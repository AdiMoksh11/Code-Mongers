const ImageKit = require("imagekit");

let imagekit = null;
const hasImageKitConfig = Boolean(
    process.env.IMAGEKIT_PUBLIC_KEY &&
    process.env.IMAGEKIT_PRIVATE_KEY &&
    process.env.IMAGEKIT_URL_ENDPOINT
);

if (hasImageKitConfig) {
    imagekit = new ImageKit({
        publicKey : process.env.IMAGEKIT_PUBLIC_KEY,
        privateKey : process.env.IMAGEKIT_PRIVATE_KEY,
        urlEndpoint : process.env.IMAGEKIT_URL_ENDPOINT
    });
} else {
    console.warn("ImageKit not configured: set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT in backend/.env");
}

async function uploadFile(file, filename, fileType = 'image') {
    try {
        if (!imagekit) {
            throw new Error('ImageKit not configured. Please set IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT');
        }
        console.log('Uploading file to ImageKit:', filename);
        console.log('File size:', file.length);
        console.log('File type:', fileType);
        console.log('ImageKit config check:', {
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY ? 'SET' : 'MISSING',
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY ? 'SET' : 'MISSING',
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT ? 'SET' : 'MISSING'
        });
        
        // Determine folder based on file type
        const folder = fileType === 'resume' ? 'credexa/resumes' : 'credexa';
        
        const response = await imagekit.upload({
            file: file,
            fileName: filename,
            folder: folder,
            // For non-image files, we still need to upload them but they won't be transformed
            useUniqueFileName: true
        });
        
        console.log('ImageKit upload successful:', response.url);
        return response;
    } catch (error) {
        console.error('ImageKit upload failed:', error);
        throw error;
    }
}

async function uploadResume(file, filename) {
    return uploadFile(file, filename, 'resume');
}

async function deleteFile(imageUrl) {
    try {
        if (!imageUrl) return;
        if (!imagekit) {
            console.warn('ImageKit not configured, skipping delete for URL:', imageUrl);
            return;
        }
        
        console.log('Attempting to delete ImageKit file:', imageUrl);
        
        // Extract the file path from the ImageKit URL
        // ImageKit URLs look like: https://ik.imagekit.io/yourEndpoint/folder/filename.ext
        const urlParts = new URL(imageUrl);
        const filePath = urlParts.pathname; // This gives us the full path like /credexa/filename.ext
        
        console.log('Extracted file path:', filePath);
        
        // List all files to find the one with matching URL
        const files = await imagekit.listFiles({
            path: "/credexa/"
        });
        
        console.log(`Found ${files.length} files in ImageKit credexa folder`);
        
        // Find the file that matches our URL
        const fileToDelete = files.find(file => {
            return file.url === imageUrl || file.filePath === filePath;
        });
        
        if (fileToDelete) {
            console.log('Found file to delete:', fileToDelete.fileId, fileToDelete.name);
            await imagekit.deleteFile(fileToDelete.fileId);
            console.log('ImageKit file deleted successfully:', fileToDelete.fileId);
        } else {
            console.log('File not found in ImageKit for URL:', imageUrl);
            console.log('Available files:', files.map(f => ({ id: f.fileId, name: f.name, url: f.url })));
        }
    } catch (error) {
        console.error('ImageKit delete failed:', error);
        // Don't throw error - we don't want credential deletion to fail if image deletion fails
    }
}

module.exports = {
    uploadFile,
    uploadResume,
    deleteFile
};
