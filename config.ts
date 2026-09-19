import dotenv from "dotenv";

dotenv.config();
const { DB_LOCAL, DB_CLOUD, NODE_ENV, RUN_SERVER, SECRET_TOKEN, APP_DONMAIN, APP_PROTOCOL, APP_UNIQUE_NAME } = process.env;

interface Config {
    DB_CONECCTION: string
    STATUS_DB: String
    PORT_SERVER: number
    SECRET_ACCESS_TOKEN: string,
    DEPLOY_URL: string
    IS_PRODUCTION: boolean
}

const validateEnv = (): void => {
    if (!SECRET_TOKEN) {
        throw new Error('[config] La variable de entorno SECRET_TOKEN es obligatoria. Revisa tu archivo .env');
    }
    if (!DB_LOCAL && NODE_ENV !== 'Production') {
        throw new Error('[config] La variable de entorno DB_LOCAL es obligatoria para entorno de desarrollo. Revisa tu archivo .env');
    }
    if (!DB_CLOUD && NODE_ENV === 'Production') {
        throw new Error('[config] La variable de entorno DB_CLOUD es obligatoria para entorno de producción. Revisa tu archivo .env');
    }
};

export const config = (): Config => {
    validateEnv();

    const isProduction = NODE_ENV === 'Production';

    return {
        DB_CONECCTION: isProduction ? DB_CLOUD as string : DB_LOCAL as string,
        STATUS_DB: isProduction ? 'Run on cloud db' : 'Run on local db',
        PORT_SERVER: Number(RUN_SERVER) || 3000,
        SECRET_ACCESS_TOKEN: SECRET_TOKEN as string,
        DEPLOY_URL: !isProduction ? `http://localhost:${RUN_SERVER || 3000}` : `${APP_PROTOCOL}${APP_UNIQUE_NAME}${APP_DONMAIN}`,
        IS_PRODUCTION: isProduction
    }
};