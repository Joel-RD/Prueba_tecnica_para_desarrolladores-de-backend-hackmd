import express from 'express';
import auth from './router/authRouter.js';
import crud from './router/crudRouter.js';
import logger from 'morgan';
import cookieParser from 'cookie-parser';
import { config } from "../config.js"
import cors from "cors";

const { DEPLOY_URL } = config();
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

app.use((_req, res) => {
  res.status(404).json({ message: 'Ruta no encontrada.' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: 'Ah ocurrido un error interno, intentenlo nuevamente en unos momentos...' });
});

export default app;