import request from "supertest";
import app from "../dist/src/app.js";
import { Query } from "../dist/src/models/db.js";

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
  address: "Calle falsa Eudy23",
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
    cookie = resp.header["set-cookie"][0].split(";")[0];

    expect(data).toHaveProperty("accesss_token");
    expect(data).toHaveProperty("token_type", "bearer");
    expect(data.user).toMatchObject({
      first_name: validUser.first_name,
      last_name: validUser.last_name,
      email: validUser.email,
      mobile_phone: validUser.mobile_phone,
      session_active: true,
    });
    expect(data.user).not.toHaveProperty("password");
  });

  it("should return 400 if missing mobile_phone or password", async () => {
    const resp = await request(app)
      .post("/api/v1/users/login")
      .send({ mobile_phone: "" });

    expect(resp.statusCode).toBe(400);
    expect(resp.body).toHaveProperty("message");
    expect(resp.body.errors).toBeInstanceOf(Array);
  });

  it("should return 400 if user does not exist", async () => {
    const resp = await request(app)
      .post("/api/v1/users/login")
      .send({ mobile_phone: "0000000000", password: "123456" });

    expect(resp.statusCode).toBe(400);
    expect(resp.body.message).toBe("Usuario no encontrado.");
  });

  it("should return 400 if password is incorrect", async () => {
    const resp = await request(app).post("/api/v1/users/login").send({
      mobile_phone: validUser.mobile_phone,
      password: "wrongpassword",
    });

    expect(resp.statusCode).toBe(400);
    expect(resp.body.message).toBe("Contraseña incorrecta, intentalo nuevamente.");
  });
});

describe("User creation API", () => {
  it("should create a user successfully and return 201", async () => {
    const resp = await request(app)
      .post("/api/v1/users/signup")
      .set("Cookie", cookie)
      .send(userTest);

    if (resp.statusCode === 201) {
      userId = resp.body.user.id;
      expect(resp.body.user).not.toHaveProperty("password");
      expect(resp.body.user.address).toBe(userTest.address);
    } else {
      expect(resp.statusCode).toBe(409);
      const found = await Query(`select id from users where email = $1;`, [
        userTest.email,
      ]);
      userId = found.rows[0].id;
    }
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
    expect(resp.body).toHaveProperty("message");
    expect(resp.body.errors).toContain("El campo date_birth es requerido.");
  });

  it("should reject an invalid date_birth format", async () => {
    const resp = await request(app)
      .post("/api/v1/users/signup")
      .set("Cookie", cookie)
      .send({ ...userTest, email: "otro@gmail.com", date_birth: "12-12-1990" });

    expect(resp.statusCode).toEqual(400);
    expect(resp.body.errors.some((e) => e.includes("date_birth"))).toBe(true);
  });

  it("should return 409 if user already exists", async () => {
    const resp = await request(app)
      .post("/api/v1/users/signup")
      .set("Cookie", cookie)
      .send(userTest);

    expect([201, 409]).toContain(resp.statusCode);
    if (resp.statusCode === 409) {
      expect(resp.body.message).toBe(
        "Ya existe un usuario registrado con ese email."
      );
    }
  });
});

describe("GET /api/v1/users - Obtener todos los usuarios", () => {
  it("should return 200 and all users if records exist", async () => {
    const response = await request(app).get("/api/v1/users");

    expect(response.statusCode).toBe(200);
    expect(response.body).toHaveProperty("getAllUsers");
    expect(Array.isArray(response.body.getAllUsers)).toBe(true);
    expect(response.body.getAllUsers.every((u) => !u.password)).toBe(true);
  });

  it("should return 500 if an internal error occurs", async () => {
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

    const partial = {
      first_name: userTest.first_name,
      last_name: userTest.last_name,
      mobile_phone: userTest.mobile_phone,
      email: userTest.email,
      address: userTest.address,
    };
    expect(resp.statusCode).toBe(200);
    expect(resp.body).toMatchObject(partial);
    expect(resp.body).not.toHaveProperty("password");
  });

  it("should return 404 if user is not found", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/999999`)
      .set("Cookie", cookie);

    expect(resp.statusCode).toBe(404);
    expect(resp.body.message).toBe(
      "Upps, no se encontraron registros de usuarios."
    );
  });

  it("should return 400 if id param is invalid", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/${"a"}`)
      .set("Cookie", cookie);

    expect(resp.statusCode).toBe(400);
    expect(resp.body.message).toBe(
      "Upps, el parámetro solicitado no ha sido enviado correctamente."
    );
  });

  it("should return 401 if token is not provided", async () => {
    const resp = await request(app).get(`/api/v1/users/${userId}`);

    expect(resp.statusCode).toBe(401);
  });

  it("should accept an Authorization Bearer token", async () => {
    const resp = await request(app)
      .get(`/api/v1/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(resp.statusCode).toBe(200);
  });
});

describe("PUT /api/v1/users/:id", () => {
  it("should update user successfully and return 200", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set("Cookie", cookie)
      .send(template);

    expect(resp.statusCode).toBe(200);
    expect(resp.body.user.address).toBe(template.address);
    expect(resp.body.user).not.toHaveProperty("password");
  });

  it("should return 400 if no valid fields are sent", async () => {
    const resp = await request(app)
      .put(`/api/v1/users/${userId}`)
      .set("Cookie", cookie)
      .send({ invalid_field: "something" });

    expect(resp.statusCode).toBe(400);
    expect(resp.body).toHaveProperty("message");
    expect(resp.body.errors).toContain("No se enviaron campos válidos para actualizar.");
  });

  it("should return 404 if update targets a missing route id", async () => {
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
});

describe("DELETE /api/v1/users/:id", () => {
  it("should delete user successfully and return 200", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/${userId}`)
      .set("Cookie", cookie);

    expect(resp.body.message).toEqual("Usuario eliminado");
    expect(resp.body.user).not.toHaveProperty("password");
  });

  it("should return 404 if id param is missing", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/`)
      .set("Cookie", cookie);

    expect(resp.statusCode).toEqual(404);
  });

  it("should return 401 if token is missing", async () => {
    const resp = await request(app).delete(`/api/v1/users/${userId}`);

    expect(resp.statusCode).toEqual(401);
  });

  it("should return 404 if id not valid", async () => {
    const resp = await request(app)
      .delete(`/api/v1/users/${8000}`)
      .set("Cookie", cookie);

    expect(resp.statusCode).toBe(404);
    expect(resp.body.message).toBe(
      "Uppds el usuario no existe, intentelo nuevamente."
    );
  });
});