import request from "supertest";
import app from "../../app";
import { getAllUsers, createUser, deleteUser } from "../../utils/mockData";

describe("Testes de Integração - Rotas de Usuários", () => {
	it("Deve criar um novo usuário", async () => {
		const response = await request(app)
			.post("/api/users")
			.send({ name: "Daniel", age: 30 });
		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			message: "Usuário criado",
			user: { id: expect.any(String), name: "Daniel", age: 30 },
		});

		const users = getAllUsers();
		expect(users).toContainEqual({
			id: response.body.user.id,
			name: "Daniel",
			age: 30,
		});
	});

	it("Deve retornar erro ao criar usuário sem dados", async () => {
		const response = await request(app).post("/api/users").send({});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Dados do usuário são obrigatórios",
		});
	});

	it("Deve retornar usuário por ID", async () => {
		const user = createUser("Test User", 25);
		const response = await request(app).get(`/api/users/${user.id}`);
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: `Usuário com ID ${user.id}`,
			user,
		});
	});

	it("Deve retornar erro ao buscar usuário com ID inválido", async () => {
		const response = await request(app).get("/api/users/abc");
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "ID inválido",
		});
	});

	it("Deve retornar erro para rota não encontrada", async () => {
		const response = await request(app).get("/api/unknown");
		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: "Rota não encontrada",
		});
	});
});
