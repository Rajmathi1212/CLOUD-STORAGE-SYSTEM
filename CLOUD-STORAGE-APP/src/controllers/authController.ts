import express, { Request, Response, NextFunction } from 'express';
import mongoose, { ConnectOptions } from 'mongoose';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { sendEmail } from './emailController';

dotenv.config();

const app = express();
app.use(express.json());

// MongoDB connection
const DB_URL = process.env.DB_URL as string;
if (!DB_URL) {
    throw new Error('DB_URL environment variable is not set');
}

mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    connectTimeoutMS: 30000,
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

interface IUser extends mongoose.Document {
    user_id: string;
    user_name: string;
    first_name: string;
    last_name: string;
    email_address: string;
    mobile_number: string;
    password: string;
    gender: string;
    created_on: String;
    is_active: number;
}

const userSchema = new mongoose.Schema<IUser>({
    user_id: String,
    user_name: String,
    first_name: String,
    last_name: String,
    email_address: String,
    mobile_number: String,
    password: String,
    gender: String,
    created_on: String,
    is_active: { type: Number, default: 1 }
});

const User = mongoose.models.User || mongoose.model('User', userSchema);

//Registration endpoint
export const userRegister = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'User Register'
    // #swagger.description = 'This endpoint is used to registering the user.'
    try {
        const { user_name, first_name, last_name, email_address, mobile_number, password, gender } = req.body;

        if (!user_name || !first_name || !last_name || !email_address || !mobile_number || !password || !gender) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'Bad Request',
                message: 'All fields are required.'
            });
        }

        const existingUser = await User.findOne({ user_name });
        if (existingUser) {
            return res.status(409).json({
                succeed: false,
                code: 409,
                status: 'Conflict',
                message: 'Username already exists.'
            });
        }

        const user_id = uuidv4();
        const hash_password = await bcrypt.hash(password, 10);
        const created_on = new Date();

        const user = new User({
            user_id,
            user_name,
            first_name,
            last_name,
            email_address,
            mobile_number,
            password: hash_password,
            gender,
            created_on
        });

        const result = await user.save();
        if (result) {
            await sendEmail(
                user.email_address,
                'Registration Successful',
                `Dear ${first_name},\n\nYour account has been successfully created with the username: ${user_name}.\n\nThank you!`
            );
            return res.status(200).json({
                succeed: true,
                code: 200,
                status: 'Registration successful',
                message: 'User registered successfully'
            });
        }
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Error processing registration.',
        });
    }
};
// Login endpoint
export const userLogin = async (req: Request, res: Response) => {
    // #swagger.tags = ['Users']
    // #swagger.summary = 'User Login'
    // #swagger.description = 'This endpoint is used to login the user.'
    try {
        const { user_name, password } = req.body;
        if (!user_name || !password) {
            return res.status(400).json({
                succeed: false,
                code: 400,
                status: 'Bad Request',
                message: 'Username and password are required.'
            });
        }

        const user = await User.findOne({ user_name, is_active: 1 });

        if (!user) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'User not found or inactive'
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                succeed: false,
                code: 401,
                status: 'Unauthorized',
                message: 'Invalid Password!'
            });
        }

        const jwtSecret = process.env.PASS_ENC_KEY as string;
        if (!jwtSecret) {
            return res.status(500).json({
                succeed: false,
                code: 500,
                status: 'Internal Server Error',
                message: 'JWT secret key is not set'
            });
        }

        const token = jwt.sign({
            user_id: user.user_id,
            user_name: user.user_name,
            first_name: user.first_name,
            last_name: user.last_name,
            email_address: user.email_address,
            mobile_number: user.mobile_number,
            gender: user.gender,
            created_on: user.created_on
        }, jwtSecret, { expiresIn: '360d' });

        return res.status(200).json({
            succeed: true,
            code: 200,
            status: 'Login Successful',
            message: 'User logged in successfully',
            token
        });
    } catch (error) {
        return res.status(500).json({
            succeed: false,
            code: 500,
            status: 'Internal Server Error',
            message: error instanceof Error ? error.message : 'Internal Server error!'
        });
    }
};