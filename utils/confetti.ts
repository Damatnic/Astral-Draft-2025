import React from 'react';

const confettiCount = 150;
const gravity = 0.98;
const terminalVelocity = 9;
const drag = 0.075;

interface ConfettiParticle {
    x: number;
    y: number;
    w: number;
    h: number;
    color: string;
    vx: number;
    vy: number;
    angle: number;
    rotation: number;
    tilt: number;
    tiltAngle: number;
    tiltAngleIncrement: number;
}

export const useConfetti = () => {
    const [canvas, setCanvas] = React.useState<HTMLCanvasElement | null>(null);

    React.useEffect(() => {
        const c = document.getElementById('confetti-canvas') as HTMLCanvasElement | null;
        if (c) setCanvas(c);
    }, []);

    const triggerConfetti = React.useCallback(() => {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        let particles: ConfettiParticle[] = [];
        const colors = ['#06b6d4', '#22c55e', '#a855f7', '#facc15', '#ec4899'];

        const createParticles = () => {
            particles = [];
            for (let i = 0; i < confettiCount; i++) {
                particles.push({
                    x: canvas.width * 0.5,
                    y: canvas.height * 0.5,
                    w: Math.random() * 8 + 5,
                    h: Math.random() * 5 + 5,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15,
                    angle: Math.random() * Math.PI * 2,
                    rotation: Math.random() * 10,
                    tilt: Math.random() * 10 - 10,
                    tiltAngle: 0,
                    tiltAngleIncrement: Math.random() * 0.07 + 0.05
                });
            }
        };

        const update = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            particles.forEach((p, i) => {
                p.vx *= (1 - drag);
                p.vy += gravity;
                p.vy = Math.min(p.vy, terminalVelocity);
                
                p.x += p.vx;
                p.y += p.vy;

                p.tiltAngle += p.tiltAngleIncrement;
                p.tilt = Math.sin(p.tiltAngle) * 15;
                
                ctx.save();
                ctx.fillStyle = p.color;
                ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
                ctx.rotate(p.rotation);
                ctx.globalAlpha = 1 - (p.y / canvas.height);
                ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
                ctx.restore();

                if (p.y > canvas.height) {
                    particles.splice(i, 1);
                }
            });

            if (particles.length > 0) {
                requestAnimationFrame(update);
            } else {
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        };
        
        createParticles();
        requestAnimationFrame(update);

    }, [canvas]);
    
    return triggerConfetti;
};
