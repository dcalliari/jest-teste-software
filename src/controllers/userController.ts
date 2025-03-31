import type { Request, Response } from "express";
import {
	getAllUsers,
	getUserById,
	createUser,
	updateUser,
	deleteUser,
} from "../utils/mockData";

export class UserController {
	// Controlador para a rota de boas-vindas
	public getWelcome(req: Request, res: Response): void {
		res.status(200).send("Bem-vindo à API!");
	}

	// Controlador para listar usuários com filtros
	public getUsers(req: Request, res: Response): void {
		const { name, age } = req.query;
		let users = getAllUsers();

		if (name) {
			users = users.filter((user) => user.name.includes(name as string));
		}

		if (age) {
			users = users.filter((user) => user.age === Number(age));
		}

		res.status(200).json({ message: "Usuários filtrados", users });
	}

	// Controlador para buscar um usuário por ID
	public getUserById(req: Request, res: Response): void {
		const { id } = req.params;
		const user = getUserById(id);
		if (!user) {
			res.status(400).json({ error: "ID inválido" });
			return;
		}
		res.status(200).json({ message: `Usuário com ID ${id}`, user });
	}

	// Controlador para criar um novo usuário
	public createUser(req: Request, res: Response): void {
		const { name, age } = req.body;
		if (!name || !age) {
			res.status(400).json({ error: "Dados do usuário são obrigatórios" });
			return;
		}
		const newUser = createUser(name, age);
		res.status(201).json({ message: "Usuário criado", user: newUser });
	}

	// Controlador para atualizar um usuário por ID
	public updateUser(req: Request, res: Response): void {
		const { id } = req.params;
		const { name, age } = req.body;
		if (!name || !age) {
			res
				.status(400)
				.json({ error: "Dados para atualização são obrigatórios" });
			return;
		}
		const updatedUser = updateUser(id, name, age);
		if (!updatedUser) {
			res.status(400).json({ error: "ID inválido" });
			return;
		}
		res
			.status(200)
			.json({ message: `Usuário com ID ${id} atualizado`, user: updatedUser });
	}

	// Controlador para deletar um usuário por ID
	public deleteUser(req: Request, res: Response): void {
		const { id } = req.params;
		const success = deleteUser(id);
		if (!success) {
			res.status(400).json({ error: "ID inválido" });
			return;
		}
		res.status(200).json({ message: `Usuário com ID ${id} deletado` });
	}

	// Controlador para autenticar um usuário
	public authenticateUser(req: Request, res: Response): void {
		const { username, password } = req.body;
		// Exemplo fictício de autenticação
		if (username === "admin" && password === "1234") {
			res.status(200).json({ message: "Autenticação bem-sucedida" });
		} else {
			res.status(401).json({ message: "Credenciais inválidas" });
		}
	}

	// Controlador para obter o perfil do usuário logado
	public getProfile(req: Request, res: Response): void {
		// Exemplo fictício de perfil
		const userProfile = { id: 1, name: "Daniel", age: 28 };
		res
			.status(200)
			.json({ message: "Perfil do usuário", profile: userProfile });
	}
}
