"use client";
import React from "react";
import { Modal, Space, Typography, Input, Button } from "antd";
import { QrCode } from "lucide-react";

const { Text } = Typography;

export default function TwoFAModal({
  open,
  onClose,
  qrCode,
  secret,
  code,
  setCode,
  onVerify,
}: {
  open: boolean;
  onClose: () => void;
  qrCode: string;
  secret: string;
  code: string;
  setCode: (v: string) => void;
  onVerify: () => void;
}) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title={
        <span className="flex items-center gap-2">
          <QrCode className="w-5 h-5" />
          Set up Two-Factor Authentication
        </span>
      }
      footer={null}
      width={500}
    >
      <Space direction="vertical" size="large" className="w-full">
        <div className="text-center">
          <Text>Scan this QR code with your authenticator app (like Google Authenticator, Authy, or 1Password)</Text>
        </div>
        {qrCode && (
          <div className="flex justify-center">
            <img src={qrCode} alt="2FA QR Code" className="max-w-xs" />
          </div>
        )}
        <div>
          <Text strong>Or enter this secret key manually:</Text>
          <br />
          <Text code copyable>
            {secret}
          </Text>
        </div>
        <Input placeholder="Enter 6-digit verification code" value={code} onChange={(e) => setCode(e.target.value)} maxLength={6} />
        <div className="flex justify-end gap-2">
          <Button onClick={onClose}>Cancel</Button>
          <Button type="primary" onClick={onVerify} disabled={code.length !== 6}>
            Verify & Enable
          </Button>
        </div>
      </Space>
    </Modal>
  );
}
