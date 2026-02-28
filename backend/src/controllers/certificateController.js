const axios = require('axios');
const cheerio = require('cheerio');
const { uploadFile } = require('../services/storageService');
const { generateDetails } = require('../services/aiService');

function pickImageFromHtml($) {
  const og = $('meta[property="og:image"]').attr('content');
  const tw = $('meta[name="twitter:image"]').attr('content');
  let inline = null;
  $('img').each((_, el) => {
    const src = $(el).attr('src') || '';
    if (!inline && /certificate|accomplish|share|verify|coursera/i.test(src)) inline = src;
  });
  // JSON-LD image
  let jsonLdImage = null;
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const json = JSON.parse($(el).contents().text().trim());
      const arr = Array.isArray(json) ? json : [json];
      for (const node of arr) {
        if (node && node.image) {
          jsonLdImage = typeof node.image === 'string' ? node.image : node.image.url;
          if (jsonLdImage) break;
        }
      }
    } catch {}
  });
  return jsonLdImage || og || tw || inline || null;
}

// POST /api/certificates/import-url
async function importCertificateFromUrl(req, res) {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json({ success: false, message: 'Certificate URL is required' });
    if (!/^https?:\/\/(www\.)?coursera\.org\/share\/[A-Za-z0-9]+/.test(url)) {
      return res.status(400).json({ success: false, message: 'Only Coursera certificate share URLs are supported currently' });
    }

    // Fetch share page
    const htmlResp = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      timeout: 15000,
      maxRedirects: 3,
      validateStatus: s => s >= 200 && s < 400,
    });
    const $ = cheerio.load(htmlResp.data);
    const imgUrl = pickImageFromHtml($);
    if (!imgUrl) return res.status(422).json({ success: false, message: 'Could not locate certificate image on the page' });
    const resolvedImageUrl = new URL(imgUrl, url).toString();

    // Download image
    const imgResp = await axios.get(resolvedImageUrl, { responseType: 'arraybuffer', timeout: 20000 });
    const imgBuffer = Buffer.from(imgResp.data);

    // Upload to ImageKit (optional if configured)
    let uploaded = null;
    try {
      uploaded = await uploadFile(imgBuffer, `coursera_certificate_${Date.now()}.png`);
    } catch (e) {
      console.warn('Image upload skipped/failed:', e.message);
    }

    // Use AI service to extract certificate details
    let extractedData = {};
    try {
      console.log('Calling AI service to analyze certificate from URL...');
      const base64Image = imgBuffer.toString('base64');
      const aiResponse = await generateDetails(base64Image);
      console.log('AI Response received:', aiResponse);

      // Parse AI response
      let cleanResponse = aiResponse.trim();
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }
      extractedData = JSON.parse(cleanResponse);
    } catch (e) {
      console.error('AI extraction failed:', e);
      extractedData = {};
    }

    const data = {
      platform: 'Coursera',
      originalUrl: url,
      storedImageUrl: uploaded?.url || null,
      title: extractedData.title || '',
      issuer: extractedData.issuer || '',
      nsqfLevel: extractedData.nsqfLevel || null,
      completionDate: extractedData.issueDate || null,
      credentialId: extractedData.credentialId || '',
      description: extractedData.description || '',
      creditPoints: extractedData.creditPoints || null,
      aiExtracted: true,
    };

    // Validate credential ID before returning success
    if (data.credentialId === 'ID_NOT_FOUND' || !data.credentialId || data.credentialId.trim() === '') {
      return res.status(400).json({ 
        success: false, 
        error: 'CREDENTIAL_ID_NOT_FOUND',
        message: 'Certificate ID not visible or available in this certificate. Please use a certificate with a clearly visible ID number.' 
      });
    }

    return res.json({ success: true, data, message: 'Certificate downloaded and analyzed with AI' });
  } catch (err) {
    console.error('Certificate import error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Failed to import certificate' });
  }
}

// POST /api/certificates/analyze-image
async function analyzeCertificateImage(req, res) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ 
        success: false, 
        message: 'No image file uploaded. Please upload a certificate image.' 
      });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid file type. Please upload a JPEG, PNG, or WebP image.' 
      });
    }

    // Convert buffer to base64
    const base64Image = req.file.buffer.toString('base64');

    // Call AI service to analyze the certificate
    console.log('Calling AI service to analyze certificate...');
    const aiResponse = await generateDetails(base64Image);
    console.log('AI Response received:', aiResponse);

    // Try to parse JSON response from AI
    let extractedData;
    try {
      // Check if response is the "not my expertise" message
      if (aiResponse.includes("Sorry, this is not my expertise")) {
        return res.status(400).json({
          success: false,
          message: "This image doesn't appear to be an educational certificate. Please upload a valid certificate image."
        });
      }

      // Clean the response - remove any markdown formatting or extra text
      let cleanResponse = aiResponse.trim();
      
      // If response contains JSON within backticks, extract it
      const jsonMatch = cleanResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[1];
      }
      
      // If response starts with text before JSON, try to extract JSON
      const jsonStart = cleanResponse.indexOf('{');
      const jsonEnd = cleanResponse.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleanResponse = cleanResponse.substring(jsonStart, jsonEnd + 1);
      }

      // Try to parse JSON response
      extractedData = JSON.parse(cleanResponse);
      
      // Validate that required fields exist
      if (!extractedData || typeof extractedData !== 'object') {
        throw new Error('Invalid data structure');
      }

    } catch (parseError) {
      console.error('AI Response parsing error:', parseError);
      console.error('Raw AI Response:', aiResponse);
      
      // If JSON parsing fails, return a more helpful error with the raw response
      return res.status(500).json({
        success: false,
        message: "AI service returned an invalid response format. Please try again or contact support.",
        error: parseError.message,
        rawResponse: aiResponse.substring(0, 500) // Limit raw response length
      });
    }

    // Return successful response with extracted data
    return res.json({
      success: true,
      data: extractedData,
      message: "Certificate analyzed successfully"
    });

  } catch (error) {
    console.error('Certificate analysis error:', error);
    
    // Handle specific API errors
    if (error.status === 503) {
      return res.status(503).json({
        success: false,
        message: "AI service is temporarily unavailable. Please try again in a few minutes.",
        code: "SERVICE_UNAVAILABLE"
      });
    } else if (error.status === 429) {
      return res.status(429).json({
        success: false,
        message: "Too many requests. Please wait a moment and try again.",
        code: "RATE_LIMITED"
      });
    } else if (error.status === 401 || error.status === 403) {
      return res.status(500).json({
        success: false,
        message: "AI service authentication error. Please contact support.",
        code: "AUTH_ERROR"
      });
    }
    
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze certificate',
      code: "UNKNOWN_ERROR"
    });
  }
}

module.exports = { importCertificateFromUrl, analyzeCertificateImage };
