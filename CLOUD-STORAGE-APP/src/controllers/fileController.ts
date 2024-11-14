import express, { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import constants from '../common/constants';
import { sendEmail } from './emailController';
import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

// MongoDB connection setup using mongoose
const DB_URL = process.env.DB_URL as string;
if (!DB_URL) {
    throw new Error('DB_URL environment variable is not set');
}

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,

} as ConnectOptions)
    .then(() => console.log('MongoDB connected'))
    .catch(error => console.error('MongoDB connection error:', error));
const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({
            succeed: false,
            code: 503,
            status: 'Service Unavailable',
            message: 'Database not connected. Please try again later.',
        });
    }
    next();
};

app.use(checkDbConnection);


interface IFile extends mongoose.Document {
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadDate: Date;
    userId: string;
    s3Url: string;
}

const fileSchema = new mongoose.Schema<IFile>({
    id: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadDate: { type: Date, default: Date.now },
    userId: { type: String, required: true },
    s3Url: { type: String, required: true },
});

const File = mongoose.models.File || mongoose.model<IFile>('File', fileSchema);

const s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_BUCKET_REGION,
});

export const uploadFile = async (req: Request, res: Response) => {
    // #swagger.tags = ['File']
    // #swagger.summary = 'Upload File.'
    // #swagger.description = 'This endpoint is used to Upload the file.'
    try {
        if (!req.file) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'No file uploaded.',
            });
        }

        const file = req.file;
        const fileId = uuidv4();
        const userId = req.body.user_id;

        const s3Params = {
            Bucket: BUCKET_NAME,
            Key: `${fileId}-${file.originalname}`,
            Body: file.buffer,
            ContentType: file.mimetype,
        };

        const s3Upload = await s3.upload(s3Params).promise();

        const fileMetadata = new File({
            id: fileId,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            uploadDate: new Date(),
            userId,
            s3Url: s3Upload.Location,
        });

        await fileMetadata.save();

        // Check for user in MongoDB collection
        const user = await mongoose.connection.db.collection('users').findOne({ user_id: userId });
        if (user) {
            const email = user.email_address;
            const subject = 'File Upload Notification';
            const message = `Hello, your file "${file.originalname}" has been successfully uploaded. View it here: ${s3Upload.Location}`;

            try {
                await sendEmail(email, subject, message);
            } catch (emailError) {
                return res.status(500).json({
                    succeed: false,
                    code: 500,
                    status: 'Error sending email.',
                    message: emailError.message,
                });
            }
        } else {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: 'User not found.',
                message: 'The user associated with the file upload was not found.',
            });
        }

        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'File uploaded successfully.',
            data: { fileId, s3Url: s3Upload.Location },
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error.',
            message: error.message || 'Error processing the file.',
        });
    }
};

export const downloadFile = async (req: Request, res: Response) => {
    // #swagger.tags = ['File']
    // #swagger.summary = 'Download File.'
    // #swagger.description = 'This endpoint is used to Download the file.'

    const { fileId } = req.params;
    const USE_S3 = process.env.USE_S3 === 'true';
    const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

    try {
        const db = mongoose.connection.db;
        const fileMetadata = await db.collection('files').findOne({ id: fileId });

        if (!fileMetadata) {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'File not found.',
            });
        }

        if (USE_S3) {
            const s3 = new AWS.S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
                region: process.env.AWS_BUCKET_REGION,
            });

            const s3Params = {
                Bucket: BUCKET_NAME,
                Key: `${fileId}-${fileMetadata.originalName}`,
            };

            const fileStream = s3.getObject(s3Params).createReadStream();

            res.setHeader('Content-Disposition', `attachment; filename="${fileMetadata.originalName}"`);
            res.setHeader('Content-Type', fileMetadata.mimeType);

            res.status(200);

            fileStream.pipe(res);

            fileStream.on('error', (error) => {
                return res.status(500).json({
                    succeed: false,
                    code: 500,
                    status: constants.API_CODE.API_500,
                    message: error.message || 'Error retrieving file from S3.',
                });
            });

        } else {
            const localPath = `path/to/local/storage/${fileId}-${fileMetadata.originalName}`;
            return res.download(localPath, fileMetadata.originalName, (err) => {
                if (err) {
                    res.status(500).json({
                        succeed: false,
                        code: 500,
                        status: constants.API_CODE.API_500,
                        message: err.message || 'Error retrieving file from local storage.',
                    });
                } else {
                    res.status(200).json({
                        succeed: true,
                        code: 200,
                        status: constants.API_RESPONSE.API_SUCCESS_DATA,
                        message: 'File downloaded successfully.',
                    });
                }
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: constants.API_CODE.API_500,
            message: error.message || 'Internal Server Error.',
        });
    }
};
