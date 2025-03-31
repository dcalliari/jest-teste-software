import express from "express";
import { UserController } from "../controllers/userController";

const router = express.Router();
const controller = new UserController();

// Rota de boas-vindas
router.get("/", controller.getWelcome);

// Rota para listar usuários
router.get("/users", controller.getUsers);

// Rota para buscar usuário por ID
router.get("/users/:id", controller.getUserById);

// Rota para criar um novo usuário
router.post("/users", controller.createUser);
// Rota para atualizar um usuário por ID
router.put("/users/:id", controller.updateUser);

// Rota para deletar um usuário por ID
router.delete("/users/:id", controller.deleteUser);

// Rota para autenticar um usuário
router.post("/auth", controller.authenticateUser);

// Rota para obter o perfil do usuário logado
router.get("/profile", controller.getProfile);

export default router;
