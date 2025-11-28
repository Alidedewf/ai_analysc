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

    // State for hover and click effects
    const isHovering = useRef(false);
    const isClicking = useRef(false);

    useEffect(() => {
        const onMouseMove = (e) => {
            mouse.current.x = e.clientX;
            mouse.current.y = e.clientY;
        };

        const onMouseDown = () => { isClicking.current = true; };
        const onMouseUp = () => { isClicking.current = false; };

        const onMouseOver = (e) => {
            const target = e.target;
            // Check if target is clickable (link, button, input, or has 'clickable' class)
            if (
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.tagName === 'SELECT' ||
                target.closest('a') ||
                target.closest('button') ||
                target.classList.contains('clickable')
            ) {
                isHovering.current = true;
            } else {
                isHovering.current = false;
            }
        };

        const onMouseOut = () => {
            isHovering.current = false;
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', onMouseDown);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('mouseover', onMouseOver);
        window.addEventListener('mouseout', onMouseOut);

        const animate = () => {
            // 1. Inner Dot: Follows mouse almost instantly (very fast lerp or direct)
            // Using slight lerp (0.8) makes it feel "organic" but snappy
            dot.current.x += (mouse.current.x - dot.current.x) * 0.9;
            dot.current.y += (mouse.current.y - dot.current.y) * 0.9;

            // 2. Outer Circle: Follows with smooth delay
            // Increased speed from 0.15 to 0.25 for better responsiveness
            const speed = 0.25;
            cursor.current.x += (mouse.current.x - cursor.current.x) * speed;
            cursor.current.y += (mouse.current.y - cursor.current.y) * speed;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${dot.current.x}px, ${dot.current.y}px, 0)`;
            }

            if (cursorRef.current) {
                const x = cursor.current.x;
                const y = cursor.current.y;

                // Calculate scale based on state
                let scale = 1;
                if (isClicking.current) scale = 0.8;
                else if (isHovering.current) scale = 1.5;

                cursorRef.current.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;

                // Optional: Change opacity or border on hover
                cursorRef.current.style.opacity = isHovering.current ? '0.5' : '0.3';
                cursorRef.current.style.borderColor = isHovering.current ? 'rgba(125, 29, 64, 0.5)' : 'rgba(0, 0, 0, 0.5)';
                cursorRef.current.style.backgroundColor = isHovering.current ? 'rgba(125, 29, 64, 0.1)' : 'rgba(0, 0, 0, 0.05)';
            }

            requestAnimationFrame(animate);
        };

        const animationId = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mousedown', onMouseDown);
            window.removeEventListener('mouseup', onMouseUp);
            window.removeEventListener('mouseover', onMouseOver);
            window.removeEventListener('mouseout', onMouseOut);
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
