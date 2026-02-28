import React from "react";
import { Modal, Button as AntButton } from "antd";

interface ImageViewerModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  imageUrl,
  onClose,
}) => {
  return (
    <Modal
      open={!!imageUrl}
      onCancel={onClose}
      footer={null}
      width="90vw"
      centered
      styles={{
        body: { padding: 0 },
        content: { padding: 0 }
      }}
    >
      {imageUrl && (
        <div className="relative">
          <img
            src={imageUrl}
            alt="Certificate"
            className="w-full h-auto max-h-[80vh] object-contain"
          />
          <AntButton
            className="absolute top-4 right-4 bg-black/50 hover:bg-black/70 text-white border-none"
            onClick={onClose}
            shape="circle"
            icon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        </div>
      )}
    </Modal>
  );
};
