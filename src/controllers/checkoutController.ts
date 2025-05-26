import type { Request, Response } from "express";
import {
	createOrder,
	getOrderById,
	getOrdersByUserId,
	getCartByUserId,
	authenticateUser,
} from "../utils/mockData";

export class CheckoutController {
	// Process checkout and create order
	public processCheckout(req: Request, res: Response): void {
		const startTime = Date.now();
		const {
			userId,
			paymentMethod,
			shippingAddress,
			billingAddress,
			email,
			password,
		} = req.body;

		// Validate required fields
		if (!userId || !paymentMethod || !shippingAddress || !email) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error:
					"Missing required fields: userId, paymentMethod, shippingAddress, email",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Simulate authentication check
		const user = authenticateUser(email, password || "defaultpass");
		if (!user || user.id !== userId) {
			const responseTime = Date.now() - startTime;
			res.status(401).json({
				error: "Authentication failed",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Check if cart has items
		const cartItems = getCartByUserId(userId);
		if (cartItems.length === 0) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Cart is empty",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Validate payment method
		const validPaymentMethods = ["credit_card", "debit_card", "paypal", "pix"];
		if (!validPaymentMethods.includes(paymentMethod)) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Invalid payment method",
				validMethods: validPaymentMethods,
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Simulate payment processing delay (realistic for performance testing)
		setTimeout(
			() => {
				// Create the order
				const order = createOrder(userId);
				const responseTime = Date.now() - startTime;

				if (!order) {
					res.status(500).json({
						error: "Failed to create order",
						responseTime: `${responseTime}ms`,
					});
					return;
				}

				// Simulate additional processing for complex checkouts
				const processingDelay = Math.random() * 1000 + 500; // 500-1500ms

				res.status(200).json({
					message: "Order created successfully",
					order: {
						id: order.id,
						userId: order.userId,
						total: order.total,
						status: order.status,
						itemCount: order.items.length,
						createdAt: order.createdAt,
					},
					paymentMethod,
					estimatedDelivery: "3-5 business days",
					processingTime: `${processingDelay.toFixed(0)}ms`,
					responseTime: `${responseTime}ms`,
				});
			},
			Math.random() * 800 + 200,
		); // 200-1000ms payment processing
	}

	// Get order by ID
	public getOrder(req: Request, res: Response): void {
		const startTime = Date.now();
		const { orderId } = req.params;

		if (!orderId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "Order ID is required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		const order = getOrderById(orderId);
		const responseTime = Date.now() - startTime;

		if (!order) {
			res.status(404).json({
				error: "Order not found",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Order retrieved successfully",
			order,
			responseTime: `${responseTime}ms`,
		});
	}

	// Get user's order history
	public getUserOrders(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId } = req.params;
		const { limit = "10", status } = req.query;

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID is required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		let orders = getOrdersByUserId(userId);

		// Filter by status if provided
		if (status) {
			orders = orders.filter((order) => order.status === status);
		}

		// Apply limit
		const limitNum = Number.parseInt(limit as string, 10);
		if (limitNum > 0) {
			orders = orders.slice(0, limitNum);
		}

		const responseTime = Date.now() - startTime;

		res.status(200).json({
			message: "Orders retrieved successfully",
			orders,
			total: orders.length,
			userId,
			filters: {
				status: status || null,
				limit: limitNum,
			},
			responseTime: `${responseTime}ms`,
		});
	}

	// Validate checkout data (pre-checkout validation)
	public validateCheckout(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId, paymentMethod, shippingAddress } = req.body;

		const errors: string[] = [];

		if (!userId) errors.push("User ID is required");
		if (!paymentMethod) errors.push("Payment method is required");
		if (!shippingAddress) errors.push("Shipping address is required");

		// Check cart
		if (userId) {
			const cartItems = getCartByUserId(userId);
			if (cartItems.length === 0) {
				errors.push("Cart is empty");
			}
		}

		// Validate payment method
		const validPaymentMethods = ["credit_card", "debit_card", "paypal", "pix"];
		if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
			errors.push("Invalid payment method");
		}

		const responseTime = Date.now() - startTime;

		if (errors.length > 0) {
			res.status(400).json({
				message: "Validation failed",
				errors,
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		res.status(200).json({
			message: "Checkout validation passed",
			valid: true,
			responseTime: `${responseTime}ms`,
		});
	}

	// Calculate shipping and taxes (utility endpoint)
	public calculateTotals(req: Request, res: Response): void {
		const startTime = Date.now();
		const { userId, shippingMethod = "standard" } = req.body;

		if (!userId) {
			const responseTime = Date.now() - startTime;
			res.status(400).json({
				error: "User ID is required",
				responseTime: `${responseTime}ms`,
			});
			return;
		}

		// Simulate complex calculation delay
		setTimeout(
			() => {
				const cartItems = getCartByUserId(userId);
				let subtotal = 0;

				// Calculate subtotal (this would involve product price lookup in real scenario)
				for (const item of cartItems) {
					// Mock calculation - in real app would fetch product prices
					subtotal += 100 * item.quantity; // Simplified
				}

				// Calculate shipping
				const shippingRates = {
					standard: 9.99,
					express: 19.99,
					overnight: 39.99,
				};

				const shipping =
					shippingRates[shippingMethod as keyof typeof shippingRates] || 9.99;
				const tax = subtotal * 0.08; // 8% tax
				const total = subtotal + shipping + tax;

				const responseTime = Date.now() - startTime;

				res.status(200).json({
					message: "Totals calculated successfully",
					breakdown: {
						subtotal: Number.parseFloat(subtotal.toFixed(2)),
						shipping: Number.parseFloat(shipping.toFixed(2)),
						tax: Number.parseFloat(tax.toFixed(2)),
						total: Number.parseFloat(total.toFixed(2)),
					},
					shippingMethod,
					responseTime: `${responseTime}ms`,
				});
			},
			Math.random() * 300 + 100,
		); // 100-400ms calculation delay
	}
}
