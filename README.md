# Documentación del Test Técnico Backend JR

## Descripción del Proyecto

Este proyecto es una aplicación backend diseñada para gestionar datos de usuarios. Incluye funcionalidades como autenticación de usuarios, operaciones CRUD para la gestión de usuarios e interacción con la base de datos. La aplicación está construida utilizando TypeScript y Express.js, con PostgreSQL como base de datos.

## Estructura del Proyecto

El proyecto está organizado de la siguiente manera:

```
config.ts
package.json
README.md
tsconfig.json
src/
    app.ts
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
```

### Archivos y Directorios Clave

- **config.ts**: Contiene configuraciones de la aplicación, como cadenas de conexión a la base de datos y el puerto del servidor.
- **package.json**: Define las dependencias y scripts del proyecto.
- **tsconfig.json**: Archivo de configuración de TypeScript.
- **src/app.ts**: Punto de entrada de la aplicación, configura middleware y rutas.
- **src/controller/auth.ts**: Contiene la lógica para la autenticación de usuarios y operaciones CRUD.
- **src/models/db.ts**: Maneja la conexión a la base de datos y la ejecución de consultas.
- **src/models/db.sql**: Script SQL para crear la base de datos y la tabla de usuarios.
- **src/router/authRouter.ts**: Define las rutas de la API para las operaciones relacionadas con usuarios.
- **src/utils/encrypt.ts**: Proporciona funciones utilitarias para el hash y la comparación de contraseñas.
- **src/utils/validation.ts**: Middleware para validar tokens JWT.

## Funcionalidades

### Autenticación

- **Inicio de Sesión**: Valida las credenciales del usuario y genera un token JWT.
- **Validación de Token**: Middleware para verificar la validez de los tokens JWT.

### Gestión de Usuarios

- **Crear Usuario**: Agrega un nuevo usuario a la base de datos.
- **Leer Usuarios**: Recupera todos los usuarios o un usuario específico por ID.
- **Actualizar Usuario**: Actualiza los detalles de un usuario.
- **Eliminar Usuario**: Elimina un usuario de la base de datos.

### Base de Datos

- Se utiliza PostgreSQL como base de datos.
- El archivo `db.sql` contiene el esquema para la tabla `users`.

## Endpoints de la API

```bash
Nota: Algunas nutas tienen "Segurity" delante del EndPoint , Significa que hay que estar logueado para poder usar el endPoint en caso de que no este loqueado no se consedera los permiso;
```

### Autenticación

- `POST /api/v1/users/login`: Inicia sesión de un usuario y devuelve un token JWT.
- `[ Segurity ] POST /api/v1/users`: Crea un nuevo usuario (requiere validación de token).

### Gestión de Usuarios

- `GET /api/v1/users`: Recupera todos los usuarios.
- `[ Segurity ] GET /api/v1/users/:id`: Recupera un usuario por ID (requiere validación de token).
- `[ Segurity ] PUT /api/v1/users/:id`: Actualiza un usuario por ID (requiere validación de token).
- `[ Segurity ] DELETE /api/v1/users/:id`: Elimina un usuario por ID (requiere validación de token).

## Variables de Entorno

La aplicación utiliza las siguientes variables de entorno:

- `DB_LOCAL`: Cadena de conexión a la base de datos local.
- `DB_CLOUD`: Cadena de conexión a la base de datos en la nube (opcional).
- `NODE_ENV`: Modo de entorno (por ejemplo, Producción o Desarrollo).
- `RUN_SERVER`: Número de puerto para el servidor.
- `SECRET_TOKEN`: Clave secreta para la generación de tokens JWT.

## Configuración e Instalación

1. Clona el repositorio.
   ```bash
   git clone https://github.com/Joel-RD/JR_backend_technical_test.git
   ```
2. Tener instalado PostgreSQL y agregado al path del sistema. [agregarlo al path!](https://www.youtube.com/watch?v=2oAM4Q-9DMU) y [descargar e installar!](https://www.youtube.com/watch?v=4qH-7w5LZsA)

3. Instala las dependencias:
   ```bash
   npm install
   ```

4. Configura el archivo `.env` con las variables de entorno requeridas.
    ```bash
    DB_LOCAL: coneccíon a la base de datos local.
    DB_CLOUD: coneccíon a la base de datos en la nube.
    NODE_ENV: Entorno (produccíon o Desarrollo).
    RUN_SERVER: Puero del servidor.
    SECRET_TOKEN: Token seguro.
    ```
5. Compila TypeScript:
   ```bash
   npm run ts_node
   ```
6. Inicia el servidor:
* Desarrollo
   ```bash
   npm run dev
   ```
* Produccíon
   ```bash
   npm run build
   ```

## Conexión a la API con Fetch

A continuación, se muestran ejemplos de cómo conectarse a los endpoints de la API utilizando `fetch` desde el cliente:

### Autenticación

#### Inicio de Sesión
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    username: 'your_username',
    password: 'your_password',
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

### Gestión de Usuarios

#### Obtener todos los usuarios
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

#### Obtener un usuario por ID
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users/1', {
  headers: {
    Authorization: 'Bearer your_token',
  },
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

#### Crear un nuevo usuario
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your_token',
  },
  body: JSON.stringify({
    username: 'new_user',
    password: 'new_password',
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

#### Actualizar un usuario por ID
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer your_token',
  },
  body: JSON.stringify({
    username: 'updated_user',
    password: 'updated_password',
  }),
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

#### Eliminar un usuario por ID
```javascript
fetch('https://jr-backend-technical.onrender.com/api/v1/users/1', {
  method: 'DELETE',
  headers: {
    Authorization: 'Bearer your_token',
  },
})
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error('Error:', error));
```

## Dependencias

- **bcrypt**: Para el hash de contraseñas.
- **cookie-parser**: Para el análisis de cookies.
- **express**: Framework web.
- **jsonwebtoken**: Para la generación y validación de tokens JWT.
- **morgan**: Logger de solicitudes HTTP.
- **pg**: Cliente de PostgreSQL.

## Dependencias de Desarrollo

- **@types/bcrypt**: Definiciones de tipo para bcrypt.
- **@types/cookie-parser**: Definiciones de tipo para cookie-parser.
- **@types/express**: Definiciones de tipo para Express.
- **@types/jsonwebtoken**: Definiciones de tipo para jsonwebtoken.
- **@types/morgan**: Definiciones de tipo para morgan.
- **@types/node**: Definiciones de tipo para Node.js.
- **@types/pg**: Definiciones de tipo para pg.
- **ts-node**: Entorno de ejecución de TypeScript.
- **typescript**: Compilador de TypeScript.

## Notas

- Asegúrate de que la base de datos esté configurada y en ejecución antes de iniciar la aplicación.
- Usa el archivo `db.sql` para inicializar el esquema de la base de datos.

## Licencia

Este proyecto está licenciado bajo la Licencia ISC.
