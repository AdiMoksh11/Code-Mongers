'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { 
  ArrowLeft, 
  Home, 
  Zap, 
  Code2, 
  Trophy, 
  Rocket, 
  Stars,
  ChevronRight,
  ExternalLink
} from 'lucide-react'

export default function NotFound() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const [showCountdown, setShowCountdown] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])



  const handleGoHome = () => {
    setIsLoading(true)
    setShowCountdown(true)
    setCountdown(3) // Reset countdown
  }

  // Handle countdown and navigation in useEffect
  useEffect(() => {
    if (!showCountdown) return

    const countdownTimer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(countdownTimer)
  }, [showCountdown])

  // Navigate when countdown reaches 0
  useEffect(() => {
    if (showCountdown && countdown === 0) {
      router.push('/')
    }
  }, [countdown, showCountdown, router])

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Blockchain Verification",
      description: "Tamper-proof credential verification system"
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Smart Contracts",
      description: "Automated verification through smart contracts"
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: "Anti-Fraud Detection",
      description: "Advanced ML-powered fraud detection"
    }
  ]

  // Prevent hydration mismatch by not rendering until mounted
  if (!isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-4">
        <div className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
          404
        </div>
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
          🚧 Page Under Construction 🚧
        </h2>
        <p className="text-xl text-muted-foreground mb-8">
          We're working hard to bring you an amazing experience!
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute -top-4 -left-4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute -bottom-4 -right-4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1.2, 1, 1.2],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Floating Particles */}
      {isMounted && [...Array(20)].map((_, i) => {
        // Use deterministic values based on index to avoid hydration mismatch
        const leftPos = (i * 37) % 100; // Pseudo-random but deterministic
        const topPos = (i * 73) % 100;
        const duration = 3 + (i % 3);
        const delay = (i * 0.2) % 2;
        
        return (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-primary/20 rounded-full"
            style={{
              left: `${leftPos}%`,
              top: `${topPos}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.2, 1, 0.2],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
            }}
          />
        );
      })}

      <div className="relative z-10 text-center max-w-4xl mx-auto">
        {/* 404 Animation */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "backOut" }}
          className="mb-8"
        >
          <motion.h1
            className="text-8xl md:text-9xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4"
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }}
            style={{
              backgroundSize: "200% 200%"
            }}
          >
            404
          </motion.h1>
        </motion.div>

        {/* Main Message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            🚧 Page Under Construction 🚧
          </h2>
          <div className="flex items-center justify-center gap-2 mb-6">
            <Rocket className="w-5 h-5 text-primary" />
            <p className="text-xl text-muted-foreground">
              We're working hard to bring you an amazing experience!
            </p>
            <Stars className="w-5 h-5 text-accent" />
          </div>
        </motion.div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: "100%" }}
          transition={{ delay: 0.6, duration: 1 }}
          className="mb-8"
        >
          <div className="bg-card rounded-lg p-6 shadow-lg border">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-muted-foreground">Development Progress</span>
              <span className="text-2xl font-bold text-primary">80%</span>
            </div>
            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "80%" }}
                transition={{ delay: 1, duration: 2, ease: "easeOut" }}
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent rounded-full"
              />
              <motion.div
                className="absolute top-0 h-full w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent"
                animate={{
                  x: ["-100%", "400%"]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
              />
            </div>
          </div>
        </motion.div>



        {/* Features Preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-foreground mb-6">
            🎯 What We're Building
          </h3>
          <div className="grid md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 + index * 0.1, duration: 0.6 }}
                whileHover={{ 
                  scale: 1.05,
                  transition: { duration: 0.2 }
                }}
                className="bg-card border rounded-lg p-6 shadow-lg hover:shadow-xl transition-shadow group cursor-pointer"
              >
                <motion.div
                  className="text-primary mb-3 group-hover:scale-110 transition-transform"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.5 }}
                >
                  {feature.icon}
                </motion.div>
                <h4 className="font-semibold text-foreground mb-2">{feature.title}</h4>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <motion.button
            onClick={handleGoHome}
            disabled={isLoading}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                />
                Redirecting in {countdown}s
              </>
            ) : (
              <>
                <Home className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                Take Me Home
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </motion.button>

          <motion.button
            onClick={() => router.back()}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-2 bg-card border text-foreground px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </motion.button>

          <motion.a
            href="https://github.com/Aditya-KumarJha/Credexa"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="group flex items-center gap-2 bg-accent text-accent-foreground px-8 py-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Code2 className="w-5 h-5" />
            View on GitHub
            <ExternalLink className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
          </motion.a>
        </motion.div>

        {/* Footer Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-muted-foreground text-sm">
            💪 Development in progress - We appreciate your patience!
            <br />
            <span className="text-primary font-medium">
              Thank you for exploring Credexa - Your feedback helps us build better!
            </span>
          </p>
        </motion.div>
      </div>

      {/* Overlay for countdown */}
      {showCountdown && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-card border rounded-2xl p-8 text-center shadow-2xl"
          >
            <motion.div
              key={countdown}
              initial={{ scale: 1.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
              className="text-6xl font-bold text-primary mb-4"
            >
              {countdown}
            </motion.div>
            <p className="text-muted-foreground">Redirecting to home...</p>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
