import express from 'express';
import { getAllUsers, updateUsers } from '../controllers/userController';


const router = express.Router();

router.get('/getAll', getAllUsers);
router.put('/update', updateUsers);

export { router as userRouter }