import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useTheme } from '../../context/ThemeContext';

const ThreeBackground: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        if (!containerRef.current) return;

        // --- SCENE SETUP ---
        const scene = new THREE.Scene();
        // Fog for depth - lighter fog for light theme to keep it airy but visible
        scene.fog = new THREE.FogExp2(theme === 'dark' ? 0x000000 : 0xf0f9ff, theme === 'dark' ? 0.02 : 0.015);

        const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

        // Initial Position
        camera.position.set(0, 0, 30);

        const renderer = new THREE.WebGLRenderer({
            alpha: true,
            antialias: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerRef.current.appendChild(renderer.domElement);

        // --- DNA HELIX PARAMETERS ---
        const DNA_PARTICLES_COUNT = 300;
        const HELIX_RADIUS = 6;
        const HELIX_LENGTH = 60;
        const HELIX_TURNS = 4;

        // Colors
        const colorStrand1 = new THREE.Color(theme === 'dark' ? 0x00ffff : 0x0044aa);
        const colorStrand2 = new THREE.Color(theme === 'dark' ? 0xff00ff : 0x8800cc);

        const particleGeometry = new THREE.BufferGeometry();
        const positions: number[] = [];
        const colors: number[] = [];
        const sizes: number[] = [];

        const addParticle = (x: number, y: number, z: number, color: THREE.Color, size: number) => {
            positions.push(x, y, z);
            colors.push(color.r, color.g, color.b);
            sizes.push(size);
        };

        for (let i = 0; i < DNA_PARTICLES_COUNT; i++) {
            const t = i / DNA_PARTICLES_COUNT;
            const angle = t * Math.PI * 2 * HELIX_TURNS;
            const y = (t - 0.5) * HELIX_LENGTH;

            const x1 = Math.cos(angle) * HELIX_RADIUS;
            const z1 = Math.sin(angle) * HELIX_RADIUS;
            addParticle(x1, y, z1, colorStrand1, 0.3);

            const x2 = Math.cos(angle + Math.PI) * HELIX_RADIUS;
            const z2 = Math.sin(angle + Math.PI) * HELIX_RADIUS;
            addParticle(x2, y, z2, colorStrand2, 0.3);

            if (i % 15 === 0) {
                const steps = 10;
                for (let j = 1; j < steps; j++) {
                    const lerp = j / steps;
                    const xl = x1 + (x2 - x1) * lerp;
                    const yl = y;
                    const zl = z1 + (z2 - z1) * lerp;
                    addParticle(xl, yl, zl, new THREE.Color(theme === 'dark' ? 0xffffff : 0x333333), 0.1);
                }
            }
        }

        for (let i = 0; i < 200; i++) {
            const x = (Math.random() - 0.5) * 80;
            const y = (Math.random() - 0.5) * 80;
            const z = (Math.random() - 0.5) * 50;
            addParticle(x, y, z, new THREE.Color(theme === 'dark' ? 0x88ccff : 0x99aacc), Math.random() * 0.2);
        }

        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            map: getDiscTexture(),
            alphaTest: 0.5,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });

        const helixPoints = new THREE.Points(particleGeometry, material);
        scene.add(helixPoints);

        // --- INTERACTION & SCROLL ---
        let mouseX = 0;
        let mouseY = 0;
        let scrollY = 0;

        const handleMouseMove = (event: MouseEvent) => {
            mouseX = (event.clientX - window.innerWidth / 2) * 0.001;
            mouseY = (event.clientY - window.innerHeight / 2) * 0.001;
        };

        const handleScroll = () => {
            scrollY = window.scrollY;
        };

        document.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('scroll', handleScroll);

        const handleResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        // --- ANIMATION ---
        const clock = new THREE.Clock();

        const animate = () => {
            requestAnimationFrame(animate);
            const time = clock.getElapsedTime();

            // Calculate Scroll Progress (0 to 1 based on page height approx)
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const scrollProgress = Math.min(scrollY / (maxScroll || 1), 1);

            // --- SCROLL DRIVEN ANIMATION ("Dora Style") ---

            // 1. Position: Move Helix based on scroll
            // Hero (0): Center
            // Feature (0.3): Move Left
            // Map (0.6): Move Right
            // End (1): Center Zoom

            let targetX = 0;
            let targetY = 0;
            let targetZ = 30; // Camera Z
            let targetRotZ = 0;

            if (scrollProgress < 0.3) {
                // Hero -> Features: Move Left (-10)
                const p = scrollProgress / 0.3;
                targetX = THREE.MathUtils.lerp(0, -10, p);
                targetY = THREE.MathUtils.lerp(0, 5, p);
            } else if (scrollProgress < 0.6) {
                // Features -> Map: Move Right (10)
                const p = (scrollProgress - 0.3) / 0.3;
                targetX = THREE.MathUtils.lerp(-10, 10, p);
                targetY = THREE.MathUtils.lerp(5, -5, p);
                targetRotZ = THREE.MathUtils.lerp(0, Math.PI / 2, p); // Rotate 90 deg
            } else {
                // Map -> Footer: Center and Zoom in
                const p = (scrollProgress - 0.6) / 0.4;
                targetX = THREE.MathUtils.lerp(10, 0, p);
                targetY = THREE.MathUtils.lerp(-5, 0, p);
                targetZ = THREE.MathUtils.lerp(30, 10, p); // Zoom in
                targetRotZ = THREE.MathUtils.lerp(Math.PI / 2, Math.PI, p);
            }

            // Smooth Camera Movement (Lerp)
            camera.position.x += (targetX - camera.position.x) * 0.05;
            camera.position.y += (targetY - camera.position.y) * 0.05;
            camera.position.z += (targetZ - camera.position.z) * 0.05;

            // Look at slightly offset center for dynamic feel
            camera.lookAt(targetX * 0.5, targetY * 0.5, 0);

            // Helix Rotation
            helixPoints.rotation.y += 0.005; // Constant spin
            helixPoints.rotation.z += (targetRotZ - helixPoints.rotation.z) * 0.05; // Scroll rotation

            // Mouse Parallax (Subtle)
            camera.position.x += mouseX * 2;
            camera.position.y += -mouseY * 2;

            // Pulse
            const scale = 1 + Math.sin(time * 2) * 0.05;
            helixPoints.scale.set(scale, scale, scale);

            renderer.render(scene, camera);
        };
        animate();

        // Cleanup
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (containerRef.current) {
                containerRef.current.removeChild(renderer.domElement);
            }
            particleGeometry.dispose();
            material.dispose();
        };

    }, [theme]);

    return (
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none bg-gradient-to-b from-transparent to-background">
            <div ref={containerRef} className="absolute inset-0 z-0" />
            {/* Optional simplified ambient glow */}
            <div className={`absolute inset-0 z-10 bg-gradient-to-t ${theme === 'dark' ? 'from-black/60' : 'from-white/60'} to-transparent`} />
        </div>
    );
};

// Helper to create a soft glow texture programmatically
function getDiscTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const context = canvas.getContext('2d');
    if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255,255,255,1)');
        gradient.addColorStop(0.5, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
    }
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
}

export default ThreeBackground;
