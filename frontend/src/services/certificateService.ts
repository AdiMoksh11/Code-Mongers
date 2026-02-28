import api from "@/utils/axios";

export type ImportResult = {
  success: boolean;
  message?: string;
  data?: {
    platform: string;
    originalUrl: string;
    storedImageUrl?: string | null;
    title?: string;
    issuer?: string;
    completionDate?: string | null;
    issueDate?: string | null;
    credentialId?: string;
    description?: string;
    nsqfLevel?: string | null;
    creditPoints?: string | null;
    ocrAvailable?: boolean;
    aiExtracted?: boolean;
  };
};

export function isSupportedCertificateUrl(url: string): boolean {
  if (!url) return false;
  return /^https?:\/\/(www\.)?coursera\.org\/share\/[A-Za-z0-9]+/.test(url);
}

export async function importCertificateFromUrl(url: string): Promise<ImportResult> {
  const res = await api.post<ImportResult>("/api/certificates/import-url", { url });
  return res.data;
}
