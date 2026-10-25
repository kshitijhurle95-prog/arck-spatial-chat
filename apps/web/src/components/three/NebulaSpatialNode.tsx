import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface NebulaSpatialNodeProps {
  className?: string;
  intensity?: 'subtle' | 'expressive' | 'reduced';
  theme?: 'dark' | 'light' | 'system';
}

export const NebulaSpatialNode: React.FC<NebulaSpatialNodeProps> = ({
  className = '',
  intensity = 'expressive',
  theme = 'dark',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [hasWebGL, setHasWebGL] = useState(true);

  useEffect(() => {
    // Check reduced motion preference
    const prefersReducedMotion =
      intensity === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!mountRef.current) return;
    const container = mountRef.current;

    // Detect WebGL capability
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setHasWebGL(false);
        return;
      }
    } catch {
      setHasWebGL(false);
      return;
    }

    // Three.js Scene Setup
    const width = container.clientWidth || 300;
    const height = container.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 24;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'low-power',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Group for mouse parallax rotation
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 1. Central Core Node (Wireframe Icosahedron)
    const isDark = theme !== 'light';
    const coreColor = isDark ? 0x69e6ff : 0x0284c7;
    const accentColor = isDark ? 0xa78bfa : 0x7c3aed;

    const coreGeo = new THREE.IcosahedronGeometry(4.2, 1);
    const coreMat = new THREE.MeshBasicMaterial({
      color: coreColor,
      wireframe: true,
      transparent: true,
      opacity: isDark ? 0.45 : 0.6,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    masterGroup.add(coreMesh);

    // Inner glowing sphere
    const innerGeo = new THREE.SphereGeometry(2.0, 16, 16);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: isDark ? 0.3 : 0.4,
    });
    const innerMesh = new THREE.Mesh(innerGeo, innerMat);
    masterGroup.add(innerMesh);

    // 2. Orbital Rings (Torus Wireframe)
    const ringGeo = new THREE.TorusGeometry(8.5, 0.06, 8, 48);
    const ringMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      transparent: true,
      opacity: 0.5,
    });
    const ringMesh1 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh1.rotation.x = Math.PI / 3;
    masterGroup.add(ringMesh1);

    const ringMesh2 = new THREE.Mesh(ringGeo, ringMat);
    ringMesh2.rotation.x = -Math.PI / 4;
    ringMesh2.rotation.y = Math.PI / 6;
    masterGroup.add(ringMesh2);

    // 3. Drifting Particle Cloud
    const particleCount = prefersReducedMotion ? 40 : 160;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const color1 = new THREE.Color(coreColor);
    const color2 = new THREE.Color(accentColor);

    for (let i = 0; i < particleCount; i++) {
      const radius = 6 + Math.random() * 8;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;

      positions[i * 3] = radius * Math.cos(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.sin(theta) * Math.cos(phi);

      const mixed = color1.clone().lerp(color2, Math.random());
      colors[i * 3] = mixed.r;
      colors[i * 3 + 1] = mixed.g;
      colors[i * 3 + 2] = mixed.b;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMat = new THREE.PointsMaterial({
      size: 0.28,
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // Pointer Interactivity with smooth damping
    let targetX = 0;
    let targetY = 0;

    const handlePointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      targetX = x * 0.8;
      targetY = y * 0.8;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });

    // Handle Window Resize
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop with Visibility & Reduced-Motion awareness
    let animationFrameId: number;
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (!isTabVisible) return; // Pause when tab hidden

      if (!prefersReducedMotion) {
        // Slow idle rotation
        coreMesh.rotation.y += 0.005;
        coreMesh.rotation.x += 0.003;
        ringMesh1.rotation.z += 0.004;
        ringMesh2.rotation.z -= 0.003;
        particles.rotation.y += 0.002;

        // Smooth pointer tracking interpolation
        masterGroup.rotation.y += (targetX - masterGroup.rotation.y) * 0.05;
        masterGroup.rotation.x += (-targetY - masterGroup.rotation.x) * 0.05;
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      coreGeo.dispose();
      coreMat.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
    };
  }, [intensity, theme]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full pointer-events-none select-none flex items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* CSS Fallback if WebGL unavailable */}
      {!hasWebGL && (
        <div className="relative w-48 h-48 rounded-full border border-nebula-cyan/30 animate-spin-slow flex items-center justify-center">
          <div className="w-32 h-32 rounded-full border border-nebula-violet/40 animate-pulse" />
          <div className="absolute w-8 h-8 rounded-full bg-gradient-to-tr from-nebula-cyan to-nebula-violet shadow-glow-cyan" />
        </div>
      )}
    </div>
  );
};
