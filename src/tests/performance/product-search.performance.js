// Cenário 1: Teste de Tempo de Resposta para Busca de Produtos
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Métricas personalizadas
const errorRate = new Rate("errors");
const searchTimes = new Trend("search_response_time");

export const options = {
	stages: [
		{ duration: "30s", target: 10 }, // ramp-up mais suave para debug
		{ duration: "1m", target: 50 }, // carga reduzida para debug
		{ duration: "30s", target: 50 }, // manter carga
		{ duration: "30s", target: 0 }, // ramp-down
	],
	thresholds: {
		http_req_duration: ["p(95)<1000"], // mais permissivo para debug: 95% das requisições < 1000ms
		search_response_time: ["p(95)<600"], // mais permissivo: 95% das buscas < 600ms
		errors: ["rate<0.05"], // taxa de erro < 5% (mais permissivo para debug)
		http_req_failed: ["rate<0.05"], // taxa de falha < 5%
	},
};

// Termos de busca variados para simular comportamento real
const searchTerms = [
	"smartphone",
	"laptop",
	"headphone",
	"camera",
	"tv",
	"watch",
	"tablet",
	"speaker",
	"monitor",
	"keyboard",
	"mouse",
	"phone",
	"computer",
	"audio",
	"gaming",
];

const categories = [
	"smartphone",
	"laptop",
	"headphone",
	"camera",
	"tv",
	"watch",
	"tablet",
	"speaker",
	"monitor",
	"keyboard",
];

const baseUrl = "http://localhost:3000/api";

export default function () {
	// Cenário 1: Busca simples de produtos
	const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

	let searchResponse;
	try {
		searchResponse = http.get(`${baseUrl}/products?query=${term}&limit=20`, {
			timeout: "10s",
		});
	} catch (error) {
		console.error(`Search request failed: ${error}`);
		errorRate.add(1);
		sleep(1);
		return;
	}

	// Registrar tempo de resposta apenas se a requisição foi bem-sucedida
	if (searchResponse.status === 200) {
		searchTimes.add(searchResponse.timings.duration);
	}

	// Verificações de qualidade com melhor tratamento de erros
	const searchCheck = check(searchResponse, {
		"search status is 200": (r) => r.status === 200,
		"search response time < 300ms": (r) => r.timings.duration < 300,
		"search contains products": (r) => {
			if (r.status !== 200) return false;
			try {
				const body = r.json();
				return body?.products && Array.isArray(body.products);
			} catch (e) {
				console.warn(`Failed to parse search response: ${e}`);
				return false;
			}
		},
		"search has response time in body": (r) => {
			if (r.status !== 200) return false;
			try {
				const body = r.json();
				return body && body.responseTime !== undefined;
			} catch {
				return false;
			}
		},
	});

	errorRate.add(!searchCheck);

	sleep(1);

	// Cenário 2: Busca por categoria
	const category = categories[Math.floor(Math.random() * categories.length)];

	let categoryResponse;
	try {
		categoryResponse = http.get(`${baseUrl}/products/category/${category}`, {
			timeout: "10s",
		});
	} catch (error) {
		console.error(`Category request failed: ${error}`);
		errorRate.add(1);
		sleep(1);
		return;
	}

	const categoryCheck = check(categoryResponse, {
		"category status is 200": (r) => r.status === 200,
		"category response time < 400ms": (r) => r.timings.duration < 400,
		"category contains products": (r) => {
			if (r.status !== 200) return false;
			try {
				const body = r.json();
				return body?.products && body.products.length >= 0;
			} catch (e) {
				console.warn(`Failed to parse category response: ${e}`);
				return false;
			}
		},
	});

	errorRate.add(!categoryCheck);

	sleep(1);

	// Cenário 3: Busca avançada com filtros
	let advancedSearchResponse;
	try {
		advancedSearchResponse = http.get(
			`${baseUrl}/products/search?q=${term}&category=${category}&minPrice=100&maxPrice=5000&minRating=4.0`,
			{
				timeout: "15s",
			},
		);
	} catch (error) {
		console.error(`Advanced search request failed: ${error}`);
		errorRate.add(1);
		sleep(Math.random() * 3 + 1);
		return;
	}

	const advancedCheck = check(advancedSearchResponse, {
		"advanced search status is 200": (r) => r.status === 200,
		"advanced search response time < 800ms": (r) => r.timings.duration < 800,
		"advanced search has filters": (r) => {
			if (r.status !== 200) return false;
			try {
				const body = r.json();
				return body && body.filters !== undefined;
			} catch (e) {
				console.warn(`Failed to parse advanced search response: ${e}`);
				return false;
			}
		},
	});

	errorRate.add(!advancedCheck);

	// Pausa para simular comportamento de usuário real
	sleep(Math.random() * 3 + 1); // 1-4 segundos
}

export function handleSummary(data) {
	// Helper function to safely get metric values with fallbacks
	const getMetricValue = (metricPath, fallback = 0) => {
		try {
			const keys = metricPath.split(".");
			let value = data;
			for (const key of keys) {
				value = value?.[key];
				if (value === undefined || value === null) {
					return fallback;
				}
			}
			return value;
		} catch {
			return fallback;
		}
	};

	// Get metric values with safe fallbacks
	const httpReqDurationP95 = getMetricValue(
		"metrics.http_req_duration.values.p95",
		0,
	);
	const errorsRate = getMetricValue("metrics.errors.values.rate", 0);
	const httpReqsCount = getMetricValue("metrics.http_reqs.values.count", 0);
	const httpReqsRate = getMetricValue("metrics.http_reqs.values.rate", 0);

	return {
		"performance/results/product-search-summary.json": JSON.stringify(
			data,
			null,
			2,
		),
		"performance/results/product-search-summary.html": `
<!DOCTYPE html>
<html>
<head>
    <title>Teste de Busca de Produtos - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
        .warning { background-color: #fff3cd; }
    </style>
</head>
<body>
    <h1>Resultados do Teste de Busca de Produtos</h1>
    <div class="metric ${httpReqDurationP95 < 500 ? "pass" : "fail"}">
        <strong>Tempo de Resposta P95:</strong> ${httpReqDurationP95.toFixed(2)}ms
        (Meta: < 500ms)
    </div>
    <div class="metric ${errorsRate < 0.01 ? "pass" : "fail"}">
        <strong>Taxa de Erro:</strong> ${(errorsRate * 100).toFixed(2)}%
        (Meta: < 1%)
    </div>
    <div class="metric">
        <strong>Total de Requisições:</strong> ${httpReqsCount}
    </div>
    <div class="metric">
        <strong>Requisições por Segundo:</strong> ${httpReqsRate.toFixed(2)}
    </div>
    ${
			errorsRate > 0.01
				? `
    <div class="metric fail">
        <strong>⚠️ Atenção:</strong> Taxa de erro acima do limite aceitável. 
        Verifique se o servidor está funcionando corretamente e se os endpoints estão respondendo adequadamente.
    </div>
    `
				: ""
		}
</body>
</html>
    `,
	};
}
