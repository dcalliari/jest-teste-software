import type { Request, Response } from "express";
import {
	getAllProducts,
	getProductById,
	searchProducts,
	getProductsByCategory,
} from "../utils/mockData";

export class ProductController {
	// Get all products with optional filtering
	public getProducts(req: Request, res: Response): void {
		const startTime = Date.now();
		const { query, category, limit = "20" } = req.query;

		let products = getAllProducts();

		if (query || category) {
			products = searchProducts(query as string, category as string);
		}

		// Apply limit for pagination
		const limitNum = Number.parseInt(limit as string, 10);
		if (limitNum > 0) {
			products = products.slice(0, limitNum);
		}

		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: "Products retrieved successfully",
			products,
			total: products.length,
			responseTime: `${responseTime}ms`,
			query: query || null,
			category: category || null,
		});
	}

	// Get product by ID
	public getProductById(req: Request, res: Response): void {
		const startTime = Date.now();
		const { id } = req.params;

		const product = getProductById(id);
		const responseTime = Date.now() - startTime;

		if (!product) {
			res.status(404).json({
				error: "Product not found",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: `Product with ID ${id}`,
			product,
			responseTime: `${responseTime}ms`,
		});
	}

	// Get products by category
	public getProductsByCategory(req: Request, res: Response): void {
		const startTime = Date.now();
		const { category } = req.params;

		const products = getProductsByCategory(category);
		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: `Products in category: ${category}`,
			products,
			total: products.length,
			category,
			responseTime: `${responseTime}ms`,
		});
	}

	// Search products (alternative endpoint for complex searches)
	public searchProducts(req: Request, res: Response): void {
		const startTime = Date.now();
		const { q, category, minPrice, maxPrice, minRating } = req.query;

		let products = searchProducts(q as string, category as string);

		// Additional filtering
		if (minPrice) {
			products = products.filter(
				(p) => p.price >= Number.parseFloat(minPrice as string),
			);
		}

		if (maxPrice) {
			products = products.filter(
				(p) => p.price <= Number.parseFloat(maxPrice as string),
			);
		}

		if (minRating) {
			products = products.filter(
				(p) => p.rating >= Number.parseFloat(minRating as string),
			);
		}

		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: "Search completed",
			products,
			total: products.length,
			filters: {
				query: q || null,
				category: category || null,
				minPrice: minPrice || null,
				maxPrice: maxPrice || null,
				minRating: minRating || null,
			},
			responseTime: `${responseTime}ms`,
		});
	}

	// Get featured products (simulate heavy database query)
	public getFeaturedProducts(req: Request, res: Response): void {
		const startTime = Date.now();

		// Simulate processing delay for performance testing
		setTimeout(
			() => {
				const products = getAllProducts()
					.filter((p) => p.rating >= 4.5)
					.slice(0, 6);

				const responseTime = Date.now() - startTime;

				res.status(200).json({
					message: "Featured products retrieved",
					products,
					total: products.length,
					responseTime: `${responseTime}ms`,
				});
			},
			Math.random() * 200 + 50,
		); // 50-250ms delay
	}
}
