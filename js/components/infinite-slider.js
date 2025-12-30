
class InfiniteSlider {
    constructor(container, options = {}) {
        this.container = container;
        this.track = container.querySelector('.infinite-slider-track');
        this.items = Array.from(container.querySelectorAll('.service-card')); // or generic item class

        if (!this.track || this.items.length === 0) return;

        this.options = {
            speed: 1, // pixels per frame, approx
            direction: -1, // -1 left, 1 right
            pauseOnHover: true,
            gap: 32, // must match CSS gap
            ...options
        };

        this.x = 0;
        this.width = 0;
        this.trackWidth = 0;
        this.isHovered = false;

        this.resize = this.resize.bind(this);
        this.animate = this.animate.bind(this);

        this.init();
    }

    init() {
        // Clone items to fill width + buffer
        // For a true infinite loop, we need enough copies to cover the screen width * 2
        // Simplified approach: Duplicate the entire set once or twice.

        // Calculate total width of one set
        // We can't know exact width yet if images stick loading, but we can try.
        // Better: Duplicate set 3 times to be safe.

        const setHtml = this.track.innerHTML;
        this.track.innerHTML = setHtml + setHtml + setHtml + setHtml; // 4 sets

        this.items = Array.from(this.track.children);

        if (this.options.pauseOnHover) {
            this.container.addEventListener('mouseenter', () => this.isHovered = true);
            this.container.addEventListener('mouseleave', () => this.isHovered = false);

            // Touch events
            this.container.addEventListener('touchstart', () => this.isHovered = true, {passive: true});
            this.container.addEventListener('touchend', () => this.isHovered = false);
        }

        window.addEventListener('resize', this.resize);
        this.resize();
        this.animate();
    }

    resize() {
        // Measure one item + gap to estimate track content width
        // Actually, since we duplicated, we just need to know when to reset.
        // We reset when we have scrolled past the width of ONE original set.
        // Let's assume all items are roughly same width or we measure the first original set count.

        const originalCount = this.items.length / 4;
        let singleSetWidth = 0;

        for(let i=0; i<originalCount; i++) {
            singleSetWidth += this.items[i].offsetWidth + this.options.gap;
        }

        this.resetWidth = singleSetWidth;
    }

    animate() {
        if (!this.isHovered) {
            this.x += this.options.speed * this.options.direction;
        }

        // Wrap logic
        // If moving left (-), x goes 0 -> -Infinity
        // Reset when x <= -resetWidth
        if (this.options.direction === -1) {
            if (this.x <= -this.resetWidth) {
                this.x = 0;
            }
        } else {
            // Moving right (+)
            if (this.x >= 0) {
                this.x = -this.resetWidth;
            }
        }

        this.track.style.transform = `translate3d(${this.x}px, 0, 0)`;
        requestAnimationFrame(this.animate);
    }
}
