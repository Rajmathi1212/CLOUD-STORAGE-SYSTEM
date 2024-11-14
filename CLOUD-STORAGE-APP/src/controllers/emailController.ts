import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { Request, Response, NextFunction } from 'express';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async (to: string, subject: string, message: string) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text: message,
    };

    try {
        if (!to || !subject || !message) {
            throw new Error('Missing required fields: to, subject, or message');
        }

        const info = await transporter.sendMail(mailOptions);

        if (info.accepted.length > 0) {
            console.log('E-mail sent successfully.');
        } else {
            throw new Error('Failed to send email.');
        }
    } catch (error) {
        console.error('Error sending email:', error);
        throw new Error(error instanceof Error ? error.message : 'Internal server error');
    }
};

//sendEmail endpoint
export const sendEmailHandler = async (req: Request, res: Response, next: NextFunction) => {
    // #swagger.tags = ['E-mail']
    // #swagger.summary = 'Email Handler.'
    // #swagger.description = 'This endpoint is used to Handle the E-mail.'
    const { to, subject, message } = req.body;

    try {
        if (!to || !subject || !message) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'Missing required fields: to, subject, or message',
            });
        }

        await sendEmail(to, subject, message);

        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'Email sent successfully.',
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Error sending email.',
            message: error.message || 'Internal server error',
        });
    }
};


