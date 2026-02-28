"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Modal
} from "antd";
import { 
  Shield, 
  Scan, 
  Camera, 
  Share2, 
  X, 
  Info, 
  Link, 
  Lock, 
  Calendar, 
  User,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Globe,
  Zap,
  Eye,
  Copy,
  Moon
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { Html5QrcodeScanner, Html5QrcodeScanType } from "html5-qrcode";
import ThemeToggleButton from "../../components/ui/theme-toggle-button";
import api from "../../utils/axios";

// Custom toast notification function
const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 z-50 px-6 py-4 rounded-2xl shadow-2xl border transition-all duration-500 transform translate-x-full opacity-0 ${
    type === 'success' 
      ? 'bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-900/20 dark:to-cyan-900/20 border-emerald-300 dark:border-emerald-600 text-emerald-800 dark:text-emerald-200'
      : type === 'error'
      ? 'bg-gradient-to-r from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 border-rose-300 dark:border-rose-600 text-rose-800 dark:text-rose-200'
      : 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200'
  }`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <span class="text-lg">${icon}</span>
      <span class="font-medium">${message}</span>
    </div>
  `;
  
  document.body.appendChild(toast);
  
  // Animate in
  setTimeout(() => {
    toast.classList.remove('translate-x-full', 'opacity-0');
  }, 100);
  
  // Auto remove after 4 seconds
  setTimeout(() => {
    toast.classList.add('translate-x-full', 'opacity-0');
    setTimeout(() => {
      if (document.body.contains(toast)) {
        document.body.removeChild(toast);
      }
    }, 500);
  }, 4000);
};

interface VerificationResult {
  verified: boolean;
  issuer?: string;
  timestamp?: number;
  error?: string;
  structuredData?: any;
  blockchainData?: any;
  blockchain?: any;
  credential?: any;
  user?: any;
  verifiedAt?: string;
  credentialHash?: string;
}

export default function VerifyCredentialPage() {
  const [credentialHash, setCredentialHash] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("manual");
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | null>(null);

  // Fetch current user data
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (token) {
          const response = await api.get("/api/users/me");
          setCurrentUser(response.data);
        }
      } catch (error) {
        console.log("Not logged in or token expired");
      }
    };
    
    fetchCurrentUser();
  }, []);

  // Check for hash in URL parameters on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hashFromUrl = params.get('hash');
    if (hashFromUrl) {
      setCredentialHash(hashFromUrl);
      // Auto-verify after a short delay
      setTimeout(() => handleVerify(hashFromUrl), 500);
    }
  }, []);

  // Check camera permissions
  useEffect(() => {
    const checkCameraPermission = async () => {
      try {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        setCameraPermission(permission.state);
        permission.onchange = () => setCameraPermission(permission.state);
      } catch (err) {
        console.log('Camera permission check not supported');
      }
    };
    checkCameraPermission();
  }, []);

  // Initialize QR Scanner
  useEffect(() => {
    if (activeTab === "scan" && !scannerRef.current && !isScanning) {
      // Add a small delay to ensure the DOM element is available
      const timer = setTimeout(() => {
        const scannerElement = document.getElementById("qr-reader");
        if (scannerElement) {
          initializeScanner();
        } else {
          console.log('Scanner element not found, retrying...');
          // Retry after a longer delay
          setTimeout(() => {
            const retryElement = document.getElementById("qr-reader");
            if (retryElement) {
              initializeScanner();
            }
          }, 500);
        }
      }, 200);
      return () => clearTimeout(timer);
    }
    
    // Cleanup when switching away from scan tab
    if (activeTab !== "scan" && scannerRef.current) {
      try {
        scannerRef.current.clear();
        console.log('Scanner cleaned up when switching tabs');
      } catch (e) {
        console.log('Scanner cleanup error:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
    
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (e) {
          console.log('Scanner cleanup error:', e);
        }
        scannerRef.current = null;
      }
    };
  }, [activeTab]);

  const initializeScanner = async () => {
    try {
      setIsScanning(true);
      setScannerError(null);
      
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScannerError('Camera access is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.');
        setIsScanning(false);
        return;
      }
      
      // Request camera permission explicitly
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: "environment" // Prefer back camera
          } 
        });
        // Stop the stream immediately - we just wanted to check permissions
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera permission granted');
      } catch (permissionError: any) {
        console.error('Camera permission denied:', permissionError);
        let errorMessage = 'Camera access denied. ';
        if (permissionError?.name === 'NotAllowedError') {
          errorMessage += 'Please click the camera icon in your browser\'s address bar and allow camera access, then try again.';
        } else if (permissionError?.name === 'NotFoundError') {
          errorMessage += 'No camera found on this device.';
        } else {
          errorMessage += 'Please check your camera permissions and try again.';
        }
        setScannerError(errorMessage);
        setIsScanning(false);
        return;
      }
      
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        disableFlip: false,
        videoConstraints: {
          facingMode: "environment" // Use back camera on mobile
        },
        rememberLastUsedCamera: true,
        useBarCodeDetectorIfSupported: true
      };

      // Clear any existing scanner first
      const scannerElement = document.getElementById("qr-reader");
      if (scannerElement) {
        scannerElement.innerHTML = '';
      }

      // Add a small delay to ensure DOM is ready
      await new Promise(resolve => setTimeout(resolve, 100));

      scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);
      
      scannerRef.current.render(
        (decodedText) => {
          console.log('QR code successfully scanned:', decodedText);
          handleQRScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Only show errors that are not common scanning failures
          if (!errorMessage.includes('NotFoundException') && 
              !errorMessage.includes('No MultiFormat Readers') &&
              !errorMessage.includes('QR code parse error')) {
            console.log('QR scan error:', errorMessage);
          }
        }
      );
      
      console.log('QR Scanner initialized successfully');
    } catch (err: any) {
      console.error('Scanner initialization error:', err);
      setScannerError(`Failed to initialize camera scanner: ${err?.message || 'Unknown error'}. Please refresh the page and try again.`);
      setIsScanning(false);
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    console.log('QR Scan Debug Info:');
    console.log('- Decoded Text:', decodedText);
    console.log('- Text Length:', decodedText.length);
    console.log('- Contains /verify:', decodedText.includes('/verify'));
    console.log('- URL Match Test:', /[?&]hash=([a-fA-F0-9x]+)/.test(decodedText));
    
    let hash = decodedText;
    
    try {
      // Try to parse as JSON (structured QR data)
      const qrData = JSON.parse(decodedText);
      
      if (qrData.type === "CREDEXA_CREDENTIAL_VERIFICATION" && qrData.credentialHash) {
        console.log('Structured QR data detected:', qrData);
        
        // Show preliminary structured data
        setResult({
          verified: false, // Will be updated after blockchain verification
          issuer: qrData.credential?.issuer || 'Unknown',
          timestamp: qrData.credential?.issueDate ? new Date(qrData.credential.issueDate).getTime() / 1000 : Date.now() / 1000,
          structuredData: qrData
        });
        
        hash = qrData.credentialHash;
        setCredentialHash(hash);
        
        showToast("Structured QR data scanned successfully!", 'success');
        
        // Auto-verify blockchain data
        setTimeout(() => handleBlockchainVerify(hash, qrData), 500);
      } else {
        // Fallback to URL parsing
        parseUrlHash(decodedText);
      }
    } catch (e) {
      // Not JSON, try URL parsing
      parseUrlHash(decodedText);
    }
    
    setActiveTab("manual");
    
    // Stop the scanner and clean up
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (e) {
        console.log('Scanner cleanup error:', e);
      }
      scannerRef.current = null;
      setIsScanning(false);
    }
  };

  const parseUrlHash = (decodedText: string) => {
    console.log('Parse URL Hash Debug:');
    console.log('- Input Text:', decodedText);
    
    let hash = decodedText;
    
    // Extract hash from URL if it's a full URL
    if (decodedText.includes('/verify')) {
      console.log('- Contains /verify: true');
      const urlMatch = decodedText.match(/[?&]hash=(0x[a-fA-F0-9]+)/);
      console.log('- URL Match Result:', urlMatch);
      if (urlMatch && urlMatch[1]) {
        hash = urlMatch[1];
        console.log('- Extracted Hash:', hash);
      }
    } else if (decodedText.includes('/api/credentials/verify/')) {
      console.log('- Contains /api/credentials/verify: true');
      const apiMatch = decodedText.match(/api\/credentials\/verify\/(0x[a-fA-F0-9]+)/);
      console.log('- API Match Result:', apiMatch);
      if (apiMatch && apiMatch[1]) {
        hash = apiMatch[1];
        console.log('- Extracted API Hash:', hash);
      }
    } else if (decodedText.startsWith('0x') && decodedText.length === 66) {
      hash = decodedText;
    }
    
    console.log('Final Parse Results:');
    console.log('- Extracted hash:', hash);
    console.log('- Hash length:', hash.length);
    console.log('- Starts with 0x:', hash.startsWith('0x'));
    
    setCredentialHash(hash);
    showToast("QR code scanned successfully!", 'success');
    
    // Auto-verify if hash is valid
    if (hash.startsWith('0x') && hash.length === 66) {
      console.log('Auto-verifying scanned hash - VALID FORMAT');
      setTimeout(() => handleVerify(hash), 500);
    } else {
      console.log('Invalid hash format - NOT AUTO-VERIFYING');
      showToast('Invalid credential hash format. Please check and verify manually.', 'warning');
    }
  };

  const handleBlockchainVerify = async (hash: string, structuredData?: any) => {
    setLoading(true);
    
    try {
      const cleanHash = hash.startsWith('0x') ? hash : `0x${hash}`;
      const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE_URL}/api/credentials/verify/${cleanHash}`);
      const data = await res.json();
      
      if (res.ok && (data.credential || data.verified !== false)) {
        setResult({ 
          verified: data.verified || data.blockchain?.verified || false,
          issuer: data.credential?.issuer || data.blockchain?.issuer,
          timestamp: data.blockchain?.timestamp || data.timestamp,
          structuredData: structuredData || null,
          blockchainData: data.blockchain || data,
          credential: data.credential,
          user: data.user,
          blockchain: data.blockchain,
          verifiedAt: data.verifiedAt,
          credentialHash: data.credentialHash || hash
        });
        
        if (data.verified || data.blockchain?.verified) {
          showToast("Credential verified successfully!", 'success');
        } else {
          showToast("Credential found but blockchain verification pending", 'warning');
        }
      } else {
        setResult({ 
          verified: false, 
          error: data.error || "Credential not found",
          structuredData: structuredData || null
        });
        showToast("Verification failed: " + (data.error || "Credential not found"), 'error');
      }
    } catch (e) {
      const errorMsg = "Verification failed. Please check your connection.";
      setError(errorMsg);
      setResult({ 
        verified: false, 
        error: errorMsg,
        structuredData: structuredData || null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (hashToVerify?: string) => {
    const hash = hashToVerify || credentialHash;
    if (!hash) return;

    await handleBlockchainVerify(hash);
  };

  const verificationUrl = credentialHash
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${credentialHash}`
    : "";

  // Debug logging for QR code content
  useEffect(() => {
    if (verificationUrl && credentialHash) {
      console.log('QR Code Debug Info:');
      console.log('- Credential Hash:', credentialHash);
      console.log('- Verification URL:', verificationUrl);
      console.log('- Hash Length:', credentialHash.length);
      console.log('- Starts with 0x:', credentialHash.startsWith('0x'));
      console.log('- URL Pattern Test:', /[?&]hash=([a-fA-F0-9x]+)/.test(verificationUrl));
    }
  }, [verificationUrl, credentialHash]);

  const handleCopy = () => {
    navigator.clipboard.writeText(verificationUrl);
    showToast("Link copied to clipboard!", 'success');
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const clearResults = () => {
    setResult(null);
    setError(null);
    setCredentialHash("");
  };

  return (
    <div className="bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-gray-100 min-h-screen font-sans antialiased">
      {/* Animated Header */}
      <motion.header
        className="bg-white dark:bg-zinc-800 p-4 flex justify-between items-center shadow-md sticky top-0 z-50 border-b border-gray-200 dark:border-zinc-700"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center">
          <ArrowRight
            className="h-6 w-6 text-cyan-500 dark:text-cyan-400 mr-3 rotate-180 cursor-pointer hover:scale-110 transition-transform"
            onClick={() => (window.location.href = "/")}
          />
          <span className="text-2xl font-bold text-cyan-500 dark:text-cyan-400">C</span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">redexa</span>
          <div className="ml-3 px-3 py-1 bg-gradient-to-r from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/20 dark:to-teal-500/20 rounded-full border border-cyan-200 dark:border-cyan-700">
            <span className="text-sm font-medium text-cyan-600 dark:text-cyan-400">Verify</span>
          </div>
        </div>

        <nav className="hidden md:flex space-x-8 text-sm font-medium">
          <a href="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Dashboard</a>
          <a href="/explore" className="text-gray-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Explore</a>
          <a href="/analytics" className="text-gray-600 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 transition-colors">Analytics</a>
        </nav>

        <div className="flex items-center space-x-4">
          <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
          {currentUser ? (
            <div className="flex items-center space-x-3">
              <img 
                src={currentUser.profilePic || "https://placehold.co/40x40/5A6B7E/FFFFFF?text=" + (currentUser.fullName?.firstName?.charAt(0) || "U")} 
                alt="User Avatar" 
                className="w-10 h-10 rounded-full cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all object-cover border-2 border-gray-200 dark:border-gray-600" 
              />
              <div className="hidden md:block">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {currentUser.fullName?.firstName && currentUser.fullName?.lastName 
                    ? `${currentUser.fullName.firstName} ${currentUser.fullName.lastName}`
                    : currentUser.email?.split('@')[0] || 'User'
                  }
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {currentUser.email}
                </p>
              </div>
            </div>
          ) : (
            <img src="https://placehold.co/40x40/5A6B7E/FFFFFF?text=U" alt="User Avatar" className="rounded-full cursor-pointer hover:ring-2 hover:ring-cyan-500 transition-all" />
          )}
        </div>
      </motion.header>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative mb-6">
            <motion.div 
              className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl mb-4 shadow-2xl shadow-cyan-500/25"
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, type: "spring", stiffness: 200 }}
            >
              <Shield className="text-3xl text-white" />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-teal-500/20 rounded-2xl blur-3xl -z-10" />
          </div>
          
          <motion.h1 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 dark:from-cyan-400 dark:via-teal-400 dark:to-emerald-400 bg-clip-text text-transparent mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Credential Verification
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Verify the authenticity of blockchain-secured credentials instantly with our advanced verification system.
            <br />
            <span className="text-cyan-500 dark:text-cyan-400 font-medium">Powered by Web3 technology</span>
          </motion.p>

          <motion.div
            className="flex flex-wrap justify-center gap-4 mt-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">Instant Verification</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700">
              <Lock className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Blockchain Secured</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-gray-200 dark:border-zinc-700">
              <Globe className="h-4 w-4 text-cyan-500" />
              <span className="text-sm font-medium">Global Standard</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Main Verification Interface */}
        <motion.div
          className="relative bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden mb-8"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-teal-500/5 dark:from-cyan-500/10 dark:to-teal-500/10" />
          
          {/* Tab Navigation */}
          <div className="relative p-6 border-b border-gray-200 dark:border-zinc-700">
            <div className="flex space-x-1 bg-gray-100 dark:bg-zinc-700 p-1 rounded-2xl">
              <motion.button
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "manual"
                    ? "bg-white dark:bg-zinc-600 text-cyan-600 dark:text-cyan-400 shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("manual")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Link className="h-4 w-4" />
                Manual Entry
              </motion.button>
              <motion.button
                className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === "scan"
                    ? "bg-white dark:bg-zinc-600 text-cyan-600 dark:text-cyan-400 shadow-lg"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                }`}
                onClick={() => setActiveTab("scan")}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Camera className="h-4 w-4" />
                QR Scanner
                {cameraPermission === 'denied' && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </motion.button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="relative p-8">
            <AnimatePresence mode="wait">
              {activeTab === "manual" && (
                <motion.div
                  key="manual"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Credential Hash
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Enter or paste credential hash (0x...)"
                        value={credentialHash}
                        onChange={(e) => setCredentialHash(e.target.value)}
                        className="w-full px-4 py-4 pr-32 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all text-sm font-mono"
                        onKeyPress={(e) => e.key === 'Enter' && handleVerify()}
                      />
                      <motion.button
                        onClick={() => handleVerify()}
                        disabled={loading || !credentialHash}
                        className="absolute right-2 top-2 bottom-2 px-6 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {loading ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Zap className="h-4 w-4" />
                          </motion.div>
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Hash should start with "0x" followed by 64 hexadecimal characters
                    </p>
                  </div>

                  {credentialHash && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-3"
                    >
                      <motion.button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl font-medium text-gray-700 dark:text-gray-300 hover:border-cyan-500 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Share2 className="h-4 w-4" />
                        Generate QR Code
                      </motion.button>
                      <motion.button
                        onClick={clearResults}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl font-medium text-gray-600 dark:text-gray-400 hover:text-red-500 hover:border-red-300 transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <X className="h-4 w-4" />
                        Clear
                      </motion.button>
                    </motion.div>
                  )}
                </motion.div>
              )}

              {activeTab === "scan" && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center space-y-6"
                >
                  {cameraPermission === 'denied' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-2xl"
                    >
                      <AlertCircle className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                      <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium">
                        Camera Access Denied
                      </p>
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        Please enable camera permissions in your browser settings
                      </p>
                    </motion.div>
                  )}
                  
                  {scannerError && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-2xl"
                    >
                      <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-2" />
                      <p className="text-sm text-red-700 dark:text-red-300 font-medium mb-3">
                        Scanner Error
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-400 mb-4">
                        {scannerError}
                      </p>
                      <motion.button
                        onClick={() => {
                          setScannerError(null);
                          setIsScanning(false);
                          setTimeout(initializeScanner, 300);
                        }}
                        className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        Retry
                      </motion.button>
                    </motion.div>
                  )}

                  <div 
                    id="qr-reader" 
                    className="mx-auto max-w-md relative"
                    style={{ 
                      border: isScanning ? '2px solid #3b82f6' : '2px dashed #d1d5db',
                      borderRadius: '16px',
                      minHeight: '320px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: isScanning ? 'transparent' : 'linear-gradient(135deg, rgba(59, 130, 246, 0.05), rgba(168, 85, 247, 0.05))'
                    }}
                  >
                    {!isScanning && !scannerError && (
                      <motion.div
                        className="text-center p-8"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                      >
                        <motion.div
                          className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, type: "spring" }}
                        >
                          <Camera className="h-8 w-8 text-white" />
                        </motion.div>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                          Camera scanner will appear here
                        </p>
                        <motion.button
                          onClick={() => {
                            setScannerError(null);
                            setTimeout(initializeScanner, 100);
                          }}
                          className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Camera className="h-4 w-4 inline mr-2" />
                          Start Scanner
                        </motion.button>
                      </motion.div>
                    )}
                    {isScanning && (
                      <motion.div
                        className="text-center p-8"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-16 h-16 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                        >
                          <Scan className="h-8 w-8 text-white" />
                        </motion.div>
                        <p className="text-gray-600 dark:text-gray-400">
                          Initializing camera...
                        </p>
                      </motion.div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Position the QR code within the scanning area for automatic verification
                    </p>
                    {!isScanning && !scannerError && (
                      <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <Sparkles className="h-3 w-3" />
                        <span>Make sure to allow camera permissions when prompted</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 p-12 text-center mb-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/20 dark:to-teal-500/20" />
              
              <motion.div className="relative">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                  animate={{ 
                    rotate: 360,
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                    scale: { duration: 2, repeat: Infinity }
                  }}
                >
                  <Shield className="h-10 w-10 text-white" />
                </motion.div>
                
                <motion.h3
                  className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  Verifying Credential
                </motion.h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  Checking blockchain authenticity...
                </p>
                
                <div className="flex justify-center space-x-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-cyan-500 rounded-full"
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        delay: i * 0.2 
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results Section */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -40 }}
              className="relative bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden mb-8"
            >
              {result.verified ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative p-8"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-500/5 dark:from-green-500/10 dark:to-emerald-500/10" />
                  
                  {/* Success Header */}
                  <motion.div
                    className="text-center mb-8"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <motion.div
                      className="w-20 h-20 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ duration: 0.6, type: "spring" }}
                    >
                      <CheckCircle className="h-10 w-10 text-white" />
                    </motion.div>
                    
                    <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-2">
                      Credential Verified!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      This credential has been successfully verified on the blockchain
                    </p>
                  </motion.div>

                  {/* Credential Owner */}
                  {result.user && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-700 mb-8"
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-3 uppercase tracking-wide">
                          This Credential Belongs To
                        </div>
                        <div className="flex items-center justify-center gap-6">
                          {result.user.profilePic && (
                            <motion.img 
                              src={result.user.profilePic} 
                              alt="Profile"
                              className="w-20 h-20 rounded-2xl object-cover border-2 border-cyan-300 dark:border-cyan-600 shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.6, type: "spring" }}
                            />
                          )}
                          <div className="text-center">
                            <h3 className="text-2xl md:text-3xl font-bold text-cyan-900 dark:text-cyan-100 mb-2">
                              {result.user.firstName && result.user.lastName 
                                ? `${result.user.firstName} ${result.user.lastName}`
                                : result.user.fullName?.firstName && result.user.fullName?.lastName
                                ? `${result.user.fullName.firstName} ${result.user.fullName.lastName}`
                                : 'Credential Holder'
                              }
                            </h3>
                            {result.user.institute && (
                              <div className="text-cyan-700 dark:text-cyan-300">
                                <p className="font-medium">Student at {result.user.institute.name}</p>
                                {result.user.institute.state && (
                                  <p className="text-sm opacity-80">
                                    {result.user.institute.district && `${result.user.institute.district}, `}
                                    {result.user.institute.state}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Credential Details */}
                  {result.credential && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6 }}
                      className="bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-900/20 dark:to-teal-900/20 p-6 rounded-2xl border border-cyan-200 dark:border-cyan-700 mb-6"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-xl flex items-center justify-center">
                          <CheckCircle className="h-5 w-5 text-white" />
                        </div>
                        <h4 className="text-xl font-bold text-cyan-800 dark:text-cyan-200">
                          Credential Information
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Title</label>
                          <p className="text-cyan-700 dark:text-cyan-200 font-medium">{result.credential.title}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Issuer</label>
                          <p className="text-cyan-700 dark:text-cyan-200">{result.credential.issuer}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Type</label>
                          <p className="text-cyan-700 dark:text-cyan-200 capitalize">{result.credential.type}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300">Issue Date</label>
                          <p className="text-cyan-700 dark:text-cyan-200">
                            {new Date(result.credential.issueDate).toLocaleDateString()}
                          </p>
                        </div>
                        {result.credential.nsqfLevel && (
                          <div>
                            <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300">NSQF Level</label>
                            <p className="text-cyan-700 dark:text-cyan-200">{result.credential.nsqfLevel}</p>
                          </div>
                        )}
                        {result.credential.skills && result.credential.skills.length > 0 && (
                          <div className="md:col-span-2">
                            <label className="text-sm font-medium text-cyan-900 dark:text-cyan-300 block mb-2">Skills</label>
                            <div className="flex flex-wrap gap-2">
                              {result.credential.skills.map((skill: string, index: number) => (
                                <span 
                                  key={index}
                                  className="px-3 py-1 bg-purple-500 text-white text-xs font-medium rounded-full"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {/* Blockchain Verification */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-2xl border border-green-200 dark:border-green-700 mb-6"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="text-xl font-bold text-green-800 dark:text-green-200">
                        Blockchain Verification
                      </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="text-sm font-medium text-green-900 dark:text-green-300">Status</label>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <p className="text-green-700 dark:text-green-200 font-medium">
                            {result.blockchain?.verified ? "Verified on Blockchain" : "Database Verified"}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-green-900 dark:text-green-300">Verified At</label>
                        <p className="text-green-700 dark:text-green-200">
                          {result.verifiedAt ? new Date(result.verifiedAt).toLocaleString() : 'Just now'}
                        </p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-green-900 dark:text-green-300">Credential Hash</label>
                        <p className="text-green-700 dark:text-green-200 font-mono text-sm break-all bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                          {result.credentialHash || credentialHash}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Success Message */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-200 dark:border-green-700 mb-8"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          {result.structuredData ? "QR Code & Blockchain Verified" : "Blockchain Verified"}
                        </p>
                        <p className="text-sm text-green-600 dark:text-green-300">
                          {result.structuredData 
                            ? "This credential was scanned from a QR code and verified on the blockchain. All data is authentic."
                            : "This credential has been verified on the blockchain and is authentic."
                          }
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div
                    className="flex flex-wrap gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                  >
                    <motion.button
                      onClick={clearResults}
                      className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      Verify Another Credential
                    </motion.button>
                    <motion.button
                      onClick={() => setIsModalOpen(true)}
                      className="px-8 py-3 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:border-cyan-500 transition-all"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Share2 className="h-4 w-4 inline mr-2" />
                      Share QR Code
                    </motion.button>
                  </motion.div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="relative p-8 text-center"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 dark:from-red-500/10 dark:to-pink-500/10" />
                  
                  <motion.div
                    className="w-20 h-20 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-6"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ duration: 0.6, type: "spring" }}
                  >
                    <X className="h-10 w-10 text-white" />
                  </motion.div>
                  
                  <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent mb-4">
                    Credential Not Verified
                  </h2>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-700 mb-6">
                    <AlertCircle className="h-6 w-6 text-red-500 mx-auto mb-3" />
                    <p className="font-medium text-red-800 dark:text-red-200 mb-2">Verification Failed</p>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {result.error || "The credential hash could not be verified on the blockchain."}
                    </p>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    This could mean the credential is not authentic, the hash is incorrect, 
                    or the credential has not been properly anchored to the blockchain.
                  </p>
                  
                  <motion.button
                    onClick={clearResults}
                    className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    Try Another Hash
                  </motion.button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error State */}
        <AnimatePresence>
          {error && !result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-red-200 dark:border-red-700 p-8 mb-8 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-500/5 dark:from-red-500/10 dark:to-pink-500/10" />
              
              <div className="relative text-center">
                <motion.div
                  className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.6, type: "spring" }}
                >
                  <AlertCircle className="h-8 w-8 text-white" />
                </motion.div>
                
                <h3 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">
                  Verification Error
                </h3>
                <p className="text-red-600 dark:text-red-300 mb-4">
                  {error}
                </p>
                
                <motion.button
                  onClick={() => setError(null)}
                  className="px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Dismiss
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* How It Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.4 }}
          className="relative bg-white dark:bg-zinc-800 rounded-3xl shadow-2xl border border-gray-200 dark:border-zinc-700 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-500/5 to-slate-500/5 dark:from-gray-500/10 dark:to-slate-500/10" />
          
          <div className="relative p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-gradient-to-br from-gray-500 to-slate-600 rounded-xl flex items-center justify-center">
                <Info className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                How It Works
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: Scan,
                  title: "1. Enter or Scan",
                  description: "Enter the credential hash manually or scan the QR code",
                  gradient: "from-cyan-500 to-teal-500"
                },
                {
                  icon: Shield,
                  title: "2. Blockchain Verification",
                  description: "We verify the credential against the blockchain record",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: CheckCircle,
                  title: "3. Get Results",
                  description: "Receive instant verification with issuer details",
                  gradient: "from-green-500 to-emerald-500"
                }
              ].map((step, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 1.6 + (index * 0.1) }}
                >
                  <motion.div
                    className={`w-16 h-16 bg-gradient-to-br ${step.gradient} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <step.icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* QR Code Share Modal */}
        <Modal 
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          centered
          width={800}
          className="custom-modal"
          style={{
            borderRadius: '24px',
            overflow: 'hidden'
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white dark:bg-zinc-800 rounded-3xl overflow-hidden"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-cyan-500 to-teal-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Share2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Share Verification Link</h3>
                    {result && result.user && (
                      <p className="text-blue-100 text-sm">
                        {result.user.firstName && result.user.lastName 
                          ? `${result.user.firstName} ${result.user.lastName}`
                          : result.user.fullName?.firstName && result.user.fullName?.lastName
                          ? `${result.user.fullName.firstName} ${result.user.fullName.lastName}`
                          : 'Credential Holder'
                        }
                      </p>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <div className="p-8">
              {/* Credential Owner Info */}
              {result && result.user && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-700 mb-8"
                >
                  <div className="text-center">
                    <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-3 uppercase tracking-wide">
                      Credential Owner
                    </div>
                    <div className="flex items-center justify-center gap-4">
                      {result.user.profilePic && (
                        <motion.img 
                          src={result.user.profilePic} 
                          alt="Profile"
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-300 dark:border-blue-600"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.2, type: "spring" }}
                        />
                      )}
                      <div className="text-center">
                        <h4 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-1">
                          {result.user.firstName && result.user.lastName 
                            ? `${result.user.firstName} ${result.user.lastName}`
                            : result.user.fullName?.firstName && result.user.fullName?.lastName
                            ? `${result.user.fullName.firstName} ${result.user.fullName.lastName}`
                            : 'Credential Holder'
                          }
                        </h4>
                        {result.credential?.issuer && (
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            Issued by {result.credential.issuer}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-4">
                      {result.verified ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                          <CheckCircle className="h-4 w-4" />
                          Verified on Blockchain
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
                          <Eye className="h-4 w-4" />
                          Share for Verification
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {!result && credentialHash && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-50 dark:bg-zinc-700 p-6 rounded-2xl border border-gray-200 dark:border-zinc-600 mb-8"
                >
                  <div className="text-center">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">
                      Credential Verification Link
                    </h4>
                    <p className="text-gray-600 dark:text-gray-400 mb-3">
                      Share this QR code to verify the credential
                    </p>
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-zinc-600 rounded-lg text-xs font-mono text-gray-700 dark:text-gray-300">
                      Hash: {credentialHash.substring(0, 10)}...{credentialHash.substring(credentialHash.length - 8)}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {result && result.verified 
                    ? "Share this QR code to allow others to verify this authentic credential instantly."
                    : "Share this QR code or link to allow others to verify this credential's authenticity on the blockchain."
                  }
                </p>
                
                {/* QR Code */}
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  className="bg-gradient-to-br from-gray-50 to-white dark:from-zinc-700 dark:to-zinc-600 p-8 rounded-3xl border-2 border-gray-200 dark:border-zinc-600 inline-block mb-8 shadow-lg"
                >
                  <QRCodeCanvas 
                    value={verificationUrl} 
                    size={280}
                    level="M"
                    includeMargin={true}
                    bgColor="transparent"
                    fgColor="#1f2937"
                  />
                </motion.div>

                {/* Credential Summary */}
                {result && result.verified && result.credential && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-2xl border border-purple-200 dark:border-purple-700 mb-8"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Scan className="h-4 w-4 text-white" />
                      </div>
                      <h5 className="text-lg font-bold text-purple-800 dark:text-purple-200">
                        QR Code Contains
                      </h5>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-purple-900 dark:text-purple-300">Credential</label>
                        <p className="text-purple-700 dark:text-purple-200">{result.credential.title}</p>
                      </div>
                      <div>
                        <label className="font-medium text-purple-900 dark:text-purple-300">Type</label>
                        <p className="text-purple-700 dark:text-purple-200 capitalize">{result.credential.type}</p>
                      </div>
                      <div>
                        <label className="font-medium text-purple-900 dark:text-purple-300">Issuer</label>
                        <p className="text-purple-700 dark:text-purple-200">{result.credential.issuer}</p>
                      </div>
                      <div>
                        <label className="font-medium text-purple-900 dark:text-purple-300">Network</label>
                        <p className="text-purple-700 dark:text-purple-200">Ethereum Sepolia</p>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* URL Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Verification URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        value={verificationUrl}
                        readOnly
                        className="flex-1 px-4 py-3 bg-gray-50 dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-xl font-mono text-sm"
                      />
                      <motion.button
                        onClick={handleCopy}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Copy className="h-4 w-4" />
                      </motion.button>
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-200 dark:border-blue-700">
                    <div className="flex items-start gap-3">
                      <Lock className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                      <div className="text-left">
                        <p className="font-medium text-blue-800 dark:text-blue-200 mb-1">
                          Secure & Private
                        </p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">
                          This verification link is public and contains only verification data. 
                          No personal information is exposed.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </Modal>
      </div>
    </div>
  );
}