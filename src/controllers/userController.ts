import type { Request, Response } from "express";
import {
	getAllUsers,
	getUserById,
	getUserByEmail,
	createUser,
	updateUser,
	deleteUser,
	authenticateUser,
	type User,
} from "../utils/mockData";

export class UserController {
	// Get all users with optional filtering
	public getUsers(req: Request, res: Response): void {
		const startTime = Date.now();
		const { name, age, email } = req.query;
		let users = getAllUsers();

		if (name) {
			users = users.filter((user) =>
				user.name.toLowerCase().includes((name as string).toLowerCase()),
			);
		}

		if (age) {
			users = users.filter((user) => user.age === Number(age));
		}

		if (email) {
			users = users.filter((user) =>
				user.email.toLowerCase().includes((email as string).toLowerCase()),
			);
		}

		const responseTime = Date.now() - startTime;
		res.status(200).json({
			message: "Usuários filtrados",
			users,
			total: users.length,
			filters: { name, age, email },
			responseTime: `${responseTime}ms`,
		});
	}

	// Get user by ID
	public getUserById(req: Request, res: Response): void {
		const startTime = Date.now();
		const { id } = req.params;
		const user = getUserById(id);
		const responseTime = Date.now() - startTime;

		if (!user) {
			res.status(400).json({
				error: "ID inválido",
				responseTime: `${responseTime}ms`,
			});
			return;
		}
		res.status(200).json({
			message: `Usuário com ID ${id}`,
			user,
			responseTime: `${responseTime}ms`,
		});
	}

	// Create a new user
	public createUser(req: Request, res: Response): void {
		const startTime = Date.now();
		const { name, age, email } = req.body;

		if (!name || !age || !email) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Dados do usuário são obrigatórios (name, age, email)",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Check if email already exists
		const existingUser = getUserByEmail(email);
		if (existingUser) {
			const responseTime = Date.now() - startTime;
			res.status(409).json({
				error: "Email já está em uso",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const newUser = createUser(name, email, age);
		const responseTime = Date.now() - startTime;

		res.status(201).json({
			message: "Usuário criado",
			user: newUser,
			responseTime: `${responseTime}ms`,
		});
	}

	// Update an existing user by ID
	public updateUser(req: Request, res: Response): void {
		const startTime = Date.now();
		const { id } = req.params;
		const { name, age } = req.body;

		if (!name || !age) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Dados para atualização são obrigatórios",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const updatedUser = updateUser(id, name, age);
		const responseTime = Date.now() - startTime;

		if (!updatedUser) {
			res.status(400).json({
				error: "ID inválido",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: `Usuário com ID ${id} atualizado`,
			user: updatedUser,
			responseTime: `${responseTime}ms`,
		});
	}

	// Delete a user by ID
	public deleteUser(req: Request, res: Response): void {
		const startTime = Date.now();
		const { id } = req.params;
		const success = deleteUser(id);
		const responseTime = Date.now() - startTime;

		if (!success) {
			res.status(400).json({
				error: "ID inválido",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: `Usuário com ID ${id} deletado`,
			responseTime: `${responseTime}ms`,
		});
	}

	// Authenticate user (enhanced)
	public authenticateUser(req: Request, res: Response): void {
		const startTime = Date.now();
		const { email, password } = req.body;

		if (!email || !password) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Email e password são obrigatórios",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Simulate authentication delay for performance testing
		setTimeout(
			() => {
				const user = authenticateUser(email, password);
				const responseTime = Date.now() - startTime;

				if (user) {
					// Simulate JWT token generation
					const token = `jwt_token_${Date.now()}_${user.id}`;

					res.status(200).json({
						message: "Autenticação bem-sucedida",
						user: {
							id: user.id,
							name: user.name,
							email: user.email,
						},
						token,
						expiresIn: "24h",
						responseTime: `${responseTime}ms`,
					});
				} else {
					res.status(401).json({
						message: "Credenciais inválidas",
						responseTime: `${responseTime}ms`,
					});
				}
			},
			Math.random() * 200 + 100,
		); // 100-300ms auth delay
	}

	// Get user profile
	public getProfile(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId } = req.query; // In real app, would extract from JWT token

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(401).json({
				error: "Token de autenticação necessário",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const user = getUserById(userId as string);
		const responseTime = Date.now() - startTime;

		if (!user) {
			res.status(404).json({
				error: "Usuário não encontrado",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Perfil do usuário",
			profile: {
				id: user.id,
				name: user.name,
				email: user.email,
				age: user.age,
				isAuthenticated: user.isAuthenticated || false,
			},
			responseTime: `${responseTime}ms`,
		});
	}

	// Logout user
	public logoutUser(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId } = req.body;

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID é obrigatório",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const user = getUserById(userId);
		if (user) {
			user.isAuthenticated = false;
		}

		const responseTime = Date.now() - startTime;
		res.status(200).json({
			message: "Logout realizado com sucesso",
			responseTime: `${responseTime}ms`,
		});
	}
}
