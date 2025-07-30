// backend/api/utils/cloudflareR2.js

require('dotenv').config();
const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');

// --- S3 Client Configuration for Cloudflare R2 ---
// This client uses the API ENDPOINT to send commands.
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    },
});

// eafhuxjkcjchanges

const BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL; // <-- Uses the new variable from .env

if (!R2_PUBLIC_URL) {
    throw new Error("R2_PUBLIC_URL is not defined in the .env file. Please add it.");
}


/**
 * Uploads a file buffer from multer to Cloudflare R2.
 * @returns {Promise<string>} The full public URL of the uploaded file.
 */
const uploadFileToR2 = async (file, destinationFolder, fileName) => {
    if (!file) throw new Error('No file provided for upload.');

    const key = `${destinationFolder}/${fileName}`; // e.g., 'products/P_001.png'

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
    });

    try {
        await s3Client.send(command);
        console.log(`✅ Successfully uploaded ${key} to R2 bucket.`);
        // --- THIS IS THE CRITICAL PART ---
        // It now correctly constructs the public URL for the browser.
        return `${R2_PUBLIC_URL}/${key}`; 
    } catch (error) {
        console.error(`❌ Failed to upload ${key} to R2.`, error);
        throw error;
    }
};

/**
 * Deletes a file from Cloudflare R2 using its full public URL.
 */
const deleteFileFromR2 = async (fileUrl) => {
    if (!fileUrl || !fileUrl.startsWith('http')) {
        console.warn('⚠️ deleteFileFromR2 called with invalid or empty URL.');
        return;
    }

    try {
        // This logic correctly extracts the key from the full public URL.
        const key = new URL(fileUrl).pathname.substring(1);

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });

        await s3Client.send(command);
        console.log(`✅ Successfully deleted ${key} from R2 bucket.`);
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            console.warn(`⚠️ File not found in R2 for deletion: ${fileUrl}`);
        } else {
            console.error(`❌ Failed to delete ${fileUrl} from R2.`, error);
        }
    }
};

module.exports = {
    uploadFileToR2,
    deleteFileFromR2
};