import React, { useState } from "react";
import { Modal, Spin } from "antd";
import { Shield, Award, Calendar, CheckCircle, Link, ExternalLink, Eye, FileText } from "lucide-react";
import dayjs from "dayjs";
import { CredentialDetails } from "@/types/credentials";

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

interface CredentialDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  details: CredentialDetails | null;
  onViewImage: (imageUrl: string) => void;
}

export const CredentialDetailsModal: React.FC<CredentialDetailsModalProps> = ({
  isOpen,
  onClose,
  details,
  onViewImage,
}) => {
  if (!details) return null;

  const [forensicsLoading, setForensicsLoading] = useState(false);
  const [forensicsError, setForensicsError] = useState<string | null>(null);
  const [forensicsImage, setForensicsImage] = useState<string | null>(null);
  const [forensicsForbidden, setForensicsForbidden] = useState(false);
  const [forensicsMetrics, setForensicsMetrics] = useState<any>(null);

  const runForensics = async () => {
    try {
      setForensicsError(null);
      setForensicsForbidden(false);
      setForensicsLoading(true);
      setForensicsImage(null);
      setForensicsMetrics(null);
      const token = localStorage.getItem('authToken');
      const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${base}/api/credentials/${details.credential._id}/forensics`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        }
      });

      if (res.status === 403) {
        // Credential exists but user is not authorized to run forensics
        setForensicsForbidden(true);
        const body = await res.json().catch(() => ({}));
        setForensicsError(body.message || 'You are not authorized to run forensics on this credential');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed: ${res.status}`);
      }

      const data = await res.json();
      if (!data.imageBase64) throw new Error('No image in response');
      setForensicsImage(`data:image/png;base64,${data.imageBase64}`);
      setForensicsMetrics(data.analysis || null);
    } catch (err: any) {
      setForensicsError(err?.message || 'Forensics failed');
    } finally {
      setForensicsLoading(false);
    }
  };

  return (
    <Modal
      open={isOpen}
      onCancel={onClose}
      title={
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          <span>Credential Details</span>
        </div>
      }
      footer={null}
      width={800}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-primary" />
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Title</label>
              <p className="text-foreground font-medium mt-1">{details.credential.title}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Issuer</label>
              <p className="text-foreground font-medium mt-1">{details.credential.issuer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Type</label>
              <p className="text-foreground font-medium mt-1 capitalize">{details.credential.type}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Issue Date</label>
              <p className="text-foreground font-medium mt-1">
                {dayjs(details.credential.issueDate).format("MMMM D, YYYY")}
              </p>
            </div>
            {details.credential.creditPoints && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credit Points</label>
                <p className="text-foreground font-medium mt-1">{details.credential.creditPoints}</p>
              </div>
            )}
            {details.credential.nsqfLevel && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">NSQF Level</label>
                <p className="text-foreground font-medium mt-1">{details.credential.nsqfLevel}</p>
              </div>
            )}
          </div>
          {details.credential.description && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Description</label>
              <p className="text-foreground mt-1 leading-relaxed">{details.credential.description}</p>
            </div>
          )}
          {details.credential.skills?.length > 0 && (
            <div className="mt-4">
              <label className="text-sm font-medium text-muted-foreground">Skills</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {details.credential.skills.map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 text-sm bg-primary/10 text-primary rounded-full border border-primary/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Blockchain Information */}
        {details.anchored && (
          <div className="border border-green-200 dark:border-green-800 rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
              <Shield className="w-5 h-5 text-green-600 dark:text-green-400" />
              Blockchain Verification
            </h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Status</label>
                <div className="flex items-center gap-2 mt-1">
                  <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  <span className="text-green-700 dark:text-green-300 font-medium">Verified on Blockchain</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Transaction Hash</label>
                <p className="text-foreground font-mono text-sm break-all mt-1 bg-background/50 p-2 rounded border">
                  {details.credential.transactionHash}
                </p>
              </div>
              {details.credential.credentialHash && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credential Hash</label>
                  <p className="text-foreground font-mono text-sm break-all mt-1 bg-background/50 p-2 rounded border">
                    {details.credential.credentialHash}
                  </p>
                </div>
              )}
              {details.blockchain && details.blockchain.verified && (
                <>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blockchain Issuer</label>
                    <p className="text-foreground font-medium mt-1">{details.blockchain.issuer}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Blockchain Timestamp</label>
                    <p className="text-foreground font-medium mt-1">
                      {dayjs(details.blockchain.timestampDate).format("MMMM D, YYYY [at] h:mm A")}
                    </p>
                  </div>
                </>
              )}
              {details.verificationUrl && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Public Verification URL</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Link className="w-4 h-4 text-primary" />
                    <a
                      href={details.verificationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-red hover:text-blue-600 hover:underline text-sm"
                    >
                      Verify Publicly
                    </a>
                    <ExternalLink className="w-3 h-3 text-primary" />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Additional Information */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            Additional Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">Created</label>
              <p className="text-foreground mt-1">
                {dayjs(details.credential.createdAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
              <p className="text-foreground mt-1">
                {dayjs(details.credential.updatedAt).format("MMMM D, YYYY [at] h:mm A")}
              </p>
            </div>
            {details.credential.credentialId && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Credential ID</label>
                <p className="text-foreground font-mono text-sm mt-1 bg-background/50 p-2 rounded border">
                  {details.credential.credentialId}
                </p>
              </div>
            )}
            {details.credential.credentialUrl && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Original URL</label>
                <div className="flex items-center gap-2 mt-1">
                  <ExternalLink className="w-4 h-4 text-primary" />
                  <a
                    href={details.credential.credentialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 hover:underline text-sm"
                  >
                    View Original Certificate
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Certificate Image or PDF */}
        {(details.credential.imageUrl || details.credential.credentialUrl) && (
          <div className="border border-border rounded-lg p-4 bg-card">
            <h3 className="text-lg font-semibold mb-3 text-foreground">Certificate</h3>
            {isImageUrl(details.credential.imageUrl) ? (
              <div
                className="w-full h-64 relative rounded-lg overflow-hidden bg-background border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => onViewImage(details.credential.imageUrl!)}
              >
                <img
                  src={details.credential.imageUrl}
                  alt={`${details.credential.title} certificate`}
                  className="w-full h-full object-contain"
                />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors flex items-center justify-center">
                  <div className="bg-background/90 backdrop-blur-sm rounded-full p-3 opacity-0 hover:opacity-100 transition-opacity border">
                    <Eye className="w-6 h-6 text-foreground" />
                  </div>
                </div>
              </div>
            ) : isPdfUrl(details.credential.credentialUrl || details.credential.imageUrl) ? (
              <div className="w-full h-64 flex items-center justify-center bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg border">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-red-600 dark:text-red-400 mx-auto mb-4" />
                  <p className="text-red-700 dark:text-red-300 font-medium mb-4">PDF Certificate</p>
                  <button
                    onClick={() => window.open(details.credential.credentialUrl || details.credential.imageUrl, '_blank')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors inline-flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View PDF
                  </button>
                </div>
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-background border rounded-lg">
                <div className="text-center">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Certificate file not available</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Forensics / Model Output */}
        <div className="border border-border rounded-lg p-4 bg-card">
          <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Forensics
          </h3>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Run a forgery detector on this credential to visualize model output.</p>
            <div className="flex items-center gap-3">
              <button
                onClick={runForensics}
                disabled={forensicsLoading || forensicsForbidden}
                title={forensicsForbidden ? 'You are not authorized to run forensics on this credential' : undefined}
                className="px-4 py-2 bg-primary text-white rounded-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {forensicsLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spin />
                    Running...
                  </span>
                ) : (
                  'Run Forensics'
                )}
              </button>
              {forensicsImage && (
                <a
                  href={forensicsImage}
                  download={`forensics-${details.credential._id}.png`}
                  className="text-sm text-primary hover:underline"
                >
                  Download Result
                </a>
              )}
            </div>

            {forensicsError && (
              <p className="text-sm text-red-600">{forensicsError}</p>
            )}

            {forensicsMetrics && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border">
                <h4 className="font-semibold text-lg mb-3 text-foreground">Fraud Detection Results</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      forensicsMetrics.authenticityScore >= 90 ? 'text-green-600' :
                      forensicsMetrics.authenticityScore >= 70 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {forensicsMetrics.authenticityScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Authenticity Score</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${
                      forensicsMetrics.fraudPercentage < 5 ? 'text-green-600' :
                      forensicsMetrics.fraudPercentage < 15 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {forensicsMetrics.fraudPercentage}%
                    </div>
                    <div className="text-sm text-muted-foreground">Tampering Detected</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {forensicsMetrics.confidence}%
                    </div>
                    <div className="text-sm text-muted-foreground">Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-lg font-bold px-2 py-1 rounded text-white ${
                      forensicsMetrics.classification === 'AUTHENTIC' ? 'bg-green-600' :
                      forensicsMetrics.classification === 'POSSIBLY_TAMPERED' ? 'bg-yellow-600' : 'bg-red-600'
                    }`}>
                      {forensicsMetrics.classification.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Classification</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  Analysis: {forensicsMetrics.tamperedPixels.toLocaleString()} of {forensicsMetrics.totalPixels.toLocaleString()} pixels flagged as potentially tampered
                </div>
              </div>
            )}

            {forensicsImage && (
              <div className="w-full rounded overflow-hidden border mt-4">
                <h4 className="font-semibold text-lg mb-2 text-foreground">Forensics Heatmap</h4>
                <p className="text-sm text-muted-foreground mb-2">
                  Bright regions indicate potential tampering or forgery
                </p>
                <img src={forensicsImage} alt="Forensics Output" className="w-full object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
