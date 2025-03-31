import type { Request, Response } from "express";
import { UserController } from "../../controllers/userController";
import {
	getAllUsers,
	createUser,
	deleteUser,
	updateUser,
} from "../../utils/mockData";

const userController = new UserController();

describe("Testes Unitários - userController", () => {
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;

	beforeEach(() => {
		mockRequest = {};
		mockResponse = {
			status: jest.fn().mockReturnThis(),
			send: jest.fn(),
			json: jest.fn(),
		};
	});

	afterEach(() => {
		while (getAllUsers().length > 0) {
			deleteUser(getAllUsers()[0].id);
		}
	});

	it("Deve atualizar um usuário por ID", () => {
		const user = createUser("João", 25);
		mockRequest.params = { id: user.id };
		mockRequest.body = { name: "João Atualizado", age: 26 };
		userController.updateUser(mockRequest as Request, mockResponse as Response);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: `Usuário com ID ${user.id} atualizado`,
			user: { id: user.id, name: "João Atualizado", age: 26 },
		});
	});

	it("Deve deletar um usuário por ID", () => {
		const user = createUser("João", 25);
		mockRequest.params = { id: user.id };
		userController.deleteUser(mockRequest as Request, mockResponse as Response);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: `Usuário com ID ${user.id} deletado`,
		});
	});

	it("Deve autenticar um usuário com sucesso", () => {
		mockRequest.body = { username: "admin", password: "1234" };
		userController.authenticateUser(
			mockRequest as Request,
			mockResponse as Response,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(200);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Autenticação bem-sucedida",
		});
	});

	it("Deve falhar na autenticação com credenciais inválidas", () => {
		mockRequest.body = { username: "user", password: "wrongpassword" };
		userController.authenticateUser(
			mockRequest as Request,
			mockResponse as Response,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(401);
		expect(mockResponse.json).toHaveBeenCalledWith({
			message: "Credenciais inválidas",
		});
	});

	it("Deve retornar erro ao criar usuário sem dados", () => {
		mockRequest.body = {};
		userController.createUser(mockRequest as Request, mockResponse as Response);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Dados do usuário são obrigatórios",
		});
	});

	it("Deve retornar erro ao buscar usuário com ID inválido", () => {
		mockRequest.params = { id: "abc" };
		userController.getUserById(
			mockRequest as Request,
			mockResponse as Response,
		);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "ID inválido",
		});
	});

	it("Deve retornar erro ao atualizar usuário sem dados", () => {
		const user = createUser("João", 25);
		mockRequest.params = { id: user.id };
		mockRequest.body = {};
		userController.updateUser(mockRequest as Request, mockResponse as Response);
		expect(mockResponse.status).toHaveBeenCalledWith(400);
		expect(mockResponse.json).toHaveBeenCalledWith({
			error: "Dados para atualização são obrigatórios",
		});
	});
});
