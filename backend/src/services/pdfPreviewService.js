const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { uploadFile } = require('./storageService');

/**
 * Generate preview image from PDF URL
 * For now, this is a placeholder - we'll return the PDF URL and let frontend handle display
 * @param {string} pdfUrl - URL to the PDF file
 * @param {string} credentialId - Credential ID for naming
 * @returns {Promise<string>} URL of the PDF (no conversion for now)
 */
async function generatePdfPreview(pdfUrl, credentialId) {
  try {
    console.log('🔄 Detecting PDF for:', pdfUrl);

    // Check if URL is a PDF
    if (!isPdfUrl(pdfUrl)) {
      console.log('❌ URL is not a PDF, skipping preview generation');
      return null;
    }

    // For now, just return the PDF URL - frontend will handle display
    // TODO: Implement actual PDF to image conversion when system dependencies are available
    console.log('✅ PDF detected, returning PDF URL for frontend handling:', pdfUrl);
    return pdfUrl;

  } catch (error) {
    console.error('❌ Error in PDF preview generation:', error);
    return null;
  }
}

/**
 * Generate preview image from PDF buffer
 * For now, this is a placeholder - we'll save the PDF and return its URL
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {string} credentialId - Credential ID for naming
 * @returns {Promise<string>} URL of the saved PDF
 */
async function generatePdfPreviewFromBuffer(pdfBuffer, credentialId) {
  try {
    console.log('🔄 Processing PDF buffer for credential:', credentialId);

    // Upload the PDF buffer to cloud storage
    const uploadResult = await uploadFile(
      pdfBuffer, 
      `credential_pdf_${credentialId}_${Date.now()}.pdf`
    );

    console.log('✅ PDF uploaded to cloud storage:', uploadResult.url);
    return uploadResult.url;

  } catch (error) {
    console.error('❌ Error processing PDF buffer:', error);
    return null;
  }
}

/**
 * Check if a URL points to a PDF file
 * @param {string} url - URL to check
 * @returns {boolean} True if URL appears to be a PDF
 */
function isPdfUrl(url) {
  if (!url || typeof url !== 'string') return false;
  
  const urlLower = url.toLowerCase();
  return urlLower.includes('.pdf') || 
         urlLower.includes('pdf') || 
         urlLower.includes('application/pdf');
}

/**
 * Determine the file type from URL or content
 * @param {string} url - File URL
 * @returns {string} File type: 'pdf', 'image', or 'unknown'
 */
function getFileType(url) {
  if (!url || typeof url !== 'string') return 'unknown';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('.pdf') || urlLower.includes('pdf')) {
    return 'pdf';
  }
  
  if (urlLower.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/i)) {
    return 'image';
  }
  
  return 'unknown';
}

module.exports = {
  generatePdfPreview,
  generatePdfPreviewFromBuffer,
  isPdfUrl,
  getFileType
};