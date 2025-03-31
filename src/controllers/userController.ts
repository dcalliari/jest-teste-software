import type { Request, Response } from "express";

// Controlador para a rota de boas-vindas
export class UserController {
	// Controlador para a rota de boas-vindas
	public getWelcome(req: Request, res: Response): void {
		res.status(200).send("Bem-vindo à API!");
	}

	// Controlador para listar usuários com filtros
	public getUsers(req: Request, res: Response): void {
		const { name, age } = req.query;
		res
			.status(200)
			.json({ message: "Usuários filtrados", filters: { name, age } });
	}

	// Controlador para buscar um usuário por ID
	public getUserById(req: Request, res: Response): void {
		const { id } = req.params;
		res.status(200).json({ message: `Usuário com ID ${id}` });
	}

	// Controlador para criar um novo usuário
	public createUser(req: Request, res: Response): void {
		const { name, age } = req.body;
		res.status(201).json({ message: "Usuário criado", user: { name, age } });
	}

	// Controlador para atualizar um usuário por ID
	public updateUser(req: Request, res: Response): void {
		const { id } = req.params;
		const { name, age } = req.body;
		res.status(200).json({
			message: `Usuário com ID ${id} atualizado`,
			user: { name, age },
		});
	}

	// Controlador para deletar um usuário por ID
	public deleteUser(req: Request, res: Response): void {
		const { id } = req.params;
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
