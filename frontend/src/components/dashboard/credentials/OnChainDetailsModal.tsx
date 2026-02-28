import React from "react";
import { Modal, Spin } from "antd";
import dayjs from "dayjs";
import { OnChainDetails } from "@/types/credentials";

interface OnChainDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: OnChainDetails | null;
  isLoading: boolean;
}

export const OnChainDetailsModal: React.FC<OnChainDetailsModalProps> = ({
  isOpen,
  onClose,
  data,
  isLoading,
}) => {
  return (
    <Modal
      title="On-Chain Credential Details"
      open={isOpen}
      onCancel={onClose}
      footer={null}
      className="onchain-modal"
    >
      {isLoading ? (
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4">Fetching data from the blockchain...</p>
        </div>
      ) : data ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-500">ISSUER ADDRESS</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-sm break-all text-gray-900 dark:text-gray-900">{data.issuer}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500">ANCHORED ON (TIMESTAMP)</p>
            <p className="font-mono bg-gray-100 p-2 rounded text-sm text-gray-900 dark:text-gray-900">
              {data.timestamp && data.timestamp > 0 
                ? dayjs.unix(data.timestamp).format("MMMM D, YYYY h:mm:ss A")
                : "Invalid Date"
              }
            </p>
          </div>
        </div>
      ) : (
        <p>No data available.</p>
      )}
      {/* Override Ant Design modal background to a soft gray instead of pure black */}
      <style jsx global>{`
        .onchain-modal .ant-modal-content,
        .onchain-modal .ant-modal-header,
        .onchain-modal .ant-modal-body {
          background-color: #f3f4f6; /* Tailwind gray-100 */
        }
        /* Dark mode: use a medium-dark gray rather than pure black */
        .dark .onchain-modal .ant-modal-content,
        .dark .onchain-modal .ant-modal-header,
        .dark .onchain-modal .ant-modal-body {
          background-color: #1f2937; /* Tailwind gray-800 */
        }
      `}</style>
    </Modal>
  );
};
