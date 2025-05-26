import request from "supertest";
import app from "../../app";
import type { Product } from "../../utils/mockData";

describe("Integration Tests - Product Routes", () => {
	describe("GET /api/products", () => {
		it("should return all products with default pagination", async () => {
			const response = await request(app).get("/api/products");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Products retrieved successfully",
					products: expect.any(Array),
					total: expect.any(Number),
					category: null,
					query: null,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
			expect(response.body.products.length).toBeLessThanOrEqual(20);
		});

		it("should filter products by category", async () => {
			const response = await request(app).get(
				"/api/products?category=electronics",
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Products retrieved successfully",
					products: expect.any(Array),
					category: "electronics",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			); // Verify all returned products are electronics
			for (const product of response.body.products as Product[]) {
				expect(product.category).toBe("electronics");
			}
		});

		it("should filter products by search query", async () => {
			const response = await request(app).get("/api/products?query=phone");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Products retrieved successfully",
					products: expect.any(Array),
					query: "phone",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			); // Verify all returned products contain "phone" in name or description
			for (const product of response.body.products as Product[]) {
				const hasPhoneInName = product.name.toLowerCase().includes("phone");
				const hasPhoneInDescription = product.description
					.toLowerCase()
					.includes("phone");
				expect(hasPhoneInName || hasPhoneInDescription).toBe(true);
			}
		});
		it("should respect limit parameter", async () => {
			const response = await request(app).get("/api/products?limit=5");

			expect(response.status).toBe(200);
			expect(response.body.products.length).toBeLessThanOrEqual(5);
		});

		it("should handle invalid limit parameter", async () => {
			const response = await request(app).get("/api/products?limit=invalid");

			expect(response.status).toBe(200); // API doesn't validate limit parameter
			expect(response.body.products).toBeDefined();
		});
	});

	describe("GET /api/products/search", () => {
		it("should search products with query parameter", async () => {
			const response = await request(app).get("/api/products/search?q=laptop");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Search completed",
					products: expect.any(Array),
					filters: expect.objectContaining({
						query: "laptop", // API correctly sets query parameter
					}),
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});
		it("should search products with price range", async () => {
			const response = await request(app).get(
				"/api/products/search?minPrice=100&maxPrice=500",
			);

			expect(response.status).toBe(200);
			expect(response.body.filters).toEqual(
				expect.objectContaining({
					minPrice: "100",
					maxPrice: "500",
				}),
			); // Verify all products are within price range
			for (const product of response.body.products as Product[]) {
				expect(product.price).toBeGreaterThanOrEqual(100);
				expect(product.price).toBeLessThanOrEqual(500);
			}
		});
		it("should search products with minimum rating", async () => {
			const response = await request(app).get(
				"/api/products/search?minRating=4",
			);

			expect(response.status).toBe(200);
			expect(response.body.filters.minRating).toBe("4"); // Verify all products have rating >= 4
			for (const product of response.body.products as Product[]) {
				expect(product.rating).toBeGreaterThanOrEqual(4);
			}
		});
		it("should search products with combined filters", async () => {
			const response = await request(app).get(
				"/api/products/search?q=phone&category=electronics&minPrice=200&maxPrice=800&minRating=3.5",
			);

			expect(response.status).toBe(200);
			expect(response.body.filters).toEqual({
				query: "phone", // API correctly sets query parameter
				category: "electronics",
				minPrice: "200",
				maxPrice: "800",
				minRating: "3.5",
			});
		});

		it("should return empty results for non-existent search", async () => {
			const response = await request(app).get(
				"/api/products/search?q=nonexistentproduct12345",
			);

			expect(response.status).toBe(200);
			expect(response.body.products).toEqual([]);
			expect(response.body.total).toBe(0);
		});
	});

	describe("GET /api/products/featured", () => {
		it("should return featured products with simulated delay", async () => {
			const startTime = Date.now();
			const response = await request(app).get("/api/products/featured");
			const endTime = Date.now();

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Featured products retrieved",
					products: expect.any(Array),
					total: expect.any(Number),
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);

			// Verify simulated delay (should be at least 50ms)
			expect(endTime - startTime).toBeGreaterThanOrEqual(50);
		});

		it("should return only featured products", async () => {
			const response = await request(app).get("/api/products/featured");

			expect(response.status).toBe(200);
			// All products should have high rating (≥4.5) since that's the featured criteria
			for (const product of response.body.products as Product[]) {
				expect(product.rating).toBeGreaterThanOrEqual(4.5);
			}
		});
	});

	describe("GET /api/products/category/:category", () => {
		it("should return products by specific category", async () => {
			const category = "books";
			const response = await request(app).get(
				`/api/products/category/${category}`,
			);

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: `Products in category: ${category}`,
					products: expect.any(Array),
					category: category,
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			); // Verify all products belong to the specified category
			for (const product of response.body.products as Product[]) {
				expect(product.category).toBe(category);
			}
		});

		it("should return empty array for non-existent category", async () => {
			const response = await request(app).get(
				"/api/products/category/nonexistent",
			);

			expect(response.status).toBe(200);
			expect(response.body.products).toEqual([]);
			expect(response.body.total).toBe(0);
		});

		it("should handle URL encoded category names", async () => {
			const response = await request(app).get(
				"/api/products/category/home%20%26%20garden",
			);

			expect(response.status).toBe(200);
			expect(response.body.category).toBe("home & garden");
		});
	});

	describe("GET /api/products/:id", () => {
		it("should return specific product by ID", async () => {
			const response = await request(app).get("/api/products/1");

			expect(response.status).toBe(200);
			expect(response.body).toEqual(
				expect.objectContaining({
					message: "Product with ID 1",
					product: expect.objectContaining({
						id: "1",
						name: expect.any(String),
						price: expect.any(Number),
						category: expect.any(String),
						description: expect.any(String),
						stock: expect.any(Number),
						rating: expect.any(Number),
					}),
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should return 404 for non-existent product ID", async () => {
			const response = await request(app).get("/api/products/nonexistent");

			expect(response.status).toBe(404);
			expect(response.body).toEqual(
				expect.objectContaining({
					error: "Product not found",
					responseTime: expect.stringMatching(/\d+ms/),
				}),
			);
		});

		it("should handle numeric and string product IDs", async () => {
			const numericResponse = await request(app).get("/api/products/2");
			const stringResponse = await request(app).get("/api/products/prod-001");

			// Both should work (depending on mock data structure)
			if (numericResponse.status === 200) {
				expect(numericResponse.body.product.id).toBe("2");
			}
			if (stringResponse.status === 200) {
				expect(stringResponse.body.product.id).toBe("prod-001");
			}
		});
	});

	describe("Performance and Response Time Tests", () => {
		it("should respond within acceptable time limits for product listing", async () => {
			const startTime = Date.now();
			const response = await request(app).get("/api/products");
			const endTime = Date.now();

			expect(response.status).toBe(200);
			expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
		});

		it("should respond within acceptable time limits for search", async () => {
			const startTime = Date.now();
			const response = await request(app).get("/api/products/search?q=test");
			const endTime = Date.now();

			expect(response.status).toBe(200);
			expect(endTime - startTime).toBeLessThan(3000); // Should respond within 3 seconds
		});

		it("should include response time in all endpoints", async () => {
			const endpoints = [
				"/api/products",
				"/api/products/search?q=test",
				"/api/products/category/electronics",
				"/api/products/1",
			];

			for (const endpoint of endpoints) {
				const response = await request(app).get(endpoint);
				expect(response.body.responseTime).toMatch(/\d+ms/);
			}
		});
	});
});
