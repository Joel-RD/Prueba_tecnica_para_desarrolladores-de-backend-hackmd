import pg from "pg";
import { config } from "../../config.js";

const { Pool } = pg;
const { DB_CONECCTION, STATUS_DB, IS_PRODUCTION } = config();

const dbConnect = async (): Promise<pg.Pool> => {
    try {
        console.log(STATUS_DB);
        return new Pool({
            connectionString: DB_CONECCTION,
            ssl: IS_PRODUCTION ? { rejectUnauthorized: false } : undefined
        });
    } catch (error) {
        console.log(error);
        throw error;
    }
};

const pool = await dbConnect();

export const Query = async <T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params?: (string | number)[]): Promise<pg.QueryResult<T>> => {
    return pool.query(sql, params) as Promise<pg.QueryResult<T>>;
};

export const closePool = async (): Promise<void> => {
    await pool.end();
};

export default pool;