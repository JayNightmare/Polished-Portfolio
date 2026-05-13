import { motion } from 'motion/react';
import { useEffect, useState } from 'react';

interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    speedX: number;
    speedY: number;
    opacity: number;
}

export function AnimatedBackground() {
    const [particles, setParticles] = useState<Particle[]>([]);

    useEffect(() => {
        const createParticles = () => {
            const newParticles: Particle[] = [];
            for (let i = 0; i < 24; i++) {
                newParticles.push({
                    id: i,
                    x: Math.random() * window.innerWidth,
                    y: Math.random() * window.innerHeight,
                    size: Math.random() * 4 + 1,
                    speedX: (Math.random() - 0.5) * 25,
                    speedY: (Math.random() - 0.5) * 25,
                    opacity: Math.random() * 0.5 + 0.1,
                });
            }
            setParticles(newParticles);
        };

        createParticles();
        window.addEventListener('resize', createParticles);

        return () => window.removeEventListener('resize', createParticles);
    }, []);

    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
            {/* Animated Gradient Background */}
            <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                    background: `
            radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
            radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3), transparent 50%)
          `,
                }}
                animate={{
                    background: [
                        `radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 40% 80%, rgba(119, 198, 255, 0.3), transparent 50%)`,
                        `radial-gradient(circle at 80% 20%, rgba(120, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 40% 80%, rgba(255, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 20% 50%, rgba(119, 198, 255, 0.3), transparent 50%)`,
                        `radial-gradient(circle at 40% 80%, rgba(120, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 20% 50%, rgba(255, 119, 198, 0.3), transparent 50%),
             radial-gradient(circle at 80% 20%, rgba(119, 198, 255, 0.3), transparent 50%)`,
                    ],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            />

            {/* Floating Particles */}
            {particles.map((particle) => (
                <motion.div
                    key={particle.id}
                    className="absolute rounded-full bg-primary/20"
                    style={{
                        left: particle.x,
                        top: particle.y,
                        width: particle.size,
                        height: particle.size,
                        opacity: particle.opacity,
                    }}
                    animate={{
                        x: [0, particle.speedX, 0],
                        y: [0, particle.speedY, 0],
                        scale: [1, 1.2, 1],
                        opacity: [particle.opacity, particle.opacity * 0.5, particle.opacity],
                    }}
                    transition={{
                        duration: 6 + Math.random() * 4,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}

            {/* Geometric Shapes */}
            <motion.div
                className="absolute top-20 left-10 w-32 h-32 border border-primary/10 rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
                className="absolute bottom-20 right-10 w-24 h-24 border border-primary/10 rotate-45"
                animate={{ rotate: [45, 405] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            />

            <motion.div
                className="absolute top-1/2 left-1/4 w-16 h-16 border border-primary/10 rounded-lg"
                animate={{
                    rotate: [0, 180, 360],
                    scale: [1, 1.1, 1],
                }}
                transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
            />
        </div>
    );
}
