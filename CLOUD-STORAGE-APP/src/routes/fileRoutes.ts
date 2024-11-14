import express from 'express';
import multer from 'multer';
import { downloadFile, uploadFile } from '../controllers/fileController';

const router = express.Router();
const MAX_FILE_SIZE = 100 * 1024 * 1024;

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: MAX_FILE_SIZE },
});


router.post('/upload-file', upload.single('file'), uploadFile);
router.get('/download/:fileId', downloadFile);


export { router as fileRouter };
