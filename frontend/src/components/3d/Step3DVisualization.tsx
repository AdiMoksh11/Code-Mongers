"use client";

import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// User Avatar for Step 1
function UserAvatar({ isVisible }: { isVisible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const documentsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
      
      // Animate floating documents
      documentsRef.current.forEach((doc, i) => {
        if (doc) {
          doc.position.y = 0.5 + Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
          doc.rotation.z = Math.sin(state.clock.elapsedTime + i) * 0.1;
        }
      });
    }
  });

  return (
    <group ref={groupRef} scale={isVisible ? 1 : 0.8}>
      {/* User Head */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#fbbf24" />
      </mesh>
      
      {/* User Body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.08, 0.12, 0.4, 8]} />
        <meshStandardMaterial color="#3b82f6" />
      </mesh>
      
      {/* Floating Documents */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => el && (documentsRef.current[i] = el)}
          position={[0.3 + i * 0.2, 0.5, 0.2]}
          rotation={[0, 0, 0.1]}
        >
          <boxGeometry args={[0.1, 0.15, 0.01]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.8} />
        </mesh>
      ))}
    </group>
  );
}

// Floating Documents for Step 2
function FloatingDocuments({ isVisible }: { isVisible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const docsRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
      
      docsRef.current.forEach((doc, i) => {
        if (doc) {
          const angle = state.clock.elapsedTime + i * (Math.PI * 2) / 5;
          doc.position.x = Math.cos(angle) * 0.4;
          doc.position.z = Math.sin(angle) * 0.4;
          doc.position.y = Math.sin(state.clock.elapsedTime * 2 + i) * 0.1;
          doc.rotation.y = angle;
        }
      });
    }
  });

  return (
    <group ref={groupRef} scale={isVisible ? 1 : 0.8}>
      {/* Central Hub */}
      <mesh>
        <cylinderGeometry args={[0.1, 0.1, 0.05, 12]} />
        <meshStandardMaterial color="#8b5cf6" emissive="#8b5cf6" emissiveIntensity={0.2} />
      </mesh>
      
      {/* Orbiting Documents */}
      {[...Array(5)].map((_, i) => (
        <mesh key={i} ref={(el) => el && (docsRef.current[i] = el)}>
          <boxGeometry args={[0.12, 0.16, 0.02]} />
          <meshStandardMaterial 
            color={`hsl(${220 + i * 30}, 70%, 60%)`}
            transparent 
            opacity={0.8} 
          />
        </mesh>
      ))}
    </group>
  );
}

// Verification Shield for Step 3
function VerificationShield({ isVisible }: { isVisible: boolean }) {
  const shieldRef = useRef<THREE.Mesh>(null);
  const particlesRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (shieldRef.current) {
      shieldRef.current.rotation.y += 0.01;
      shieldRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.05);
    }
    
    particlesRef.current.forEach((particle, i) => {
      if (particle) {
        const angle = state.clock.elapsedTime + i * (Math.PI * 2) / 8;
        particle.position.x = Math.cos(angle) * 0.6;
        particle.position.z = Math.sin(angle) * 0.6;
        particle.position.y = Math.sin(angle * 2) * 0.1;
      }
    });
  });

  return (
    <group scale={isVisible ? 1 : 0.8}>
      {/* Shield */}
      <mesh ref={shieldRef}>
        <cylinderGeometry args={[0.3, 0.25, 0.05, 6]} />
        <meshStandardMaterial 
          color="#10b981" 
          transparent 
          opacity={0.8}
          emissive="#10b981"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* Security Particles */}
      {[...Array(8)].map((_, i) => (
        <mesh key={i} ref={(el) => el && (particlesRef.current[i] = el)}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial 
            color="#06b6d4" 
            emissive="#06b6d4" 
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}

// Sharing Network for Step 4
function SharingNetwork({ isVisible }: { isVisible: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Mesh[]>([]);
  
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.008;
      
      nodesRef.current.forEach((node, i) => {
        if (node) {
          const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i) * 0.1;
          node.scale.setScalar(scale);
        }
      });
    }
  });

  const networkNodes = [
    { pos: [0, 0, 0], size: 0.12, color: "#3b82f6" }, // Center
    { pos: [-0.4, 0.3, 0.2], size: 0.08, color: "#8b5cf6" },
    { pos: [0.4, 0.3, -0.2], size: 0.08, color: "#06b6d4" },
    { pos: [-0.3, -0.4, -0.1], size: 0.08, color: "#10b981" },
    { pos: [0.3, -0.4, 0.3], size: 0.08, color: "#f59e0b" },
  ];

  return (
    <group ref={groupRef} scale={isVisible ? 1 : 0.8}>
      {/* Network Nodes */}
      {networkNodes.map((node, i) => (
        <mesh 
          key={i} 
          ref={(el) => el && (nodesRef.current[i] = el)}
          position={node.pos as [number, number, number]}
        >
          <sphereGeometry args={[node.size, 16, 16]} />
          <meshStandardMaterial 
            color={node.color}
            emissive={node.color}
            emissiveIntensity={0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}
      
      {/* Connection Lines */}
      {networkNodes.slice(1).map((node, i) => {
        const start = new THREE.Vector3(0, 0, 0);
        const end = new THREE.Vector3(...node.pos as [number, number, number]);
        const distance = start.distanceTo(end);
        const midPoint = start.clone().add(end).multiplyScalar(0.5);
        
        return (
          <mesh key={i} position={midPoint.toArray() as [number, number, number]}>
            <cylinderGeometry args={[0.005, 0.005, distance, 8]} />
            <meshStandardMaterial 
              color="#4f46e5" 
              transparent 
              opacity={0.6}
              emissive="#4f46e5"
              emissiveIntensity={0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// Main Step 3D Component
interface Step3DVisualizationProps {
  step: 'signup' | 'upload' | 'verify' | 'share';
  isVisible?: boolean;
  className?: string;
}

export default function Step3DVisualization({ 
  step, 
  isVisible = false, 
  className = "" 
}: Step3DVisualizationProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className={`w-20 h-20 flex items-center justify-center ${className}`}>
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 animate-spin rounded-full"></div>
      </div>
    );
  }

  const renderVisualization = () => {
    switch (step) {
      case 'signup':
        return <UserAvatar isVisible={isVisible} />;
      case 'upload':
        return <FloatingDocuments isVisible={isVisible} />;
      case 'verify':
        return <VerificationShield isVisible={isVisible} />;
      case 'share':
        return <SharingNetwork isVisible={isVisible} />;
      default:
        return null;
    }
  };

  return (
    <div className={`w-20 h-20 ${className}`}>
      <Suspense fallback={
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 animate-spin rounded-full"></div>
        </div>
      }>
        <Canvas
          camera={{ position: [0, 0, 2], fov: 60 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 5, 5]} intensity={0.8} />
          <directionalLight position={[-5, -5, -5]} intensity={0.3} color="#8b5cf6" />
          {renderVisualization()}
        </Canvas>
      </Suspense>
    </div>
  );
}
