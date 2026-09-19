import { Query } from '../models/db.js'
import { hashGenerator, comparePassword } from '../utils/encrypt.js'
import { Request, Response, NextFunction } from 'express'
import { validateSignup, validateLogin, validateUpdate, UPDATABLE_FIELDS } from '../utils/validators.js'
import jwt from 'jsonwebtoken'
import { config } from '../../config.js'

const { SECRET_ACCESS_TOKEN, IS_PRODUCTION } = config();

interface UserRow {
    id: number;
    first_name: string;
    last_name: string;
    date_birth: string | Date;
    address: string;
    password: string;
    mobile_phone: string;
    email: string;
    token?: string | null;
}

export interface PublicUser {
    id: number;
    first_name: string;
    last_name: string;
    date_birth: string | null;
    mobile_phone: string;
    email: string;
    address: string;
}

const toDateString = (value: string | Date | null): string | null => {
    if (!value) return null;
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return null;
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const toPublicUser = (user: UserRow): PublicUser => ({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    date_birth: toDateString(user.date_birth),
    mobile_phone: user.mobile_phone,
    email: user.email,
    address: user.address
});

const getToken = (result: { rows: UserRow[] }): string => {
    const user = result.rows[0];
    const token = jwt.sign({ userName: user.first_name, userEmail: user.email, mobilePhone: user.mobile_phone }, SECRET_ACCESS_TOKEN, {
        expiresIn: "24h"
    });

    return token
}

export const createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = (req.body ?? {}) as Record<string, unknown>;
        const validation = validateSignup(body);

        if (!validation.valid) {
            res.status(400).json({ message: 'Envie todos los parámetros solicitados correctamente.', errors: validation.errors });
            return
        };

        const { first_name, last_name, date_birth, mobile_phone, email, password, address } = body as Record<string, string>;

        const existeUsuario = 'Select * from users where email = $1;';
        const result = await Query<UserRow>(existeUsuario, [email]);

        if ((result.rowCount ?? 0) !== 0) {
            res.status(409).json({ message: 'Ya existe un usuario registrado con ese email.' });
            return
        };

        const hashpassword = await hashGenerator(password);

        const insertUser = "Insert into users (first_name, last_name, date_birth, address, password, mobile_phone, email) values ($1, $2, $3, $4, $5, $6, $7) RETURNING *;"
        const resultInsert = await Query<UserRow>(insertUser, [first_name, last_name, date_birth, address, hashpassword, mobile_phone, email]);

        const createdUser = toPublicUser(resultInsert.rows[0]);
        res.status(201).json({ message: 'Usuario creado exitosamente.', user: createdUser });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const loging = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const body = (req.body ?? {}) as Record<string, unknown>;
        const validation = validateLogin(body);

        if (!validation.valid) {
            res.status(400).json({ message: 'Los parámetros solicitados no han sido enviados correctamente.', errors: validation.errors });
            return;
        }

        const mobile_phone = String(body.mobile_phone).trim();
        const password = String(body.password);

        const sql = 'Select * from users where mobile_phone = $1;';
        const result = await Query<UserRow>(sql, [mobile_phone]);

        if ((result.rowCount ?? 0) === 0) {
            res.status(400).json({ message: 'Usuario no encontrado.' });
            return;
        }

        const user = result.rows[0];

        if (!(await comparePassword(password, user.password))) {
            res.status(400).json({ message: 'Contraseña incorrecta, intentalo nuevamente.' });
            return;
        }

        const token = getToken(result);

        const sqlUpdate = 'Update users set token = $1 where mobile_phone = $2;';
        await Query(sqlUpdate, [token, mobile_phone]);

        res.status(200)
            .cookie('access_token', token, {
                httpOnly: true,
                sameSite: 'strict',
                secure: IS_PRODUCTION,
                maxAge: 1000 * 60 * 60 * 24
            })
            .json({
                user: {
                    ...toPublicUser(user),
                    session_active: true,
                },
                accesss_token: token,
                token_type: 'bearer'
            });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getUsers = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const result = await Query<UserRow>('Select * from users;');

        if ((result.rowCount ?? 0) === 0) {
            res.status(400).json({ message: 'Upps, aun no hay registros de usuarios.' });
            return;
        }

        const userProcess = result.rows.map(user => ({
            ...toPublicUser(user),
            city_id: null as number | null,
            session_active: true,
        }));

        res.status(200).json({ getAllUsers: userProcess });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const getUsersById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id) || !req.params.id) {
            res.status(400).json({ message: 'Upps, el parámetro solicitado no ha sido enviado correctamente.' });
            return;
        }

        const result = await Query<UserRow>('select * from users where id = $1;', [id]);

        if ((result.rowCount ?? 0) === 0) {
            res.status(404).json({ message: 'Upps, no se encontraron registros de usuarios.' });
            return;
        }

        res.status(200).json({
            ...toPublicUser(result.rows[0]),
            document_type_id: null,
            document_number: null,
            city_id: null,
            session_active: true,
        });
    } catch (error) {
        console.log(error);
        next(error);
    }
};

export const updateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: 'El parámetro ID es requerido.' });
            return;
        }

        const body = (req.body ?? {}) as Record<string, unknown>;
        const validation = validateUpdate(body);

        if (!validation.valid) {
            res.status(400).json({ message: 'No se enviaron campos válidos para actualizar.', errors: validation.errors });
            return;
        }

        const updates: string[] = [];
        const values: (string | number)[] = [];
        let index = 1;

        for (const field of UPDATABLE_FIELDS) {
            if (body[field] === undefined) continue;

            let value = body[field] as string | number;

            if (field === 'password') {
                value = await hashGenerator(String(value));
            }

            updates.push(`${field} = $${index}`);
            values.push(value);
            index++;
        }

        if (updates.length === 0) {
            res.status(400).json({ message: 'No se enviaron campos válidos para actualizar.' });
            return;
        }

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING *;`;
        values.push(Number(id));

        const result = await Query<UserRow>(sql, values);

        if ((result.rowCount ?? 0) === 0) {
            res.status(404).json({ message: 'Usuario no encontrado o sin cambios.' });
            return
        }

        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: toPublicUser(result.rows[0]) });
    } catch (error) {
        console.log(error);
        next(error);
    }
}

export const deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: 'Proporcione el id necesario.' });
            return;
        }

        const verifyUser = 'Select * from users where id = $1;';
        const result = await Query<UserRow>(verifyUser, [Number(id)]);

        if ((result.rowCount ?? 0) === 0) {
            res.status(404).json({ message: 'Uppds el usuario no existe, intentelo nuevamente.' });
            return;
        }

        const deleteUserQuery = 'Delete from users where id = $1 RETURNING *;';
        const resultDelete = await Query<UserRow>(deleteUserQuery, [Number(id)]);

        if ((resultDelete.rowCount ?? 0) === 0) {
            res.status(404).json({ message: 'El usuario ya no existe.' });
            return;
        }

        res.status(200).json({ message: 'Usuario eliminado', user: toPublicUser(resultDelete.rows[0]) })
    } catch (error) {
        console.log(error);
        next(error);
    }
}