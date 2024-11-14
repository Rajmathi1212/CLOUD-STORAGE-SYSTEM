import mongoose from 'mongoose';
import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import ENV from './env';

dotenv.config();

import { logger } from './libs/logger';
import swaggerUi from 'swagger-ui-express';
import swaggerDocument from './swagger_output.json';

import { userRouter } from './routes/userRoutes';
import { authRouter } from './routes/authRoutes';
import { fileRouter } from './routes/fileRoutes';
import { emailRouter } from './routes/emailRoutes';

const app = express();

const startServer = async () => {
  try {

    app.use(cors());
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());

    // Health check route
    app.get('/api/v1/health', (req: Request, res: Response) => {
      res.send('Server Running Healthy.');
    });

    app.get('/', (req: Request, res: Response) => {
      res.send(`
                <style>
                    * { transition: all 0.6s; }
                    html { block-size: 100%; }
                    body { font-family: 'Lato', sans-serif; color: #888; margin: 0; }
                    #main { display: table; inline-size: 100%; block-size: 100vh; text-align: center; }
                    .fof { display: table-cell; vertical-align: middle; }
                    .fof h1 { font-size: 50px; display: inline-block; padding-inline-end: 12px; animation: type .5s alternate infinite; }
                    @keyframes type { from { box-shadow: inset -3px 0px 0px #888; } to { box-shadow: inset -3px 0px 0px transparent; } }
                </style>
                <div id="main">
                    <div class="fof">
                            <h1 style="color: #8080ff">Cloud Storage App Running Healthy. <br> 200 Status</h1>
                    </div>
                </div>`);
    });
    const DB = process.env.DB_URL;
    console.log(DB, "db");
    const db = mongoose.connect(DB, {}).then((con) => {
      console.log(con.connections, db);
      console.log("connected successfuly");
    });


    app.use('/api/v1/email', emailRouter);
    app.use('/api/v1/files', fileRouter);
    app.use('/api/v1/users', userRouter);
    app.use('/api/v1/auth', authRouter);

    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

    app.listen(ENV.PORT, () => {
      logger(`Server is running on ${ENV.BASE_URL}`);
      console.log(`Swagger docs available at ${ENV.BASE_URL}/api-docs`);
    });
  } catch (error) {
    console.error('Error during MongoDB connection:', error);
    process.exit(1);
  }
};

startServer();
