import express from "express";
import { UserController } from "../controllers/userController";

const router = express.Router();
const controller = new UserController();

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Lista usuários com filtros
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Nome do usuário
 *       - in: query
 *         name: age
 *         schema:
 *           type: integer
 *         description: Idade do usuário
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.get("/users", controller.getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Busca usuário por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Sucesso
 */
router.get("/users/:id", controller.getUserById);

/**
 * @swagger
 * /users:
 *   post:
 *     summary: Cria um novo usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Usuário criado
 */
router.post("/users", controller.createUser);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Atualiza um usuário por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               age:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuário atualizado
 */
router.put("/users/:id", controller.updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Deleta um usuário por ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     responses:
 *       200:
 *         description: Usuário deletado
 */
router.delete("/users/:id", controller.deleteUser);

/**
 * @swagger
 * /auth:
 *   post:
 *     summary: Autentica um usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Autenticação bem-sucedida
 */
router.post("/auth", controller.authenticateUser);

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtém o perfil do usuário logado
 *     responses:
 *       200:
 *         description: Perfil do usuário
 */
router.get("/profile", controller.getProfile);

export default router;
