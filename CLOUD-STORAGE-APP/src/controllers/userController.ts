import constants from '../common/constants';
import express, { Request, Response } from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection setup
const DB_URL = process.env.DB_URL as string;
if (!DB_URL) {
    throw new Error('DB_URL environment variable is not set');
}

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    serverSelectionTimeoutMS: 30000,
} as ConnectOptions)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('MongoDB connection error:', error));

interface IUser extends mongoose.Document {
    user_id: string;
    user_name: string;
    first_name: string;
    last_name: string;
    email_address: string;
    mobile_number: string;
    password: string;
    gender: string;
    is_active: number;
    updated_on: Date;
}

const User = mongoose.model<IUser>('User', new mongoose.Schema<IUser>({
    user_id: { type: String, required: true },
    user_name: { type: String, required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    email_address: { type: String, required: true },
    mobile_number: { type: String, required: true },
    password: { type: String, required: true },
    gender: { type: String, required: true },
    is_active: { type: Number, default: 1 },
    updated_on: { type: Date, default: Date.now },
}));

const app = express();
app.use(express.json());

// Get all users endpoint
export const getAllUsers = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Get All the Users.'
    // #swagger.description = 'This endpoint is used to get all the users.'
    try {
        const users = await User.find({ is_active: 1 });

        if (users.length > 0) {
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: constants.API_RESPONSE.API_SUCCESS_DATA,
                data: users,
            });
        } else {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'Data not found.',
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

// Update users endpoint
export const updateUsers = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'Update Users'
    // #swagger.description = 'This endpoint is used to Update all the users.'
    try {
        const { user_id, user_name, first_name, last_name, email_address, mobile_number, gender } = req.body;
        if (!user_id) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: constants.API_CODE.API_400,
                message: 'User ID is required.',
            });
        }

        const updated_on = new Date();

        const updateData: any = {};
        if (user_name) updateData.user_name = user_name;
        if (first_name) updateData.first_name = first_name;
        if (last_name) updateData.last_name = last_name;
        if (email_address) updateData.email_address = email_address;
        if (mobile_number) updateData.mobile_number = mobile_number;
        if (gender) updateData.gender = gender;
        updateData.updated_on = updated_on;

        const result = await User.updateOne({ user_id }, { $set: updateData });

        if (result.modifiedCount > 0) {
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: constants.API_RESPONSE.API_UPDATED_DATA,
                data: result,
            });
        } else if (result.matchedCount === 0) {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'User not found.',
            });
        } else {
            return res.status(404).json({
                succeed: false,
                code: 404,
                status: constants.API_CODE.API_404,
                message: 'Data not updated, try after some time.',
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: constants.API_CODE.API_500,
            message: error.message || 'Internal server error',
        });
    }
};

