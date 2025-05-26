import express from "express";
import { ProductController } from "../controllers/productController";

const router = express.Router();
const controller = new ProductController();

router.get("/products", controller.getProducts);

router.get("/products/search", controller.searchProducts);

router.get("/products/featured", controller.getFeaturedProducts);

router.get("/products/category/:category", controller.getProductsByCategory);

router.get("/products/:id", controller.getProductById);

export default router;
