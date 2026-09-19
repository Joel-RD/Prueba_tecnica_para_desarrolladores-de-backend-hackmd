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

const getTokenFromRequest = (req: Request): string | null => {
    const cookieToken = req.cookies?.access_token;
    if (cookieToken) return cookieToken;

    const authorization = req.headers.authorization;
    if (authorization?.startsWith('Bearer ')) {
        return authorization.slice('Bearer '.length).trim() || null;
    }

    return null;
};

export const validationToken = (req: Request, res: Response, next: NextFunction): void => {
    try {
        const token = getTokenFromRequest(req);
        if (!token) {
            res.status(401).json({ message: 'No se proporcionó un token de acceso válido.' });
            return;
        }

        const decode = jwt.verify(token, SECRET_ACCESS_TOKEN);
        req.session = decode;
        res.locals.user = decode;

        next();
    } catch (error) {
        console.log(error);
        res.status(401).json({ message: 'Token de acceso inválido o expirado.' });
    }
}