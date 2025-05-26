import express from "express";
import { UserController } from "../controllers/userController";

const router = express.Router();
const controller = new UserController();

router.get("/users", controller.getUsers);

router.get("/users/:id", controller.getUserById);

router.post("/users", controller.createUser);

router.put("/users/:id", controller.updateUser);

router.delete("/users/:id", controller.deleteUser);

router.post("/auth", controller.authenticateUser);

router.post("/auth/logout", controller.logoutUser);

router.get("/profile", controller.getProfile);

export default router;
