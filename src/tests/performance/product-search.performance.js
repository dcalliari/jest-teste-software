// Cenário 1: Teste de Tempo de Resposta para Busca de Produtos
import http from "k6/http";
import { check, sleep } from "k6";
import { Rate, Trend } from "k6/metrics";

// Métricas personalizadas
const errorRate = new Rate("errors");
const searchTimes = new Trend("search_response_time");

export const options = {
	stages: [
		{ duration: "30s", target: 20 }, // ramp-up suave
		{ duration: "1m", target: 100 }, // carga alvo
		{ duration: "30s", target: 100 }, // manter carga
		{ duration: "30s", target: 0 }, // ramp-down
	],
	thresholds: {
		http_req_duration: ["p(95)<500"], // 95% das requisições < 500ms
		search_response_time: ["p(95)<300"], // 95% das buscas < 300ms
		errors: ["rate<0.01"], // taxa de erro < 1%
		http_req_failed: ["rate<0.01"],
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

	const searchResponse = http.get(`${baseUrl}/products?query=${term}&limit=20`);

	// Registrar tempo de resposta
	searchTimes.add(searchResponse.timings.duration);

	// Verificações de qualidade
	const searchCheck = check(searchResponse, {
		"search status is 200": (r) => r.status === 200,
		"search response time < 300ms": (r) => r.timings.duration < 300,
		"search contains products": (r) => {
			try {
				const body = r.json();
				return body.products && Array.isArray(body.products);
			} catch {
				return false;
			}
		},
		"search has response time in body": (r) => {
			try {
				const body = r.json();
				return body.responseTime !== undefined;
			} catch {
				return false;
			}
		},
	});

	errorRate.add(!searchCheck);

	sleep(1);

	// Cenário 2: Busca por categoria
	const category = categories[Math.floor(Math.random() * categories.length)];

	const categoryResponse = http.get(`${baseUrl}/products/category/${category}`);

	const categoryCheck = check(categoryResponse, {
		"category status is 200": (r) => r.status === 200,
		"category response time < 400ms": (r) => r.timings.duration < 400,
		"category contains products": (r) => {
			try {
				const body = r.json();
				return body.products && body.products.length >= 0;
			} catch {
				return false;
			}
		},
	});

	errorRate.add(!categoryCheck);

	sleep(1);

	// Cenário 3: Busca avançada com filtros
	const advancedSearchResponse = http.get(
		`${baseUrl}/products/search?q=${term}&category=${category}&minPrice=100&maxPrice=5000&minRating=4.0`,
	);

	const advancedCheck = check(advancedSearchResponse, {
		"advanced search status is 200": (r) => r.status === 200,
		"advanced search response time < 800ms": (r) => r.timings.duration < 800,
		"advanced search has filters": (r) => {
			try {
				const body = r.json();
				return body.filters !== undefined;
			} catch {
				return false;
			}
		},
	});

	errorRate.add(!advancedCheck);

	// Pausa para simular comportamento de usuário real
	sleep(Math.random() * 3 + 1); // 1-4 segundos
}

export function handleSummary(data) {
	return {
		"performance-results/product-search-summary.json": JSON.stringify(
			data,
			null,
			2,
		),
		"performance-results/product-search-summary.html": `
<!DOCTYPE html>
<html>
<head>
    <title>Teste de Busca de Produtos - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 10px; border: 1px solid #ddd; }
        .pass { background-color: #d4edda; }
        .fail { background-color: #f8d7da; }
    </style>
</head>
<body>
    <h1>Resultados do Teste de Busca de Produtos</h1>
    <div class="metric ${data.metrics.http_req_duration.values.p95 < 500 ? "pass" : "fail"}">
        <strong>Tempo de Resposta P95:</strong> ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms
        (Meta: < 500ms)
    </div>
    <div class="metric ${data.metrics.errors.values.rate < 0.01 ? "pass" : "fail"}">
        <strong>Taxa de Erro:</strong> ${(data.metrics.errors.values.rate * 100).toFixed(2)}%
        (Meta: < 1%)
    </div>
    <div class="metric">
        <strong>Total de Requisições:</strong> ${data.metrics.http_reqs.values.count}
    </div>
    <div class="metric">
        <strong>Requisições por Segundo:</strong> ${data.metrics.http_reqs.values.rate.toFixed(2)}
    </div>
</body>
</html>
    `,
	};
}
