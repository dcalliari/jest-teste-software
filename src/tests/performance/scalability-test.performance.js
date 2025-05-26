import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Horizontal Scalability Test Configuration
// Tests how the system handles increasing load by gradually scaling up users
export const options = {
	stages: [
		// Phase 1: Baseline - 10 users
		{ duration: "5m", target: 10 },
		{ duration: "5m", target: 10 },

		// Phase 2: Scale to 25 users
		{ duration: "2m", target: 25 },
		{ duration: "5m", target: 25 },

		// Phase 3: Scale to 50 users
		{ duration: "2m", target: 50 },
		{ duration: "5m", target: 50 },

		// Phase 4: Scale to 100 users
		{ duration: "3m", target: 100 },
		{ duration: "5m", target: 100 },

		// Phase 5: Scale to 200 users
		{ duration: "3m", target: 200 },
		{ duration: "5m", target: 200 },

		// Phase 6: Scale to 300 users (peak load)
		{ duration: "3m", target: 300 },
		{ duration: "5m", target: 300 },

		// Gradual scale down to observe recovery
		{ duration: "3m", target: 100 },
		{ duration: "3m", target: 50 },
		{ duration: "3m", target: 0 },
	],
	thresholds: {
		// Scalability thresholds - observe degradation patterns
		http_req_duration: [
			"p(50)<1000", // 50% under 1s
			"p(95)<5000", // 95% under 5s (allows for degradation)
		],
		http_req_failed: ["rate<0.05"], // Less than 5% failure rate
		scalability_score: ["value>0.7"], // Custom scalability metric
		throughput_per_user: ["value>0.8"], // Throughput efficiency
	},
	ext: {
		loadimpact: {
			projectID: 3649739,
			name: "ShopFast Horizontal Scalability Test",
		},
	},
};

// Base URL
const BASE_URL = "http://localhost:3000";

// Test scenarios for scalability testing
const scenarios = [
	"browse_products",
	"search_and_filter",
	"cart_operations",
	"user_authentication",
	"quick_checkout",
];

const testUsers = Array.from({ length: 50 }, (_, i) => ({
	email: `scale.user${i + 1}@test.com`,
	password: "password123",
}));

// Custom metrics for scalability analysis
import { Trend, Counter, Rate, Gauge } from "k6/metrics";

const scalabilityScore = new Gauge("scalability_score");
const throughputPerUser = new Gauge("throughput_per_user");
const concurrentUsers = new Gauge("concurrent_users");
const responseTimeByLoad = new Trend("response_time_by_load");
const successRateByLoad = new Rate("success_rate_by_load");
const apiCallsPerMinute = new Counter("api_calls_per_minute");

export default function () {
	// Track current load level
	const currentVUs = __ENV.K6_VUS || 1;
	concurrentUsers.add(currentVUs);

	// Select scenario based on scalability testing needs
	const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
	const user = testUsers[Math.floor(Math.random() * testUsers.length)];

	const startTime = Date.now();
	let requestCount = 0;
	let successfulRequests = 0;

	try {
		switch (scenario) {
			case "browse_products":
				executeProductBrowsingScenario();
				break;
			case "search_and_filter":
				executeSearchScenario();
				break;
			case "cart_operations":
				executeCartScenario(user);
				break;
			case "user_authentication":
				executeAuthScenario(user);
				break;
			case "quick_checkout":
				executeQuickCheckoutScenario(user);
				break;
		}
	} catch (error) {
		console.error(`Scalability test error in ${scenario}:`, error);
	}

	// Calculate scalability metrics
	const sessionDuration = Date.now() - startTime;
	const requestsPerSecond = requestCount / (sessionDuration / 1000);

	// Update scalability metrics
	responseTimeByLoad.add(sessionDuration / requestCount);
	apiCallsPerMinute.add(requestCount);

	// Calculate scalability score (simplified)
	const baselineRPS = 2; // Expected RPS per user at baseline
	const currentRPS = requestsPerSecond;
	const efficiency = Math.min(currentRPS / baselineRPS, 1);
	scalabilityScore.add(efficiency);

	throughputPerUser.add(requestsPerSecond);

	// Think time varies by load to simulate realistic user behavior
	const thinkTime =
		currentVUs > 100 ? Math.random() * 2 + 1 : Math.random() * 3 + 2;
	sleep(thinkTime);

	// Helper functions for different scenarios
	function executeProductBrowsingScenario() {
		// Simple product browsing
		let response = http.get(`${BASE_URL}/api/products?page=1&limit=12`);
		requestCount++;

		if (
			check(response, {
				"products loaded": (r) => r.status === 200,
				"response time acceptable": (r) => r.timings.duration < 3000,
			})
		) {
			successfulRequests++;
		}

		sleep(1);

		// View random product
		const productId = Math.floor(Math.random() * 10) + 1;
		response = http.get(`${BASE_URL}/api/products/${productId}`);
		requestCount++;

		if (
			check(response, {
				"product details loaded": (r) => r.status === 200,
			})
		) {
			successfulRequests++;
		}
	}

	function executeSearchScenario() {
		const searchTerms = ["laptop", "phone", "camera", "headphones"];
		const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

		let response = http.get(
			`${BASE_URL}/api/products/search?q=${term}&page=1&limit=10`,
		);
		requestCount++;

		if (
			check(response, {
				"search completed": (r) => r.status === 200,
				"search response time ok": (r) => r.timings.duration < 2500,
			})
		) {
			successfulRequests++;
		}

		sleep(0.5);

		// Filter by category
		response = http.get(
			`${BASE_URL}/api/products?category=electronics&page=1&limit=10`,
		);
		requestCount++;

		if (
			check(response, {
				"filter applied": (r) => r.status === 200,
			})
		) {
			successfulRequests++;
		}
	}

	function executeCartScenario(user) {
		// Login first
		let response = http.post(
			`${BASE_URL}/api/users/login`,
			JSON.stringify({
				email: user.email,
				password: user.password,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
		requestCount++;

		if (!check(response, { "login ok": (r) => r.status === 200 })) {
			return;
		}

		successfulRequests++;
		const authToken = response.json().token;

		// Add to cart
		response = http.post(
			`${BASE_URL}/api/cart/add`,
			JSON.stringify({
				productId: Math.floor(Math.random() * 10) + 1,
				quantity: Math.floor(Math.random() * 3) + 1,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		requestCount++;

		if (check(response, { "item added to cart": (r) => r.status === 200 })) {
			successfulRequests++;
		}

		sleep(0.5);

		// View cart
		response = http.get(`${BASE_URL}/api/cart`, {
			headers: { Authorization: `Bearer ${authToken}` },
		});
		requestCount++;

		if (check(response, { "cart viewed": (r) => r.status === 200 })) {
			successfulRequests++;
		}
	}

	function executeAuthScenario(user) {
		// Login
		let response = http.post(
			`${BASE_URL}/api/users/login`,
			JSON.stringify({
				email: user.email,
				password: user.password,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
		requestCount++;

		if (
			!check(response, {
				"login successful": (r) => r.status === 200,
				"login response time ok": (r) => r.timings.duration < 1500,
			})
		) {
			return;
		}

		successfulRequests++;
		const authToken = response.json().token;

		sleep(1);

		// Get profile
		response = http.get(`${BASE_URL}/api/users/profile`, {
			headers: { Authorization: `Bearer ${authToken}` },
		});
		requestCount++;

		if (check(response, { "profile retrieved": (r) => r.status === 200 })) {
			successfulRequests++;
		}

		// Logout
		response = http.post(
			`${BASE_URL}/api/users/logout`,
			{},
			{
				headers: { Authorization: `Bearer ${authToken}` },
			},
		);
		requestCount++;

		if (check(response, { "logout successful": (r) => r.status === 200 })) {
			successfulRequests++;
		}
	}

	function executeQuickCheckoutScenario(user) {
		// Rapid checkout flow
		let response = http.post(
			`${BASE_URL}/api/users/login`,
			JSON.stringify({
				email: user.email,
				password: user.password,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
		requestCount++;

		if (!check(response, { "quick login ok": (r) => r.status === 200 })) {
			return;
		}

		successfulRequests++;
		const authToken = response.json().token;

		// Quick add to cart
		response = http.post(
			`${BASE_URL}/api/cart/add`,
			JSON.stringify({
				productId: Math.floor(Math.random() * 5) + 1, // Popular products
				quantity: 1,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		requestCount++;

		if (check(response, { "quick add ok": (r) => r.status === 200 })) {
			successfulRequests++;
		}

		// Quick checkout
		response = http.post(
			`${BASE_URL}/api/checkout/process`,
			JSON.stringify({
				paymentMethod: "credit_card",
				billingAddress: {
					street: "123 Test St",
					city: "Test City",
					zipCode: "12345",
				},
			}),
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		requestCount++;

		if (
			check(response, {
				"quick checkout completed": (r) => r.status === 200,
				"checkout response time acceptable": (r) => r.timings.duration < 4000,
			})
		) {
			successfulRequests++;
		}
	}

	// Update success rate
	successRateByLoad.add(successfulRequests / requestCount);
}

// Custom summary with scalability analysis
export function handleSummary(data) {
	// Calculate scalability insights
	const baselineResponseTime = 500; // ms
	const currentAvgResponseTime =
		data.metrics.http_req_duration?.values?.avg || 0;
	const degradationFactor = currentAvgResponseTime / baselineResponseTime;

	const scalabilityAnalysis = {
		performance_degradation: `${((degradationFactor - 1) * 100).toFixed(1)}%`,
		scalability_rating:
			degradationFactor < 1.5
				? "Excellent"
				: degradationFactor < 2.0
					? "Good"
					: degradationFactor < 3.0
						? "Fair"
						: "Poor",
		recommended_max_users:
			currentAvgResponseTime < 2000
				? "300+"
				: currentAvgResponseTime < 3000
					? "200"
					: currentAvgResponseTime < 5000
						? "100"
						: "50",
	};

	return {
		"scalability-test-results.html": htmlReport(data),
		stdout: textSummary(data, { indent: " ", enableColors: true }),
		"scalability-test-summary.json": JSON.stringify(
			{
				...data,
				test_type: "Horizontal Scalability Test",
				test_description:
					"Tests system performance as user load increases from 10 to 300 concurrent users",
				scalability_phases: [
					{ phase: "Baseline", users: 10, duration: "10m" },
					{ phase: "Light Load", users: 25, duration: "7m" },
					{ phase: "Medium Load", users: 50, duration: "7m" },
					{ phase: "High Load", users: 100, duration: "8m" },
					{ phase: "Heavy Load", users: 200, duration: "8m" },
					{ phase: "Peak Load", users: 300, duration: "8m" },
					{ phase: "Recovery", users: "300→0", duration: "9m" },
				],
				scalability_analysis: scalabilityAnalysis,
				key_metrics: {
					max_concurrent_users: 300,
					avg_response_time: data.metrics.http_req_duration?.values?.avg,
					p95_response_time: data.metrics.http_req_duration?.values?.["p(95)"],
					p99_response_time: data.metrics.http_req_duration?.values?.["p(99)"],
					failure_rate: data.metrics.http_req_failed?.values?.rate,
					total_requests: data.metrics.http_reqs?.values?.count,
					requests_per_second: data.metrics.http_reqs?.values?.rate,
					scalability_score: data.metrics.scalability_score?.values?.value,
					throughput_per_user: data.metrics.throughput_per_user?.values?.value,
				},
			},
			null,
			2,
		),
	};
}
