"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
  opacity: number;
  color: string;
  direction: number;
}

const FloatingParticles = () => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const colors = useMemo(() => {
    const isDarkMode = typeof window !== 'undefined' && 
      document.documentElement.classList.contains('dark');
    
    return isDarkMode ? [
      'rgba(59, 130, 246, 0.3)',    // blue
      'rgba(139, 92, 246, 0.3)',    // violet  
      'rgba(6, 182, 212, 0.3)',     // cyan
      'rgba(16, 185, 129, 0.3)',    // emerald
      'rgba(245, 158, 11, 0.3)',    // amber
      'rgba(168, 85, 247, 0.3)',    // purple
    ] : [
      'rgba(30, 64, 175, 0.5)',     // darker blue
      'rgba(109, 40, 217, 0.5)',    // darker violet
      'rgba(8, 145, 178, 0.5)',     // darker cyan
      'rgba(4, 120, 87, 0.5)',      // darker emerald
      'rgba(217, 119, 6, 0.5)',     // darker amber
      'rgba(124, 58, 237, 0.5)',    // darker purple
    ];
  }, []);

  // Initialize particles
  useEffect(() => {
    const generateParticles = () => {
      if (typeof window === 'undefined') return;
      
      const newParticles: Particle[] = [];
      const particleCount = window.innerWidth > 768 ? 40 : 25;

      for (let i = 0; i < particleCount; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: 1 + Math.random() * 3, // 1-4px dots
          speed: 0.1 + Math.random() * 0.3, // Very slow movement
          opacity: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') 
            ? 0.1 + Math.random() * 0.2  // Dark mode: 0.1-0.3 opacity
            : 0.2 + Math.random() * 0.3, // Light mode: 0.2-0.5 opacity for better visibility
          color: colors[Math.floor(Math.random() * colors.length)],
          direction: Math.random() * Math.PI * 2, // Random direction
        });
      }
      setParticles(newParticles);
    };

    generateParticles();

    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(generateParticles, 300);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [colors]);

  // Mouse interaction
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ 
        x: e.clientX,
        y: e.clientY
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Animate particles
  useEffect(() => {
    const animateParticles = () => {
      setParticles(prevParticles => 
        prevParticles.map(particle => {
          let newX = particle.x + Math.cos(particle.direction) * particle.speed;
          let newY = particle.y + Math.sin(particle.direction) * particle.speed;

          // Wrap around screen edges
          if (newX > window.innerWidth + 10) newX = -10;
          if (newX < -10) newX = window.innerWidth + 10;
          if (newY > window.innerHeight + 10) newY = -10;
          if (newY < -10) newY = window.innerHeight + 10;

          // Mouse interaction - particles avoid cursor
          const dx = mousePosition.x - newX;
          const dy = mousePosition.y - newY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < 100) {
            const angle = Math.atan2(dy, dx);
            newX -= Math.cos(angle) * (100 - distance) * 0.001;
            newY -= Math.sin(angle) * (100 - distance) * 0.001;
          }

          return {
            ...particle,
            x: newX,
            y: newY,
          };
        })
      );

      animationFrameRef.current = requestAnimationFrame(animateParticles);
    };

    animateParticles();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [mousePosition]);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-[0]"
    >
      <svg className="w-full h-full">
        {particles.map(particle => (
          <circle
            key={particle.id}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={particle.color}
            opacity={particle.opacity}
            style={{
              filter: `blur(0.5px) drop-shadow(0 0 2px ${particle.color})`,
              transition: 'all 0.1s ease-out',
            }}
          />
        ))}
        
        {/* Add connecting lines between nearby particles */}
        {particles.map((particle, i) => 
          particles.slice(i + 1).map((otherParticle, j) => {
            const dx = particle.x - otherParticle.x;
            const dy = particle.y - otherParticle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 120) {
              const opacity = Math.max(0, (120 - distance) / 120 * 0.1);
              return (
                <line
                  key={`${particle.id}-${otherParticle.id}`}
                  x1={particle.x}
                  y1={particle.y}
                  x2={otherParticle.x}
                  y2={otherParticle.y}
                  stroke={particle.color}
                  strokeWidth="0.5"
                  opacity={opacity}
                />
              );
            }
            return null;
          })
        )}
      </svg>
    </div>
  );
};

export default FloatingParticles;