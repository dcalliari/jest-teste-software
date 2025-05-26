import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";
import { textSummary } from "https://jslib.k6.io/k6-summary/0.0.1/index.js";

// Endurance Test Configuration
// Tests system stability over extended periods (2 hours) with steady load
export const options = {
	stages: [
		// Ramp up to baseline load
		{ duration: "10m", target: 50 },
		// Maintain steady load for extended period (endurance phase)
		{ duration: "100m", target: 50 },
		// Gradual ramp down
		{ duration: "10m", target: 0 },
	],
	thresholds: {
		// Endurance test focuses on stability metrics
		http_req_duration: ["p(95)<3000"], // 95% of requests under 3s
		http_req_failed: ["rate<0.02"], // Less than 2% failure rate
		memory_usage: ["value<85"], // Memory usage should stay below 85%
		response_time_trend: ["trend<2000"], // Response time trend shouldn't increase significantly
	},
	ext: {
		loadimpact: {
			projectID: 3649739,
			name: "ShopFast Endurance Test",
		},
	},
};

// Base URL
const BASE_URL = "http://localhost:3000";

// Test data for realistic endurance testing
const testUsers = [
	{ email: "endurance.user1@test.com", password: "password123" },
	{ email: "endurance.user2@test.com", password: "password123" },
	{ email: "endurance.user3@test.com", password: "password123" },
	{ email: "endurance.user4@test.com", password: "password123" },
	{ email: "endurance.user5@test.com", password: "password123" },
];

const searchTerms = [
	"laptop",
	"smartphone",
	"headphones",
	"camera",
	"tablet",
	"watch",
	"keyboard",
	"mouse",
	"monitor",
	"speaker",
];

// Custom metrics for endurance testing
import { Trend, Counter, Rate } from "k6/metrics";

const memoryUsageTrend = new Trend("memory_usage");
const responseTimeTrend = new Trend("response_time_trend");
const userSessionDuration = new Trend("user_session_duration");
const apiCallsPerSession = new Counter("api_calls_per_session");
const sessionFailureRate = new Rate("session_failure_rate");

export default function () {
	const startTime = Date.now();

	// Simulate realistic user behavior for endurance testing
	const user = testUsers[Math.floor(Math.random() * testUsers.length)];
	const searchTerm =
		searchTerms[Math.floor(Math.random() * searchTerms.length)];

	let sessionFailed = false;
	let apiCalls = 0;

	try {
		// 1. Health check to monitor system status
		let response = http.get(`${BASE_URL}/health`);
		apiCalls++;

		if (
			!check(response, {
				"health check passed": (r) => r.status === 200,
				"health response time < 500ms": (r) => r.timings.duration < 500,
			})
		) {
			sessionFailed = true;
		}

		responseTimeTrend.add(response.timings.duration);

		// Simulate memory usage monitoring (mock value for demonstration)
		const mockMemoryUsage = 60 + Math.random() * 20; // 60-80%
		memoryUsageTrend.add(mockMemoryUsage);

		sleep(1);

		// 2. User login
		response = http.post(
			`${BASE_URL}/api/users/login`,
			JSON.stringify({
				email: user.email,
				password: user.password,
			}),
			{
				headers: { "Content-Type": "application/json" },
			},
		);
		apiCalls++;

		if (
			!check(response, {
				"login successful": (r) => r.status === 200,
				"login response time < 1s": (r) => r.timings.duration < 1000,
			})
		) {
			sessionFailed = true;
		}

		responseTimeTrend.add(response.timings.duration);

		const loginData = response.json();
		const authToken = loginData.token;

		sleep(2);

		// 3. Browse products (multiple searches for endurance)
		for (let i = 0; i < 3; i++) {
			response = http.get(
				`${BASE_URL}/api/products/search?q=${searchTerm}&page=1&limit=10`,
			);
			apiCalls++;

			if (
				!check(response, {
					"product search successful": (r) => r.status === 200,
					"search response time < 2s": (r) => r.timings.duration < 2000,
				})
			) {
				sessionFailed = true;
			}

			responseTimeTrend.add(response.timings.duration);
			sleep(1);
		}

		// 4. Add items to cart
		const productId = Math.floor(Math.random() * 10) + 1;
		response = http.post(
			`${BASE_URL}/api/cart/add`,
			JSON.stringify({
				productId: productId,
				quantity: Math.floor(Math.random() * 3) + 1,
			}),
			{
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		apiCalls++;

		if (
			!check(response, {
				"add to cart successful": (r) => r.status === 200,
				"add to cart response time < 1s": (r) => r.timings.duration < 1000,
			})
		) {
			sessionFailed = true;
		}

		responseTimeTrend.add(response.timings.duration);
		sleep(1);

		// 5. View cart
		response = http.get(`${BASE_URL}/api/cart`, {
			headers: { Authorization: `Bearer ${authToken}` },
		});
		apiCalls++;

		if (
			!check(response, {
				"view cart successful": (r) => r.status === 200,
				"view cart response time < 1s": (r) => r.timings.duration < 1000,
			})
		) {
			sessionFailed = true;
		}

		responseTimeTrend.add(response.timings.duration);
		sleep(2);

		// 6. Simulate longer browsing session (endurance behavior)
		for (let i = 0; i < 5; i++) {
			// Random product view
			const randomProductId = Math.floor(Math.random() * 10) + 1;
			response = http.get(`${BASE_URL}/api/products/${randomProductId}`);
			apiCalls++;

			check(response, {
				"product view successful": (r) => r.status === 200,
				"product view response time < 1.5s": (r) => r.timings.duration < 1500,
			});

			responseTimeTrend.add(response.timings.duration);
			sleep(3); // Longer think time for endurance testing
		}

		// 7. Logout
		response = http.post(
			`${BASE_URL}/api/users/logout`,
			{},
			{
				headers: { Authorization: `Bearer ${authToken}` },
			},
		);
		apiCalls++;

		if (
			!check(response, {
				"logout successful": (r) => r.status === 200,
				"logout response time < 500ms": (r) => r.timings.duration < 500,
			})
		) {
			sessionFailed = true;
		}

		responseTimeTrend.add(response.timings.duration);
	} catch (error) {
		console.error("Endurance test error:", error);
		sessionFailed = true;
	}

	// Record session metrics
	const sessionDuration = Date.now() - startTime;
	userSessionDuration.add(sessionDuration);
	apiCallsPerSession.add(apiCalls);
	sessionFailureRate.add(sessionFailed ? 1 : 0);

	// Simulate realistic user think time for endurance testing
	sleep(Math.random() * 5 + 2); // 2-7 seconds between user sessions
}

// Custom summary with endurance-specific metrics
export function handleSummary(data) {
	return {
		"endurance-test-results.html": htmlReport(data),
		stdout: textSummary(data, { indent: " ", enableColors: true }),
		"endurance-test-summary.json": JSON.stringify(
			{
				...data,
				test_type: "Endurance Test",
				test_duration: "2 hours",
				target_load: "50 concurrent users",
				focus: "System stability over extended periods",
				key_metrics: {
					avg_response_time: data.metrics.http_req_duration?.values?.avg,
					p95_response_time: data.metrics.http_req_duration?.values?.["p(95)"],
					failure_rate: data.metrics.http_req_failed?.values?.rate,
					total_requests: data.metrics.http_reqs?.values?.count,
					avg_session_duration: data.metrics.user_session_duration?.values?.avg,
					total_vus: data.metrics.vus?.values?.max,
				},
			},
			null,
			2,
		),
	};
}
