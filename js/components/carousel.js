
class Carousel3D {
    constructor(container) {
        this.container = container;
        this.track = container.querySelector('.carousel-track');
        if (!this.track) {
            console.error("Carousel track not found");
            return;
        }
        this.items = Array.from(container.querySelectorAll('.carousel-item'));

        // Settings
        this.baseWidth = 300;
        this.gap = 16;
        this.itemWidth = this.baseWidth;
        this.trackItemOffset = this.itemWidth + this.gap;

        this.position = 0; // Current index
        this.target = 0;
        this.isDragging = false;
        this.startX = 0;
        this.currentX = 0;

        this.resize = this.resize.bind(this);
        this.init();
    }

    init() {
        this.resize();
        window.addEventListener('resize', this.resize);

        // Events
        this.track.addEventListener('mousedown', this.handleDragStart.bind(this));
        window.addEventListener('mousemove', this.handleDragMove.bind(this));
        window.addEventListener('mouseup', this.handleDragEnd.bind(this));

        this.track.addEventListener('touchstart', this.handleDragStart.bind(this));
        window.addEventListener('touchmove', this.handleDragMove.bind(this));
        window.addEventListener('touchend', this.handleDragEnd.bind(this));

        // Loop
        this.animate();

        // Add Indicators
        this.createIndicators();
    }

    resize() {
        const containerWidth = this.container.offsetWidth;
        // On mobile, if container is smaller than 320, shrink items
        if (containerWidth < 340) {
            this.itemWidth = containerWidth - 40; // 20px padding each side
        } else {
            this.itemWidth = this.baseWidth;
        }
        this.trackItemOffset = this.itemWidth + this.gap;

        // Update items width
        this.items.forEach(item => {
            item.style.width = `${this.itemWidth}px`;
        });
    }

    createIndicators() {
        // Find or create indicators container
        // Simplified: assuming indicators are added manually or we can skip for now based on complexity
        // The previous carousel had next/prev buttons. The user provided React code has indicators.
        // Let's rely on Drag for now.
    }

    handleDragStart(e) {
        this.isDragging = true;
        this.startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        this.track.style.cursor = 'grabbing';
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        const x = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
        const diff = x - this.startX;
        this.currentX = diff;
        // Visual feedback during drag could be added here
    }

    handleDragEnd(e) {
        if (!this.isDragging) return;
        this.isDragging = false;
        this.track.style.cursor = 'grab';

        if (Math.abs(this.currentX) > 50) {
            if (this.currentX > 0) {
                this.target = Math.max(0, this.target - 1);
            } else {
                this.target = Math.min(this.items.length - 1, this.target + 1);
            }
        }
        this.currentX = 0;
    }

    updateLayout() {
        // Center the active item
        // track x = -(position * offset)
        // items rotateY based on distance from center
    }

    animate() {
        // Lerp position to target
        this.position += (this.target - this.position) * 0.1;

        const x = -(this.position * this.trackItemOffset);

        // Apply transform to track
        // We need to center the active item in the view.
        // View center = container width / 2
        // Item center = item width / 2
        // So we offset by (containerW/2 - itemW/2)
        const centerOffset = (this.container.offsetWidth - this.itemWidth) / 2;
        this.track.style.transform = `translateX(${x + centerOffset}px)`;

        // Update items rotation
        this.items.forEach((item, index) => {
            const range = [-(index + 1) * this.trackItemOffset, -index * this.trackItemOffset, -(index - 1) * this.trackItemOffset];
            // Distance from current scroll x
            // This is tricky to port 1:1 from Framer Motion's useTransform without detailed math.
            // Let's approximate:
            // Normalized distance from center (0 = center, 1 = right neighbor, -1 = left neighbor)
            const dist = index - this.position;

            let rotateY = 0;
            if (dist < -0.5) rotateY = -90; // Left items
            else if (dist > 0.5) rotateY = 90; // Right items
            else rotateY = dist * -180; // Transition through center (0 -> 0deg)?

            // Simpler visual:
            // Center item (dist ~ 0): 0deg
            // Left item (dist ~ -1): -45deg
            // Right item (dist ~ 1): 45deg
            rotateY = dist * 45;

            // Clamp
            rotateY = Math.max(-90, Math.min(90, rotateY));

            item.style.transform = `perspective(1000px) rotateY(${rotateY}deg)`;
            item.style.zIndex = Math.round(100 - Math.abs(dist));
            item.style.opacity = 1 - Math.abs(dist) * 0.5;
        });

        requestAnimationFrame(this.animate.bind(this));
    }
}
