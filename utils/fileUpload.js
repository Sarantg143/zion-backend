const { v4: uuidv4 } = require('uuid');
const { bucket } = require('../firebase'); // Assuming you're using Firebase Admin SDK for storage
const ffmpeg = require('fluent-ffmpeg'); // Add this for calculating media duration
const path = require('path');

const SUPPORTED_FILE_FOLDERS = {
    video: 'videos',
    audio: 'audios',
    image: 'images',
    document: 'documents',
    pdf: 'documents',
    ppt: 'presentations',
};

// Helper function to calculate duration of video/audio files
const getMediaDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        ffmpeg(filePath)
            .ffprobe((err, metadata) => {
                if (err) {
                    return reject('Error retrieving media duration');
                }
                const duration = metadata.format.duration;
                resolve(duration);
            });
    });
};

// Upload file to Firebase Storage
const uploadFile = async (file) => {
    try {
        const fileType = file.mimetype.split('/')[0]; // Extract file type (e.g., "image/png" -> "image")
        const folder = SUPPORTED_FILE_FOLDERS[fileType];
        if (!folder) throw new Error(`Unsupported file type: ${file.mimetype}`);

        const fileName = `${uuidv4()}_${file.originalname || file.name}`;
        const filePath = `${folder}/${fileName}`;

        // Upload the file to Firebase Storage
        const fileRef = bucket.file(filePath);
        await fileRef.save(file.buffer || file);
        await fileRef.makePublic(); // Optionally make the file public

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

        let duration = null;
        // If the file is a video or audio, calculate the duration
        if (fileType === 'video' || fileType === 'audio') {
            const localFilePath = `/tmp/${fileName}`; // Use a temporary path to save the file locally
            await fileRef.download({ destination: localFilePath });

            try {
                duration = await getMediaDuration(localFilePath); // Get media duration
            } catch (err) {
                console.error('Error calculating media duration:', err);
            } finally {
                // Clean up temporary file if needed
                fs.unlinkSync(localFilePath);
            }
        }

        return {
            url: fileUrl,
            type: fileType,
            name: file.originalname || file.name,
            duration,
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        throw new Error('File upload failed');
    }
};

// Upload thumbnail to a specific folder
const uploadThumbnail = async (file) => {
    try {
        const fileName = `${uuidv4()}_${file.originalname || file.name}`;
        const filePath = `thumbnails/${fileName}`;

        // Upload thumbnail to Firebase Storage
        const fileRef = bucket.file(filePath);
        await fileRef.save(file.buffer || file);
        await fileRef.makePublic(); // Optionally make the thumbnail public

        const fileUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        return fileUrl;
    } catch (error) {
        console.error('Error uploading thumbnail:', error);
        throw new Error('Thumbnail upload failed');
    }
};

module.exports = { uploadFile, uploadThumbnail };
