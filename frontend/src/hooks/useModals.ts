import { useState } from "react";
import { AddMethod, Platform } from "@/types/credentials";

export const useCredentialModal = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [file, setFile] = useState<File | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [addMethod, setAddMethod] = useState<AddMethod | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<any>(null);

  const resetModal = () => {
    setEditing(null);
    setFile(null);
    setAddMethod(null);
    setSelectedPlatform(null);
    setFormValues(null);
    setCurrentStep(0);
    setIsModalOpen(false);
  };

  const openCreate = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const openEdit = (credential: any) => {
    setEditing(credential);
    setFile(null);
    setAddMethod("manual");
    setCurrentStep(1);
    setIsModalOpen(true);
  };

  return {
    isModalOpen,
    setIsModalOpen,
    editing,
    setEditing,
    file,
    setFile,
    currentStep,
    setCurrentStep,
    addMethod,
    setAddMethod,
    selectedPlatform,
    setSelectedPlatform,
    formValues,
    setFormValues,
    resetModal,
    openCreate,
    openEdit,
  };
};

export const useImageModal = () => {
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  return {
    viewingImage,
    setViewingImage,
  };
};

export const useDetailsModal = () => {
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [viewingDetails, setViewingDetails] = useState<any>(null);

  const openDetailsModal = (details: any) => {
    setViewingDetails(details);
    setDetailsModalOpen(true);
  };

  const closeDetailsModal = () => {
    setDetailsModalOpen(false);
    setViewingDetails(null);
  };

  return {
    detailsModalOpen,
    viewingDetails,
    openDetailsModal,
    closeDetailsModal,
  };
};

export const useOnChainModal = () => {
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<any>(null);
  const [isModalLoading, setIsModalLoading] = useState(false);

  const openOnChainModal = (data: any) => {
    setModalData(data);
    setIsDetailsModalOpen(true);
  };

  const closeOnChainModal = () => {
    setIsDetailsModalOpen(false);
    setModalData(null);
  };

  return {
    isDetailsModalOpen,
    modalData,
    isModalLoading,
    setIsModalLoading,
    openOnChainModal,
    closeOnChainModal,
  };
};
