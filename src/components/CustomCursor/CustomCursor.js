import React, { useEffect, useRef } from 'react';
import styles from './CustomCursor.module.css';

export const CustomCursor = () => {
    const cursorRef = useRef(null); // Outer circle
    const dotRef = useRef(null);    // Inner dot

    // Current position of the mouse
    const mouse = useRef({ x: 0, y: 0 });

    // Current position of the cursor elements (for interpolation)
    const cursor = useRef({ x: 0, y: 0 });
    const dot = useRef({ x: 0, y: 0 });

    useEffect(() => {
        const onMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        window.addEventListener('mousemove', onMouseMove);

        const animate = () => {
            // Lerp factor for the outer circle (0.1 = slow/smooth, 1 = instant)
            const speed = 0.15;

            // Interpolate outer circle position
            cursor.current.x += (mouse.current.x - cursor.current.x) * speed;
            cursor.current.y += (mouse.current.y - cursor.current.y) * speed;

            // Inner dot follows instantly (or very fast)
            dot.current.x = mouse.current.x;
            dot.current.y = mouse.current.y;

            // Apply transforms
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${cursor.current.x}px, ${cursor.current.y}px, 0)`;
            }
            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0)`;
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            cancelAnimationFrame(animationId);
        };
    }, []);

    return (
        <>
            <div ref={cursorRef} className={styles.cursorOuter} />
            <div ref={dotRef} className={styles.cursorInner} />
        </>
    );
};
