import express from "express";
import { CartController } from "../controllers/cartController";

const router = express.Router();
const controller = new CartController();

router.post("/cart", controller.addToCart);

router.get("/cart/:userId", controller.getCart);

router.delete("/cart/:userId/clear", controller.clearCart);

router.delete("/cart/:userId/:productId", controller.removeFromCart);

router.put("/cart/:userId/:productId", controller.updateCartItem);

export default router;
