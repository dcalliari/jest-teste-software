import type { Request, Response } from "express";
import { UserController } from "../../controllers/userController";
import { getAllUsers, createUser, deleteUser } from "../../utils/mockData";

const userController = new UserController();

describe("ShopFast User Controller - Unit Tests", () => {
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
		// Clean up test data
		while (getAllUsers().length > 0) {
			deleteUser(getAllUsers()[0].id);
		}
	});

	describe("User Creation", () => {
		it("Should successfully create a new user", () => {
			mockRequest.body = {
				name: "João Silva",
				email: "joao@test.com",
				age: 30,
			};

			userController.createUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(201);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Usuário criado",
					user: expect.objectContaining({
						name: "João Silva",
						email: "joao@test.com",
						age: 30,
					}),
				}),
			);
		});

		it("Should return error for missing user data", () => {
			mockRequest.body = {};

			userController.createUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Dados do usuário são obrigatórios (name, age, email)",
				}),
			);
		});

		it("Should return error for duplicate email", () => {
			// Create a user first
			createUser("Existing User", "existing@test.com", 25);

			mockRequest.body = {
				name: "Another User",
				email: "existing@test.com",
				age: 30,
			};

			userController.createUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(409);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Email já está em uso",
				}),
			);
		});
	});

	describe("User Authentication", () => {
		beforeEach((done) => {
			// Create a test user
			createUser("Test User", "test@test.com", 25);
			done();
		});

		it("Should successfully authenticate user with valid credentials", (done) => {
			mockRequest.body = { email: "test@test.com", password: "validpassword" };

			userController.authenticateUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Wait for async authentication
			setTimeout(() => {
				expect(mockResponse.status).toHaveBeenCalledWith(200);
				expect(mockResponse.json).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Autenticação bem-sucedida",
						token: expect.any(String),
						user: expect.objectContaining({
							email: "test@test.com",
						}),
					}),
				);
				done();
			}, 400);
		});

		it("Should fail authentication with invalid credentials", (done) => {
			mockRequest.body = {
				email: "invalid@test.com",
				password: "wrongpassword",
			};

			userController.authenticateUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			setTimeout(() => {
				expect(mockResponse.status).toHaveBeenCalledWith(401);
				expect(mockResponse.json).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Credenciais inválidas",
					}),
				);
				done();
			}, 400);
		});

		it("Should return error for missing authentication data", () => {
			mockRequest.body = {};

			userController.authenticateUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Email e password são obrigatórios",
				}),
			);
		});
	});

	describe("User Management", () => {
		it("Should get user by ID successfully", () => {
			const user = createUser("Get User", "get@test.com", 28);
			mockRequest.params = { id: user.id };

			userController.getUserById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: `Usuário com ID ${user.id}`,
					user: expect.objectContaining({
						id: user.id,
						email: "get@test.com",
					}),
				}),
			);
		});

		it("Should update user successfully", () => {
			const user = createUser("Update User", "update@test.com", 25);
			mockRequest.params = { id: user.id };
			mockRequest.body = { name: "Updated Name", age: 30 };

			userController.updateUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: `Usuário com ID ${user.id} atualizado`,
					user: expect.objectContaining({
						name: "Updated Name",
						age: 30,
					}),
				}),
			);
		});

		it("Should delete user successfully", () => {
			const user = createUser("Delete User", "delete@test.com", 25);
			mockRequest.params = { id: user.id };

			userController.deleteUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: `Usuário com ID ${user.id} deletado`,
				}),
			);
		});

		it("Should return error for invalid user ID", () => {
			mockRequest.params = { id: "invalid-id" };

			userController.getUserById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "ID inválido",
				}),
			);
		});

		it("Should return error when updating user without data", () => {
			const user = createUser("Test User", "test@test.com", 25);
			mockRequest.params = { id: user.id };
			mockRequest.body = {};

			userController.updateUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Dados para atualização são obrigatórios",
				}),
			);
		});
	});

	describe("User Profile", () => {
		it("Should get user profile successfully", () => {
			const user = createUser("Profile User", "profile@test.com", 30);
			mockRequest.query = { userId: user.id };

			userController.getProfile(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Perfil do usuário",
					profile: expect.objectContaining({
						id: user.id,
						email: "profile@test.com",
					}),
				}),
			);
		});

		it("Should return error for missing user token", () => {
			mockRequest.query = {};

			userController.getProfile(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(401);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Token de autenticação necessário",
				}),
			);
		});
	});

	describe("User Logout", () => {
		it("Should logout user successfully", () => {
			const user = createUser("Logout User", "logout@test.com", 25);
			mockRequest.body = { userId: user.id };

			userController.logoutUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Logout realizado com sucesso",
				}),
			);
		});

		it("Should return error for missing user ID", () => {
			mockRequest.body = {};

			userController.logoutUser(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockResponse.status).toHaveBeenCalledWith(400);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID é obrigatório",
				}),
			);
		});
	});

	describe("User Filtering", () => {
		beforeEach(() => {
			createUser("Alice Silva", "alice@test.com", 25);
			createUser("Bob Santos", "bob@test.com", 30);
			createUser("Carol Oliveira", "carol@test.com", 35);
		});

		it("Should filter users by name", () => {
			mockRequest.query = { name: "Alice" };

			userController.getUsers(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Usuários filtrados",
					users: expect.arrayContaining([
						expect.objectContaining({ name: "Alice Silva" }),
					]),
					total: 1,
					filters: { name: "Alice", age: undefined, email: undefined },
				}),
			);
		});

		it("Should filter users by age", () => {
			mockRequest.query = { age: "30" };

			userController.getUsers(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Usuários filtrados",
					users: expect.arrayContaining([expect.objectContaining({ age: 30 })]),
					total: 1,
				}),
			);
		});

		it("Should return all users when no filters applied", () => {
			mockRequest.query = {};

			userController.getUsers(mockRequest as Request, mockResponse as Response);

			expect(mockResponse.status).toHaveBeenCalledWith(200);
			expect(mockResponse.json).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Usuários filtrados",
					total: 3,
				}),
			);
		});
	});
});
