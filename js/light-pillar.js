class LightPillar {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            topColor: '#ffffff',
            bottomColor: '#9eb1ff',
            intensity: 1.0,
            rotationSpeed: 0.3,
            interactive: false,
            glowAmount: 0.005,
            pillarWidth: 3.0,
            pillarHeight: 0.4,
            noiseIntensity: 0.5,
            pillarRotation: 0,
            ...options
        };

        this.mouse = new THREE.Vector2(0, 0);
        this.time = 0;
        this.rafId = null;

        this.init();
    }

    init() {
        if (!this.container) return;

        const width = this.container.clientWidth;
        const height = this.container.clientHeight;

        // Scene setup
        this.scene = new THREE.Scene();
        this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        try {
            this.renderer = new THREE.WebGLRenderer({
                antialias: false,
                alpha: true,
                powerPreference: 'high-performance',
                precision: 'lowp',
                stencil: false,
                depth: false
            });
        } catch (error) {
            console.error('Failed to create WebGL renderer:', error);
            return;
        }

        this.renderer.setSize(width, height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Convert hex colors to RGB
        const parseColor = hex => {
            const color = new THREE.Color(hex);
            return new THREE.Vector3(color.r, color.g, color.b);
        };

        // Shader material
        const vertexShader = `
            varying vec2 vUv;
            void main() {
                vUv = uv;
                gl_Position = vec4(position, 1.0);
            }
        `;

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uResolution;
            uniform vec2 uMouse;
            uniform vec3 uTopColor;
            uniform vec3 uBottomColor;
            uniform float uIntensity;
            uniform bool uInteractive;
            uniform float uGlowAmount;
            uniform float uPillarWidth;
            uniform float uPillarHeight;
            uniform float uNoiseIntensity;
            uniform float uPillarRotation;
            varying vec2 vUv;

            const float PI = 3.141592653589793;
            const float EPSILON = 0.001;
            const float E = 2.71828182845904523536;
            const float HALF = 0.5;

            mat2 rot(float angle) {
                float s = sin(angle);
                float c = cos(angle);
                return mat2(c, -s, s, c);
            }

            // Procedural noise function
            float noise(vec2 coord) {
                float G = E;
                vec2 r = (G * sin(G * coord));
                return fract(r.x * r.y * (1.0 + coord.x));
            }

            // Apply layered wave deformation to position
            vec3 applyWaveDeformation(vec3 pos, float timeOffset) {
                float frequency = 1.0;
                float amplitude = 1.0;
                vec3 deformed = pos;

                for(float i = 0.0; i < 4.0; i++) {
                    deformed.xz *= rot(0.4);
                    float phase = timeOffset * i * 2.0;
                    vec3 oscillation = cos(deformed.zxy * frequency - phase);
                    deformed += oscillation * amplitude;
                    frequency *= 2.0;
                    amplitude *= HALF;
                }
                return deformed;
            }

            // Polynomial smooth blending between two values
            float blendMin(float a, float b, float k) {
                float scaledK = k * 4.0;
                float h = max(scaledK - abs(a - b), 0.0);
                return min(a, b) - h * h * 0.25 / scaledK;
            }

            float blendMax(float a, float b, float k) {
                return -blendMin(-a, -b, k);
            }

            void main() {
                vec2 fragCoord = vUv * uResolution;
                vec2 uv = (fragCoord * 2.0 - uResolution) / uResolution.y;

                // Apply 2D rotation to UV coordinates
                float rotAngle = uPillarRotation * PI / 180.0;
                uv *= rot(rotAngle);

                vec3 origin = vec3(0.0, 0.0, -10.0);
                vec3 direction = normalize(vec3(uv, 1.0));

                float maxDepth = 50.0;
                float depth = 0.1;

                mat2 rotX = rot(uTime * 0.3);
                if(uInteractive && length(uMouse) > 0.0) {
                    rotX = rot(uMouse.x * PI * 2.0);
                }

                vec3 color = vec3(0.0);

                for(float i = 0.0; i < 100.0; i++) {
                    vec3 pos = origin + direction * depth;
                    pos.xz *= rotX;

                    // Apply vertical scaling and wave deformation
                    vec3 deformed = pos;
                    deformed.y *= uPillarHeight;
                    deformed = applyWaveDeformation(deformed + vec3(0.0, uTime, 0.0), uTime);

                    // Calculate distance field using cosine pattern
                    vec2 cosinePair = cos(deformed.xz);
                    float fieldDistance = length(cosinePair) - 0.2;

                    // Radial boundary constraint
                    float radialBound = length(pos.xz) - uPillarWidth;
                    fieldDistance = blendMax(radialBound, fieldDistance, 1.0);
                    fieldDistance = abs(fieldDistance) * 0.15 + 0.01;

                    vec3 gradient = mix(uBottomColor, uTopColor, smoothstep(15.0, -15.0, pos.y));
                    color += gradient * pow(1.0 / fieldDistance, 1.0);

                    if(fieldDistance < EPSILON || depth > maxDepth) break;
                    depth += fieldDistance;
                }

                // Normalize by pillar width to maintain consistent glow regardless of size
                float widthNormalization = uPillarWidth / 3.0;
                color = tanh(color * uGlowAmount / widthNormalization);

                // Add noise postprocessing
                float rnd = noise(gl_FragCoord.xy);
                color -= rnd / 15.0 * uNoiseIntensity;

                gl_FragColor = vec4(color * uIntensity, 1.0);
            }
        `;

        this.material = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) },
                uMouse: { value: this.mouse },
                uTopColor: { value: parseColor(this.options.topColor) },
                uBottomColor: { value: parseColor(this.options.bottomColor) },
                uIntensity: { value: this.options.intensity },
                uInteractive: { value: this.options.interactive },
                uGlowAmount: { value: this.options.glowAmount },
                uPillarWidth: { value: this.options.pillarWidth },
                uPillarHeight: { value: this.options.pillarHeight },
                uNoiseIntensity: { value: this.options.noiseIntensity },
                uPillarRotation: { value: this.options.pillarRotation }
            },
            transparent: true,
            depthWrite: false,
            depthTest: false
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, this.material);
        this.scene.add(mesh);

        // Bind methods
        this.handleResize = this.handleResize.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.animate = this.animate.bind(this);

        // Event listeners
        window.addEventListener('resize', this.handleResize, { passive: true });
        if (this.options.interactive) {
            this.container.addEventListener('mousemove', this.handleMouseMove, { passive: true });
        }

        // Start animation
        this.lastTime = performance.now();
        this.animate(this.lastTime);
    }

    handleMouseMove(event) {
        if (!this.options.interactive) return;

        const rect = this.container.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.mouse.set(x, y);
    }

    handleResize() {
        if (!this.renderer || !this.material || !this.container) return;

        const newWidth = this.container.clientWidth;
        const newHeight = this.container.clientHeight;

        this.renderer.setSize(newWidth, newHeight);
        this.material.uniforms.uResolution.value.set(newWidth, newHeight);
    }

    animate(currentTime) {
        if (!this.material || !this.renderer || !this.scene || !this.camera) return;

        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;
        const deltaTime = currentTime - this.lastTime;

        if (deltaTime >= frameTime) {
            this.time += 0.016 * this.options.rotationSpeed;
            this.material.uniforms.uTime.value = this.time;
            this.renderer.render(this.scene, this.camera);
            this.lastTime = currentTime - (deltaTime % frameTime);
        }

        this.rafId = requestAnimationFrame(this.animate);
    }
}
