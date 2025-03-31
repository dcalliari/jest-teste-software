import type { Request, Response } from "express";
import { UserController } from "../../controllers/userController";

const userController = new UserController();

describe("Testes Unitários - userController", () => {
	const mockRequest = {} as Request;
	const mockResponse = {
		status: jest.fn().mockReturnThis(),
		send: jest.fn(),
		json: jest.fn(),
	} as unknown as Response;

	it("Deve retornar mensagem de boas-vindas", () => {
		userController.getWelcome(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.send).toHaveBeenCalledWith("Bem-vindo à API!");
	});

	it("Deve retornar usuários filtrados", () => {
		mockRequest.query = { name: "Daniel", age: "30" };
		userController.getUsers(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Usuários filtrados",
			filters: { name: "Daniel", age: "30" },
		});
	});

	it("Deve atualizar um usuário por ID", () => {
		mockRequest.params = { id: "123" };
		mockRequest.body = { name: "João", age: 26 };
		userController.updateUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Usuário com ID 123 atualizado",
			user: { name: "João", age: 26 },
		});
	});

	it("Deve deletar um usuário por ID", () => {
		mockRequest.params = { id: "123" };
		userController.deleteUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Usuário com ID 123 deletado",
		});
	});

	it("Deve autenticar um usuário com sucesso", () => {
		mockRequest.body = { username: "admin", password: "1234" };
		userController.authenticateUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Autenticação bem-sucedida",
		});
	});

	it("Deve falhar na autenticação com credenciais inválidas", () => {
		mockRequest.body = { username: "user", password: "wrongpassword" };
		userController.authenticateUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Credenciais inválidas",
		});
	});

	it("Deve retornar o perfil do usuário logado", () => {
		userController.getProfile(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Perfil do usuário",
			profile: { id: 1, name: "Daniel", age: 30 },
		});
	});

	it("Deve retornar erro ao criar usuário sem dados", () => {
		mockRequest.body = {};
		userController.createUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Dados do usuário são obrigatórios",
		});
	});

	it("Deve retornar erro ao buscar usuário com ID inválido", () => {
		mockRequest.params = { id: "abc" };
		userController.getUserById(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "ID inválido",
		});
	});

	it("Deve retornar erro ao atualizar usuário sem dados", () => {
		mockRequest.params = { id: "123" };
		mockRequest.body = {};
		userController.updateUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Dados para atualização são obrigatórios",
		});
	});

	it("Deve retornar erro ao deletar usuário com ID inválido", () => {
		mockRequest.params = { id: "abc" };
		userController.deleteUser(mockRequest, mockResponse);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "ID inválido",
		});
	});
});
