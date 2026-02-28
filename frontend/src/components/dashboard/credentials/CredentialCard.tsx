import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Space, Popconfirm, Modal, App } from "antd";
import {
  Award,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Shield,
  Download,
  Eye,
  Link,
  Anchor,
  Share2,
  QrCode,
  Copy,
  FileText,
} from "lucide-react";
import dayjs from "dayjs";
import { Credential, CredentialStatus } from "@/types/credentials";
import { QRCodeCanvas } from "qrcode.react";

// Utility functions for file type detection
const isPdfUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return urlLower.includes('.pdf') || urlLower.includes('pdf');
};

const isImageUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const urlLower = url.toLowerCase();
  return /\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i.test(urlLower) || 
         urlLower.includes('imagekit.io') || 
         urlLower.includes('cloudinary.com');
};

interface CredentialCardProps {
  credential: Credential;
  onDelete: (id?: string) => void;
  onViewImage: (imageUrl: string) => void;
  onViewDetails: (id?: string) => void;
  onAnchor: (id?: string) => void;
  onShowOnChainDetails: (credential: Credential) => void;
  anchoringId: string | null;
  loadingDetails: boolean;
}

const blockchainStatusTag = (transactionHash: string | undefined) => {
  if (transactionHash) {
    return (
      <span className="px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-400/30 font-medium">
        <Shield className="w-3.5 h-3.5" /> 
        Blockchain Secured
      </span>
    );
  }
  return (
    <span className="px-3 py-1.5 text-xs rounded-lg inline-flex items-center gap-2 bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-400/30 font-medium">
      <Clock className="w-3.5 h-3.5" /> 
      Awaiting Verification
    </span>
  );
};

export const CredentialCard: React.FC<CredentialCardProps> = ({
  credential: c,
  onDelete,
  onViewImage,
  onViewDetails,
  onAnchor,
  onShowOnChainDetails,
  anchoringId,
  loadingDetails,
}) => {
  const { message } = App.useApp();
  const [shareModalOpen, setShareModalOpen] = useState(false);

  const handleShare = () => {
    if (!c.credentialHash) {
      message.warning("This credential needs to be anchored to the blockchain before it can be shared for verification.");
      return;
    }
    setShareModalOpen(true);
  };

  // Create structured QR data instead of just URL
  const qrData = c.credentialHash ? {
    type: "CREDEXA_CREDENTIAL_VERIFICATION",
    version: "1.0",
    credentialHash: c.credentialHash,
    transactionHash: c.transactionHash,
    blockchain: {
      network: "ethereum-sepolia",
      explorer: `https://sepolia.etherscan.io/tx/${c.transactionHash}`
    },
    credential: {
      id: c._id,
      title: c.title,
      issuer: c.issuer,
      type: c.type,
      issueDate: c.issueDate,
      nsqfLevel: c.nsqfLevel,
      creditPoints: c.creditPoints
    },
    verification: {
      url: `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${c.credentialHash}`,
      timestamp: new Date().toISOString()
    }
  } : null;

  // Use simple URL for QR code so phone cameras can recognize it
  const verificationUrl = c.credentialHash 
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/verify?hash=${c.credentialHash}`
    : "";
  
  const qrValue = verificationUrl; // Phone-scannable URL instead of JSON

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verificationUrl);
    message.success("Verification link copied to clipboard!");
  };

  const handleCopyQRData = () => {
    if (qrData) {
      navigator.clipboard.writeText(JSON.stringify(qrData, null, 2));
      message.success("QR data copied to clipboard!");
    }
  };
  return (
    <div className="group relative h-full max-h-[450px] flex flex-col overflow-hidden rounded-xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] transform-gpu border border-gray-200/50 dark:border-slate-700/50">
      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 opacity-20 dark:opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_24px,rgba(59,130,246,0.1)_25px,rgba(59,130,246,0.1)_26px,transparent_27px)] dark:bg-[linear-gradient(90deg,transparent_24px,rgba(59,130,246,0.05)_25px,rgba(59,130,246,0.05)_26px,transparent_27px)] bg-[length:26px_26px]" />
      </div>
      
      {/* Subtle Border */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 opacity-0 group-hover:opacity-20 dark:group-hover:opacity-30 transition-opacity duration-300">
        <div className="absolute inset-[1px] rounded-xl bg-gradient-to-br from-white via-gray-50 to-gray-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900" />
      </div>
      
      {/* Card Header - Compact */}
      <div className="relative z-10 px-4 py-3 border-b border-gray-200/50 dark:border-cyan-500/20 flex-shrink-0">
        {/* Title and Status */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-sm">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-gray-900 dark:text-white font-semibold text-sm leading-tight truncate">
                {c.title}
              </h3>
              <div className="text-cyan-600 dark:text-cyan-300 text-xs mt-0.5 font-medium">{c.type}</div>
            </div>
          </div>
          
          {/* Status Indicator */}
          {c.transactionHash ? (
            <div className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              <span className="text-xs text-emerald-700 dark:text-emerald-300 font-medium">Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 bg-amber-500/10 border border-amber-500/30 rounded-md">
              <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
              <span className="text-xs text-amber-700 dark:text-amber-300 font-medium">Pending</span>
            </div>
          )}
        </div>
        
        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600 dark:text-slate-400">
            Issued: {c.issueDate ? dayjs(c.issueDate).format("MMM YYYY") : "-"}
          </div>
          
          <div className="flex items-center gap-1">
            <Space size={4}>
              {c.credentialHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-emerald-500/10 border-emerald-400/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-400/60"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShare();
                  }}
                  title="Share"
                >
                  <Share2 className="w-3 h-3" />
                </Button>
              )}
              {c.transactionHash && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-blue-500/10 border-blue-400/40 text-blue-600 dark:text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/60"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewDetails(c._id);
                  }}
                  disabled={loadingDetails}
                  title="View Details"
                >
                  <Eye className="w-3 h-3" />
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="h-6 w-6 p-0 bg-purple-500/10 border-purple-400/40 text-purple-600 dark:text-purple-300 hover:bg-purple-500/20 hover:border-purple-400/60"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onAnchor(c._id);
                }}
                disabled={anchoringId === c._id}
                title="Anchor"
              >
                <Anchor className="w-3 h-3" />
              </Button>
              <Popconfirm
                title="Delete?"
                onConfirm={() => onDelete(c._id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 w-6 p-0 bg-red-500/10 border-red-400/40 text-red-600 dark:text-red-300 hover:bg-red-500/20 hover:border-red-400/60"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </Popconfirm>
            </Space>
          </div>
        </div>
      </div>

      {/* Card Body - Scrollable */}
      <div className="relative z-10 px-4 py-3 space-y-3 flex-1 overflow-y-auto">
        {/* Certificate Image */}
        {(c.imageUrl || c.credentialUrl) && (
          <div className="w-full h-24 relative rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-slate-700 dark:to-slate-800 border border-gray-200 dark:border-cyan-500/20 shadow-sm">
            {isImageUrl(c.imageUrl) ? (
              <div
                className="w-full h-full cursor-pointer group/img relative"
                onClick={() => c.imageUrl && onViewImage(c.imageUrl)}
              >
                <img
                  src={c.imageUrl}
                  alt={`${c.title} certificate`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover/img:scale-105"
                />
                <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/20 transition-colors duration-200 flex items-center justify-center">
                  <div className="bg-white/90 dark:bg-black/70 backdrop-blur-sm rounded-full p-1.5 opacity-0 group-hover/img:opacity-100 transition-opacity">
                    <Eye className="w-4 h-4 text-gray-700 dark:text-white" />
                  </div>
                </div>
              </div>
            ) : isPdfUrl(c.credentialUrl || c.imageUrl) ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
                <FileText className="w-8 h-8 text-red-600 dark:text-red-300" />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileText className="w-8 h-8 text-gray-400 dark:text-gray-300" />
              </div>
            )}
          </div>
        )}

        {/* Issuer Info */}
        <div className="flex items-center gap-3 p-2.5 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-500/10 dark:to-blue-500/10 rounded-lg border border-cyan-200/50 dark:border-cyan-500/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-sm">
            <Award className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-cyan-600 dark:text-cyan-300 font-medium">Issuer</div>
            <div className="text-gray-900 dark:text-white font-semibold text-sm truncate">{c.issuer}</div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-2 text-sm">
          {typeof c.nsqfLevel !== "undefined" && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-slate-600/50">
              <div className="text-purple-600 dark:text-purple-300 font-medium text-xs">NSQF</div>
              <div className="text-gray-900 dark:text-white font-semibold text-sm">{c.nsqfLevel}</div>
            </div>
          )}
          {typeof c.creditPoints !== "undefined" && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-slate-600/50">
              <div className="text-amber-600 dark:text-amber-300 font-medium text-xs">Points</div>
              <div className="text-gray-900 dark:text-white font-semibold text-sm">{c.creditPoints}</div>
            </div>
          )}
          {c.transactionHash && (
            <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/30 rounded border border-gray-200 dark:border-slate-600/50">
              <div className="text-emerald-600 dark:text-emerald-300 font-medium text-xs">Status</div>
              <div className="text-gray-900 dark:text-white font-semibold text-sm">Verified</div>
            </div>
          )}
        </div>

        {/* Skills */}
        {c.skills?.length ? (
          <div className="space-y-1.5">
            <div className="text-xs text-gray-600 dark:text-cyan-300 font-medium">Skills</div>
            <div className="flex flex-wrap gap-1.5">
              {c.skills.slice(0, 3).map((s) => (
                <span key={s} className="px-2 py-1 text-xs rounded-full bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-200 border border-cyan-200 dark:border-cyan-400/30 font-medium">
                  {s}
                </span>
              ))}
              {c.skills.length > 3 && (
                <span className="px-2 py-1 text-xs rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-700 dark:text-purple-200 border border-purple-200 dark:border-purple-400/30 font-medium">
                  +{c.skills.length - 3}
                </span>
              )}
            </div>
          </div>
        ) : null}
      </div>
      
      {/* Footer - Always Visible */}
      <div className="relative z-10 px-4 py-2 border-t border-gray-200 dark:border-cyan-500/20 flex-shrink-0 bg-gray-50/50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between text-xs">
          {c.credentialUrl && (
            <a 
              target="_blank" 
              rel="noreferrer" 
              href={c.credentialUrl} 
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-300 hover:text-blue-700 dark:hover:text-blue-200 font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" /> 
              Original
            </a>
          )}
          
          {c.transactionHash && (
            <>
              <a
                target="_blank"
                rel="noreferrer"
                href={`https://sepolia.etherscan.io/tx/${c.transactionHash}`}
                className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-300 hover:text-emerald-700 dark:hover:text-emerald-200 font-medium transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Shield className="w-3.5 h-3.5 dark:bg-white bg-black" /> 
                <span className="dark:text-white text-black">Blockchain</span>
              </a>
              <button
                type="button"
                className="text-cyan-600 dark:text-cyan-300 hover:text-cyan-700 dark:hover:text-cyan-200 font-medium transition-colors cursor-pointer bg-transparent border-none p-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShowOnChainDetails(c);
                }}
              >
                Details
              </button>
            </>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <Modal
        title={
          <span className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Credential Verification
          </span>
        }
        open={shareModalOpen}
        onCancel={() => setShareModalOpen(false)}
        footer={null}
        centered
        width={500}
      >
        <div className="text-center p-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">{c.title}</h3>
            <p className="text-gray-600 dark:text-gray-200 text-sm">
              Scan this QR code with any QR scanner to view complete blockchain verification details, or use the URL for web verification.
            </p>
          </div>
          
          {qrValue && (
            <>
              <div className="bg-white p-4 rounded-lg border-2 border-gray-200 inline-block mb-6">
                <QRCodeCanvas 
                  value={qrValue} 
                  size={220}
                  level="M"
                  includeMargin={true}
                />
              </div>
              
              <div className="space-y-4">
                {/* QR Data Preview */}
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-left">
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">QR Code Contains:</h4>
                  <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
                    <div className="flex justify-between">
                      <span>Credential Hash:</span>
                      <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                        {c.credentialHash?.substring(0, 10)}...
                      </span>
                    </div>
                    {c.transactionHash && (
                      <div className="flex justify-between">
                        <span>Transaction:</span>
                        <span className="font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded">
                          {c.transactionHash.substring(0, 10)}...
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span>Blockchain:</span>
                      <span className="font-semibold">Ethereum Sepolia</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issuer:</span>
                      <span className="font-semibold">{c.issuer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Issue Date:</span>
                      <span>{c.issueDate ? dayjs(c.issueDate).format("MMM D, YYYY") : "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyQRData}
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy QR Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="flex-1"
                  >
                    <Link className="w-4 h-4 mr-2" />
                    Copy URL
                  </Button>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-white block mb-2">
                    Web Verification URL:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={verificationUrl}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-50 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded text-sm text-blue-700 dark:text-blue-300">
                  <div className="flex items-start gap-2">
                    <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Secure & Private:</strong> The QR code contains blockchain verification data. 
                      No personal information is exposed. Anyone can verify the credential's authenticity by scanning.
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </Modal>
    </div>
  );
};
