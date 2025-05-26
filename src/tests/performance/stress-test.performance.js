// Cenário 3: Teste de Estresse para Limite do Sistema
import http from "k6/http";
import { check, sleep } from "k6";
import { Counter, Trend } from "k6/metrics";

// Métricas personalizadas
const systemBreakpoint = new Counter("system_breakpoint");
const peakUsers = new Trend("peak_concurrent_users");
const degradationPoint = new Trend("performance_degradation_point");

export const options = {
	stages: [
		// Aumento gradual até encontrar o ponto de ruptura
		{ duration: "2m", target: 100 },
		{ duration: "2m", target: 200 },
		{ duration: "2m", target: 300 },
		{ duration: "2m", target: 400 },
		{ duration: "2m", target: 500 },
		{ duration: "2m", target: 750 },
		{ duration: "2m", target: 1000 },
		{ duration: "2m", target: 1250 },
		{ duration: "2m", target: 1500 },
		{ duration: "2m", target: 1750 },
		{ duration: "2m", target: 2000 },
		{ duration: "2m", target: 2500 },
		{ duration: "2m", target: 3000 }, // Ponto crítico esperado
		{ duration: "1m", target: 0 }, // Recovery test
	],
	thresholds: {
		http_req_duration: ["p(95)<5000"], // Falha se P95 > 5s
		http_req_failed: ["rate<0.05"], // Falha se erro > 5%
	},
	// Abortar teste se critérios críticos forem atingidos
	abortOnFail: true,
};

const baseUrl = "http://localhost:3000/api";

// Mix de operações com pesos realistas
const operationMix = [
	{ type: "browse", weight: 60 }, // 60% navegação
	{ type: "search", weight: 25 }, // 25% busca
	{ type: "cart", weight: 10 }, // 10% carrinho
	{ type: "checkout", weight: 5 }, // 5% checkout
];

function selectOperation() {
	const random = Math.random() * 100;
	let cumulative = 0;

	for (const op of operationMix) {
		cumulative += op.weight;
		if (random <= cumulative) {
			return op.type;
		}
	}
	return "browse"; // fallback
}

export default function () {
	const userId = `stress_user_${__VU}_${__ITER}`;
	const operation = selectOperation();

	let operationSuccess = false;

	switch (operation) {
		case "browse":
			operationSuccess = performBrowsing();
			break;
		case "search":
			operationSuccess = performSearch();
			break;
		case "cart":
			operationSuccess = performCartOperations(userId);
			break;
		case "checkout":
			operationSuccess = performCheckout(userId);
			break;
	}

	// Monitorar indicadores de estresse do sistema
	monitorSystemHealth();

	// Pausa reduzida durante teste de estresse
	sleep(Math.random() * 1 + 0.5); // 0.5-1.5 segundos
}

function performBrowsing() {
	const response = http.get(`${baseUrl}/products?limit=20`, {
		tags: { operation: "browse" },
	});

	return check(response, {
		"browse status ok": (r) => r.status === 200,
		"browse response reasonable": (r) => r.timings.duration < 3000,
	});
}

function performSearch() {
	const searchTerms = ["smartphone", "laptop", "camera", "tv", "watch"];
	const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

	const response = http.get(`${baseUrl}/products/search?q=${term}`, {
		tags: { operation: "search" },
	});

	return check(response, {
		"search status ok": (r) => r.status === 200,
		"search response reasonable": (r) => r.timings.duration < 4000,
	});
}

function performCartOperations(userId) {
	// Adicionar item ao carrinho
	const addPayload = {
		userId: userId,
		productId: Math.floor(Math.random() * 10 + 1).toString(),
		quantity: 1,
	};

	const addResponse = http.post(`${baseUrl}/cart`, JSON.stringify(addPayload), {
		headers: { "Content-Type": "application/json" },
		tags: { operation: "cart_add" },
	});

	const addSuccess = check(addResponse, {
		"cart add status ok": (r) => r.status === 200,
		"cart add response reasonable": (r) => r.timings.duration < 2000,
	});

	if (!addSuccess) return false;

	sleep(0.5);

	// Visualizar carrinho
	const viewResponse = http.get(`${baseUrl}/cart/${userId}`, {
		tags: { operation: "cart_view" },
	});

	return check(viewResponse, {
		"cart view status ok": (r) => r.status === 200,
		"cart view response reasonable": (r) => r.timings.duration < 1500,
	});
}

function performCheckout(userId) {
	// Primeiro adicionar item ao carrinho
	const addPayload = {
		userId: userId,
		productId: Math.floor(Math.random() * 10 + 1).toString(),
		quantity: 1,
	};

	const addResponse = http.post(`${baseUrl}/cart`, JSON.stringify(addPayload), {
		headers: { "Content-Type": "application/json" },
	});

	if (addResponse.status !== 200) return false;

	sleep(0.3);

	// Processar checkout
	const checkoutPayload = {
		userId: userId,
		email: `${userId}@stress-test.com`,
		password: "stresstest123",
		paymentMethod: "credit_card",
		shippingAddress: {
			street: "Stress Test St, 999",
			city: "Load City",
			zipCode: "99999-999",
		},
	};

	const checkoutResponse = http.post(
		`${baseUrl}/checkout`,
		JSON.stringify(checkoutPayload),
		{
			headers: { "Content-Type": "application/json" },
			tags: { operation: "checkout" },
		},
	);

	return check(checkoutResponse, {
		"checkout status ok": (r) => r.status === 200,
		"checkout response reasonable": (r) => r.timings.duration < 5000,
	});
}

function monitorSystemHealth() {
	// Health check para monitorar saúde do sistema
	const healthResponse = http.get(`${baseUrl}/../health`, {
		tags: { operation: "health_check" },
	});

	const isHealthy = check(healthResponse, {
		"system is responsive": (r) => r.status === 200,
		"health check fast": (r) => r.timings.duration < 1000,
	});

	// Registrar se o sistema está mostrando sinais de estresse
	if (!isHealthy) {
		systemBreakpoint.add(1);
	}

	// Registrar número de usuários quando performance degrada
	if (healthResponse.timings.duration > 2000) {
		peakUsers.add(__VU);
		degradationPoint.add(Date.now());
	}
}

export function handleSummary(data) {
	const totalRequests = data.metrics.http_reqs.values.count;
	const failureRate = data.metrics.http_req_failed.values.rate * 100;
	const p95ResponseTime = data.metrics.http_req_duration.values.p95;
	const maxUsers = Math.max(
		...Object.values(data.root_group.groups).map((g) =>
			g.groups ? Object.keys(g.groups).length : 0,
		),
	);

	// Determinar ponto de ruptura
	let breakpointUsers = "Não atingido";
	let systemStatus = "Estável";

	if (failureRate > 5) {
		systemStatus = "Sistema sobrecarregado - Taxa de erro crítica";
		breakpointUsers = `~${Math.floor(maxUsers * 0.8)} usuários`;
	} else if (p95ResponseTime > 5000) {
		systemStatus = "Performance degradada - Tempo de resposta crítico";
		breakpointUsers = `~${Math.floor(maxUsers * 0.9)} usuários`;
	} else if (p95ResponseTime > 3000) {
		systemStatus = "Performance em alerta";
		breakpointUsers = `~${maxUsers} usuários (limite próximo)`;
	}

	return {
		"performance-results/stress-test-summary.json": JSON.stringify(
			data,
			null,
			2,
		),
		"performance-results/stress-test-summary.html": `
<!DOCTYPE html>
<html>
<head>
    <title>Teste de Estresse - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { background-color: #d4edda; border-color: #c3e6cb; }
        .fail { background-color: #f8d7da; border-color: #f5c6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .critical { background-color: #f8d7da; border-color: #f5c6cb; font-weight: bold; }
        .summary { background-color: #e2e3e5; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        .breakpoint { background-color: #17a2b8; color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Resultados do Teste de Estresse</h1>
    
    <div class="summary">
        <h2>Resumo do Teste</h2>
        <p><strong>Duração:</strong> 27 minutos</p>
        <p><strong>Carga Máxima Testada:</strong> 3000 usuários simultâneos</p>
        <p><strong>Objetivo:</strong> Identificar ponto de ruptura do sistema</p>
    </div>
    
    <div class="breakpoint">
        <h2>🎯 Ponto de Ruptura Identificado</h2>
        <p><strong>Capacidade Máxima:</strong> ${breakpointUsers}</p>
        <p><strong>Status do Sistema:</strong> ${systemStatus}</p>
    </div>
    
    <div class="metric ${failureRate < 1 ? "pass" : failureRate < 5 ? "warning" : "critical"}">
        <strong>Taxa de Erro Final:</strong> ${failureRate.toFixed(2)}%
        <br><small>Bom: < 1%, Aceitável: < 5%, Crítico: ≥ 5%</small>
    </div>
    
    <div class="metric ${p95ResponseTime < 1000 ? "pass" : p95ResponseTime < 3000 ? "warning" : "critical"}">
        <strong>Tempo de Resposta P95:</strong> ${p95ResponseTime.toFixed(2)}ms
        <br><small>Bom: < 1000ms, Aceitável: < 3000ms, Crítico: ≥ 5000ms</small>
    </div>
    
    <div class="metric">
        <strong>Total de Requisições:</strong> ${totalRequests.toLocaleString()}
    </div>
    
    <div class="metric">
        <strong>Requisições por Segundo (Pico):</strong> ${data.metrics.http_reqs.values.rate.toFixed(2)}
    </div>
    
    <div class="metric">
        <strong>Tempo Médio de Resposta:</strong> ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
    </div>
    
    <h3>Recomendações</h3>
    <div class="metric">
        ${
					failureRate > 5
						? '<strong style="color: red;">CRÍTICO:</strong> Sistema falhou sob carga. Revisar arquitetura e recursos.'
						: failureRate > 1
							? '<strong style="color: orange;">ATENÇÃO:</strong> Taxa de erro elevada. Considerar otimizações.'
							: '<strong style="color: green;">SUCESSO:</strong> Sistema suportou a carga de teste adequadamente.'
				}
    </div>
</body>
</html>
    `,
	};
}
