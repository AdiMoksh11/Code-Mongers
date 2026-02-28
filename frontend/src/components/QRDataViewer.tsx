"use client";
import React, { useState } from "react";
import { Card, Typography, Button, Alert, Divider } from "antd";
import { QRCodeCanvas } from "qrcode.react";
import dayjs from "dayjs";

const { Title, Text } = Typography;

interface QRDataViewerProps {
  qrData: any;
  onClose?: () => void;
}

export const QRDataViewer: React.FC<QRDataViewerProps> = ({ qrData, onClose }) => {
  const [showRawData, setShowRawData] = useState(false);

  if (!qrData || qrData.type !== "CREDEXA_CREDENTIAL_VERIFICATION") {
    return (
      <Alert
        message="Invalid QR Code"
        description="This QR code is not a valid Credexa credential verification code."
        type="error"
        showIcon
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
      <Card className="shadow-lg border-0 mb-6">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
            <span className="text-2xl">🏆</span>
          </div>
          <Title level={2} className="text-gray-800 mb-2">
            Credential Verification
          </Title>
          <Text className="text-gray-600">
            Scanned from QR Code
          </Text>
        </div>

        {/* Credential Information */}
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <Title level={4} className="text-blue-800 mb-4">📜 Credential Details</Title>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Text strong className="text-blue-700">Title:</Text>
              <div className="text-lg font-semibold text-gray-800">
                {qrData.credential?.title || 'Unknown'}
              </div>
            </div>
            <div>
              <Text strong className="text-blue-700">Issuer:</Text>
              <div className="text-lg text-gray-700">
                {qrData.credential?.issuer || 'Unknown'}
              </div>
            </div>
            <div>
              <Text strong className="text-blue-700">Type:</Text>
              <div className="text-gray-700">
                {qrData.credential?.type || 'N/A'}
              </div>
            </div>
            <div>
              <Text strong className="text-blue-700">Issue Date:</Text>
              <div className="text-gray-700">
                {qrData.credential?.issueDate 
                  ? dayjs(qrData.credential.issueDate).format("MMM D, YYYY")
                  : 'N/A'
                }
              </div>
            </div>
            {qrData.credential?.nsqfLevel && (
              <div>
                <Text strong className="text-blue-700">NSQF Level:</Text>
                <div className="text-gray-700">{qrData.credential.nsqfLevel}</div>
              </div>
            )}
            {qrData.credential?.creditPoints && (
              <div>
                <Text strong className="text-blue-700">Credit Points:</Text>
                <div className="text-gray-700">{qrData.credential.creditPoints}</div>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain Information */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <Title level={4} className="text-green-800 mb-4">⛓️ Blockchain Verification</Title>
          
          <div className="space-y-3">
            <div>
              <Text strong className="text-green-700">Credential Hash:</Text>
              <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                {qrData.credentialHash}
              </div>
            </div>
            {qrData.transactionHash && (
              <div>
                <Text strong className="text-green-700">Transaction Hash:</Text>
                <div className="font-mono text-sm bg-white p-2 rounded border break-all">
                  {qrData.transactionHash}
                </div>
              </div>
            )}
            <div>
              <Text strong className="text-green-700">Network:</Text>
              <div className="text-gray-700">
                {qrData.blockchain?.network || 'Unknown'}
              </div>
            </div>
            {qrData.blockchain?.explorer && (
              <div>
                <Text strong className="text-green-700">Blockchain Explorer:</Text>
                <div>
                  <a 
                    href={qrData.blockchain.explorer} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    View on Etherscan
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Verification Information */}
        <div className="bg-purple-50 p-4 rounded-lg mb-6">
          <Title level={4} className="text-purple-800 mb-4">🔍 Verification Details</Title>
          
          <div className="space-y-2">
            <div>
              <Text strong className="text-purple-700">QR Code Version:</Text>
              <div className="text-gray-700">{qrData.version || '1.0'}</div>
            </div>
            <div>
              <Text strong className="text-purple-700">Scanned At:</Text>
              <div className="text-gray-700">
                {new Date().toLocaleString()}
              </div>
            </div>
            {qrData.verification?.timestamp && (
              <div>
                <Text strong className="text-purple-700">QR Generated:</Text>
                <div className="text-gray-700">
                  {new Date(qrData.verification.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center mb-4">
          {qrData.verification?.url && (
            <Button 
              type="primary" 
              size="large"
              onClick={() => window.open(qrData.verification.url, '_blank')}
            >
              Verify Online
            </Button>
          )}
          <Button 
            size="large"
            onClick={() => setShowRawData(!showRawData)}
          >
            {showRawData ? 'Hide' : 'Show'} Raw Data
          </Button>
          {onClose && (
            <Button size="large" onClick={onClose}>
              Close
            </Button>
          )}
        </div>

        {/* Raw Data */}
        {showRawData && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <Title level={5} className="mb-3">Raw QR Data:</Title>
            <pre className="text-xs bg-white p-3 rounded border overflow-auto max-h-60">
              {JSON.stringify(qrData, null, 2)}
            </pre>
          </div>
        )}

        {/* Security Notice */}
        <Alert
          message="Security & Privacy Notice"
          description="This QR code contains only credential verification information. No personal data or private keys are exposed. The credential's authenticity can be independently verified on the blockchain."
          type="info"
          showIcon
          className="mt-4"
        />
      </Card>
    </div>
  );
};

export default QRDataViewer;
