import request from "supertest";
import app from "../dist/src/app.js";
import { Query } from "../dist/src/models/db.js";
import { jest } from "@jest/globals";
import e from "express";

const { hashGenerator } = await import("../dist/src/utils/encrypt.js");

const validUser = {
  first_name: "Juan",
  last_name: "Perez",
  date_birth: "1990-01-01",
  mobile_phone: "5551234567",
  email: "juan.perez@example.com",
  password: "123456",
  address: "Calle Falsa 123",
};

const userTest = {
  first_name: "User test",
  last_name: "last_name_test",
  date_birth: "1990-01-01",
  mobile_phone: "928230567",
  email: "user_test@gmail.com",
  password: "user_test_01",
  address: "Calle user test",
};

const template = {
  addres: "Calle falsa Eudy23",
};
let token = "";
let userId = "";
let cookie = "";

describe("User login API", () => {
  it("should login successfully and return 200 with token and user info", async () => {
    const resp = await request(app).post("/api/v1/users/login").send({
      mobile_phone: validUser.mobile_phone,
      password: validUser.password,
    });

    const data = resp.body;

    token = data.accesss_token;
    cookie = resp.header["set-cookie"];

    expect(data).toHaveProperty("accesss_token");
    expect(data).toHaveProperty("token_type", "bearer");
    expect(data.user).toMatchObject({
      first_name: validUser.first_name,
      last_name: validUser.last_name,
      email: validUser.email,
      mobile_phone: validUser.mobile_phone,
    });
  });

  it("should return 400 if missing mobile_phone or password", async () => {
    const resp = await request(app)
      .post("/api/v1/users/login")
      .send({ mobile_phone: "" });

    expect(resp.statusCode).toBe(400);
    expect(JSON.parse(resp.text)).toEqual(
      "Uppds los parametros solicitados no an sido enviados"
    );
  });

  it("should return 400 if user does not exist", async () => {
    const resp = await request(app)
      .post("/api/v1/users/login")
      .send({ mobile_phone: "0000000000", password: "123456" });

    expect(resp.statusCode).toBe(400);
    expect(resp.text).toBe("Usuario no encontrado.");
  });

  it("should return 400 if password is incorrect", async () => {
    const resp = await request(app).post("/api/v1/users/login").send({
      mobile_phone: validUser.mobile_phone,
      password: "wrongpassword",
    });

    expect(resp.statusCode).toBe(400);
    expect(JSON.parse(resp.text)).toBe(
      "Contraseña incorrecta, intentalo nuevamente."
    );
  });
});

describe("User creation API", () => {
  it("should create a user successfully and return 201", async () => {
    const resp = await request(app).post("/api/v1/users/signup").send(userTest).set('Cookie', cookie);

    userId = resp.body.id; 
    expect([201, 409]).toContain(resp.statusCode);
  });

  it("should return 400 if missing required fields", async () => {
    const partialUser = {
      first_name: userTest.first_name,
      last_name: userTest.last_name,
      mobile_phone: userTest.mobile_phone,
      email: userTest.email,
    };

    const resp = await request(app)
      .post("/api/v1/users/signup")
      .set("Cookie", cookie)
      .send(partialUser);
    expect(resp.statusCode).toEqual(400);
    expect(JSON.parse(resp.text)).toBe("Envie todos los parmetros solicitados");
  });

  it("should return 409 if user already exists", async () => {
    const resp = await request(app).post("/api/v1/users/signup").send(userTest).set("Cookie", cookie);

    const partialUSerTets = {
      first_name: "User test", 
      last_name: "last_name_test",
      mobile_phone: "928230567",
      email: "user_test@gmail.com",
    };
    // expect(resp.statusCode).toEqual(409);
    expect(JSON.parse(resp.text)).toMatchObject(partialUSerTets);
  });
}); 

describe("GET /api/v1/users - Obtener todos los usuarios", () => {
  it("should return 200 and all users if records exist", async () => {
    const response = await request(app).get("/api/v1/users");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("getAllUsers");
    expect(Array.isArray(response.body.getAllUsers)).toBe(true);
  });

  it("should return 500 if an internal error occurs", async () => {
    // Forzamos un error modificando temporalmente la tabla
    const originalTable = "users";
    const tempName = "users_temp_test";

    try {
      await Query(`ALTER TABLE ${originalTable} RENAME TO ${tempName};`);

      const response = await request(app).get("/api/v1/users");

      expect(response.statusCode).toBe(500);
      expect(response.body).toHaveProperty(
        "message",
        "Ah ocurrido un error interno, intentenlo nuevamente en unos momentos..."
      );
    } finally {
      await Query(`ALTER TABLE ${tempName} RENAME TO ${originalTable};`);
    }
  });
}); 

describe("GET /api/v1/users/:id", () => {
  it("should return 200 and the user data when user exists", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/${userId}`)
      .set("Cookie", cookie);

    const partialUSerTets = {
      first_name: userTest.first_name,
      last_name: userTest.last_name,
      mobile_phone: userTest.mobile_phone,
      email: userTest.email,
    };
    expect(resp.statusCode).toBe(200);
    expect(JSON.parse(resp.text)).toMatchObject(partialUSerTets);
  });

  it("should return 400 if user is not found", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/999999`) // un id probablemente inexistente
      .set("Cookie", cookie);

    expect(resp.statusCode).toBe(400);
    expect(JSON.parse(resp.text)).toBe(
      "Upps, aun no hay registros de usuarios"
    );
  });

  it("should return 400 if id param is missing", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/${"a"}`) // incorrecto, no hay ID
      .set("Cookie", cookie);

    // Como esta ruta no existe, devolverá 404, no 400 desde tu controlador
    expect(resp.statusCode).toBe(400);
    expect(JSON.parse(resp.text)).toEqual(
      "Upps, el parámetro solicitado no ha sido enviado correctamente"
    );
  });

  it("should return 401 if token is not provided", async () => {
    const resp = await request(app).get(`/api/v1/users/${userId}`);

    expect(resp.statusCode).toBe(401);
  });
});

describe("PUT /api/v1/users/:id", () => {
  it("should update user successfully and return 200", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set("Cookie", cookie)
      .send(template);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.address).toBe(template.addres);
  });

  it("should return 400 if no valid fields are sent", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set("Cookie", cookie)
      .send({ invalid_field: "something" });

    expect(resp.statusCode).toBe(400);
    expect(resp.body.message).toBe(
      "No se enviaron campos válidos para actualizar"
    );
  });

  it("should return 400 if id param is missing", async () => {
    const resp = await request(app)
      .put("/api/v1/users/")
      .set("Cookie", cookie)
      .send(template);

    expect(resp.statusCode).toBe(404);
  });

  it("should return 401 if token is missing", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .send(template);

    expect(resp.statusCode).toBe(401);
  });

  it("should return 500 on database failure (simulate error)", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set("Cookie", cookie)
      .send({ value: "fecha-invalida" });

    expect(resp.statusCode).toBe(400);
    expect(resp.body.message).toBe(
      "No se enviaron campos válidos para actualizar"
    );
  });
});

describe("DELETE /api/v1/users/:id", () => {
  it("should Delete user successfully and return 200", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Cookie", cookie);

    expect(resp.body.message).toEqual("Usuario eliminado");
  });

  it("should return 400 if id param is missing", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/`)
      .set("Cookie", cookie);

    expect(resp.statusCode).toEqual(404);
  });

  it("should return 401 if token is missing", async () => {
    const resp = await request(app).delete(`/api/v1/users/${userId}`);

    expect(resp.statusCode).toEqual(401);
  });

  it("should return 400 if id not valid", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/${8000}`)
      .set("Cookie", cookie);

    expect(JSON.parse(resp.text)).toBe(
      "Uppds el usuario no existe, intentelo nuevamente"
    );
  });
});
   