import express from "express";
import { CheckoutController } from "../controllers/checkoutController";

const router = express.Router();
const controller = new CheckoutController();

router.post("/checkout", controller.processCheckout);

router.post("/checkout/validate", controller.validateCheckout);

router.post("/checkout/calculate", controller.calculateTotals);

router.get("/orders/:orderId", controller.getOrder);

router.get("/orders/user/:userId", controller.getUserOrders);

export default router;
