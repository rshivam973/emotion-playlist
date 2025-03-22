'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface MoodVisualizationProps {
  mood: string;
  intensity: number;
}

const MoodVisualization = ({ mood, intensity }: MoodVisualizationProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const timeRef = useRef(0);

  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particle system
    const particleCount = 3000;
    const boundarySize = 30;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    // Initialize particles within the boundary
    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * boundarySize;
      positions[i + 1] = (Math.random() - 0.5) * boundarySize;
      positions[i + 2] = (Math.random() - 0.5) * boundarySize;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 0.03,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true
    });

    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation
    const animate = () => {
      requestAnimationFrame(animate);
      timeRef.current += 0.001;

      if (particlesRef.current && cameraRef.current) {
        // Camera movement in a circular path
        const radius = boundarySize * 0.2;  // Camera movement radius
        const cameraX = Math.sin(timeRef.current * 0.3) * radius;
        const cameraY = Math.cos(timeRef.current * 0.2) * radius * 0.3;
        const cameraZ = Math.cos(timeRef.current * 0.15) * radius + boundarySize * 0.2;

        cameraRef.current.position.set(cameraX, cameraY, cameraZ);
        
        // Look ahead in the movement direction
        const lookAtX = Math.sin(timeRef.current * 0.3) * radius * 2;
        const lookAtY = Math.cos(timeRef.current * 0.2) * radius * 0.5;
        const lookAtZ = -boundarySize * 0.3;
        cameraRef.current.lookAt(lookAtX, lookAtY, lookAtZ);

        // Update particle positions
        const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const halfBoundary = boundarySize * 0.5;

        for (let i = 0; i < positions.length; i += 3) {
          // Move particles
          positions[i + 2] += 0.03;  // Forward motion

          // Wrap particles around the boundary
          if (positions[i] > halfBoundary) positions[i] = -halfBoundary;
          if (positions[i] < -halfBoundary) positions[i] = halfBoundary;
          if (positions[i + 1] > halfBoundary) positions[i + 1] = -halfBoundary;
          if (positions[i + 1] < -halfBoundary) positions[i + 1] = halfBoundary;
          if (positions[i + 2] > halfBoundary) positions[i + 2] = -halfBoundary;
          if (positions[i + 2] < -halfBoundary) positions[i + 2] = halfBoundary;

          // Add wave motion based on intensity
          positions[i + 1] += Math.sin(timeRef.current + positions[i] * 0.1) * 0.001 * intensity;
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
      }

      renderer.render(scene, camera);
    };

    animate();

    // Handle window resize
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && rendererRef.current) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Update particle colors based on mood
  useEffect(() => {
    if (!particlesRef.current) return;

    const colors = particlesRef.current.geometry.attributes.color.array as Float32Array;
    const moodColors = {
      happy: [1, 1, 0], // Yellow
      sad: [0, 0.5, 1], // Blue
      angry: [1, 0, 0], // Red
      neutral: [0.5, 0.5, 0.5], // Gray
      surprised: [1, 0.5, 0], // Orange
      fearful: [0.5, 0, 0.5], // Purple
      disgusted: [0, 1, 0] // Green
    };

    const color = moodColors[mood as keyof typeof moodColors] || moodColors.neutral;

    for (let i = 0; i < colors.length; i += 3) {
      colors[i] = color[0];
      colors[i + 1] = color[1];
      colors[i + 2] = color[2];
    }

    particlesRef.current.geometry.attributes.color.needsUpdate = true;
  }, [mood]);

  return <div ref={containerRef} className="fixed inset-0 -z-10" />;
};

export default MoodVisualization; 