import express from 'express';
import { sendEmailHandler } from '../controllers/emailController'; // Adjust the path if necessary

const router = express.Router();

router.post('/send', sendEmailHandler);

export { router as emailRouter };
