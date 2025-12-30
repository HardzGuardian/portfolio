
class MagneticButton {
    constructor(element, strength = 0.5) {
        this.element = element;
        this.strength = strength;
        this.x = 0;
        this.y = 0;
        this.width = 0;
        this.height = 0;

        this.handleMove = this.handleMove.bind(this);
        this.handleLeave = this.handleLeave.bind(this);

        this.init();
    }

    init() {
        this.element.addEventListener('mousemove', this.handleMove);
        this.element.addEventListener('mouseleave', this.handleLeave);
    }

    handleMove(e) {
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;
        this.height = rect.height;

        const centerX = rect.left + this.width / 2;
        const centerY = rect.top + this.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Move element
        gsap.to(this.element, {
            x: deltaX * this.strength,
            y: deltaY * this.strength,
            duration: 0.3,
            ease: 'power2.out'
        });
    }

    handleLeave() {
        gsap.to(this.element, {
            x: 0,
            y: 0,
            duration: 0.5,
            ease: 'elastic.out(1, 0.3)'
        });
    }
}
