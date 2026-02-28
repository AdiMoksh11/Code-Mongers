const FormData = require('form-data');
const axios = require('axios');
const { generateDetails } = require('./aiService');

// Configuration for the Flask extraction API
const EXTRACTION_API_URL = process.env.EXTRACTION_API_URL || 'http://localhost:5001';

/**
 * Extract credential information from certificate image using AI service (primary) with Flask OCR fallback
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {string} platform - Platform hint for extraction rules (optional)
 * @returns {Promise<Object>} Extracted credential data
 */
async function extractCredentialInfo(fileBuffer, filename, platform) {
  try {
    // Primary method: Use AI service (Google Gemini)
    console.log('Attempting AI extraction...');
    const aiResult = await extractWithAI(fileBuffer);
    
    if (aiResult.success) {
      console.log('AI extraction successful');
      return aiResult;
    }
    
    console.log('AI extraction failed, trying Flask OCR service...');
    
    // Fallback method: Use Flask OCR service
    const ocrResult = await extractWithOCR(fileBuffer, filename, platform);
    
    if (ocrResult.success) {
      console.log('OCR extraction successful');
      return ocrResult;
    }
    
    console.log('Both extraction methods failed');
    return {
      success: false,
      error: 'Failed to extract certificate information using both AI and OCR methods. Please fill the form manually.',
      extracted: null
    };

  } catch (error) {
    console.error('Certificate extraction error:', error.message);
    return {
      success: false,
      error: 'Failed to extract certificate information. Please fill the form manually.',
      extracted: null
    };
  }
}

/**
 * Extract credential information using AI service (Google Gemini)
 * @param {Buffer} fileBuffer - Image file buffer
 * @returns {Promise<Object>} Extracted credential data
 */
async function extractWithAI(fileBuffer) {
  try {
    // Convert buffer to base64
    const base64Image = fileBuffer.toString('base64');
    
    // Call AI service
    const aiResponse = await generateDetails(base64Image);
    
    // Check if AI returned an error message
    if (typeof aiResponse === 'string' && aiResponse.includes('not my expertise')) {
      return {
        success: false,
        error: 'This does not appear to be an educational certificate.',
        extracted: null
      };
    }
    
    // Parse AI response (should be JSON)
    let parsedData;
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', aiResponse);
      return {
        success: false,
        error: 'AI service returned invalid data format.',
        extracted: null
      };
    }
    
    // Validate and normalize AI extracted data
    const extracted = {
      title: parsedData.title || '',
      issuer: parsedData.issuer || '',
      issueDate: parsedData.issueDate || '',
      description: parsedData.description || '',
      credentialId: parsedData.credentialId || '',
      skills: parsedData.skills || [],
      nsqfLevel: parsedData.nsqfLevel ? parseInt(parsedData.nsqfLevel) : null,
      skillDomain: parsedData.skillDomain || '',
      creditPoints: parsedData.creditPoints ? parseInt(parsedData.creditPoints) : null,
      estimatedDuration: parsedData.estimatedDuration || '',
      type: 'certificate',
      status: 'pending'
    };
    
    return {
      success: true,
      extracted: extracted,
      extractionMethod: 'AI'
    };
    
  } catch (error) {
    console.error('AI extraction error:', error.message);
    return {
      success: false,
      error: 'AI extraction failed.',
      extracted: null
    };
  }
}

/**
 * Extract credential information using Flask OCR service (fallback)
 * @param {Buffer} fileBuffer - Image file buffer
 * @param {string} filename - Original filename
 * @param {string} platform - Platform hint for extraction rules (optional)
 * @returns {Promise<Object>} Extracted credential data
 */
async function extractWithOCR(fileBuffer, filename, platform) {
  try {
    // Create form data for the Flask API
    const formData = new FormData();
    formData.append('certificateFile', fileBuffer, {
      filename: filename,
      contentType: 'image/jpeg' // Default, Flask should handle various image types
    });
    
    // Add platform hint if provided
    if (platform) {
      formData.append('platform', platform);
    }

    // Call the Flask extraction API
    const response = await axios.post(`${EXTRACTION_API_URL}/extract`, formData, {
      headers: {
        ...formData.getHeaders(),
      },
      timeout: 30000, // 30 second timeout for OCR processing
    });

    const extractedData = response.data;

    // Validate extracted data structure
    if (!extractedData || typeof extractedData !== 'object') {
      throw new Error('Invalid response from extraction service');
    }

    // Check if extraction was successful
    if (!extractedData.success) {
      throw new Error(extractedData.message || 'Extraction failed');
    }

    // Get the actual extracted fields from the nested object
    const extracted = extractedData.extracted || {};

    // Return standardized extracted data
    return {
      success: true,
      extracted: {
        title: extracted.title || '',
        issuer: extracted.issuer || '',
        issueDate: extracted.issueDate || '',
        name: extracted.name || '', // Student name for verification
        type: extracted.type || 'certificate', // Use extracted type or default
        status: extracted.status || 'pending', // Use extracted status or default
        description: '',
        skills: [],
        nsqfLevel: null,
        skillDomain: '',
        creditPoints: null
      },
      extractionMethod: 'OCR'
    };

  } catch (error) {
    console.error('OCR extraction error:', error.message);
    
    // Handle different error types
    if (error.code === 'ECONNREFUSED') {
      return {
        success: false,
        error: 'OCR extraction service is not available.',
        extracted: null
      };
    }

    if (error.response?.status === 400) {
      return {
        success: false,
        error: 'Invalid image file for OCR processing.',
        extracted: null
      };
    }

    return {
      success: false,
      error: 'OCR extraction failed.',
      extracted: null
    };
  }
}

/**
 * Check if extraction service is available
 * @returns {Promise<boolean>} Service availability status
 */
async function isExtractionServiceAvailable() {
  try {
    const response = await axios.get(`${EXTRACTION_API_URL}/`, { timeout: 5000 });
    return response.status === 200;
  } catch (error) {
    console.warn('Extraction service health check failed:', error.message);
    return false;
  }
}

module.exports = {
  extractCredentialInfo,
  isExtractionServiceAvailable
};