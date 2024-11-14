import express from 'express';
import { userLogin, userRegister } from '../controllers/authController';


const router = express.Router();

router.post('/register', userRegister);
router.post('/login', userLogin);

export { router as authRouter }


