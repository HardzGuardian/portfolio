
class TiltedCard {
    constructor(element) {
        this.element = element;
        this.inner = element.querySelector('.tilted-card-inner');
        this.img = element.querySelector('.tilted-card-img');

        this.element.addEventListener('mousemove', this.handleMove.bind(this));
        this.element.addEventListener('mouseleave', this.handleLeave.bind(this));
    }

    handleMove(e) {
        const rect = this.element.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -10; // Max 10 deg
        const rotateY = ((x - centerX) / centerX) * 10;

        gsap.to(this.inner, {
            rotateX: rotateX,
            rotateY: rotateY,
            scale: 1.1,
            duration: 0.5,
            ease: 'power2.out'
        });
    }

    handleLeave() {
        gsap.to(this.inner, {
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            duration: 0.5,
            ease: 'power2.out'
        });
    }
}
