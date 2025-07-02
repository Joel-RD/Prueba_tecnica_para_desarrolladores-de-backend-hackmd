import pg from "pg";
import { config } from "../../config.js";

const { Pool } = pg;
const { DB_CONECCTION, STATUS_DB } = config();

const dbConnect = async () => {
    try {
        console.log(STATUS_DB);
        return new Pool({
            connectionString: DB_CONECCTION
        })
    } catch (error) {
        console.log(error);
    }
};

const pool = await dbConnect();

export const Query = async (sql?: string, params?: unknown[]) => {
    try {
        const results = pool.query(sql, params);
        return await results;
    } catch (error) {
        console.log(error);
    };
};
