"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { 
  GraduationCap, 
  Award, 
  BookOpen, 
  Shield, 
  Star, 
  Trophy, 
  Users, 
  Zap, 
  Target, 
  CheckCircle,
  Briefcase,
  Globe,
  Lock,
  FileText,
  Lightbulb,
  Heart,
  Compass,
  Gem
} from 'lucide-react';

interface FloatingIcon {
  id: number;
  Icon: React.ComponentType<any>;
  initialX: number;
  initialY: number;
  size: number;
  speed: number;
  delay: number;
  color: string;
  opacity: number;
  glowIntensity: number;
  rotationSpeed: number;
}

const AnimatedBackgroundIcons = () => {
  const [icons, setIcons] = useState<FloatingIcon[]>([]);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Available icons related to education, credentials, and achievements
  const availableIcons = useMemo(() => [
    GraduationCap, Award, BookOpen, Shield, Star, Trophy, 
    Users, Zap, Target, CheckCircle, Briefcase, Globe, 
    Lock, FileText, Lightbulb, Heart, Compass, Gem
  ], []);

  // Track theme changes
  useEffect(() => {
    const updateTheme = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    updateTheme();
    
    // Watch for theme changes
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Enhanced color palette with theme-aware colors for better visibility
  const colors = useMemo(() => {
    return isDarkMode ? [
      // Dark mode colors (lighter/brighter)
      'hsl(217, 91%, 70%)',    // blue
      'hsl(262, 83%, 68%)',    // violet
      'hsl(189, 94%, 53%)',    // cyan
      'hsl(158, 84%, 49%)',    // emerald
      'hsl(43, 96%, 66%)',     // amber
      'hsl(0, 84%, 70%)',      // red
      'hsl(271, 91%, 75%)',    // purple
      'hsl(142, 76%, 46%)',    // green
      'hsl(280, 100%, 80%)',   // fuchsia
      'hsl(204, 94%, 60%)',    // sky
    ] : [
      // Light mode colors (darker/more saturated)
      'hsl(217, 91%, 30%)',    // blue
      'hsl(262, 83%, 35%)',    // violet
      'hsl(189, 94%, 25%)',    // cyan
      'hsl(158, 84%, 25%)',    // emerald
      'hsl(43, 96%, 35%)',     // amber
      'hsl(0, 84%, 40%)',      // red
      'hsl(271, 91%, 40%)',    // purple
      'hsl(142, 76%, 20%)',    // green
      'hsl(280, 100%, 35%)',   // fuchsia
      'hsl(204, 94%, 30%)',    // sky
    ];
  }, [isDarkMode]);

  // Initialize floating icons with enhanced properties
  useEffect(() => {
    const generateIcons = () => {
      if (typeof window === 'undefined') return;
      
      const newIcons: FloatingIcon[] = [];
      const iconCount = window.innerWidth > 768 ? 30 : 20; // Responsive icon count

      for (let i = 0; i < iconCount; i++) {
        newIcons.push({
          id: i,
          Icon: availableIcons[Math.floor(Math.random() * availableIcons.length)],
          initialX: Math.random() * window.innerWidth,
          initialY: Math.random() * window.innerHeight,
          size: 16 + Math.random() * 28, // 16-44px
          speed: 0.2 + Math.random() * 0.8, // 0.2-1.0
          delay: Math.random() * 15, // 0-15s delay for staggered start
          color: colors[Math.floor(Math.random() * colors.length)],
          opacity: isDarkMode 
            ? 0.08 + Math.random() * 0.15  // Dark mode: subtle
            : 0.15 + Math.random() * 0.25, // Light mode: more visible
          glowIntensity: Math.random() * 0.3, // Variable glow
          rotationSpeed: 10 + Math.random() * 20, // 10-30s rotation
        });
      }
      setIcons(newIcons);
    };

    // Delay initial generation for smooth loading
    const timer = setTimeout(() => {
      generateIcons();
      setIsVisible(true);
    }, 500);

    // Regenerate icons when window resizes (debounced)
    let resizeTimeout: NodeJS.Timeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(generateIcons, 300);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
    };
  }, [availableIcons, colors]);

  // Enhanced mouse interaction with smooth tracking
  useEffect(() => {
    let animationId: number;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (animationId) cancelAnimationFrame(animationId);
      
      animationId = requestAnimationFrame(() => {
        setMousePosition({ 
          x: (e.clientX / window.innerWidth - 0.5) * 15,
          y: (e.clientY / window.innerHeight - 0.5) * 15
        });
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, []);

  // Generate unique CSS animations for each icon
  const animationStyles = useMemo(() => {
    return icons.map(icon => ({
      floatAnimation: `
        @keyframes float-${icon.id} {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
          }
          25% {
            transform: translateY(${-15 - Math.random() * 25}px) 
                      translateX(${-8 + Math.random() * 16}px) 
                      scale(${0.9 + Math.random() * 0.15}) 
                      rotate(${Math.random() * 45}deg);
          }
          50% {
            transform: translateY(${-8 - Math.random() * 15}px) 
                      translateX(${8 - Math.random() * 16}px) 
                      scale(${1.0 + Math.random() * 0.1}) 
                      rotate(${Math.random() * 90}deg);
          }
          75% {
            transform: translateY(${-20 - Math.random() * 20}px) 
                      translateX(${-4 + Math.random() * 12}px) 
                      scale(${0.95 + Math.random() * 0.1}) 
                      rotate(${Math.random() * 135}deg);
          }
        }
      `,
      pulseAnimation: `
        @keyframes pulse-${icon.id} {
          0%, 100% {
            filter: drop-shadow(0 0 ${2 + icon.glowIntensity * 6}px currentColor);
            opacity: ${icon.opacity};
          }
          50% {
            filter: drop-shadow(0 0 ${8 + icon.glowIntensity * 12}px currentColor);
            opacity: ${Math.min(icon.opacity * 1.5, 0.4)};
          }
        }
      `
    }));
  }, [icons]);

  if (!isVisible || icons.length === 0) {
    return null;
  }

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 overflow-hidden pointer-events-none z-[1] transition-opacity duration-1000"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {icons.map((icon, index) => (
        <div
          key={icon.id}
          className="absolute will-change-transform"
          style={{
            left: `${icon.initialX}px`,
            top: `${icon.initialY}px`,
            transform: `translate(${mousePosition.x * (icon.speed * 0.3)}px, ${mousePosition.y * (icon.speed * 0.3)}px)`,
            animation: `
              float-${icon.id} ${6 + icon.speed * 6}s ease-in-out infinite ${icon.delay}s,
              pulse-${icon.id} ${8 + Math.random() * 8}s ease-in-out infinite ${icon.delay + 2}s
            `,
          }}
        >
          <icon.Icon
            size={icon.size}
            style={{
              color: icon.color,
              opacity: icon.opacity,
              filter: `blur(${Math.random() * 0.3}px) drop-shadow(0 0 ${4 + icon.glowIntensity * 8}px currentColor)`,
            }}
          />
        </div>
      ))}
      
      {/* Dynamic CSS animations */}
      <style jsx global>{`
        ${animationStyles.map(style => style.floatAnimation + '\n' + style.pulseAnimation).join('\n')}
        
        /* Additional interactive effects */
        @keyframes sparkle {
          0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50% { transform: scale(1) rotate(180deg); opacity: 1; }
        }
        
        @keyframes drift {
          from { transform: translateX(-100px); opacity: 0; }
          10%, 90% { opacity: 1; }
          to { transform: translateX(100vw); opacity: 0; }
        }
        
        /* Performance optimization */
        .animated-background-icons * {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default AnimatedBackgroundIcons;