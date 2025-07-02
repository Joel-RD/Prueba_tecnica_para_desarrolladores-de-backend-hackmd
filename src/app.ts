import express from 'express';
import auth from './router/authRouter.js';
import crud from './router/crudRouter.js';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import {config} from "../config.js"
import cors from "cors";

const {DEPLOY_URL} = config();
const app = express();
 
const corsOptions = {
  origin: DEPLOY_URL,
}
app.set('trust proxy', true)
app.use(cors(corsOptions));

app.use(logger('dev'));
app.use(cookieParser())

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(auth, crud);

export default app;
