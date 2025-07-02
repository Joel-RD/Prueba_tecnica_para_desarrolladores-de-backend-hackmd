import { Query } from '../models/db.js'
import { hashGenerator, comparePassword } from '../utils/encrypt.js'
import { Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { config } from '../../config.js'

const { SECRET_ACCESS_TOKEN } = config();

interface userRow {
    first_name: string;
    email: string;
    mobile_phone: string;
    city_id?: number | null;
};

interface Result {
    rows: userRow[]
}

interface TemplateUser {
    first_name: null | string,
    last_name: null | string,
    date_birth: null | string,
    addres: null | string,
    password: null | string,
    mobile_phone: null | number,
    email: null | string
}

const getToken = (result: Result) => {
    const token = jwt.sign({ userName: result.rows[0].first_name, userEmail: result.rows[0].email, mobilePhone: result.rows[0].mobile_phone }, SECRET_ACCESS_TOKEN, {
        expiresIn: "24h"
    });

    return token
}

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { first_name, last_name, date_birth, mobile_phone, email, password, address } = req.body;

        if (!first_name || !last_name || !date_birth || !mobile_phone || !email || !password || !address) {
            res.status(400).json('Envie todos los parmetros solicitados');
            return
        };

        const existeUsuario = 'Select * from users where email = $1;';
        const existeUsuarioParmaetro = [email];
        const result = await Query(existeUsuario, existeUsuarioParmaetro);

        if (result.rowCount !== 0) {
            res.status(409).json({
                id: result.rows[0].id,
                first_name: result.rows[0].first_name,
                last_name: result.rows[0].last_name,
                date_birth: result.rows[0].date_birth,
                mobile_phone: result.rows[0].mobile_phone,
                email: result.rows[0].email,
                password: result.rows[0].password,
                address: result.rows[0].addres
            })
            return
        };

        const hashpassword = await hashGenerator(password);

        const insertUser = "Insert into users (first_name, last_name, date_birth, addres, password, mobile_phone, email) values ($1, $2, $3, $4, $5, $6, $7) RETURNING *;"
        const inserParametros = [first_name, last_name, date_birth, address, hashpassword, mobile_phone, email];
        const resultInser = await Query(insertUser, inserParametros);

        res.status(201).json({
            id: resultInser.rows[0].id,
            first_name: resultInser.rows[0].first_name,
            last_name: resultInser.rows[0].last_name,
            date_birth: resultInser.rows[0].date_birth,
            mobile_phone: resultInser.rows[0].mobile_phone,
            email: resultInser.rows[0].email,
            password: resultInser.rows[0].password,
            address: resultInser.rows[0].address
        });
    } catch (error) {
        console.log(error);
        res.status(500).json('Ah ocurrido un error interno, intentenlo nuevamente en unos momentos...');
    }
};

export const loging = async (req: Request, res: Response): Promise<void> => {
    try {
        const { mobile_phone, password } = req.body;

        if (!mobile_phone && !password) {
            res.status(400).json('Uppds los parametros solicitados no an sido enviados');
            return;
        }

        const newPassword = String(password);

        const sql = 'Select * from users where mobile_phone = $1;';
        const params = [mobile_phone];

        const result = await Query(sql, params);

        if (result.rowCount === 0) {
            res.status(400).send("Usuario no encontrado.");
            return;
        }

        const oldPassword = result.rows[0].password;

        if (!(await comparePassword(newPassword, oldPassword))) {
            res.status(400).json("Contraseña incorrecta, intentalo nuevamente.");
            return;
        }

        const token = getToken(result);

        const sqlUpdate = 'Update users set token = $1 where mobile_phone = $2;';
        const paramsUpdate = [token, mobile_phone];
        await Query(sqlUpdate, paramsUpdate);

        res.status(200).cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 1000 * 60 * 60 * 24
        }).json({
            user: {
                id: result.rows[0].id,
                first_name: result.rows[0].first_name,
                last_name: result.rows[0].last_name,
                session_active: true,
                date_birth: result.rows[0].date_birth,
                email: result.rows[0].email,
                mobile_phone: result.rows[0].mobile_phone,
                password: result.rows[0].password,
                address: result.rows[0].address
            },
            accesss_token: token,
            token_type: 'bearer'
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Ah ocurrido un error interno, intentenlo nuevamente en unos momentos...' });
    }
};


export const getUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const sql = 'Select * from users;';
        const result = await Query(sql);

        if (result.rowCount === 0) {
            res.status(400).json("Upps, aun no hay registros de usuarios.");
            return;
        }

        const userProcess = result.rows.map(user => ({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            date_birth: user.date_birth,
            mobile_phone: user.mobile_phone,
            email: user.email,
            city_id: null as number | null,
            session_active: true,
        }));

        res.status(200).json({ getAllUsers: [...userProcess, ...userProcess, ...userProcess, ...userProcess] });
    } catch (error) {
        res.status(500).json({ message: 'Ah ocurrido un error interno, intentenlo nuevamente en unos momentos...' });
        console.log(error);
    }
};

export const getUsersById = async (req: Request, res: Response): Promise<void> => {
    try {
        const id = Number(req.params.id);

        if (isNaN(id)) {
            res.status(400).json('Upps, el parámetro solicitado no ha sido enviado correctamente');
            return;
        }

        const sql = 'select * from users where id = $1;';
        const params = [id];
        const result = await Query(sql, params);

        if (result.rowCount === 0) {
            res.status(400).json("Upps, aun no hay registros de usuarios");
            return;
        }

        res.status(200).json({
            id: result.rows[0].id,
            document_type_id: null,
            document_number: null,
            first_name: result.rows[0].first_name,
            last_name: result.rows[0].last_name,
            date_birth: result.rows[0].date_birth,
            mobile_phone: result.rows[0].mobile_phone,
            email: result.rows[0].email,
            address: result.rows[0].address,
            city_id: null,
            session_active: true,
        });
    } catch (error) {
        res.status(500).json('Ah ocurrido un error interno, intentenlo nuevamente en unos momentos...');
        console.log(error);
    }
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const templateUser: TemplateUser = {
            first_name: null,
            last_name: null,
            date_birth: null,
            addres: null,
            password: null,
            mobile_phone: null,
            email: null
        };

        const updates: string[] = [];
        const values: any[] = [];
        let index = 1;

        Object.keys(req.body).forEach(key => {
            if (Object.keys(templateUser).includes(key)) {
                updates.push(`${key} = $${index}`);
                values.push(req.body[key]);
                index++;
            }
        });

        if (updates.length === 0) {
            res.status(400).json({ message: 'No se enviaron campos válidos para actualizar' });
            return;
        }

        const { id } = req.params;
        if (!id || isNaN(Number(id))) {
            res.status(400).json({ message: 'El parámetro ID es requerido.' });
            return;
        }

        const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = $${index} RETURNING *;`;

        values.push(id);

        const result = await Query(sql, values);
        if (result.rowCount === 0) {
            res.status(404).json({ message: "Usuario no encontrado o sin cambios" });
            return
        }

        const data = result.rows[0];
        res.status(200).json({
            first_name: data.first_name,
            last_name: data.last_name,
            date_birth: data.date_birth,
            mobile_phone: data.mobile_phone,
            email: data.email,
            password: data.password,
            address: data.addres
        });
    } catch (error) {
        res.status(500).json({ message: 'Uppds ah ocurrido un error, intentelo nuevamente.' });
        console.log(error);
    }
}

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json('Proporcione el id necesario');
        };

        const verifyUser = 'Select * from users where id = $1;';
        const paramsUser = [id];
        const result = await Query(verifyUser, paramsUser);

        if (result.rowCount === 0) {
            res.status(400).json('Uppds el usuario no existe, intentelo nuevamente')
        }

        const deleteUser = 'Delete from users where id = $1;';
        const deleteUserParams = [id];
        const resultDelete = await Query(deleteUser, deleteUserParams);

        res.status(200).json({ message: 'Usuario eliminado', user: resultDelete.rows[0] })
    } catch (error) {
        console.log(error);
        res.status(500).json('Uppds ah ocurrido un error , intentelo nuevamente')
    }
}
