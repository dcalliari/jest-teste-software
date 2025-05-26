import { CartController } from "../../controllers/cartController";
import type { Request, Response } from "express";
import {
	addToCart,
	getCartByUserId,
	removeFromCart,
	clearCart,
	getProductById,
} from "../../utils/mockData";

// Mock the utility functions
jest.mock("../../utils/mockData", () => ({
	addToCart: jest.fn(),
	getCartByUserId: jest.fn(),
	removeFromCart: jest.fn(),
	clearCart: jest.fn(),
	getProductById: jest.fn(),
}));

const mockedAddToCart = addToCart as jest.MockedFunction<typeof addToCart>;
const mockedGetCartByUserId = getCartByUserId as jest.MockedFunction<
	typeof getCartByUserId
>;
const mockedRemoveFromCart = removeFromCart as jest.MockedFunction<
	typeof removeFromCart
>;
const mockedClearCart = clearCart as jest.MockedFunction<typeof clearCart>;
const mockedGetProductById = getProductById as jest.MockedFunction<
	typeof getProductById
>;

describe("CartController", () => {
	let cartController: CartController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockJson: jest.Mock;
	let mockStatus: jest.Mock;

	beforeEach(() => {
		cartController = new CartController();
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
	describe("addToCart", () => {
		const mockProduct = {
			id: "1",
			name: "Laptop",
			price: 999.99,
			category: "electronics",
			rating: 4.5,
			stock: 10,
			description: "High-performance laptop",
		};

		const mockCartItem = {
			userId: "user1",
			productId: "1",
			quantity: 2,
		};

		it("should add item to cart successfully", () => {
			mockRequest.body = { userId: "user1", productId: "1", quantity: 2 };
			mockedGetProductById.mockReturnValue(mockProduct);
			mockedAddToCart.mockReturnValue(mockCartItem);

			cartController.addToCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetProductById).toHaveBeenCalledWith("1");
			expect(mockedAddToCart).toHaveBeenCalledWith("user1", "1", 2);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Item added to cart successfully",
					cartItem: mockCartItem,
					product: {
						id: mockProduct.id,
						name: mockProduct.name,
						price: mockProduct.price,
					},
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when userId or productId is missing", () => {
			mockRequest.body = { userId: "user1" }; // Missing productId

			cartController.addToCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID and Product ID are required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
		it("should return 404 when product not found", () => {
			mockRequest.body = { userId: "user1", productId: "999", quantity: 1 };
			mockedGetProductById.mockReturnValue(undefined);

			cartController.addToCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Product not found",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
		it("should return 400 when insufficient stock", () => {
			mockRequest.body = { userId: "user1", productId: "1", quantity: 15 };
			const lowStockProduct = { ...mockProduct, stock: 5 };
			mockedGetProductById.mockReturnValue(lowStockProduct);

			cartController.addToCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Insufficient stock. Available: 5",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should default quantity to 1 when not provided", () => {
			mockRequest.body = { userId: "user1", productId: "1" };
			mockedGetProductById.mockReturnValue(mockProduct);
			mockedAddToCart.mockReturnValue({ ...mockCartItem, quantity: 1 });

			cartController.addToCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedAddToCart).toHaveBeenCalledWith("user1", "1", 1);
		});
	});

	describe("getCart", () => {
		const mockCartItems = [
			{ userId: "user1", productId: "1", quantity: 2 },
			{ userId: "user1", productId: "2", quantity: 1 },
		];
		const mockProducts = [
			{
				id: "1",
				name: "Laptop",
				price: 999.99,
				category: "electronics",
				rating: 4.5,
				stock: 10,
				description: "High-performance laptop",
			},
			{
				id: "2",
				name: "Mouse",
				price: 29.99,
				category: "electronics",
				rating: 4.2,
				stock: 50,
				description: "Wireless gaming mouse",
			},
		];

		it("should return user's cart successfully", () => {
			mockRequest.params = { userId: "user1" };
			mockedGetCartByUserId.mockReturnValue(mockCartItems);
			mockedGetProductById
				.mockReturnValueOnce(mockProducts[0])
				.mockReturnValueOnce(mockProducts[1]);

			cartController.getCart(mockRequest as Request, mockResponse as Response);

			expect(mockedGetCartByUserId).toHaveBeenCalledWith("user1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Cart retrieved successfully",
					cart: expect.arrayContaining([
						expect.objectContaining({
							userId: "user1",
							productId: "1",
							quantity: 2,
							subtotal: 1999.98, // 999.99 * 2
						}),
						expect.objectContaining({
							userId: "user1",
							productId: "2",
							quantity: 1,
							subtotal: 29.99, // 29.99 * 1
						}),
					]),
					itemCount: 2,
					total: 2029.97, // 1999.98 + 29.99
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when userId is missing", () => {
			mockRequest.params = {};

			cartController.getCart(mockRequest as Request, mockResponse as Response);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID is required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should handle empty cart", () => {
			mockRequest.params = { userId: "user1" };
			mockedGetCartByUserId.mockReturnValue([]);

			cartController.getCart(mockRequest as Request, mockResponse as Response);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					cart: [],
					itemCount: 0,
					total: 0,
				}),
			);
		});
	});

	describe("removeFromCart", () => {
		it("should remove item from cart successfully", () => {
			mockRequest.params = { userId: "user1", productId: "1" };
			mockedRemoveFromCart.mockReturnValue(true);

			cartController.removeFromCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedRemoveFromCart).toHaveBeenCalledWith("user1", "1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Item removed from cart successfully",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 404 when item not found in cart", () => {
			mockRequest.params = { userId: "user1", productId: "999" };
			mockedRemoveFromCart.mockReturnValue(false);

			cartController.removeFromCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Item not found in cart",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when userId or productId is missing", () => {
			mockRequest.params = { userId: "user1" }; // Missing productId

			cartController.removeFromCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID and Product ID are required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});

	describe("clearCart", () => {
		it("should clear cart successfully", () => {
			mockRequest.params = { userId: "user1" };

			cartController.clearCart(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedClearCart).toHaveBeenCalledWith("user1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Cart cleared successfully",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when userId is missing", () => {
			mockRequest.params = {};

			cartController.clearCart(
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

	describe("updateCartItem", () => {
		const mockCartItem = {
			userId: "user1",
			productId: "1",
			quantity: 3,
		};

		it("should update cart item quantity successfully", () => {
			mockRequest.params = { userId: "user1", productId: "1" };
			mockRequest.body = { quantity: 3 };
			mockedRemoveFromCart.mockReturnValue(true);
			mockedAddToCart.mockReturnValue(mockCartItem);

			cartController.updateCartItem(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedRemoveFromCart).toHaveBeenCalledWith("user1", "1");
			expect(mockedAddToCart).toHaveBeenCalledWith("user1", "1", 3);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Cart item updated successfully",
					cartItem: mockCartItem,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should remove item when quantity is 0", () => {
			mockRequest.params = { userId: "user1", productId: "1" };
			mockRequest.body = { quantity: 0 };
			mockedRemoveFromCart.mockReturnValue(true);

			cartController.updateCartItem(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedRemoveFromCart).toHaveBeenCalledWith("user1", "1");
			expect(mockedAddToCart).not.toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Item removed from cart",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 400 when required parameters are missing", () => {
			mockRequest.params = { userId: "user1" }; // Missing productId
			mockRequest.body = { quantity: 2 };

			cartController.updateCartItem(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "User ID, Product ID, and quantity are required",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
});
