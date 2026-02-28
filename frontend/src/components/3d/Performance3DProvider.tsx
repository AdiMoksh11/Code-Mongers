"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface Performance3DContextType {
  isHighPerformance: boolean;
  shouldRender3D: boolean;
  reduce3DComplexity: boolean;
  enableAnimations: boolean;
}

const Performance3DContext = createContext<Performance3DContextType>({
  isHighPerformance: true,
  shouldRender3D: true,
  reduce3DComplexity: false,
  enableAnimations: true,
});

export const usePerformance3D = () => useContext(Performance3DContext);

interface Performance3DProviderProps {
  children: ReactNode;
}

export function Performance3DProvider({ children }: Performance3DProviderProps) {
  const [performance, setPerformance] = useState<Performance3DContextType>({
    isHighPerformance: true,
    shouldRender3D: true,
    reduce3DComplexity: false,
    enableAnimations: true,
  });

  useEffect(() => {
    const detectPerformance = () => {
      // Check device capabilities
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isLowEndDevice = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      const isSlowConnection = (navigator as any).connection?.effectiveType === 'slow-2g' || 
                               (navigator as any).connection?.effectiveType === '2g';
      
      // Check for reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Check WebGL support
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      const hasWebGL = !!gl;
      
      // Performance memory check (if available)
      const hasLowMemory = (performance as any).memory ? 
        (performance as any).memory.usedJSHeapSize > 50 * 1024 * 1024 : false; // 50MB threshold

      // Calculate performance profile
      const shouldRender3D = hasWebGL && !isSlowConnection;
      const isHighPerformance = !isMobile && !isLowEndDevice && !hasLowMemory && hasWebGL;
      const reduce3DComplexity = isMobile || isLowEndDevice || hasLowMemory;
      const enableAnimations = !prefersReducedMotion && shouldRender3D;

      setPerformance({
        isHighPerformance,
        shouldRender3D,
        reduce3DComplexity,
        enableAnimations,
      });

      // Log performance profile for debugging
      console.log('3D Performance Profile:', {
        isMobile,
        isLowEndDevice,
        isSlowConnection,
        prefersReducedMotion,
        hasWebGL,
        hasLowMemory,
        shouldRender3D,
        isHighPerformance,
        reduce3DComplexity,
        enableAnimations,
      });
    };

    detectPerformance();

    // Listen for changes in reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = () => detectPerformance();
    mediaQuery.addEventListener('change', handleMotionChange);

    return () => mediaQuery.removeEventListener('change', handleMotionChange);
  }, []);

  return (
    <Performance3DContext.Provider value={performance}>
      {children}
    </Performance3DContext.Provider>
  );
}
