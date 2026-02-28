"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
const Sidebar = dynamic(() => import("@/components/dashboard/Sidebar"), { ssr: false });
import api from "@/utils/axios";
import { Button } from "@/components/ui/button";
import { Card as AntCard, Form, Row, Col, Space, Empty, Skeleton, ConfigProvider, theme as antdTheme, App } from "antd";
import { Plus, Share2 } from "lucide-react";
import { useTheme } from "next-themes";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";

import { useCredentials } from "@/hooks/useCredentials";
import { useSkills } from "@/hooks/useSkills";
import { useCredentialActions } from "@/hooks/useCredentialActions";
import { useCredentialModal, useImageModal, useDetailsModal, useOnChainModal } from "@/hooks/useModals";
import { CredentialCard } from "@/components/dashboard/credentials/CredentialCard";
import { CredentialStats } from "@/components/dashboard/credentials/CredentialStats";
import { CredentialFiltersComponent } from "@/components/dashboard/credentials/CredentialFilters";
import { CredentialModal } from "@/components/dashboard/credentials/CredentialModal";
import { ImageViewerModal } from "@/components/dashboard/credentials/ImageViewerModal";
import { CredentialDetailsModal } from "@/components/dashboard/credentials/CredentialDetailsModal";
import { OnChainDetailsModal } from "@/components/dashboard/credentials/OnChainDetailsModal";
import { filterCredentials, sortCredentials, getUniqueIssuers } from "@/utils/credentialUtils";
import { Credential, CredentialFilters } from "@/types/credentials";

function CredentialsPageContent() {
  const { message } = App.useApp();
  // Use our custom hooks
  const { items, loading, handleDelete, addCredential, updateCredential, fetchItems } = useCredentials();
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    // Try to set userId from credentials
    if (items && items.length > 0) {
      // Try to find userId from credential fields
      const cred = items[0] as any;
      if (cred.userId) {
        localStorage.setItem("userId", cred.userId);
      } else if (cred.user && cred.user._id) {
        localStorage.setItem("userId", cred.user._id);
      }
    }
    // If not found, fetch from /api/users/me
    if (!localStorage.getItem("userId")) {
      const token = localStorage.getItem("authToken");
      if (token) {
        api.get("/api/users/me", { headers: { Authorization: `Bearer ${token}` } })
          .then(res => {
            if (res.data?.user?._id) {
              localStorage.setItem("userId", res.data.user._id);
            }
          });
      }
    }
  }, [items]);
  const { theme: mode } = useTheme();
  const isDark = (mode ?? "light") === "dark";
  const { skillsData, loadingSkills } = useSkills();
  const { anchoringId, loadingDetails, handleAnchorCredential, handleViewDetails, fetchOnChainDetails } = useCredentialActions();
  
  // Local state for loading
  const [submitting, setSubmitting] = useState(false);
  
  // Modal hooks
  const modalHook = useCredentialModal();
  const imageModal = useImageModal();
  const detailsModal = useDetailsModal();
  const onChainModal = useOnChainModal();

  // Local state for filters
  const [filters, setFilters] = useState<CredentialFilters>({
    search: "",
    typeFilter: "all",
    statusFilter: "all",
    issuerFilter: "all",
    sortKey: "newest",
  });

  const [form] = Form.useForm();

  // Computed values
  const filteredItems = useMemo(() => {
    const filtered = filterCredentials(items, filters);
    return sortCredentials(filtered, filters.sortKey);
  }, [items, filters]);

  const uniqueIssuers = useMemo(() => getUniqueIssuers(items), [items]);

  // Handlers
  const handleFiltersChange = (newFilters: Partial<CredentialFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleViewDetailsClick = async (credentialId?: string) => {
    const details = await handleViewDetails(credentialId);
    if (details) {
      detailsModal.openDetailsModal(details);
    }
  };

  const handleShowOnChainDetails = async (credential: Credential) => {
    console.log('🚀 handleShowOnChainDetails called');
    console.log('📦 Received credential:', credential);
    
    if (!credential.credentialHash) {
      console.error('❌ Credential hash is missing!');
      console.log('📋 Full credential object:', credential);
      message.error("Credential hash is missing. Cannot fetch details.");
      return;
    }
    
    console.log('✅ Credential hash found:', credential.credentialHash);
    console.log('🔄 Setting modal loading to true');
    onChainModal.setIsModalLoading(true);
    onChainModal.openOnChainModal(null);
    
    console.log('📡 Calling fetchOnChainDetails with hash:', credential.credentialHash);
    const data = await fetchOnChainDetails(credential.credentialHash);
    
    console.log('📥 Response from fetchOnChainDetails:', data);
    if (data) {
      console.log('✅ Opening modal with data:', data);
      onChainModal.openOnChainModal(data);
    } else {
      console.log('❌ No data received, closing modal');
      onChainModal.closeOnChainModal();
    }
    console.log('🔄 Setting modal loading to false');
    onChainModal.setIsModalLoading(false);
  };

  const handleAnchorCredentialClick = async (credentialId?: string) => {
    console.log('⚓ handleAnchorCredentialClick called with ID:', credentialId);
    
    const result: any = await handleAnchorCredential(credentialId);
    console.log('📄 Anchoring result:', result);

    if (result?.success) {
      // success case
      console.log('✅ Anchoring successful, refreshing credentials list...');
      await fetchItems();
      console.log('🔄 Credentials list refreshed');
      return;
    }

    // handle conflict cases returned by the backend
    if (result?.reason === 'ALREADY_ANCHORED') {
      // Only show the error from useCredentialActions, do not show another popup here
      return;
    }

    if (result?.reason === 'DUPLICATE_CREDENTIAL') {
      message.warning('A similar credential already exists in the system.');
      if (result?.existingCredentialId) {
        // Optionally navigate or show the existing credential
        console.log('Existing credential id:', result.existingCredentialId);
      }
      return;
    }

    // Unknown failure
    console.log('❌ Anchoring failed or missing data', result);
  };


  const submitForm = async () => {
    setSubmitting(true);
    const token = localStorage.getItem("authToken");
    const fd = new FormData();
    let payload: Record<string, any> = {};
    try {
      if (modalHook.addMethod === "sync") {
        if (!modalHook.file) {
          message.error("Please upload a certificate file to continue.");
          return;
        }
        const inferredTitle = modalHook.file.name?.replace(/\.[^/.]+$/, "") || "Synced Credential";
        payload = {
          title: inferredTitle,
          issuer: modalHook.selectedPlatform || "Unknown",
          type: "certificate",
          status: "pending",
          issueDate: new Date().toISOString(),
          description: "",
          credentialUrl: "",
          nsqfLevel: "",
          blockchainAddress: "",
          transactionHash: "",
          credentialId: "",
          creditPoints: "",
          skills: "",
        };
      } else {
        const values = modalHook.formValues;
        if (!values || !values.title) {
          message.error("Please go back and fill in the title field");
          return;
        }
        const skillArray = Array.isArray(values.skills)
          ? values.skills
          : String(values.skills || "")
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean);
        payload = {
          title: values.title,
          issuer: values.issuer || "Unknown",
          type: values.type || "certificate",
          status: "pending",
          issueDate: values.issueDate?.toISOString() || new Date().toISOString(),
          description: values.description || "",
          credentialUrl: values.credentialUrl || "",
          nsqfLevel: values.nsqfLevel || "",
          blockchainAddress: values.blockchainAddress || "",
          transactionHash: values.transactionHash || "",
          credentialId: values.credentialId || "",
          creditPoints: values.creditPoints || "",
          imageUrl: values.imageUrl || "",
          skills: skillArray.join(", "),
        };
      }

      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) fd.append(k, String(v));
      });
      if (modalHook.file) fd.append("certificateFile", modalHook.file);
      // Handle imageUrl for both editing and new credentials (e.g., from URL import)
      if (!modalHook.file && modalHook.editing?.imageUrl) {
        fd.append("imageUrl", modalHook.editing.imageUrl);
      } else if (!modalHook.file && payload.imageUrl) {
        fd.append("imageUrl", payload.imageUrl);
      }

      if (modalHook.editing?._id) {
        try {
          const res = await api.put(`/api/credentials/${modalHook.editing._id}`, fd, {
            headers: { Authorization: `Bearer ${token}` },
          });
          updateCredential(res.data);
          message.success("Credential updated successfully!");
        } catch (e: any) {
          const status = e.response?.status;
          const data = e.response?.data;
          if (status === 409) {
            if (data?.error === 'ALREADY_ANCHORED') {
              const tx = data.transactionHash;
              const hash = data.credentialHash || data.hash;
              if (tx) {
                message.error(
                  <span>
                    This credential is already anchored. <a href={`https://sepolia.etherscan.io/tx/${tx}`} target="_blank" rel="noreferrer">View transaction</a>
                  </span>
                );
              } else if (hash) {
                message.error('This credential is already anchored (hash: ' + hash.substring(0, 10) + '...)');
              } else {
                message.error('This credential is already anchored on-chain.');
              }
              modalHook.setIsModalOpen(false);
              setSubmitting(false);
              return;
            }
            if (data?.error === 'DUPLICATE_CREDENTIAL') {
              message.error('A credential with the same title and issue date already exists for this student');
              modalHook.setIsModalOpen(false);
              setSubmitting(false);
              return;
            }
          }
          throw e;
        }
      } else {
        try {
          const res = await api.post(`/api/credentials`, fd, {
            headers: { Authorization: `Bearer ${token}` },
          });
          addCredential(res.data);
          message.success("Credential created successfully!");
        } catch (e: any) {
          const status = e.response?.status;
          const data = e.response?.data;
          if (status === 409) {
            if (data?.error === 'ALREADY_ANCHORED') {
              const tx = data.transactionHash;
              const hash = data.credentialHash || data.hash;
              if (tx) {
                message.error(
                  <span>
                    This credential is already anchored. <a href={`https://sepolia.etherscan.io/tx/${tx}`} target="_blank" rel="noreferrer">View transaction</a>
                  </span>
                );
              } else if (hash) {
                message.error('This credential is already anchored (hash: ' + hash.substring(0, 10) + '...)');
              } else {
                message.error('This credential is already anchored on-chain.');
              }
              modalHook.setIsModalOpen(false);
              setSubmitting(false);
              return;
            }
            if (data?.error === 'DUPLICATE_CREDENTIAL') {
              message.error('A credential with the same title and issue date already exists for this student');
              modalHook.setIsModalOpen(false);
              setSubmitting(false);
              return;
            }
          }
          throw e;
        }
      }

      form.resetFields();
      modalHook.resetModal();
    } catch (e: any) {
      console.error('Save failed:', e);
      message.error(e.response?.data?.message || "Failed to save credential");
    } finally {
      setSubmitting(false);
    }
  };

  const handleAnchor = async () => {
    if (!modalHook.editing?._id) {
      message.error("Please save the credential first");
      return;
    }

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const hashRes = await api.post(`/api/credentials/${modalHook.editing._id}/generate-hash`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { hash } = hashRes.data;

      const anchorRes = await api.post(`/api/credentials/${modalHook.editing._id}/anchor`, { hash }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (anchorRes.data.transactionHash) {
        const credRes = await api.put(`/api/credentials/${modalHook.editing._id}`, {
          transactionHash: anchorRes.data.transactionHash,
          status: 'verified'
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        updateCredential(credRes.data);
        message.success("Credential anchored successfully!");
        modalHook.setIsModalOpen(false);
      }
    } catch (err) {
      console.error('Anchor Error:', err);
      message.error("Failed to anchor credential");
    }
  };

  if (!mounted) return null;
  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorBgBase: "var(--color-background)",
          colorBgContainer: "var(--color-card)",
          colorBgElevated: "var(--color-card)",
          colorText: "var(--color-foreground)",
          colorTextSecondary: "var(--color-muted-foreground)",
          colorBorder: "var(--color-border)",
          colorPrimary: "var(--color-primary)",
          colorLink: "var(--color-primary)",
          colorLinkHover: "var(--color-primary)",
          borderRadius: 12,
        },
        components: {
          Modal: {
            headerBg: "var(--color-card)",
            contentBg: "var(--color-card)",
            footerBg: "var(--color-card)",
            titleColor: "var(--color-foreground)",
            colorText: "var(--color-foreground)",
          },
          Card: {
            colorBgContainer: "var(--color-card)",
            headerBg: "var(--color-card)",
          },
          Input: {
            colorBgContainer: "var(--color-card)",
            colorText: "#ffffff",
            colorTextPlaceholder: "#ffffff",
            colorBorder: "var(--color-border)",
            activeBg: "var(--color-card)",
            hoverBg: "var(--color-card)",
          },
          Select: {
            colorBgContainer: "var(--color-card)",
            colorText: "var(--color-foreground)",
            colorTextPlaceholder: "var(--color-muted-foreground)",
            colorBorder: "var(--color-border)",
          },
        },
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 text-gray-800 dark:text-gray-200 flex relative overflow-hidden">
        {/* Enhanced background patterns */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-2xl" />
        </div>
        
        <Sidebar />
        <main className="flex-1 p-6 md:p-10 relative z-10">
          {/* Enhanced header section */}
          <div className="relative mb-8 overflow-hidden rounded-2xl">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10 dark:from-emerald-500/20 dark:via-teal-500/20 dark:to-cyan-500/20" />
            <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm" />
            
            <div className="relative z-10 p-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-xl">
                  <div className="text-2xl">🎓</div>
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent mb-1">
                    My Credentials
                  </h1>
                  <p className="text-base text-gray-600 dark:text-gray-400">Manage and showcase your verified achievements</p>
                </div>
              </div>
              
              <Space size="middle">
                <ThemeToggleButton variant="gif" url="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExMWI1ZmNvMGZyemhpN3VsdWp4azYzcWUxcXIzNGF0enp0eW1ybjF0ZyZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/Fa6uUw8jgJHFVS6x1t/giphy.gif" />
                <Button 
                  variant="outline" 
                  size="lg"
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-white/30 dark:border-gray-700/50 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 transition-all duration-300 rounded-xl shadow-lg" 
                  onClick={async () => {
                    // Get userId from localStorage only
                    const userId = localStorage.getItem("userId");
                    if (!userId) {
                      message.error("Unable to find your profile ID.");
                      return;
                    }
                    const url = `${window.location.origin}/profile/${userId}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      message.success(<span>Profile link copied! <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-emerald-600">View</a></span>);
                    } catch {
                      message.info(<span>Share this link: <a href={url} target="_blank" rel="noopener noreferrer" className="underline text-emerald-600">{url}</a></span>);
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" /> Share Profile
                </Button>
                <Button 
                  size="lg"
                  onClick={modalHook.openCreate} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 border-0 shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl text-white font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" /> Add Credential
                </Button>
              </Space>
            </div>
          </div>

          {/* Stats summary */}
          <CredentialStats items={items} />

          {/* Filters */}
          <CredentialFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            uniqueIssuers={uniqueIssuers}
          />

          {/* Credentials Grid */}
          {loading ? (
            <div className="relative">
              <Row gutter={[24, 24]} className="mt-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Col xs={24} sm={12} lg={8} key={i}>
                    <div className="relative group">
                      <div className="absolute inset-0 bg-gradient-to-r from-gray-200/50 to-gray-300/50 dark:from-gray-700/50 dark:to-gray-600/50 rounded-2xl blur-sm" />
                      <AntCard className="relative border-0 shadow-lg bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl" styles={{ body: { padding: "24px" } }}>
                        <Skeleton active avatar paragraph={{ rows: 3 }} />
                      </AntCard>
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="relative mt-6 overflow-hidden rounded-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-gray-500/10 via-slate-500/10 to-gray-500/10 dark:from-gray-500/20 dark:via-slate-500/20 dark:to-gray-500/20" />
              <div className="absolute inset-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm" />
              
              <AntCard
                className="relative border-0 shadow-lg py-16"
                styles={{ body: { background: "transparent", padding: "48px 24px" } }}
              >
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center">
                    <div className="text-4xl">🎓</div>
                  </div>
                  <Empty 
                    description={
                      <div className="text-gray-600 dark:text-gray-400">
                        <p className="text-lg font-medium mb-2">No credentials found</p>
                        <p className="text-sm">Start building your professional portfolio by adding your first credential!</p>
                      </div>
                    } 
                  />
                </div>
              </AntCard>
            </div>
          ) : (
            <div className="relative">
              <Row gutter={[24, 24]} className="mt-6">
                {filteredItems.map((credential) => (
                  <Col xs={24} sm={12} lg={8} key={credential._id || credential.title}>
                    <CredentialCard
                      credential={credential}
                      onDelete={handleDelete}
                      onViewImage={imageModal.setViewingImage}
                      onViewDetails={handleViewDetailsClick}
                      onAnchor={handleAnchorCredentialClick}
                      onShowOnChainDetails={handleShowOnChainDetails}
                      anchoringId={anchoringId}
                      loadingDetails={loadingDetails}
                    />
                  </Col>
                ))}
              </Row>
            </div>
          )}

          {/* Modals */}
          <CredentialModal
            isOpen={modalHook.isModalOpen}
            onClose={() => modalHook.setIsModalOpen(false)}
            editing={modalHook.editing}
            currentStep={modalHook.currentStep}
            setCurrentStep={modalHook.setCurrentStep}
            addMethod={modalHook.addMethod}
            setAddMethod={modalHook.setAddMethod}
            selectedPlatform={modalHook.selectedPlatform}
            setSelectedPlatform={modalHook.setSelectedPlatform}
            file={modalHook.file}
            setFile={modalHook.setFile}
            formValues={modalHook.formValues}
            setFormValues={modalHook.setFormValues}
            skillsData={skillsData}
            loadingSkills={loadingSkills}
            onSubmit={submitForm}
            onAnchor={handleAnchor}
            submitting={submitting}
            form={form}
          />

          <ImageViewerModal
            imageUrl={imageModal.viewingImage}
            onClose={() => imageModal.setViewingImage(null)}
          />

          <CredentialDetailsModal
            isOpen={detailsModal.detailsModalOpen}
            onClose={detailsModal.closeDetailsModal}
            details={detailsModal.viewingDetails}
            onViewImage={imageModal.setViewingImage}
          />

          <OnChainDetailsModal
            isOpen={onChainModal.isDetailsModalOpen}
            onClose={onChainModal.closeOnChainModal}
            data={onChainModal.modalData}
            isLoading={onChainModal.isModalLoading}
          />
        </main>
      </div>
    </ConfigProvider>
  );
}

import RoleGuard from "@/components/auth/RoleGuard";

export default function CredentialsPage() {
  return (
    <RoleGuard allowedRole="learner">
      <App>
        <CredentialsPageContent />
      </App>
    </RoleGuard>
  );
}
