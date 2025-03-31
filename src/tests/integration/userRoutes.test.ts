import request from "supertest";
import app from "../../app";

describe("Testes de Integração - Rotas de Usuários", () => {
	it("Deve retornar mensagem de boas-vindas", async () => {
		const response = await request(app).get("/api/");
		expect(response.status).toBe(200);
		expect(response.text).toBe("Bem-vindo à API!");
	});

	it("Deve criar um novo usuário", async () => {
		const response = await request(app)
			.post("/api/users")
			.send({ name: "Daniel", age: 30 });
		expect(response.status).toBe(201);
		expect(response.body).toEqual({
			message: "Usuário criado",
			user: { name: "Daniel", age: 30 },
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
		const response = await request(app).get("/api/users/123");
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Usuário com ID 123",
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

	it("Deve atualizar um usuário por ID", async () => {
		const response = await request(app)
			.put("/api/users/123")
			.send({ name: "João", age: 35 });
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Usuário com ID 123 atualizado",
			user: { name: "João", age: 35 },
		});
	});

	it("Deve retornar erro ao atualizar usuário sem dados", async () => {
		const response = await request(app).put("/api/users/123").send({});
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "Dados para atualização são obrigatórios",
		});
	});

	it("Deve deletar um usuário por ID", async () => {
		const response = await request(app).delete("/api/users/123");
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Usuário com ID 123 deletado",
		});
	});

	it("Deve retornar erro ao deletar usuário com ID inválido", async () => {
		const response = await request(app).delete("/api/users/abc");
		expect(response.status).toBe(400);
		expect(response.body).toEqual({
			error: "ID inválido",
		});
	});

	it("Deve autenticar um usuário com credenciais válidas", async () => {
		const response = await request(app)
			.post("/api/auth")
			.send({ username: "admin", password: "1234" });
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Autenticação bem-sucedida",
		});
	});

	it("Deve retornar erro ao autenticar com credenciais inválidas", async () => {
		const response = await request(app)
			.post("/api/auth")
			.send({ username: "user", password: "wrongpassword" });
		expect(response.status).toBe(401);
		expect(response.body).toEqual({
			message: "Credenciais inválidas",
		});
	});

	it("Deve retornar o perfil do usuário logado", async () => {
		const response = await request(app).get("/api/profile");
		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			message: "Perfil do usuário",
			profile: { id: 1, name: "Daniel", age: 30 },
		});
	});
});
