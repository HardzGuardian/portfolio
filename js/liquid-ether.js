
// --- Helper Classes (File Scope) ---

class CommonClass {
    constructor() {
        this.width = 0;
        this.height = 0;
        this.pixelRatio = 1;
        this.container = null;
        this.renderer = null;
        this.clock = null;
        this.time = 0;
        this.delta = 0;
    }
    init(container) {
        this.container = container;
        this.pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        this.resize();
        try {
            this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        } catch(e) { console.error(e); return; }

        this.renderer.autoClear = false;
        this.renderer.setClearColor(new THREE.Color(0x000000), 0);
        this.renderer.setPixelRatio(this.pixelRatio);
        this.renderer.setSize(this.width, this.height);
        this.renderer.domElement.style.width = '100%';
        this.renderer.domElement.style.height = '100%';
        this.renderer.domElement.style.display = 'block';
        this.container.appendChild(this.renderer.domElement);
        this.clock = new THREE.Clock();
        this.clock.start();
    }
    resize() {
        if (!this.container) return;
        const rect = this.container.getBoundingClientRect();
        this.width = Math.max(1, Math.floor(rect.width));
        this.height = Math.max(1, Math.floor(rect.height));
        if (this.renderer) this.renderer.setSize(this.width, this.height, false);
    }
    update() {
        this.delta = this.clock.getDelta();
        this.time += this.delta;
    }
}

class MouseClass {
    constructor() {
        this.mouseMoved = false;
        this.coords = new THREE.Vector2();
        this.coords_old = new THREE.Vector2();
        this.diff = new THREE.Vector2();
        this.timer = null;
        this.container = null;
        this.isHoverInside = false;
        this.hasUserControl = false;
        this.isAutoActive = false;
        this.autoIntensity = 2.0;
        this.takeoverActive = false;
        this.takeoverStartTime = 0;
        this.takeoverDuration = 0.25;
        this.takeoverFrom = new THREE.Vector2();
        this.takeoverTo = new THREE.Vector2();

        this._onMouseMove = this.onDocumentMouseMove.bind(this);
        this._onTouchStart = this.onDocumentTouchStart.bind(this);
        this._onTouchMove = this.onDocumentTouchMove.bind(this);
        this._onTouchEnd = this.onTouchEnd.bind(this);
    }
    init(container) {
        this.container = container;
        window.addEventListener('mousemove', this._onMouseMove);
        window.addEventListener('touchstart', this._onTouchStart, { passive: true });
        window.addEventListener('touchmove', this._onTouchMove, { passive: true });
        window.addEventListener('touchend', this._onTouchEnd);
    }
    dispose() {
        window.removeEventListener('mousemove', this._onMouseMove);
        window.removeEventListener('touchstart', this._onTouchStart);
        window.removeEventListener('touchmove', this._onTouchMove);
        window.removeEventListener('touchend', this._onTouchEnd);
    }
    isPointInside(clientX, clientY) {
        if (!this.container) return false;
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return false;
        return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
    }
    updateHoverState(clientX, clientY) {
        this.isHoverInside = this.isPointInside(clientX, clientY);
        return this.isHoverInside;
    }
    setCoords(x, y) {
        if (!this.container) return;
        if (this.timer) window.clearTimeout(this.timer);
        const rect = this.container.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;
        const nx = (x - rect.left) / rect.width;
        const ny = (y - rect.top) / rect.height;
        this.coords.set(nx * 2 - 1, -(ny * 2 - 1));
        this.mouseMoved = true;
        this.timer = window.setTimeout(() => {
            this.mouseMoved = false;
        }, 100);
    }
    setNormalized(nx, ny) {
        this.coords.set(nx, ny);
        this.mouseMoved = true;
    }
    onDocumentMouseMove(event) {
        if (!this.updateHoverState(event.clientX, event.clientY)) return;
        if (this.isAutoActive && !this.hasUserControl && !this.takeoverActive) {
            if (!this.container) return;
            const rect = this.container.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) return;
            const nx = (event.clientX - rect.left) / rect.width;
            const ny = (event.clientY - rect.top) / rect.height;
            this.takeoverFrom.copy(this.coords);
            this.takeoverTo.set(nx * 2 - 1, -(ny * 2 - 1));
            this.takeoverStartTime = performance.now();
            this.takeoverActive = true;
            this.hasUserControl = true;
            this.isAutoActive = false;
            return;
        }
        this.setCoords(event.clientX, event.clientY);
        this.hasUserControl = true;
    }
    onDocumentTouchStart(event) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        this.setCoords(t.clientX, t.clientY);
        this.hasUserControl = true;
    }
    onDocumentTouchMove(event) {
        if (event.touches.length !== 1) return;
        const t = event.touches[0];
        if (!this.updateHoverState(t.clientX, t.clientY)) return;
        this.setCoords(t.clientX, t.clientY);
    }
    onTouchEnd() {
        this.isHoverInside = false;
    }
    update() {
        if (this.takeoverActive) {
            const t = (performance.now() - this.takeoverStartTime) / (this.takeoverDuration * 1000);
            if (t >= 1) {
                this.takeoverActive = false;
                this.coords.copy(this.takeoverTo);
                this.coords_old.copy(this.coords);
                this.diff.set(0, 0);
            } else {
                const k = t * t * (3 - 2 * t);
                this.coords.copy(this.takeoverFrom).lerp(this.takeoverTo, k);
            }
        }
        this.diff.subVectors(this.coords, this.coords_old);
        this.coords_old.copy(this.coords);
        if (this.coords_old.x === 0 && this.coords_old.y === 0) this.diff.set(0, 0);
        if (this.isAutoActive && !this.takeoverActive) this.diff.multiplyScalar(this.autoIntensity);
    }
}

class AutoDriver {
    constructor(mouse, manager, opts) {
        this.mouse = mouse;
        this.manager = manager;
        this.enabled = opts.enabled;
        this.speed = opts.speed;
        this.resumeDelay = opts.resumeDelay || 3000;
        this.rampDurationMs = (opts.rampDuration || 0) * 1000;
        this.active = false;
        this.current = new THREE.Vector2(0, 0);
        this.target = new THREE.Vector2();
        this.lastTime = performance.now();
        this.activationTime = 0;
        this.margin = 0.2;
        this._tmpDir = new THREE.Vector2();
        this.pickNewTarget();
    }
    pickNewTarget() {
        const r = Math.random;
        this.target.set((r() * 2 - 1) * (1 - this.margin), (r() * 2 - 1) * (1 - this.margin));
    }
    forceStop() {
        this.active = false;
        this.mouse.isAutoActive = false;
    }
    update() {
        if (!this.enabled) return;
        const now = performance.now();
        const idle = now - this.manager.lastUserInteraction;
        if (idle < this.resumeDelay) {
            if (this.active) this.forceStop();
            return;
        }
        if (this.mouse.isHoverInside) {
            if (this.active) this.forceStop();
            return;
        }
        if (!this.active) {
            this.active = true;
            this.current.copy(this.mouse.coords);
            this.lastTime = now;
            this.activationTime = now;
        }
        if (!this.active) return;
        this.mouse.isAutoActive = true;
        let dtSec = (now - this.lastTime) / 1000;
        this.lastTime = now;
        if (dtSec > 0.2) dtSec = 0.016;
        const dir = this._tmpDir.subVectors(this.target, this.current);
        const dist = dir.length();
        if (dist < 0.01) {
            this.pickNewTarget();
            return;
        }
        dir.normalize();
        let ramp = 1;
        if (this.rampDurationMs > 0) {
            const t = Math.min(1, (now - this.activationTime) / this.rampDurationMs);
            ramp = t * t * (3 - 2 * t);
        }
        const step = this.speed * dtSec * ramp;
        const move = Math.min(step, dist);
        this.current.addScaledVector(dir, move);
        this.mouse.setNormalized(this.current.x, this.current.y);
    }
}

class ShaderPass {
    constructor(props, common) {
        this.common = common; // Need common for renderer
        this.props = props || {};
        this.uniforms = this.props.material?.uniforms;
        this.scene = null;
        this.camera = null;
        this.material = null;
        this.geometry = null;
        this.plane = null;
    }
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        if (this.uniforms) {
            this.material = new THREE.RawShaderMaterial(this.props.material);
            this.geometry = new THREE.PlaneGeometry(2.0, 2.0);
            this.plane = new THREE.Mesh(this.geometry, this.material);
            this.scene.add(this.plane);
        }
    }
    update() {
        this.common.renderer.setRenderTarget(this.props.output || null);
        this.common.renderer.render(this.scene, this.camera);
        this.common.renderer.setRenderTarget(null);
    }
}

class Advection extends ShaderPass {
    constructor(simProps, common, shaders) {
        super({
            material: {
                vertexShader: shaders.face_vert_sim,
                fragmentShader: shaders.advection_frag,
                uniforms: {
                    boundarySpace: { value: simProps.cellScale },
                    px: { value: simProps.cellScale },
                    fboSize: { value: simProps.fboSize },
                    velocity: { value: simProps.src.texture },
                    dt: { value: simProps.dt },
                    isBFECC: { value: true }
                }
            },
            output: simProps.dst
        }, common);
        this.uniforms = this.props.material.uniforms;
        this.shaders = shaders;
        this.init();
    }
    init() {
        super.init();
        this.createBoundary();
    }
    createBoundary() {
        const boundaryG = new THREE.BufferGeometry();
        const vertices_boundary = new Float32Array([
            -1, -1, 0, -1, 1, 0, -1, 1, 0, 1, 1, 0, 1, 1, 0, 1, -1, 0, 1, -1, 0, -1, -1, 0
        ]);
        boundaryG.setAttribute('position', new THREE.BufferAttribute(vertices_boundary, 3));
        const boundaryM = new THREE.RawShaderMaterial({
            vertexShader: this.shaders.line_vert,
            fragmentShader: this.shaders.advection_frag,
            uniforms: this.uniforms
        });
        this.line = new THREE.LineSegments(boundaryG, boundaryM);
        this.scene.add(this.line);
    }
    update({ dt, isBounce, BFECC }) {
        this.uniforms.dt.value = dt;
        this.line.visible = isBounce;
        this.uniforms.isBFECC.value = BFECC;
        super.update();
    }
}

class ExternalForce extends ShaderPass {
    constructor(simProps, common, shaders, mouseInstance) {
        super({ output: simProps.dst }, common);
        this.shaders = shaders;
        this.mouseInstance = mouseInstance; // Need mouse instance for state
        this.init(simProps);
    }
    init(simProps) {
        super.init();
        const mouseG = new THREE.PlaneGeometry(1, 1);
        const mouseM = new THREE.RawShaderMaterial({
            vertexShader: this.shaders.mouse_vert,
            fragmentShader: this.shaders.externalForce_frag,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            uniforms: {
                px: { value: simProps.cellScale },
                force: { value: new THREE.Vector2(0.0, 0.0) },
                center: { value: new THREE.Vector2(0.0, 0.0) },
                scale: { value: new THREE.Vector2(simProps.cursor_size, simProps.cursor_size) }
            }
        });
        this.mouse = new THREE.Mesh(mouseG, mouseM);
        this.scene.add(this.mouse);
    }
    update(props) {
        const forceX = (this.mouseInstance.diff.x / 2) * props.mouse_force;
        const forceY = (this.mouseInstance.diff.y / 2) * props.mouse_force;
        const cursorSizeX = props.cursor_size * props.cellScale.x;
        const cursorSizeY = props.cursor_size * props.cellScale.y;
        const centerX = Math.min(
            Math.max(this.mouseInstance.coords.x, -1 + cursorSizeX + props.cellScale.x * 2),
            1 - cursorSizeX - props.cellScale.x * 2
        );
        const centerY = Math.min(
            Math.max(this.mouseInstance.coords.y, -1 + cursorSizeY + props.cellScale.y * 2),
            1 - cursorSizeY - props.cellScale.y * 2
        );
        const uniforms = this.mouse.material.uniforms;
        uniforms.force.value.set(forceX, forceY);
        uniforms.center.value.set(centerX, centerY);
        uniforms.scale.value.set(props.cursor_size, props.cursor_size);
        super.update();
    }
}

class Viscous extends ShaderPass {
    constructor(simProps, common, shaders) {
        super({
            material: {
                vertexShader: shaders.face_vert_sim,
                fragmentShader: shaders.viscous_frag,
                uniforms: {
                    boundarySpace: { value: simProps.boundarySpace },
                    velocity: { value: simProps.src.texture },
                    velocity_new: { value: simProps.dst_.texture },
                    v: { value: simProps.viscous },
                    px: { value: simProps.cellScale },
                    dt: { value: simProps.dt }
                }
            },
            output: simProps.dst,
            output0: simProps.dst_,
            output1: simProps.dst
        }, common);
        this.init();
    }
    update({ viscous, iterations, dt }) {
        let fbo_in, fbo_out;
        this.uniforms.v.value = viscous;
        for (let i = 0; i < iterations; i++) {
            if (i % 2 === 0) {
                fbo_in = this.props.output0;
                fbo_out = this.props.output1;
            } else {
                fbo_in = this.props.output1;
                fbo_out = this.props.output0;
            }
            this.uniforms.velocity_new.value = fbo_in.texture;
            this.props.output = fbo_out;
            this.uniforms.dt.value = dt;
            super.update();
        }
        return fbo_out;
    }
}

class Divergence extends ShaderPass {
    constructor(simProps, common, shaders) {
        super({
            material: {
                vertexShader: shaders.face_vert_sim,
                fragmentShader: shaders.divergence_frag,
                uniforms: {
                    boundarySpace: { value: simProps.boundarySpace },
                    velocity: { value: simProps.src.texture },
                    px: { value: simProps.cellScale },
                    dt: { value: simProps.dt }
                }
            },
            output: simProps.dst
        }, common);
        this.init();
    }
    update({ vel }) {
        this.uniforms.velocity.value = vel.texture;
        super.update();
    }
}

class Poisson extends ShaderPass {
    constructor(simProps, common, shaders) {
        super({
            material: {
                vertexShader: shaders.face_vert_sim,
                fragmentShader: shaders.poisson_frag,
                uniforms: {
                    boundarySpace: { value: simProps.boundarySpace },
                    pressure: { value: simProps.dst_.texture },
                    divergence: { value: simProps.src.texture },
                    px: { value: simProps.cellScale }
                }
            },
            output: simProps.dst,
            output0: simProps.dst_,
            output1: simProps.dst
        }, common);
        this.init();
    }
    update({ iterations }) {
        let p_in, p_out;
        for (let i = 0; i < iterations; i++) {
            if (i % 2 === 0) {
                p_in = this.props.output0;
                p_out = this.props.output1;
            } else {
                p_in = this.props.output1;
                p_out = this.props.output0;
            }
            this.uniforms.pressure.value = p_in.texture;
            this.props.output = p_out;
            super.update();
        }
        return p_out;
    }
}

class Pressure extends ShaderPass {
    constructor(simProps, common, shaders) {
        super({
            material: {
                vertexShader: shaders.face_vert_sim,
                fragmentShader: shaders.pressure_frag,
                uniforms: {
                    boundarySpace: { value: simProps.boundarySpace },
                    pressure: { value: simProps.src_p.texture },
                    velocity: { value: simProps.src_v.texture },
                    px: { value: simProps.cellScale },
                    dt: { value: simProps.dt }
                }
            },
            output: simProps.dst
        }, common);
        this.init();
    }
    update({ vel, pressure }) {
        this.uniforms.velocity.value = vel.texture;
        this.uniforms.pressure.value = pressure.texture;
        super.update();
    }
}

class Simulation {
    constructor(options, common, shaders, mouse) {
        this.options = options;
        this.common = common;
        this.shaders = shaders;
        this.mouse = mouse;
        this.fbos = {
            vel_0: null,
            vel_1: null,
            vel_viscous0: null,
            vel_viscous1: null,
            div: null,
            pressure_0: null,
            pressure_1: null
        };
        this.fboSize = new THREE.Vector2();
        this.cellScale = new THREE.Vector2();
        this.boundarySpace = new THREE.Vector2();
        this.init();
    }
    init() {
        this.calcSize();
        this.createAllFBO();
        this.createShaderPass();
    }
    calcSize() {
        const width = Math.max(1, Math.round(this.options.resolution * this.common.width));
        const height = Math.max(1, Math.round(this.options.resolution * this.common.height));
        const px_x = 1.0 / width;
        const px_y = 1.0 / height;
        this.cellScale.set(px_x, px_y);
        this.fboSize.set(width, height);
    }
    createAllFBO() {
        const type = THREE.FloatType;
        const opts = {
            type,
            depthBuffer: false,
            stencilBuffer: false,
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            wrapS: THREE.ClampToEdgeWrapping,
            wrapT: THREE.ClampToEdgeWrapping
        };
        for (let key in this.fbos) {
            this.fbos[key] = new THREE.WebGLRenderTarget(this.fboSize.x, this.fboSize.y, opts);
        }
    }
    createShaderPass() {
        this.advection = new Advection({
            cellScale: this.cellScale,
            fboSize: this.fboSize,
            dt: this.options.dt,
            src: this.fbos.vel_0,
            dst: this.fbos.vel_1
        }, this.common, this.shaders);
        this.externalForce = new ExternalForce({
            cellScale: this.cellScale,
            cursor_size: this.options.cursor_size,
            dst: this.fbos.vel_1
        }, this.common, this.shaders, this.mouse);
        this.viscous = new Viscous({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            viscous: this.options.viscous,
            src: this.fbos.vel_1,
            dst: this.fbos.vel_viscous1,
            dst_: this.fbos.vel_viscous0,
            dt: this.options.dt
        }, this.common, this.shaders);
        this.divergence = new Divergence({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.vel_viscous0,
            dst: this.fbos.div,
            dt: this.options.dt
        }, this.common, this.shaders);
        this.poisson = new Poisson({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src: this.fbos.div,
            dst: this.fbos.pressure_1,
            dst_: this.fbos.pressure_0
        }, this.common, this.shaders);
        this.pressure = new Pressure({
            cellScale: this.cellScale,
            boundarySpace: this.boundarySpace,
            src_p: this.fbos.pressure_0,
            src_v: this.fbos.vel_viscous0,
            dst: this.fbos.vel_0,
            dt: this.options.dt
        }, this.common, this.shaders);
    }
    resize() {
        this.calcSize();
        for (let key in this.fbos) {
            this.fbos[key].setSize(this.fboSize.x, this.fboSize.y);
        }
    }
    update() {
        if (this.options.isBounce) {
            this.boundarySpace.set(0, 0);
        } else {
            this.boundarySpace.copy(this.cellScale);
        }
        this.advection.update({
            dt: this.options.dt,
            isBounce: this.options.isBounce,
            BFECC: this.options.BFECC
        });
        this.externalForce.update({
            cursor_size: this.options.cursor_size,
            mouse_force: this.options.mouse_force,
            cellScale: this.cellScale
        });
        let vel = this.fbos.vel_1;
        if (this.options.isViscous) {
            vel = this.viscous.update({
                viscous: this.options.viscous,
                iterations: this.options.iterations_viscous,
                dt: this.options.dt
            });
        }
        this.divergence.update({ vel });
        const pressure = this.poisson.update({
            iterations: this.options.iterations_poisson
        });
        this.pressure.update({ vel, pressure });
    }
}

class Output {
    constructor(simulation, common, shaders, paletteTex, bgVec4) {
        this.simulation = simulation;
        this.common = common;
        this.shaders = shaders;
        this.paletteTex = paletteTex;
        this.bgVec4 = bgVec4;
        this.init();
    }
    init() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.Camera();
        this.output = new THREE.Mesh(
            new THREE.PlaneGeometry(2, 2),
            new THREE.RawShaderMaterial({
                vertexShader: this.shaders.face_vert,
                fragmentShader: this.shaders.color_frag,
                transparent: true,
                depthWrite: false,
                uniforms: {
                    velocity: { value: this.simulation.fbos.vel_0.texture },
                    boundarySpace: { value: new THREE.Vector2() },
                    palette: { value: this.paletteTex },
                    bgColor: { value: this.bgVec4 }
                }
            })
        );
        this.scene.add(this.output);
    }
    resize() {
        this.simulation.resize();
    }
    update() {
        this.simulation.update();
        this.common.renderer.setRenderTarget(null);
        this.common.renderer.render(this.scene, this.camera);
    }
}

// --- Main Class ---

class LiquidEther {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            mouseForce: 20,
            cursorSize: 100,
            isViscous: false,
            viscous: 30,
            iterationsViscous: 32,
            iterationsPoisson: 32,
            dt: 0.014,
            BFECC: true,
            resolution: 0.5,
            isBounce: false,
            colors: ['#ffffff', '#0d0d0d', '#f2f1f3'],
            autoDemo: true,
            autoSpeed: 0.5,
            autoIntensity: 2.2,
            takeoverDuration: 0.25,
            autoResumeDelay: 1000,
            autoRampDuration: 0.6,
            ...options
        };

        this.init();
    }

    init() {
        const {
            mouseForce, cursorSize, isViscous, viscous, iterationsViscous, iterationsPoisson,
            dt, BFECC, resolution, isBounce, colors, autoDemo, autoSpeed, autoIntensity,
            takeoverDuration, autoResumeDelay, autoRampDuration
        } = this.options;

        // Collect Shaders in an object to pass around
        const shaders = {
             face_vert: `
                attribute vec3 position;
                varying vec2 uv;
                precision highp float;
                void main(){
                    vec3 pos = position;
                    uv = vec2(0.5) + (pos.xy) * 0.5;
                    gl_Position = vec4(pos, 1.0);
                }
            `,
             face_vert_sim: `
                attribute vec3 position;
                uniform vec2 boundarySpace;
                varying vec2 uv;
                precision highp float;
                void main(){
                    vec3 pos = position;
                    vec2 scale = 1.0 - boundarySpace * 2.0;
                    pos.xy = pos.xy * scale;
                    uv = vec2(0.5)+(pos.xy)*0.5;
                    gl_Position = vec4(pos, 1.0);
                }
            `,
             line_vert: `
                attribute vec3 position;
                uniform vec2 px;
                precision highp float;
                varying vec2 uv;
                void main(){
                    vec3 pos = position;
                    uv = 0.5 + pos.xy * 0.5;
                    vec2 n = sign(pos.xy);
                    pos.xy = abs(pos.xy) - px * 1.0;
                    pos.xy *= n;
                    gl_Position = vec4(pos, 1.0);
                }
            `,
             mouse_vert: `
                precision highp float;
                attribute vec3 position;
                attribute vec2 uv;
                uniform vec2 center;
                uniform vec2 scale;
                uniform vec2 px;
                varying vec2 vUv;
                void main(){
                    vec2 pos = position.xy * scale * 2.0 * px + center;
                    vUv = uv;
                    gl_Position = vec4(pos, 0.0, 1.0);
                }
            `,
             advection_frag: `
                precision highp float;
                uniform sampler2D velocity;
                uniform float dt;
                uniform bool isBFECC;
                uniform vec2 fboSize;
                uniform vec2 px;
                varying vec2 uv;
                void main(){
                    vec2 ratio = max(fboSize.x, fboSize.y) / fboSize;
                    if(isBFECC == false){
                        vec2 vel = texture2D(velocity, uv).xy;
                        vec2 uv2 = uv - vel * dt * ratio;
                        vec2 newVel = texture2D(velocity, uv2).xy;
                        gl_FragColor = vec4(newVel, 0.0, 0.0);
                    } else {
                        vec2 spot_new = uv;
                        vec2 vel_old = texture2D(velocity, uv).xy;
                        vec2 spot_old = spot_new - vel_old * dt * ratio;
                        vec2 vel_new1 = texture2D(velocity, spot_old).xy;
                        vec2 spot_new2 = spot_old + vel_new1 * dt * ratio;
                        vec2 error = spot_new2 - spot_new;
                        vec2 spot_new3 = spot_new - error / 2.0;
                        vec2 vel_2 = texture2D(velocity, spot_new3).xy;
                        vec2 spot_old2 = spot_new3 - vel_2 * dt * ratio;
                        vec2 newVel2 = texture2D(velocity, spot_old2).xy;
                        gl_FragColor = vec4(newVel2, 0.0, 0.0);
                    }
                }
            `,
             color_frag: `
                precision highp float;
                uniform sampler2D velocity;
                uniform sampler2D palette;
                uniform vec4 bgColor;
                varying vec2 uv;
                void main(){
                    vec2 vel = texture2D(velocity, uv).xy;
                    float lenv = clamp(length(vel), 0.0, 1.0);
                    vec3 c = texture2D(palette, vec2(lenv, 0.5)).rgb;
                    vec3 outRGB = mix(bgColor.rgb, c, lenv);
                    float outA = mix(bgColor.a, 1.0, lenv);
                    gl_FragColor = vec4(outRGB, outA);
                }
            `,
             divergence_frag: `
                precision highp float;
                uniform sampler2D velocity;
                uniform float dt;
                uniform vec2 px;
                varying vec2 uv;
                void main(){
                    float x0 = texture2D(velocity, uv-vec2(px.x, 0.0)).x;
                    float x1 = texture2D(velocity, uv+vec2(px.x, 0.0)).x;
                    float y0 = texture2D(velocity, uv-vec2(0.0, px.y)).y;
                    float y1 = texture2D(velocity, uv+vec2(0.0, px.y)).y;
                    float divergence = (x1 - x0 + y1 - y0) / 2.0;
                    gl_FragColor = vec4(divergence / dt);
                }
            `,
             externalForce_frag: `
                precision highp float;
                uniform vec2 force;
                uniform vec2 center;
                uniform vec2 scale;
                uniform vec2 px;
                varying vec2 vUv;
                void main(){
                    vec2 circle = (vUv - 0.5) * 2.0;
                    float d = 1.0 - min(length(circle), 1.0);
                    d *= d;
                    gl_FragColor = vec4(force * d, 0.0, 1.0);
                }
            `,
             poisson_frag: `
                precision highp float;
                uniform sampler2D pressure;
                uniform sampler2D divergence;
                uniform vec2 px;
                varying vec2 uv;
                void main(){
                    float p0 = texture2D(pressure, uv + vec2(px.x * 2.0, 0.0)).r;
                    float p1 = texture2D(pressure, uv - vec2(px.x * 2.0, 0.0)).r;
                    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * 2.0)).r;
                    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * 2.0)).r;
                    float div = texture2D(divergence, uv).r;
                    float newP = (p0 + p1 + p2 + p3) / 4.0 - div;
                    gl_FragColor = vec4(newP);
                }
            `,
             pressure_frag: `
                precision highp float;
                uniform sampler2D pressure;
                uniform sampler2D velocity;
                uniform vec2 px;
                uniform float dt;
                varying vec2 uv;
                void main(){
                    float step = 1.0;
                    float p0 = texture2D(pressure, uv + vec2(px.x * step, 0.0)).r;
                    float p1 = texture2D(pressure, uv - vec2(px.x * step, 0.0)).r;
                    float p2 = texture2D(pressure, uv + vec2(0.0, px.y * step)).r;
                    float p3 = texture2D(pressure, uv - vec2(0.0, px.y * step)).r;
                    vec2 v = texture2D(velocity, uv).xy;
                    vec2 gradP = vec2(p0 - p1, p2 - p3) * 0.5;
                    v = v - gradP * dt;
                    gl_FragColor = vec4(v, 0.0, 1.0);
                }
            `,
             viscous_frag: `
                precision highp float;
                uniform sampler2D velocity;
                uniform sampler2D velocity_new;
                uniform float v;
                uniform vec2 px;
                uniform float dt;
                varying vec2 uv;
                void main(){
                    vec2 old = texture2D(velocity, uv).xy;
                    vec2 new0 = texture2D(velocity_new, uv + vec2(px.x * 2.0, 0.0)).xy;
                    vec2 new1 = texture2D(velocity_new, uv - vec2(px.x * 2.0, 0.0)).xy;
                    vec2 new2 = texture2D(velocity_new, uv + vec2(0.0, px.y * 2.0)).xy;
                    vec2 new3 = texture2D(velocity_new, uv - vec2(0.0, px.y * 2.0)).xy;
                    vec2 newv = 4.0 * old + v * dt * (new0 + new1 + new2 + new3);
                    newv /= 4.0 * (1.0 + v * dt);
                    gl_FragColor = vec4(newv, 0.0, 0.0);
                }
            `
        };

        // Texture generation helper
        function makePaletteTexture(stops) {
            let arr;
            if (Array.isArray(stops) && stops.length > 0) {
                if (stops.length === 1) {
                    arr = [stops[0], stops[0]];
                } else {
                    arr = stops;
                }
            } else {
                arr = ['#ffffff', '#ffffff'];
            }
            const w = arr.length;
            const data = new Uint8Array(w * 4);
            for (let i = 0; i < w; i++) {
                const c = new THREE.Color(arr[i]);
                data[i * 4 + 0] = Math.round(c.r * 255);
                data[i * 4 + 1] = Math.round(c.g * 255);
                data[i * 4 + 2] = Math.round(c.b * 255);
                data[i * 4 + 3] = 255;
            }
            const tex = new THREE.DataTexture(data, w, 1, THREE.RGBAFormat);
            tex.magFilter = THREE.LinearFilter;
            tex.minFilter = THREE.LinearFilter;
            tex.wrapS = THREE.ClampToEdgeWrapping;
            tex.wrapT = THREE.ClampToEdgeWrapping;
            tex.generateMipmaps = false;
            tex.needsUpdate = true;
            return tex;
        }

        const paletteTex = makePaletteTexture(colors);
        const bgVec4 = new THREE.Vector4(0, 0, 0, 0);

        // Instance Properties
        this.common = new CommonClass();
        this.mouse = new MouseClass();

        // --- Manager Setup ---

        this.common.init(this.container);
        this.mouse.init(this.container);
        this.mouse.autoIntensity = autoIntensity;
        this.mouse.takeoverDuration = takeoverDuration;
        this.lastUserInteraction = performance.now();
        this.mouse.onInteract = () => {
            this.lastUserInteraction = performance.now();
            if (this.autoDriver) this.autoDriver.forceStop();
        };

        this.autoDriver = new AutoDriver(this.mouse, this, {
            enabled: autoDemo,
            speed: autoSpeed,
            resumeDelay: autoResumeDelay,
            rampDuration: autoRampDuration
        });

        this.simulation = new Simulation(this.options, this.common, shaders, this.mouse);
        this.output = new Output(this.simulation, this.common, shaders, paletteTex, bgVec4);

        // Bind and start loop
        this.loop = this.loop.bind(this);
        this.resize = this.resize.bind(this);
        window.addEventListener('resize', this.resize);
        this.loop();
    }

    resize() {
        this.common.resize();
        this.output.resize();
    }

    loop() {
        if (this.autoDriver) this.autoDriver.update();
        this.mouse.update();
        this.common.update();
        this.output.update();
        requestAnimationFrame(this.loop);
    }
}
