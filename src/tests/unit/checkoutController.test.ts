import { CheckoutController } from "../../controllers/checkoutController";
import type { Request, Response } from "express";
import {
	createOrder,
	getOrderById,
	getOrdersByUserId,
	getCartByUserId,
	getUserById,
	authenticateUser,
} from "../../utils/mockData";

// Mock the utility functions
jest.mock("../../utils/mockData", () => ({
	createOrder: jest.fn(),
	getOrderById: jest.fn(),
	getOrdersByUserId: jest.fn(),
	getCartByUserId: jest.fn(),
	getUserById: jest.fn(),
	authenticateUser: jest.fn(),
}));

const mockedCreateOrder = createOrder as jest.MockedFunction<
	typeof createOrder
>;
const mockedGetOrderById = getOrderById as jest.MockedFunction<
	typeof getOrderById
>;
const mockedGetOrdersByUserId = getOrdersByUserId as jest.MockedFunction<
	typeof getOrdersByUserId
>;
const mockedGetCartByUserId = getCartByUserId as jest.MockedFunction<
	typeof getCartByUserId
>;
const mockedGetUserById = getUserById as jest.MockedFunction<
	typeof getUserById
>;
const mockedAuthenticateUser = authenticateUser as jest.MockedFunction<
	typeof authenticateUser
>;

describe("CheckoutController", () => {
	let checkoutController: CheckoutController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockJson: jest.Mock;
	let mockStatus: jest.Mock;

	beforeEach(() => {
		checkoutController = new CheckoutController();
		mockJson = jest.fn();
		mockStatus = jest.fn().mockReturnValue({ json: mockJson });
		mockRequest = {};
		mockResponse = {
			status: mockStatus,
			json: mockJson,
		};

		// Clear all mocks
		jest.clearAllMocks();
	});

	describe("processCheckout", () => {
		const mockUser = {
			id: "user1",
			name: "John Doe",
			email: "john@example.com",
			age: 30,
		};

		const mockCartItems = [
			{ userId: "user1", productId: "1", quantity: 2 },
			{ userId: "user1", productId: "2", quantity: 1 },
		];
		const mockOrder = {
			id: "order1",
			userId: "user1",
			total: 1000,
			status: "confirmed" as const,
			items: mockCartItems,
			createdAt: new Date(),
		};

		const validCheckoutData = {
			userId: "user1",
			paymentMethod: "credit_card",
			shippingAddress: "123 Main St",
			billingAddress: "123 Main St",
			email: "john@example.com",
			password: "password123",
		};

		it("should process checkout successfully", (done) => {
			mockRequest.body = validCheckoutData;
			mockedAuthenticateUser.mockReturnValue(mockUser);
			mockedGetCartByUserId.mockReturnValue(mockCartItems);
			mockedCreateOrder.mockReturnValue(mockOrder);

			checkoutController.processCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Wait for the setTimeout to complete
			setTimeout(() => {
				expect(mockedAuthenticateUser).toHaveBeenCalledWith(
					"john@example.com",
					"password123",
				);
				expect(mockedGetCartByUserId).toHaveBeenCalledWith("user1");
				expect(mockedCreateOrder).toHaveBeenCalledWith("user1");
				expect(mockStatus).toHaveBeenCalledWith(200);
				expect(mockJson).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Order created successfully",
						order: {
							id: mockOrder.id,
							userId: mockOrder.userId,
							total: mockOrder.total,
							status: mockOrder.status,
							itemCount: mockOrder.items.length,
							createdAt: mockOrder.createdAt,
						},
						paymentMethod: "credit_card",
						estimatedDelivery: "3-5 business days",
						responseTime: expect.stringMatching(/\d+ms/),
					}),
				);
				done();
			}, 1200); // Wait longer than the maximum delay (1000ms)
		});

		it("should return 400 when required fields are missing", () => {
			mockRequest.body = { userId: "user1" }; // Missing required fields

			checkoutController.processCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error:
						"Missing required fields: userId, paymentMethod, shippingAddress, email",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 401 when authentication fails", () => {
			mockRequest.body = validCheckoutData;
			mockedAuthenticateUser.mockReturnValue(null);

			checkoutController.processCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(401);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Authentication failed",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when cart is empty", () => {
			mockRequest.body = validCheckoutData;
			mockedAuthenticateUser.mockReturnValue(mockUser);
			mockedGetCartByUserId.mockReturnValue([]);

			checkoutController.processCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Cart is empty",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when payment method is invalid", () => {
			mockRequest.body = { ...validCheckoutData, paymentMethod: "invalid" };
			mockedAuthenticateUser.mockReturnValue(mockUser);
			mockedGetCartByUserId.mockReturnValue(mockCartItems);

			checkoutController.processCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Invalid payment method",
					validMethods: ["credit_card", "debit_card", "paypal", "pix"],
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
	describe("getOrder", () => {
		const mockOrder = {
			id: "order1",
			userId: "user1",
			total: 1000,
			status: "confirmed" as const,
			items: [],
			createdAt: new Date(),
		};

		it("should return order by ID successfully", () => {
			mockRequest.params = { orderId: "order1" };
			mockedGetOrderById.mockReturnValue(mockOrder);

			checkoutController.getOrder(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetOrderById).toHaveBeenCalledWith("order1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Order retrieved successfully",
					order: mockOrder,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
		it("should return 404 when order not found", () => {
			mockRequest.params = { orderId: "order999" };
			mockedGetOrderById.mockReturnValue(undefined);

			checkoutController.getOrder(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Order not found",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when orderId is missing", () => {
			mockRequest.params = {};

			checkoutController.getOrder(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Order ID is required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
	describe("getUserOrders", () => {
		const mockOrders = [
			{
				id: "order1",
				userId: "user1",
				total: 1000,
				status: "confirmed" as const,
				items: [],
				createdAt: new Date(),
			},
			{
				id: "order2",
				userId: "user1",
				total: 500,
				status: "pending" as const,
				items: [],
				createdAt: new Date(),
			},
		];

		it("should return user orders successfully", () => {
			mockRequest.params = { userId: "user1" };
			mockRequest.query = {};
			mockedGetOrdersByUserId.mockReturnValue(mockOrders);

			checkoutController.getUserOrders(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetOrdersByUserId).toHaveBeenCalledWith("user1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Orders retrieved successfully",
					orders: mockOrders,
					total: 2,
					userId: "user1",
					filters: {
						status: null,
						limit: 10,
					},
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should filter orders by status", () => {
			mockRequest.params = { userId: "user1" };
			mockRequest.query = { status: "confirmed" };
			mockedGetOrdersByUserId.mockReturnValue(mockOrders);

			checkoutController.getUserOrders(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					orders: [mockOrders[0]], // Only confirmed order
					total: 1,
					filters: {
						status: "confirmed",
						limit: 10,
					},
				}),
			);
		});

		it("should apply limit to orders", () => {
			mockRequest.params = { userId: "user1" };
			mockRequest.query = { limit: "1" };
			mockedGetOrdersByUserId.mockReturnValue(mockOrders);

			checkoutController.getUserOrders(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					orders: [mockOrders[0]], // Only first order due to limit
					total: 1,
				}),
			);
		});
		it("should return 400 when userId is missing", () => {
			mockRequest.params = {};
			mockRequest.query = {};

			checkoutController.getUserOrders(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID is required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});

	describe("validateCheckout", () => {
		const mockCartItems = [{ userId: "user1", productId: "1", quantity: 2 }];

		it("should validate checkout data successfully", () => {
			mockRequest.body = {
				userId: "user1",
				paymentMethod: "credit_card",
				shippingAddress: "123 Main St",
			};
			mockedGetCartByUserId.mockReturnValue(mockCartItems);

			checkoutController.validateCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Checkout validation passed",
					valid: true,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return validation errors", () => {
			mockRequest.body = {}; // Missing required fields

			checkoutController.validateCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Validation failed",
					errors: [
						"User ID is required",
						"Payment method is required",
						"Shipping address is required",
					],
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should detect empty cart", () => {
			mockRequest.body = {
				userId: "user1",
				paymentMethod: "credit_card",
				shippingAddress: "123 Main St",
			};
			mockedGetCartByUserId.mockReturnValue([]);

			checkoutController.validateCheckout(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					errors: expect.arrayContaining(["Cart is empty"]),
				}),
			);
		});
	});

	describe("calculateTotals", () => {
		const mockCartItems = [
			{ userId: "user1", productId: "1", quantity: 2 },
			{ userId: "user1", productId: "2", quantity: 1 },
		];

		it("should calculate totals successfully", (done) => {
			mockRequest.body = { userId: "user1", shippingMethod: "express" };
			mockedGetCartByUserId.mockReturnValue(mockCartItems);

			checkoutController.calculateTotals(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Wait for the setTimeout to complete
			setTimeout(() => {
				expect(mockedGetCartByUserId).toHaveBeenCalledWith("user1");
				expect(mockStatus).toHaveBeenCalledWith(200);
				expect(mockJson).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Totals calculated successfully",
						breakdown: {
							subtotal: 300, // 100 * 2 + 100 * 1 (simplified calculation)
							shipping: 19.99, // Express shipping
							tax: 24, // 8% of subtotal
							total: 343.99,
						},
						shippingMethod: "express",
						responseTime: expect.stringMatching(/\d+ms/),
					}),
				);
				done();
			}, 500); // Wait longer than the maximum delay (400ms)
		});

		it("should use standard shipping by default", (done) => {
			mockRequest.body = { userId: "user1" };
			mockedGetCartByUserId.mockReturnValue(mockCartItems);

			checkoutController.calculateTotals(
				mockRequest as Request,
				mockResponse as Response,
			);

			setTimeout(() => {
				expect(mockJson).toHaveBeenCalledWith(
					expect.objectContaining({
						breakdown: expect.objectContaining({
							shipping: 9.99, // Standard shipping
						}),
						shippingMethod: "standard",
					}),
				);
				done();
			}, 500);
		});

		it("should return 400 when userId is missing", () => {
			mockRequest.body = {};

			checkoutController.calculateTotals(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID is required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
});
