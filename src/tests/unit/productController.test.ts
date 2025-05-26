import { ProductController } from "../../controllers/productController";
import type { Request, Response } from "express";
import {
	getAllProducts,
	getProductById,
	searchProducts,
	getProductsByCategory,
} from "../../utils/mockData";

// Mock the utility functions
jest.mock("../../utils/mockData", () => ({
	getAllProducts: jest.fn(),
	getProductById: jest.fn(),
	searchProducts: jest.fn(),
	getProductsByCategory: jest.fn(),
}));

const mockedGetAllProducts = getAllProducts as jest.MockedFunction<
	typeof getAllProducts
>;
const mockedGetProductById = getProductById as jest.MockedFunction<
	typeof getProductById
>;
const mockedSearchProducts = searchProducts as jest.MockedFunction<
	typeof searchProducts
>;
const mockedGetProductsByCategory =
	getProductsByCategory as jest.MockedFunction<typeof getProductsByCategory>;

describe("ProductController", () => {
	let productController: ProductController;
	let mockRequest: Partial<Request>;
	let mockResponse: Partial<Response>;
	let mockJson: jest.Mock;
	let mockStatus: jest.Mock;

	beforeEach(() => {
		productController = new ProductController();
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
	describe("getProducts", () => {
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

		it("should return all products successfully", () => {
			mockRequest.query = {};
			mockedGetAllProducts.mockReturnValue(mockProducts);

			productController.getProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetAllProducts).toHaveBeenCalled();
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Products retrieved successfully",
					products: mockProducts,
					total: 2,
					responseTime: expect.stringMatching(/\d+ms/),
					query: null,
					category: null,
				}),
			);
		});

		it("should return filtered products by query and category", () => {
			mockRequest.query = { query: "laptop", category: "electronics" };
			const filteredProducts = [mockProducts[0]];
			mockedSearchProducts.mockReturnValue(filteredProducts);

			productController.getProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedSearchProducts).toHaveBeenCalledWith(
				"laptop",
				"electronics",
			);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Products retrieved successfully",
					products: filteredProducts,
					total: 1,
					query: "laptop",
					category: "electronics",
				}),
			);
		});

		it("should apply limit to products", () => {
			mockRequest.query = { limit: "1" };
			mockedGetAllProducts.mockReturnValue(mockProducts);

			productController.getProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					products: [mockProducts[0]], // Only first product due to limit
					total: 1,
				}),
			);
		});
	});
	describe("getProductById", () => {
		const mockProduct = {
			id: "1",
			name: "Laptop",
			price: 999.99,
			category: "electronics",
			rating: 4.5,
			stock: 10,
			description: "High-performance laptop",
		};

		it("should return product by ID successfully", () => {
			mockRequest.params = { id: "1" };
			mockedGetProductById.mockReturnValue(mockProduct);

			productController.getProductById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetProductById).toHaveBeenCalledWith("1");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Product with ID 1",
					product: mockProduct,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
		it("should return 404 when product not found", () => {
			mockRequest.params = { id: "999" };
			mockedGetProductById.mockReturnValue(undefined);

			productController.getProductById(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetProductById).toHaveBeenCalledWith("999");
			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					error: "Product not found",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
	describe("getProductsByCategory", () => {
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
		];

		it("should return products by category successfully", () => {
			mockRequest.params = { category: "electronics" };
			mockedGetProductsByCategory.mockReturnValue(mockProducts);

			productController.getProductsByCategory(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedGetProductsByCategory).toHaveBeenCalledWith("electronics");
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Products in category: electronics",
					products: mockProducts,
					total: 1,
					category: "electronics",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
	});
	describe("searchProducts", () => {
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
				name: "Gaming Laptop",
				price: 1999.99,
				category: "electronics",
				rating: 4.8,
				stock: 5,
				description: "High-end gaming laptop",
			},
		];

		it("should search products with basic query", () => {
			mockRequest.query = { q: "laptop" };
			mockedSearchProducts.mockReturnValue(mockProducts);

			productController.searchProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockedSearchProducts).toHaveBeenCalledWith("laptop", undefined);
			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					message: "Search completed",
					products: mockProducts,
					total: 2,
					filters: {
						query: "laptop",
						category: null,
						minPrice: null,
						maxPrice: null,
						minRating: null,
					},
				}),
			);
		});

		it("should filter products by price range", () => {
			mockRequest.query = { q: "laptop", minPrice: "1000", maxPrice: "2000" };
			mockedSearchProducts.mockReturnValue(mockProducts);

			productController.searchProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					products: [mockProducts[1]], // Only gaming laptop within price range
					total: 1,
					filters: {
						query: "laptop",
						category: null,
						minPrice: "1000",
						maxPrice: "2000",
						minRating: null,
					},
				}),
			);
		});

		it("should filter products by minimum rating", () => {
			mockRequest.query = { q: "laptop", minRating: "4.7" };
			mockedSearchProducts.mockReturnValue(mockProducts);

			productController.searchProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			expect(mockStatus).toHaveBeenCalledWith(200);
			expect(mockJson).toHaveBeenCalledWith(
				expect.objectContaining({
					products: [mockProducts[1]], // Only gaming laptop with rating >= 4.7
					total: 1,
				}),
			);
		});
	});
	describe("getFeaturedProducts", () => {
		const mockProducts = [
			{
				id: "1",
				name: "Premium Laptop",
				price: 999.99,
				category: "electronics",
				rating: 4.8,
				stock: 10,
				description: "Premium gaming laptop",
			},
			{
				id: "2",
				name: "Gaming Mouse",
				price: 79.99,
				category: "electronics",
				rating: 4.9,
				stock: 20,
				description: "Professional gaming mouse",
			},
		];

		it("should return featured products with delay", (done) => {
			mockedGetAllProducts.mockReturnValue(mockProducts);

			productController.getFeaturedProducts(
				mockRequest as Request,
				mockResponse as Response,
			);

			// Wait for the setTimeout to complete
			setTimeout(() => {
				expect(mockedGetAllProducts).toHaveBeenCalled();
				expect(mockStatus).toHaveBeenCalledWith(200);
				expect(mockJson).toHaveBeenCalledWith(
					expect.objectContaining({
						message: "Featured products retrieved",
						products: mockProducts, // Both products have rating >= 4.5
						total: 2,
						responseTime: expect.stringMatching(/\d+ms/),
					}),
				);
				done();
			}, 300); // Wait longer than the maximum delay (250ms)
		});
	});
});
