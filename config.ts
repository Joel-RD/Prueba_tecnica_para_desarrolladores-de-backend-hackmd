import dotenv from "dotenv";

dotenv.config();
const { DB_LOCAL, DB_CLOUD, NODE_ENV, RUN_SERVER, SECRET_TOKEN, APP_DONMAIN, APP_PROTOCOL, APP_UNIQUE_NAME } = process.env;

interface Config {
    DB_CONECCTION: string | undefined
    STATUS_DB: String
    PORT_SERVER: Number | string
    SECRET_ACCESS_TOKEN: string,
    DEPLOY_URL: string
}

export const config = (): Config => {
    return {
        DB_CONECCTION: NODE_ENV === 'Production' ? DB_CLOUD : DB_LOCAL,
        STATUS_DB: NODE_ENV === 'Production' ? 'Run on cloud db' : 'Run on local db',
        PORT_SERVER: RUN_SERVER || 3000,
        SECRET_ACCESS_TOKEN: SECRET_TOKEN,
        DEPLOY_URL: NODE_ENV !== "Production" ? `http://localhost:${RUN_SERVER}`:`${APP_PROTOCOL}${APP_UNIQUE_NAME}${APP_DONMAIN}`
    }
};
