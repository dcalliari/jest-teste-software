import type { Request, Response } from "express";
import {
	addToCart,
	getCartByUserId,
	removeFromCart,
	clearCart,
	getProductById,
} from "../utils/mockData";

export class CartController {
	// Add item to cart
	public addToCart(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId, productId, quantity = 1 } = req.body;

		if (!userId || !productId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID and Product ID are required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const product = getProductById(productId);
		if (!product) {
			const responseTime = Date.now() - startTime;
			res.status(404).json({
				error: "Product not found",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		if (product.stock < quantity) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: `Insufficient stock. Available: ${product.stock}`,
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const cartItem = addToCart(userId, productId, quantity);
		const responseTime = Date.now() - startTime;

		if (!cartItem) {
			res.status(400).json({
				error: "Failed to add item to cart",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Item added to cart successfully",
			cartItem,
			product: {
				id: product.id,
				name: product.name,
				price: product.price,
			},
			responseTime: `${responseTime}ms`,
		});
	}

	// Get user's cart
	public getCart(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId } = req.params;

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID is required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const cartItems = getCartByUserId(userId);

		// Enrich cart data with product information
		const enrichedCart = cartItems.map((item) => {
			const product = getProductById(item.productId);
			return {
				...item,
				product: product
					? {
							id: product.id,
							name: product.name,
							price: product.price,
							category: product.category,
						}
					: null,
				subtotal: product ? product.price * item.quantity : 0,
			};
		});

		const total = enrichedCart.reduce((sum, item) => sum + item.subtotal, 0);
		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: "Cart retrieved successfully",
			cart: enrichedCart,
			itemCount: cartItems.length,
			total,
			responseTime: `${responseTime}ms`,
		});
	}

	// Remove item from cart
	public removeFromCart(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId, productId } = req.params;

		if (!userId || !productId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID and Product ID are required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const success = removeFromCart(userId, productId);
		const responseTime = Date.now() - startTime;

		if (!success) {
			res.status(404).json({
				error: "Item not found in cart",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Item removed from cart successfully",
			responseTime: `${responseTime}ms`,
		});
	}

	// Clear entire cart
	public clearCart(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId } = req.params;

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID is required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		clearCart(userId);
		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: "Cart cleared successfully",
			responseTime: `${responseTime}ms`,
		});
	}

	// Update cart item quantity
	public updateCartItem(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId, productId } = req.params;
		const { quantity } = req.body;

		if (!userId || !productId || quantity === undefined) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID, Product ID, and quantity are required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		if (quantity <= 0) {
			// Remove item if quantity is 0 or negative
			const success = removeFromCart(userId, productId);
			const responseTime = Date.now() - startTime;

			res.status(200).json({
				message: success ? "Item removed from cart" : "Item not found in cart",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Remove and re-add with new quantity
		removeFromCart(userId, productId);
		const cartItem = addToCart(userId, productId, quantity);
		const responseTime = Date.now() - startTime;

		if (!cartItem) {
			res.status(400).json({
				error: "Failed to update cart item",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Cart item updated successfully",
			cartItem,
			responseTime: `${responseTime}ms`,
		});
	}
}
