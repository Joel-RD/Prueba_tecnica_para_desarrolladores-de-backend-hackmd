import { NextFunction, Request, Response } from 'express';
import { config } from '../../config.js';
import jwt from 'jsonwebtoken';

const { SECRET_ACCESS_TOKEN } = config();

// Extend the Request interface to include the 'session' property
declare global {
    namespace Express {
        interface Request {
            session?: any;
        }
    }
}

export const validationToken = (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const token = req.cookies.access_token;
        if (!token) {
            res.status(401).json({ message: 'Not token access valid...' });
            return;
        };
        const decode = jwt.verify(token, SECRET_ACCESS_TOKEN)
        req.session = decode;
        res.locals.user = decode;

        next()
    } catch (error) {
        console.log(error);
    }
}
