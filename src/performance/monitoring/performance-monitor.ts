/**
 * Performance Monitoring Script for ShopFast API
 * Collects real-time performance metrics and generates reports
 */

import axios, { AxiosError } from "axios";
import fs from "node:fs";
import path from "node:path";

interface PerformanceMetric {
	endpoint: string;
	method: string;
	responseTime: number;
	statusCode: number;
	timestamp: Date;
	success: boolean;
}

interface EndpointStats {
	endpoint: string;
	method: string;
	avgResponseTime: number;
	successRate: number;
	requestCount: number;
	lastChecked: Date;
	status: "excellent" | "good" | "warning" | "poor";
}

class PerformanceMonitor {
	private baseUrl: string;
	private metrics: PerformanceMetric[] = [];
	private endpoints = [
		{ path: "/api/products", method: "GET" },
		{
			path: "/api/products/search?q=laptop&category=electronics",
			method: "GET",
		},
		{ path: "/api/products/featured", method: "GET" },
		{ path: "/api/products/1", method: "GET" },
		{ path: "/api/cart", method: "GET" },
		{ path: "/api/checkout/validate", method: "GET" },
		{ path: "/api/users/profile/1", method: "GET" },
	];

	constructor({
		baseUrl = "http://localhost:3000",
	}: { baseUrl?: string } = {}) {
		this.baseUrl = baseUrl;
	}

	/**
	 * Test a single endpoint and record performance metrics
	 */
	async testEndpoint(endpoint: {
		path: string;
		method: string;
	}): Promise<PerformanceMetric> {
		const startTime = Date.now();
		let success = false;
		let statusCode = 0;

		try {
			const response = await axios({
				method: endpoint.method.toLowerCase() as
					| "get"
					| "post"
					| "put"
					| "delete"
					| "patch"
					| "head"
					| "options",
				url: `${this.baseUrl}${endpoint.path}`,
				timeout: 5000,
				headers: {
					"Content-Type": "application/json",
				},
			});

			statusCode = response.status;
			success = statusCode >= 200 && statusCode < 400;
		} catch (error: unknown) {
			if (error instanceof AxiosError) {
				statusCode = error.response?.status || 0;
			}
			success = false;
		}

		const responseTime = Date.now() - startTime;

		const metric: PerformanceMetric = {
			endpoint: endpoint.path,
			method: endpoint.method,
			responseTime,
			statusCode,
			timestamp: new Date(),
			success,
		};

		this.metrics.push(metric);
		return metric;
	}

	/**
	 * Run performance tests on all endpoints
	 */
	async runPerformanceTest(): Promise<PerformanceMetric[]> {
		console.log("🚀 Starting performance monitoring...");
		const results: PerformanceMetric[] = [];

		for (const endpoint of this.endpoints) {
			try {
				const metric = await this.testEndpoint(endpoint);
				results.push(metric);
				console.log(
					`✅ ${endpoint.method} ${endpoint.path}: ${metric.responseTime}ms (${metric.statusCode})`,
				);
			} catch (error) {
				console.error(
					`❌ Error testing ${endpoint.method} ${endpoint.path}:`,
					error,
				);
			}

			// Small delay between requests
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		return results;
	}

	/**
	 * Calculate statistics for each endpoint
	 */
	getEndpointStats(): EndpointStats[] {
		const endpointGroups = this.groupMetricsByEndpoint();
		const stats: EndpointStats[] = [];

		for (const [key, metrics] of endpointGroups.entries()) {
			const successfulMetrics = metrics.filter((m) => m.success);
			const avgResponseTime =
				metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
			const successRate = (successfulMetrics.length / metrics.length) * 100;

			let status: "excellent" | "good" | "warning" | "poor" = "excellent";
			if (avgResponseTime > 200 || successRate < 95) status = "poor";
			else if (avgResponseTime > 100 || successRate < 98) status = "warning";
			else if (avgResponseTime > 50 || successRate < 99) status = "good";

			const [endpoint, method] = key.split("|");
			stats.push({
				endpoint,
				method,
				avgResponseTime: Math.round(avgResponseTime),
				successRate: Math.round(successRate * 100) / 100,
				requestCount: metrics.length,
				lastChecked: new Date(),
				status,
			});
		}

		return stats.sort((a, b) => a.avgResponseTime - b.avgResponseTime);
	}

	/**
	 * Group metrics by endpoint
	 */
	private groupMetricsByEndpoint(): Map<string, PerformanceMetric[]> {
		const groups = new Map<string, PerformanceMetric[]>();

		for (const metric of this.metrics) {
			const key = `${metric.endpoint}|${metric.method}`;
			if (!groups.has(key)) {
				groups.set(key, []);
			}
			groups.get(key)?.push(metric);
		}

		return groups;
	}

	/**
	 * Generate performance report
	 */
	generateReport(): string {
		const stats = this.getEndpointStats();
		const totalRequests = this.metrics.length;
		const successfulRequests = this.metrics.filter((m) => m.success).length;
		const overallSuccessRate = (successfulRequests / totalRequests) * 100;
		const avgResponseTime =
			this.metrics.reduce((sum, m) => sum + m.responseTime, 0) / totalRequests;

		let report = `
			# 📊 ShopFast API Performance Report
			Generated: ${new Date().toISOString()}

			## 🎯 Overall Metrics
			- **Total Requests**: ${totalRequests}
			- **Success Rate**: ${overallSuccessRate.toFixed(2)}%
			- **Average Response Time**: ${avgResponseTime.toFixed(0)}ms
			- **Failed Requests**: ${totalRequests - successfulRequests}

			## 📈 Endpoint Performance

			| Endpoint | Method | Avg Response Time | Success Rate | Requests | Status |
			|----------|--------|------------------|--------------|----------|---------|
		`;

		for (const stat of stats) {
			const statusEmoji = {
				excellent: "🟢",
				good: "🔵",
				warning: "🟡",
				poor: "🔴",
			}[stat.status];

			report += `| ${stat.endpoint} | ${stat.method} | ${stat.avgResponseTime}ms | ${stat.successRate}% | ${stat.requestCount} | ${statusEmoji} ${stat.status} |\n`;
		}

		report += `
			## 🔍 Recommendations
		`;

		const slowEndpoints = stats.filter((s) => s.avgResponseTime > 100);
		const lowSuccessRate = stats.filter((s) => s.successRate < 99);

		if (slowEndpoints.length > 0) {
			report += "### ⚠️ Performance Concerns\n";
			for (const endpoint of slowEndpoints) {
				report += `- **${endpoint.endpoint}**: ${endpoint.avgResponseTime}ms response time (target: <100ms)\n`;
			}
			report += "\n";
		}

		if (lowSuccessRate.length > 0) {
			report += "### 🚨 Reliability Concerns\n";
			for (const endpoint of lowSuccessRate) {
				report += `- **${endpoint.endpoint}**: ${endpoint.successRate}% success rate (target: >99%)\n`;
			}
			report += "\n";
		}

		if (slowEndpoints.length === 0 && lowSuccessRate.length === 0) {
			report +=
				"### ✅ All Systems Performing Well\nAll endpoints are meeting performance and reliability targets.\n\n";
		}

		return report;
	}

	/**
	 * Save metrics to JSON file
	 */
	saveMetrics({
		filename = "performance-metrics.json",
	}: { filename?: string } = {}): void {
		const data = {
			timestamp: new Date().toISOString(),
			metrics: this.metrics,
			stats: this.getEndpointStats(),
			summary: {
				totalRequests: this.metrics.length,
				successRate:
					(this.metrics.filter((m) => m.success).length / this.metrics.length) *
					100,
				avgResponseTime:
					this.metrics.reduce((sum, m) => sum + m.responseTime, 0) /
					this.metrics.length,
			},
		};

		const outputPath = path.join(
			process.cwd(),
			"src",
			"performance",
			"reports",
			filename,
		);

		// Ensure directory exists
		const dir = path.dirname(outputPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}

		fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
		console.log(`📁 Metrics saved to: ${outputPath}`);
	}

	/**
	 * Clear stored metrics
	 */
	clearMetrics(): void {
		this.metrics = [];
	}
}

/**
 * Main execution function
 */
async function main() {
	const monitor = new PerformanceMonitor();

	console.log("🔍 ShopFast API Performance Monitor");
	console.log("=====================================");

	try {
		// Run performance tests
		await monitor.runPerformanceTest();

		// Generate and display report
		const report = monitor.generateReport();
		console.log(report);

		// Save metrics
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		monitor.saveMetrics({ filename: `performance-metrics-${timestamp}.json` });

		// Save latest report
		const reportPath = path.join(
			process.cwd(),
			"src",
			"performance",
			"reports",
			"latest-report.md",
		);
		const dir = path.dirname(reportPath);
		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir, { recursive: true });
		}
		fs.writeFileSync(reportPath, report);
		console.log(`📄 Report saved to: ${reportPath}`);
	} catch (error) {
		console.error("❌ Error running performance monitor:", error);
		process.exit(1);
	}
}

if (require.main === module) {
	main();
}

export { PerformanceMonitor, type PerformanceMetric, type EndpointStats };
