import React, { useEffect, useRef } from 'react';
import styles from './BackgroundAnimation.module.css';

export const BackgroundAnimation = () => {
    const canvasRef = useRef(null);
    const mouseRef = useRef({ x: null, y: null, radius: 150 });

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let particlesArray;

        const handleResize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            init();
        };

        const handleMouseMove = (event) => {
            mouseRef.current.x = event.x;
            mouseRef.current.y = event.y;
        };

        const handleMouseLeave = () => {
            mouseRef.current.x = null;
            mouseRef.current.y = null;
        }

        window.addEventListener('resize', handleResize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseout', handleMouseLeave);

        class MixedShape {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = (Math.random() * 15) + 8;
                this.directionX = (Math.random() * 0.4) - 0.2;
                this.directionY = (Math.random() * 0.4) - 0.2;

                // Rotation properties
                this.rotation = Math.random() * 360;
                this.rotationSpeed = (Math.random() * 0.2) - 0.1;

                // 3D Rotation (for cubes and pyramids)
                this.angleX = Math.random() * Math.PI * 2;
                this.angleY = Math.random() * Math.PI * 2;
                this.speedX = (Math.random() * 0.02) - 0.01;
                this.speedY = (Math.random() * 0.02) - 0.01;

                this.opacity = (Math.random() * 0.3) + 0.05;
                this.color = `rgba(125, 29, 64, ${this.opacity})`;
                this.type = ['sphere', 'pyramid', 'cube'][Math.floor(Math.random() * 3)];
            }

            draw() {
                if (!Number.isFinite(this.x) || !Number.isFinite(this.y)) return;

                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.fillStyle = this.color;
                ctx.strokeStyle = this.color;
                ctx.lineWidth = 1.5;

                if (this.type === 'cube') {
                    // Draw 3D Cube
                    let vertices = [
                        { x: -this.size, y: -this.size, z: -this.size },
                        { x: this.size, y: -this.size, z: -this.size },
                        { x: this.size, y: this.size, z: -this.size },
                        { x: -this.size, y: this.size, z: -this.size },
                        { x: -this.size, y: -this.size, z: this.size },
                        { x: this.size, y: -this.size, z: this.size },
                        { x: this.size, y: this.size, z: this.size },
                        { x: -this.size, y: this.size, z: this.size }
                    ];

                    // Rotate vertices
                    vertices = vertices.map(v => {
                        let y1 = v.y * Math.cos(this.angleX) - v.z * Math.sin(this.angleX);
                        let z1 = v.y * Math.sin(this.angleX) + v.z * Math.cos(this.angleX);
                        let x1 = v.x;

                        let x2 = x1 * Math.cos(this.angleY) + z1 * Math.sin(this.angleY);
                        let z2 = -x1 * Math.sin(this.angleY) + z1 * Math.cos(this.angleY);
                        let y2 = y1;

                        return { x: x2, y: y2 };
                    });

                    // Edges
                    const edges = [
                        [0, 1], [1, 2], [2, 3], [3, 0], // Front face
                        [4, 5], [5, 6], [6, 7], [7, 4], // Back face
                        [0, 4], [1, 5], [2, 6], [3, 7]  // Connecting lines
                    ];

                    ctx.beginPath();
                    edges.forEach(edge => {
                        const v1 = vertices[edge[0]];
                        const v2 = vertices[edge[1]];
                        ctx.moveTo(v1.x, v1.y);
                        ctx.lineTo(v2.x, v2.y);
                    });
                    ctx.stroke();

                } else if (this.type === 'pyramid') {
                    // Draw 3D Pyramid (Tetrahedron)
                    let vertices = [
                        { x: this.size, y: this.size, z: this.size },
                        { x: this.size, y: -this.size, z: -this.size },
                        { x: -this.size, y: this.size, z: -this.size },
                        { x: -this.size, y: -this.size, z: this.size }
                    ];

                    // Rotate vertices
                    vertices = vertices.map(v => {
                        let y1 = v.y * Math.cos(this.angleX) - v.z * Math.sin(this.angleX);
                        let z1 = v.y * Math.sin(this.angleX) + v.z * Math.cos(this.angleX);
                        let x1 = v.x;

                        let x2 = x1 * Math.cos(this.angleY) + z1 * Math.sin(this.angleY);
                        let z2 = -x1 * Math.sin(this.angleY) + z1 * Math.cos(this.angleY);
                        let y2 = y1;

                        return { x: x2, y: y2 };
                    });

                    // Edges
                    const edges = [
                        [0, 1], [0, 2], [0, 3],
                        [1, 2], [1, 3],
                        [2, 3]
                    ];

                    ctx.beginPath();
                    edges.forEach(edge => {
                        const v1 = vertices[edge[0]];
                        const v2 = vertices[edge[1]];
                        ctx.moveTo(v1.x, v1.y);
                        ctx.lineTo(v2.x, v2.y);
                    });
                    ctx.stroke();

                } else if (this.type === 'sphere') {
                    // Draw Sphere (Circle)
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size, 0, Math.PI * 2, false);
                    ctx.fill();
                }

                ctx.restore();
            }

            update() {
                // Bounce off edges
                if (this.x > canvas.width + 50 || this.x < -50) {
                    this.directionX = -this.directionX;
                }
                if (this.y > canvas.height + 50 || this.y < -50) {
                    this.directionY = -this.directionY;
                }

                // Mouse interaction (repel)
                let dx = mouseRef.current.x - this.x;
                let dy = mouseRef.current.y - this.y;
                let distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < mouseRef.current.radius && mouseRef.current.x !== null && distance > 0) {
                    const forceDirectionX = dx / distance;
                    const forceDirectionY = dy / distance;
                    const force = (mouseRef.current.radius - distance) / mouseRef.current.radius;
                    const directionX = forceDirectionX * force * 2;
                    const directionY = forceDirectionY * force * 2;

                    this.x -= directionX;
                    this.y -= directionY;
                }

                this.x += this.directionX;
                this.y += this.directionY;

                // Update rotations
                this.rotation += this.rotationSpeed;
                this.angleX += this.speedX;
                this.angleY += this.speedY;

                this.draw();
            }
        }

        function init() {
            particlesArray = [];
            let numberOfParticles = (canvas.height * canvas.width) / 15000;
            for (let i = 0; i < numberOfParticles; i++) {
                particlesArray.push(new MixedShape());
            }
        }

        function animate() {
            animationFrameId = requestAnimationFrame(animate);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            try {
                for (let i = 0; i < particlesArray.length; i++) {
                    particlesArray[i].update();
                }
            } catch (error) {
                console.error("Animation Error:", error);
                cancelAnimationFrame(animationFrameId);
            }
        }

        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        init();
        animate();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseout', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return <canvas ref={canvasRef} className={styles.canvas} />;
};
