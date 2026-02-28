"use client";

import React, { useRef, useState, useEffect, Suspense, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePerformance3D } from './Performance3DProvider';

// Individual floating geometric shape
function FloatingShape({ 
  position, 
  shape, 
  color, 
  size,
  mousePosition 
}: {
  position: [number, number, number];
  shape: 'box' | 'sphere' | 'octahedron' | 'tetrahedron';
  color: string;
  size: number;
  mousePosition: { x: number; y: number };
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const initialPosition = useRef(position);

  useFrame((state) => {
    if (meshRef.current) {
      // Base floating animation
      const time = state.clock.elapsedTime;
      meshRef.current.position.x = initialPosition.current[0] + Math.sin(time * 0.5 + position[0]) * 0.3;
      meshRef.current.position.y = initialPosition.current[1] + Math.cos(time * 0.3 + position[1]) * 0.2;
      meshRef.current.position.z = initialPosition.current[2] + Math.sin(time * 0.4 + position[2]) * 0.1;

      // Mouse interaction
      const mouseInfluence = 0.1;
      meshRef.current.position.x += mousePosition.x * mouseInfluence;
      meshRef.current.position.y += mousePosition.y * mouseInfluence;

      // Rotation
      meshRef.current.rotation.x += 0.005;
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.z += 0.002;
    }
  });

  const renderGeometry = () => {
    switch (shape) {
      case 'box':
        return <boxGeometry args={[size, size, size]} />;
      case 'sphere':
        return <sphereGeometry args={[size * 0.6, 16, 16]} />;
      case 'octahedron':
        return <octahedronGeometry args={[size * 0.7]} />;
      case 'tetrahedron':
        return <tetrahedronGeometry args={[size * 0.8]} />;
      default:
        return <boxGeometry args={[size, size, size]} />;
    }
  };

  return (
    <mesh ref={meshRef} position={position}>
      {renderGeometry()}
      <meshStandardMaterial
        color={color}
        transparent
        opacity={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 0.15 : 0.25}
        roughness={0.3}
        metalness={0.1}
        emissive={color}
        emissiveIntensity={typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? 0.05 : 0.08}
      />
    </mesh>
  );
}

// Particle system for data flow
function DataFlowParticles({ mousePosition }: { mousePosition: { x: number; y: number } }) {
  const particlesRef = useRef<THREE.Mesh[]>([]);
  const particleCount = 20;

  useFrame((state) => {
    particlesRef.current.forEach((particle, i) => {
      if (particle) {
        const time = state.clock.elapsedTime;
        const speed = 0.3 + (i % 3) * 0.1;
        
        // Flow movement
        particle.position.x = -8 + ((time * speed + i) % 16);
        particle.position.y = -4 + (i % 8);
        particle.position.z = -2 + (i % 4);

        // Mouse interaction
        particle.position.x += mousePosition.x * 0.05;
        particle.position.y += mousePosition.y * 0.05;

        // Fade effect
        const progress = (particle.position.x + 8) / 16;
        const material = particle.material as THREE.MeshStandardMaterial;
        material.opacity = Math.sin(progress * Math.PI) * 0.3;
      }
    });
  });

  return (
    <group>
      {[...Array(particleCount)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => el && (particlesRef.current[i] = el)}
          position={[-8 + (i % 16), -4 + (i % 8), -2 + (i % 4)]}
        >
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial
            color="#3b82f6"
            transparent
            opacity={0.3}
            emissive="#3b82f6"
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main ambient scene
function AmbientScene() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((event: MouseEvent) => {
    setMousePosition({
      x: (event.clientX / window.innerWidth) * 2 - 1,
      y: -(event.clientY / window.innerHeight) * 2 + 1,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  // Dynamic colors based on theme
  const isDarkMode = typeof window !== 'undefined' && 
    document.documentElement.classList.contains('dark');

  const shapes = [
    { position: [-6, 3, -5] as [number, number, number], shape: 'box' as const, color: isDarkMode ? '#3b82f6' : '#1e40af', size: 0.3 },
    { position: [4, -2, -3] as [number, number, number], shape: 'sphere' as const, color: isDarkMode ? '#8b5cf6' : '#6d28d9', size: 0.4 },
    { position: [-3, -4, -2] as [number, number, number], shape: 'octahedron' as const, color: isDarkMode ? '#06b6d4' : '#0891b2', size: 0.35 },
    { position: [6, 2, -6] as [number, number, number], shape: 'tetrahedron' as const, color: isDarkMode ? '#10b981' : '#047857', size: 0.25 },
    { position: [-8, 0, -4] as [number, number, number], shape: 'box' as const, color: isDarkMode ? '#f59e0b' : '#d97706', size: 0.3 },
    { position: [2, 4, -3] as [number, number, number], shape: 'sphere' as const, color: isDarkMode ? '#ef4444' : '#dc2626', size: 0.2 },
    { position: [8, -3, -5] as [number, number, number], shape: 'octahedron' as const, color: isDarkMode ? '#8b5cf6' : '#6d28d9', size: 0.4 },
    { position: [-2, 5, -2] as [number, number, number], shape: 'tetrahedron' as const, color: isDarkMode ? '#06b6d4' : '#0891b2', size: 0.3 },
  ];

  return (
    <>
      {/* Ambient lighting */}
      <ambientLight intensity={0.2} />
      <directionalLight position={[10, 10, 10]} intensity={0.3} />

      {/* Floating geometric shapes */}
      {shapes.map((shape, i) => (
        <FloatingShape
          key={i}
          position={shape.position}
          shape={shape.shape}
          color={shape.color}
          size={shape.size}
          mousePosition={mousePosition}
        />
      ))}

      {/* Data flow particles */}
      <DataFlowParticles mousePosition={mousePosition} />
    </>
  );
}

// Loading component
function LoadingFallback() {
  return null; // Invisible for ambient elements
}

// Main ambient 3D component
export default function Ambient3DBackground({ 
  className = "",
  intensity = 1 
}: { 
  className?: string;
  intensity?: number;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const { shouldRender3D, reduce3DComplexity, enableAnimations } = usePerformance3D();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !shouldRender3D || !enableAnimations) {
    return <LoadingFallback />;
  }

  return (
    <div 
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      style={{ opacity: intensity }}
    >
      <Suspense fallback={<LoadingFallback />}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          gl={{ 
            antialias: !reduce3DComplexity,
            alpha: true,
            powerPreference: reduce3DComplexity ? "low-power" : "default"
          }}
          style={{ background: 'transparent' }}
          frameloop={reduce3DComplexity ? "demand" : "always"}
        >
          <AmbientScene />
        </Canvas>
      </Suspense>
    </div>
  );
}
