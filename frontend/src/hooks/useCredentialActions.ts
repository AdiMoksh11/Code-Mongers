import { useState } from "react";
import { App } from "antd";
import api from "@/utils/axios";
import { Credential, CredentialDetails, OnChainDetails } from "@/types/credentials";

export const useCredentialActions = () => {
  const { message } = App.useApp();
  const [anchoringId, setAnchoringId] = useState<string | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Handler to anchor a credential on the blockchain
  const handleAnchorCredential = async (credentialId?: string) => {
    if (!credentialId) return;
    setAnchoringId(credentialId);
    const token = localStorage.getItem("authToken");
    
    try {
      message.loading({ content: 'Anchoring on the blockchain...', key: 'anchor' });
      const anchorRes = await api.post(`/api/credentials/${credentialId}/anchor`, {}, { 
        headers: { Authorization: `Bearer ${token}` } 
      });
      const { transactionHash } = anchorRes.data;

      message.success({ content: 'Credential anchored successfully!', key: 'anchor' });
      return { success: true, transactionHash } as any;
    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;
      // Handle known conflict responses from backend
      if (status === 409 || status === 400) {
        if (data?.reason === 'already_anchored' || data?.error === 'ALREADY_ANCHORED') {
          const tx = data.transactionHash || data.blockchain?.transactionHash || null;
          const hash = data.credentialHash || null;
          // Only show one error message for already anchored
          let shortMsg = 'This credential is already anchored on the blockchain.';
          if (tx) {
            shortMsg = `Already anchored: View on blockchain: https://sepolia.etherscan.io/tx/${tx}`;
          }
          message.destroy('anchor'); // Remove any previous anchor messages
          message.error({ content: shortMsg, key: 'anchor', duration: 4 });
          return { success: false, reason: 'ALREADY_ANCHORED', transactionHash: tx, credentialHash: hash, details: shortMsg } as any;
        }
        if (data?.error === 'DUPLICATE_CREDENTIAL') {
          message.error({ content: 'A similar credential already exists in the system.', key: 'anchor' });
          return { success: false, reason: 'DUPLICATE_CREDENTIAL', existingCredentialId: data.existingCredentialId } as any;
        }
      }

      const errorMessage = data?.details || data?.message || err.response?.data?.error || "Anchoring failed.";
      message.error({ content: errorMessage, key: 'anchor' });
      return { success: false, reason: 'UNKNOWN', error: errorMessage } as any;
    } finally {
      setAnchoringId(null);
    }
  };

  // Handler to view credential details
  const handleViewDetails = async (credentialId?: string): Promise<CredentialDetails | null> => {
    if (!credentialId) return null;
    setLoadingDetails(true);
    const token = localStorage.getItem("authToken");

    try {
      const response = await api.get(`/api/credentials/${credentialId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || "Failed to load credential details.";
      message.error(errorMessage);
      return null;
    } finally {
      setLoadingDetails(false);
    }
  };

  // Handler to fetch on-chain details
  const fetchOnChainDetails = async (credentialHash: string): Promise<OnChainDetails | null> => {
    console.log('🔍 fetchOnChainDetails called with hash:', credentialHash);
    
    if (!credentialHash) {
      console.error('❌ Credential hash is empty or undefined');
      message.error("Credential hash is missing. Cannot fetch details.");
      return null;
    }

    try {
      console.log('📡 Making API request to:', `/api/credentials/verify/${credentialHash}`);
      const response = await api.get(`/api/credentials/verify/${credentialHash}`);
      console.log('✅ API response received:', response);
      console.log('📊 Response data:', response.data);
      console.log('📈 Response status:', response.status);
      
      // Extract blockchain data from the response
      const data = response.data;
      if (data && data.blockchain) {
        const blockchainData: OnChainDetails = {
          issuer: data.blockchain.issuer || 'Unknown',
          timestamp: data.blockchain.timestamp || 0
        };
        return blockchainData;
      } else {
        console.warn('⚠️ No blockchain data found in response');
        message.error("No blockchain data found for this credential.");
        return null;
      }
    } catch (error: any) {
      console.error('❌ API request failed:', error);
      console.error('📋 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      message.error("Failed to fetch on-chain details.");
      return null;
    }
  };

  return {
    anchoringId,
    loadingDetails,
    handleAnchorCredential,
    handleViewDetails,
    fetchOnChainDetails,
  };
};
