# Documentación del Test Técnico Backend JR

## Descripción del Proyecto

Aplicación backend para gestionar datos de usuarios: autenticación, operaciones CRUD e interacción con PostgreSQL. Construido con **TypeScript**, **Express 5** y **PostgreSQL**.

## Estructura del Proyecto

```
config.ts
package.json
README.md
tsconfig.json
src/
    app.ts
    run.ts
    controller/
        auth.ts
    models/
        db.sql
        db.ts
    router/
        crudRouter.ts
        authRouter.ts
    utils/
        encrypt.ts
        validation.ts
        validators.ts
test/
    app.test.js
test_HTTP-client/
    postman_client/
    thumder_client/
```

### Archivos y Directorios Clave

- **config.ts**: Configuración de la aplicación (conexión a BD, puerto, secretos y validación de variables de entorno).
- **src/app.ts**: Punto de entrada de Express; configura middleware, rutas, manejo de 404 y error handler global.
- **src/run.ts**: Arranca el servidor en el puerto configurado.
- **src/controller/auth.ts**: Lógica de autenticación y operaciones CRUD.
- **src/models/db.ts**: Pool de conexiones a PostgreSQL y `Query` tipada que propaga errores.
- **src/models/db.sql**: Script SQL para crear la tabla `users` y un usuario de prueba.
- **src/router/authRouter.ts / crudRouter.ts**: Rutas de la API.
- **src/utils/encrypt.ts**: Hash y comparación de contraseñas con bcrypt.
- **src/utils/validation.ts**: Middleware de validación de tokens JWT (cookie o `Authorization: Bearer`).
- **src/utils/validators.ts**: Validación manual de entrada para `signup`, `login` y `update`.

## Funcionalidades

### Autenticación

- **Inicio de Sesión**: Valida `mobile_phone` + `password`, genera un token JWT (expira en 24h) y lo entrega en cookie `httpOnly` y en el cuerpo de la respuesta.
- **Validación de Token**: Middleware que acepta la cookie `access_token` o el header `Authorization: Bearer <token>`.

### Gestión de Usuarios

- **Crear Usuario**: Requiere token. Valida datos, hashea la contraseña y responde **sin incluir la contraseña**.
- **Leer Usuarios**: Lista todos los usuarios o uno por ID.
- **Actualizar Usuario**: Actualiza campos permitidos; si se envía `password`, se hashea.
- **Eliminar Usuario**: Elimina el usuario y responde sin exponer la contraseña.

### Base de Datos

- PostgreSQL. El esquema está en `db.sql` (columna `address`, tabla `users`).
- **Migración para BD existentes** (si tenías la columna con el typo `addres`):
  ```sql
  alter table users rename column addres to address;
  ```

## Endpoints de la API

> Convención: los endpoints marcados como **[Seguridad]** requieren token (cookie `access_token` o header `Authorization: Bearer`).

| Método | Ruta | Protegido | Descripción |
| ------ | ---- | --------- | ----------- |
| POST | `/api/v1/users/login` | No | Inicia sesión con `mobile_phone` y `password`. |
| POST | `/api/v1/users/signup` | Sí | Crea un nuevo usuario. |
| GET | `/api/v1/users` | No | Recupera todos los usuarios. |
| GET | `/api/v1/users/:id` | Sí | Recupera un usuario por ID. |
| PUT | `/api/v1/users/:id` | Sí | Actualiza un usuario por ID. |
| DELETE | `/api/v1/users/:id` | Sí | Elimina un usuario por ID. |

### Cuerpos de solicitud

**Login**
```json
{ "mobile_phone": "5551234567", "password": "123456" }
```

**Signup**
```json
{
  "first_name": "Juan",
  "last_name": "Perez",
  "date_birth": "1990-01-01",
  "mobile_phone": "5551234567",
  "email": "juan.perez@example.com",
  "password": "123456",
  "address": "Calle Falsa 123"
}
```

**Update** (campos permitidos: `first_name`, `last_name`, `date_birth`, `address`, `password`, `mobile_phone`, `email`)

## Variables de Entorno

| Variable | Requerida | Descripción |
| -------- | --------- | ----------- |
| `DB_LOCAL` | Sí | Cadena de conexión a la BD local (desarrollo). |
| `DB_CLOUD` | Sí (prod) | Cadena de conexión a la BD en la nube (producción). |
| `NODE_ENV` | No | `Production` o cualquier otro valor (desarrollo). |
| `RUN_SERVER` | No | Puerto del servidor (por defecto `3000`). |
| `SECRET_TOKEN` | **Sí** | Secreto para firmar tokens JWT (la app falla al arrancar si falta). |
| `APP_DONMAIN` / `APP_PROTOCOL` / `APP_UNIQUE_NAME` | Solo prod | Forman la URL de producción (origen CORS). |

Usa `templated.env` como plantilla y renómbralo a `.env`.

## Configuración e Instalación

1. Instala [PostgreSQL](https://www.postgresql.org/download/) y agrégalo al PATH.
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Crea tu archivo `.env` a partir de `templated.env` con los valores requeridos (al menos `DB_LOCAL` y `SECRET_TOKEN`).
4. Ejecuta el script `src/models/db.sql` para crear la tabla (y aplicar la migración indicada si partiste del esquema viejo).
5. Compila TypeScript:
   ```bash
   npm run build
   ```
6. Inicia el servidor:
   - Desarrollo: `npm run dev`
   - Producción: `npm run build && npm start`
   ```bash
   npm start
   ```

## Scripts

| Script | Descripción |
| ------ | ----------- |
| `npm run dev` | Compila y ejecuta con nodemon (watch). |
| `npm run build` | Compila TypeScript a `dist/`. |
| `npm run typecheck` | Verifica tipos sin emitir. |
| `npm test` | Compila (`pretest`) y ejecuta los tests con Jest. |

## Tests

Los tests (`test/app.test.js`) usan Supertest contra la app compilada y **requieren una base de datos PostgreSQL en ejecución** y un `.env` configurado:

```bash
npm test
```

## Conexión a la API con Fetch

### Login
```javascript
fetch('https://tu-dominio.com/api/v1/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ mobile_phone: '5551234567', password: '123456' }),
})
  .then((res) => res.json())
  .then((data) => console.log(data.accesss_token));
```

### Crear usuario (requiere token)
```javascript
fetch('https://tu-dominio.com/api/v1/users/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer TU_TOKEN',
  },
  body: JSON.stringify({
    first_name: 'Juan',
    last_name: 'Perez',
    date_birth: '1990-01-01',
    mobile_phone: '5551234567',
    email: 'juan.perez@example.com',
    password: '123456',
    address: 'Calle Falsa 123',
  }),
});
```

### Obtener todos los usuarios
```javascript
fetch('https://tu-dominio.com/api/v1/users')
  .then((res) => res.json())
  .then((data) => console.log(data.getAllUsers));
```

## Dependencias

- **bcrypt**: Hash de contraseñas.
- **cookie-parser**: Análisis de cookies.
- **cors**: Control de acceso cross-origin.
- **express**: Framework web.
- **jsonwebtoken**: Generación y validación de tokens JWT.
- **morgan**: Logger de solicitudes HTTP.
- **pg**: Cliente de PostgreSQL.
- Desarrollo: `typescript`, `ts-node`, `nodemon`, `jest`, `supertest`, `ts-jest`, `cross-env` y sus tipos (`@types/*`).

## Licencia

ISC