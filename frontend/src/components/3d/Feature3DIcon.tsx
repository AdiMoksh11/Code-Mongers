"use client";

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { usePerformance3D } from './Performance3DProvider';

// Neural Network for AI Skill Mapping
function NeuralNetwork({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Animate node pulsing
      nodesRef.current.forEach((node, i) => {
        if (node) {
          const scale = 1 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
          node.scale.setScalar(scale * (isHovered ? 1.2 : 1));
        }
      });
    }
  });

  const nodes = [
    { pos: [-0.8, 0.5, 0], color: "#3b82f6" },
    { pos: [0, 0.8, 0], color: "#8b5cf6" },
    { pos: [0.8, 0.5, 0], color: "#06b6d4" },
    { pos: [-0.4, -0.3, 0], color: "#10b981" },
    { pos: [0.4, -0.3, 0], color: "#f59e0b" },
    { pos: [0, -0.8, 0], color: "#ef4444" },
  ];

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {nodes.map((node, i) => (
        <mesh
          key={i}
          ref={(el) => el && (nodesRef.current[i] = el)}
          position={node.pos as [number, number, number]}
        >
          <sphereGeometry args={[0.1, 16, 16]} />
          <meshStandardMaterial
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.2}
          />
        </mesh>
      ))}
      
      {/* Connections */}
      {nodes.map((_, i) =>
        nodes.slice(i + 1).map((_, j) => {
          const start = new THREE.Vector3(...nodes[i].pos as [number, number, number]);
          const end = new THREE.Vector3(...nodes[i + j + 1].pos as [number, number, number]);
          const distance = start.distanceTo(end);
          const midPoint = start.clone().add(end).multiplyScalar(0.5);
          
          return (
            <mesh key={`${i}-${j}`} position={midPoint.toArray() as [number, number, number]}>
              <cylinderGeometry args={[0.01, 0.01, distance, 8]} />
              <meshStandardMaterial
                color="#4f46e5"
                transparent
                opacity={0.6}
                emissive="#4f46e5"
                emissiveIntensity={0.1}
              />
            </mesh>
          );
        })
      )}
    </group>
  );
}

// Blockchain Cubes for Verification
function BlockchainCubes({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const cubesRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.01;
      
      cubesRef.current.forEach((cube, i) => {
        if (cube) {
          cube.rotation.x = Math.sin(state.clock.elapsedTime + i) * 0.2;
          cube.rotation.z = Math.cos(state.clock.elapsedTime + i) * 0.2;
          cube.scale.setScalar(isHovered ? 1.1 : 1);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(3)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => el && (cubesRef.current[i] = el)}
          position={[(i - 1) * 0.4, 0, 0]}
        >
          <boxGeometry args={[0.25, 0.25, 0.25]} />
          <meshStandardMaterial
            color="#8b5cf6"
            transparent
            opacity={0.8}
            wireframe={i === 1}
          />
        </mesh>
      ))}
    </group>
  );
}

// 3D Chart for Dashboard
function Chart3D({ isHovered }: { isHovered: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      
      barsRef.current.forEach((bar, i) => {
        if (bar) {
          const targetHeight = 0.3 + Math.sin(state.clock.elapsedTime + i) * 0.2;
          bar.scale.y = THREE.MathUtils.lerp(bar.scale.y, targetHeight * (isHovered ? 1.3 : 1), 0.1);
        }
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(5)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => el && (barsRef.current[i] = el)}
          position={[(i - 2) * 0.2, 0, 0]}
        >
          <boxGeometry args={[0.15, 1, 0.15]} />
          <meshStandardMaterial
            color={`hsl(${220 + i * 20}, 70%, 60%)`}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
    </group>
  );
}

// Spinning Globe for Global Recognition
function SpinningGlobe({ isHovered }: { isHovered: boolean }) {
  const globeRef = useRef<THREE.Mesh>(null);
  const ringsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += 0.01;
      globeRef.current.scale.setScalar(isHovered ? 1.2 : 1);
    }
    
    ringsRef.current.forEach((ring, i) => {
      if (ring) {
        ring.rotation.x += 0.02 * (i + 1);
        ring.rotation.z += 0.01 * (i + 1);
      }
    });
  });

  return (
    <group>
      {/* Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial
          color="#06b6d4"
          transparent
          opacity={0.7}
          wireframe
        />
      </mesh>
      
      {/* Orbital Rings */}
      {[...Array(2)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => el && (ringsRef.current[i] = el)}
          rotation={[Math.PI / 2, 0, i * Math.PI / 4]}
        >
          <torusGeometry args={[0.5 + i * 0.1, 0.01, 8, 64]} />
          <meshStandardMaterial
            color="#10b981"
            transparent
            opacity={0.5}
            emissive="#10b981"
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

// Main 3D Icon Component
interface Feature3DIconProps {
  type: 'neural' | 'blockchain' | 'chart' | 'globe';
  isHovered?: boolean;
  className?: string;
}

export default function Feature3DIcon({ type, isHovered = false, className = "" }: Feature3DIconProps) {
  const [isMounted, setIsMounted] = useState(false);
  const { shouldRender3D, reduce3DComplexity } = usePerformance3D();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || !shouldRender3D) {
    return (
      <div className={`w-16 h-16 flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 animate-spin rounded-full"></div>
      </div>
    );
  }

  const renderIcon = () => {
    switch (type) {
      case 'neural':
        return <NeuralNetwork isHovered={isHovered} />;
      case 'blockchain':
        return <BlockchainCubes isHovered={isHovered} />;
      case 'chart':
        return <Chart3D isHovered={isHovered} />;
      case 'globe':
        return <SpinningGlobe isHovered={isHovered} />;
      default:
        return null;
    }
  };

  return (
    <div className={`w-16 h-16 ${className}`}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 animate-spin rounded-full"></div>
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 3], fov: 50 }}
          gl={{ 
            antialias: !reduce3DComplexity, 
            alpha: true,
            powerPreference: reduce3DComplexity ? "low-power" : "default"
          }}
          style={{ background: 'transparent' }}
          frameloop={reduce3DComplexity ? "demand" : "always"}
        >
          <ambientLight intensity={reduce3DComplexity ? 0.6 : 0.5} />
          <directionalLight position={[5, 5, 5]} intensity={reduce3DComplexity ? 0.6 : 0.8} />
          {!reduce3DComplexity && (
            <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#8b5cf6" />
          )}
          {renderIcon()}
        </Canvas>
      </Suspense>
    </div>
  );
}
