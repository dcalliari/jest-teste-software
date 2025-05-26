const axios = require("axios");

async function testPerformance() {
	console.log("🔍 ShopFast API Performance Monitor");
	console.log("=====================================");

	const baseUrl = "http://localhost:3000";
	const endpoints = [
		"/api/products",
		"/api/products/search?q=laptop",
		"/api/products/featured",
		"/api/products/1",
		"/api/cart",
		"/api/checkout/validate",
		"/api/users/profile/1",
	];

	const results = [];

	for (const endpoint of endpoints) {
		const startTime = Date.now();
		try {
			const response = await axios.get(`${baseUrl}${endpoint}`, {
				timeout: 5000,
			});
			const responseTime = Date.now() - startTime;

			console.log(`✅ GET ${endpoint}: ${responseTime}ms (${response.status})`);
			results.push({
				endpoint,
				responseTime,
				status: response.status,
				success: true,
			});
		} catch (error) {
			const responseTime = Date.now() - startTime;
			console.log(
				`❌ GET ${endpoint}: ${responseTime}ms (${error.response?.status || "ERROR"})`,
			);
			results.push({
				endpoint,
				responseTime,
				status: error.response?.status || 0,
				success: false,
			});
		}
	}

	// Calculate statistics
	const avgResponseTime =
		results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
	const successRate =
		(results.filter((r) => r.success).length / results.length) * 100;

	console.log("\n📊 Performance Summary:");
	console.log(`Average Response Time: ${Math.round(avgResponseTime)}ms`);
	console.log(`Success Rate: ${successRate.toFixed(1)}%`);
	console.log(`Total Endpoints Tested: ${results.length}`);
}

testPerformance().catch((error) => {
	console.error("❌ Error:", error.message);
});
