
class LogoLoop {
    constructor(container, options = {}) {
        this.container = container;
        this.track = container.querySelector('.logoloop__track');
        this.list = container.querySelector('.logoloop__list');
        this.speed = options.speed || 1; // Pixels per frame approx
        this.direction = options.direction || 'left';

        this.offset = 0;
        this.listWidth = 0;
        this.clones = [];

        this.init();
    }

    init() {
        // Measure
        this.listWidth = this.list.offsetWidth;

        // Clone to fill screen + buffer
        // Simple approach: Duplicate list 4 times
        for(let i = 0; i < 4; i++) {
            const clone = this.list.cloneNode(true);
            clone.setAttribute('aria-hidden', 'true');
            this.track.appendChild(clone);
            this.clones.push(clone);
        }

        // Loop
        this.animate();
    }

    animate() {
        this.offset += this.speed;

        // Reset when one list width has passed
        if (this.offset >= this.listWidth) {
            this.offset = 0;
        }

        this.track.style.transform = `translateX(-${this.offset}px)`;
        requestAnimationFrame(this.animate.bind(this));
    }
}
