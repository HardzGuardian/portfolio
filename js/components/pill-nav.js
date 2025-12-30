
class PillNav {
    constructor(navElement, options = {}) {
        this.nav = navElement;
        this.items = this.nav.querySelectorAll('.pill');
        this.mobileBtn = this.nav.querySelector('.mobile-menu-button');
        this.mobileMenu = document.querySelector('.mobile-menu-popover');
        this.hamburgerLines = this.mobileBtn ? this.mobileBtn.querySelectorAll('.hamburger-line') : [];

        this.isOpen = false;
        this.ease = "power3.easeOut";

        this.init();
    }

    init() {
        // Setup Hover Effects
        this.items.forEach(item => {
            const circle = item.querySelector('.hover-circle');
            const label = item.querySelector('.pill-label');
            const labelHover = item.querySelector('.pill-label-hover');

            if (!circle || !label || !labelHover) return;

            // Initial Layout
            this.layoutPill(item, circle, label, labelHover);

            // Events
            item.addEventListener('mouseenter', () => this.handleEnter(item, circle, label, labelHover));
            item.addEventListener('mouseleave', () => this.handleLeave(item, circle, label, labelHover));
        });

        // Mobile Menu
        if (this.mobileBtn && this.mobileMenu) {
            this.mobileBtn.addEventListener('click', () => this.toggleMobileMenu());

            // Close on link click
            this.mobileMenu.querySelectorAll('a').forEach(link => {
                link.addEventListener('click', () => {
                    if (this.isOpen) this.toggleMobileMenu();
                });
            });
        }

        // Resize handler
        window.addEventListener('resize', () => {
            this.items.forEach(item => {
                const circle = item.querySelector('.hover-circle');
                const label = item.querySelector('.pill-label');
                const labelHover = item.querySelector('.pill-label-hover');
                if (circle) this.layoutPill(item, circle, label, labelHover);
            });
        });
    }

    layoutPill(pill, circle, label, labelHover) {
        const rect = pill.getBoundingClientRect();
        const { width: w, height: h } = rect;
        // Calculate circle size to cover pill
        const R = ((w * w) / 4 + h * h) / (2 * h);
        const D = Math.ceil(2 * R) + 2;
        const delta = Math.ceil(R - Math.sqrt(Math.max(0, R * R - (w * w) / 4))) + 1;
        const originY = D - delta;

        gsap.set(circle, {
            width: D,
            height: D,
            bottom: -delta,
            xPercent: -50,
            scale: 0,
            transformOrigin: `50% ${originY}px`
        });

        if (label) gsap.set(label, { y: 0 });
        if (labelHover) gsap.set(labelHover, { y: h + 12, opacity: 0 });
    }

    handleEnter(pill, circle, label, labelHover) {
        const h = pill.offsetHeight;

        gsap.to(circle, { scale: 1.2, duration: 0.4, ease: this.ease, overwrite: 'auto' });

        if (label) {
            gsap.to(label, { y: -(h + 8), duration: 0.4, ease: this.ease, overwrite: 'auto' });
        }

        if (labelHover) {
            gsap.fromTo(labelHover,
                { y: h + 20, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.4, ease: this.ease, overwrite: 'auto' }
            );
        }
    }

    handleLeave(pill, circle, label, labelHover) {
        gsap.to(circle, { scale: 0, duration: 0.3, ease: this.ease, overwrite: 'auto' });

        if (label) {
            gsap.to(label, { y: 0, duration: 0.3, ease: this.ease, overwrite: 'auto' });
        }

        if (labelHover) {
            gsap.to(labelHover, { y: pill.offsetHeight + 12, opacity: 0, duration: 0.3, ease: this.ease, overwrite: 'auto' });
        }
    }

    toggleMobileMenu() {
        this.isOpen = !this.isOpen;

        if (this.isOpen) {
            // Animate Hamburger to X
            gsap.to(this.hamburgerLines[0], { rotation: 45, y: 5, duration: 0.3, ease: this.ease });
            gsap.to(this.hamburgerLines[1], { rotation: -45, y: -5, duration: 0.3, ease: this.ease });
            // remove middle line if exists, but we only have 2 in provided CSS

            // Show Menu
            gsap.set(this.mobileMenu, { visibility: 'visible' });
            gsap.fromTo(this.mobileMenu,
                { opacity: 0, y: -20 },
                { opacity: 1, y: 0, duration: 0.3, ease: this.ease }
            );
            document.body.style.overflow = 'hidden';
        } else {
            // Animate Hamburger back
            gsap.to(this.hamburgerLines[0], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });
            gsap.to(this.hamburgerLines[1], { rotation: 0, y: 0, duration: 0.3, ease: this.ease });

            // Hide Menu
            gsap.to(this.mobileMenu, {
                opacity: 0,
                y: -20,
                duration: 0.2,
                ease: this.ease,
                onComplete: () => gsap.set(this.mobileMenu, { visibility: 'hidden' })
            });
            document.body.style.overflow = '';
        }
    }
}
