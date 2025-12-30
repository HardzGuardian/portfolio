
class TextAnimations {
    static init() {
        console.log("TextAnimations init called");
        if (typeof gsap === 'undefined') {
            console.error("GSAP not loaded");
            return;
        }

        if (typeof ScrollTrigger !== 'undefined') {
            gsap.registerPlugin(ScrollTrigger);
        }

        // Blur Text (ReactBits Style)
        const blurElements = document.querySelectorAll('.blur-text-anim');
        blurElements.forEach(el => {
            const text = el.innerText;
            el.innerHTML = '';
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.innerText = char;
                span.style.display = 'inline-block';
                span.style.opacity = '0';
                span.style.filter = 'blur(10px)';
                span.style.transform = 'translate3d(0, -10px, 0)';
                if (char === ' ') span.innerHTML = '&nbsp;';
                el.appendChild(span);
            });

            gsap.to(el.children, {
                opacity: 1,
                filter: 'blur(0px)',
                y: 0,
                duration: 1.2,
                stagger: 0.05,
                ease: 'power4.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 80%'
                }
            });
        });

        // Split Text
        const splitElements = document.querySelectorAll('.split-text-anim');
        console.log(`Found ${splitElements.length} split elements`);

        splitElements.forEach(el => {
            const text = el.innerText;
            el.innerHTML = '';
            text.split('').forEach(char => {
                const span = document.createElement('span');
                span.innerText = char;
                span.className = 'char';
                if (char === ' ') span.innerHTML = '&nbsp;';
                el.appendChild(span);
            });

            gsap.fromTo(el.querySelectorAll('.char'),
                { opacity: 0, y: 50 },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.02,
                    duration: 0.8,
                    ease: "back.out(1.7)",
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 80%'
                    }
                }
            );
        });

        // Scroll Float
        const floatElements = document.querySelectorAll('.scroll-float-anim');
        console.log(`Found ${floatElements.length} float elements`);

        floatElements.forEach(el => {
             const text = el.innerText;
             el.innerHTML = '';
             text.split('').forEach(char => {
                 const span = document.createElement('span');
                 span.innerText = char;
                 span.className = 'char';
                 if (char === ' ') span.innerHTML = '&nbsp;';
                 el.appendChild(span);
             });

             gsap.fromTo(el.querySelectorAll('.char'),
                { y: 50, opacity: 0, scale: 0.5 },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    stagger: 0.05,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 90%',
                        end: 'bottom 60%',
                        scrub: true
                    }
                }
             );
        });

        // Fade Content
        const fadeElements = document.querySelectorAll('.fade-content-anim');
        console.log(`Found ${fadeElements.length} fade elements`);

        fadeElements.forEach(el => {
            gsap.fromTo(el,
                { opacity: 0, filter: 'blur(10px)' },
                {
                    opacity: 1,
                    filter: 'blur(0px)',
                    duration: 1,
                    scrollTrigger: {
                        trigger: el,
                        start: 'top 85%'
                    }
                }
            );
        });
    }
}
