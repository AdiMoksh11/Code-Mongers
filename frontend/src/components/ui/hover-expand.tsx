"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface HoverExpandProps {
  images: string[];
  initialSelectedIndex?: number;
  thumbnailHeight?: number;
  modalImageSize?: number;
  maxThumbnails?: number;
  onHover?: (index: number) => void; 
}

export default function HoverExpand({
  images,
  initialSelectedIndex = 0,
  thumbnailHeight = 200,
  modalImageSize = 400,
  maxThumbnails = 11,
  onHover,
}: HoverExpandProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>(initialSelectedIndex);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };

    if (isModalOpen) {
      document.body.classList.add("overflow-hidden");
      document.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.classList.remove("overflow-hidden");
    }

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.classList.remove("overflow-hidden");
    };
  }, [isModalOpen]);

  return (
    <div className="relative">
      {/* Flex container: left-aligned on mobile, centered on md+ */}
      <div className="mx-auto flex w-full max-w-full gap-1 rounded-md pb-20 pt-10 md:gap-2 justify-start md:justify-center overflow-x-auto">
        {images.slice(0, maxThumbnails).map((imageUrl, i) => (
          <div
            key={`image-container-${i}`}
            className={`group relative overflow-hidden rounded-2xl transition-all duration-300 ${
              selectedIndex === i ? "w-64" : "w-4 sm:w-5 md:w-8 xl:w-12"
            }`}
            style={{ height: thumbnailHeight }}
            onMouseEnter={() => {
              setSelectedIndex(i);
              if (onHover) onHover(i);
            }}
            onClick={() => {
              setSelectedIndex(i);
              setIsModalOpen(true);
            }}
          >
            <motion.div layoutId={`image-${i}`} className="absolute inset-0 w-full h-full">
              <img
                draggable={false}
                src={imageUrl}
                alt={`Image ${i + 1}`}
                className="w-full h-full object-cover transition-transform duration-300"
              />
            </motion.div>
          </div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-content-center bg-white/40 backdrop-blur-sm dark:bg-black/40"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="cursor-pointer overflow-hidden rounded-2xl bg-black"
              style={{ width: modalImageSize, height: modalImageSize }}
            >
              <motion.div layoutId={`image-${selectedIndex}`} className="relative w-full h-full">
                <img
                  src={images[selectedIndex]}
                  draggable={false}
                  alt={`Image ${selectedIndex + 1}`}
                  className="absolute left-1/2 top-1/2 w-full h-full -translate-x-1/2 -translate-y-1/2 object-cover"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
