// Cenário 2: Teste de Carga no Processo de Checkout
import http from "k6/http";
import { check, group, sleep } from "k6";
import { Counter, Rate, Trend } from "k6/metrics";

// Métricas personalizadas
const checkoutTransactions = new Counter("checkout_transactions");
const checkoutErrors = new Rate("checkout_errors");
const authTimes = new Trend("auth_response_time");
const cartTimes = new Trend("cart_response_time");
const checkoutTimes = new Trend("checkout_response_time");

export const options = {
	stages: [
		{ duration: "1m", target: 200 }, // ramp-up inicial
		{ duration: "2m", target: 500 }, // aumento gradual
		{ duration: "3m", target: 1000 }, // carga máxima
		{ duration: "10m", target: 1000 }, // sustentação da carga (Black Friday)
		{ duration: "2m", target: 500 }, // redução gradual
		{ duration: "1m", target: 0 }, // ramp-down
	],
	thresholds: {
		"http_req_duration{name:checkout}": ["p(95)<2000"], // checkout < 2s
		checkout_response_time: ["p(95)<2000"],
		http_req_failed: ["rate<0.01"], // taxa de erro < 1%
		checkout_errors: ["rate<0.01"],
		checkout_transactions: ["rate>50"], // min 50 transações/segundo
	},
};

const baseUrl = "http://localhost:3000/api";

// Produtos disponíveis para adicionar ao carrinho
const products = [
	{ id: "1", name: "iPhone 15 Pro" },
	{ id: "2", name: "MacBook Pro M3" },
	{ id: "3", name: "AirPods Pro" },
	{ id: "4", name: "Sony A7R V" },
	{ id: "5", name: 'Samsung OLED 65"' },
	{ id: "6", name: "Apple Watch Series 9" },
	{ id: "7", name: 'iPad Pro 12.9"' },
	{ id: "8", name: "JBL Flip 6" },
];

const paymentMethods = ["credit_card", "debit_card", "paypal", "pix"];

export default function () {
	const userId = `user_${__VU}_${__ITER}`;
	const userEmail = `${userId}@shopfast-test.com`;

	// Grupo 1: Autenticação do usuário
	group("Authentication", () => {
		const authPayload = {
			email: userEmail,
			password: "testpassword123",
		};

		const authResponse = http.post(
			`${baseUrl}/auth`,
			JSON.stringify(authPayload),
			{
				headers: { "Content-Type": "application/json" },
				tags: { name: "auth" },
			},
		);

		authTimes.add(authResponse.timings.duration);

		const authCheck = check(authResponse, {
			"auth successful": (r) => r.status === 200,
			"auth response time < 500ms": (r) => r.timings.duration < 500,
			"auth returns token": (r) => {
				try {
					const body = r.json();
					return body.token !== undefined;
				} catch {
					return false;
				}
			},
		});

		if (!authCheck) {
			checkoutErrors.add(1);
			return; // Para execução se autenticação falhar
		}

		// Simular token para próximas requisições
		const authToken = `Bearer jwt_token_${Date.now()}_${userId}`;
		const headers = {
			"Content-Type": "application/json",
			Authorization: authToken,
		};

		sleep(0.5);

		// Grupo 2: Navegação e busca de produtos
		group("Product Browsing", () => {
			// Buscar produtos
			const productsResponse = http.get(
				`${baseUrl}/products?category=electronics&limit=10`,
				{
					headers,
					tags: { name: "product_search" },
				},
			);

			check(productsResponse, {
				"products retrieved": (r) => r.status === 200,
				"products response time < 400ms": (r) => r.timings.duration < 400,
			});

			sleep(Math.random() * 2 + 1); // 1-3 segundos navegando

			// Visualizar produto específico
			const selectedProduct =
				products[Math.floor(Math.random() * products.length)];

			const productDetailResponse = http.get(
				`${baseUrl}/products/${selectedProduct.id}`,
				{
					headers,
					tags: { name: "product_detail" },
				},
			);

			check(productDetailResponse, {
				"product detail retrieved": (r) => r.status === 200,
			});

			sleep(Math.random() * 3 + 2); // 2-5 segundos vendo detalhes

			// Grupo 3: Adicionar ao carrinho
			group("Add to Cart", () => {
				const addToCartPayload = {
					userId: userId,
					productId: selectedProduct.id,
					quantity: Math.floor(Math.random() * 3) + 1, // 1-3 unidades
				};

				const cartResponse = http.post(
					`${baseUrl}/cart`,
					JSON.stringify(addToCartPayload),
					{
						headers,
						tags: { name: "add_to_cart" },
					},
				);

				cartTimes.add(cartResponse.timings.duration);

				const cartCheck = check(cartResponse, {
					"product added to cart": (r) => r.status === 200,
					"cart response time < 600ms": (r) => r.timings.duration < 600,
				});

				if (!cartCheck) {
					checkoutErrors.add(1);
					return;
				}

				sleep(1);

				// Visualizar carrinho
				const viewCartResponse = http.get(`${baseUrl}/cart/${userId}`, {
					headers,
					tags: { name: "view_cart" },
				});

				check(viewCartResponse, {
					"cart viewed successfully": (r) => r.status === 200,
				});

				sleep(Math.random() * 2 + 1); // 1-3 segundos revisando carrinho

				// Grupo 4: Processo de Checkout
				group("Checkout Process", () => {
					// Validar dados do checkout
					const validatePayload = {
						userId: userId,
						paymentMethod:
							paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
						shippingAddress: {
							street: "Test Street, 123",
							city: "Test City",
							zipCode: "12345-678",
							country: "Brazil",
						},
					};

					const validateResponse = http.post(
						`${baseUrl}/checkout/validate`,
						JSON.stringify(validatePayload),
						{
							headers,
							tags: { name: "checkout_validate" },
						},
					);

					check(validateResponse, {
						"checkout validation passed": (r) => r.status === 200,
					});

					sleep(0.5);

					// Calcular totais
					const calculatePayload = {
						userId: userId,
						shippingMethod: Math.random() > 0.7 ? "express" : "standard",
					};

					const calculateResponse = http.post(
						`${baseUrl}/checkout/calculate`,
						JSON.stringify(calculatePayload),
						{
							headers,
							tags: { name: "checkout_calculate" },
						},
					);

					check(calculateResponse, {
						"totals calculated": (r) => r.status === 200,
					});

					sleep(Math.random() * 2 + 1); // 1-3 segundos revisando totais

					// Finalizar checkout
					const checkoutPayload = {
						userId: userId,
						email: userEmail,
						password: "testpassword123",
						paymentMethod: validatePayload.paymentMethod,
						shippingAddress: validatePayload.shippingAddress,
						billingAddress: validatePayload.shippingAddress,
					};

					const checkoutResponse = http.post(
						`${baseUrl}/checkout`,
						JSON.stringify(checkoutPayload),
						{
							headers,
							tags: { name: "checkout" },
						},
					);

					checkoutTimes.add(checkoutResponse.timings.duration);

					const checkoutCheck = check(checkoutResponse, {
						"checkout successful": (r) => r.status === 200,
						"checkout response time < 2000ms": (r) => r.timings.duration < 2000,
						"order id received": (r) => {
							try {
								const body = r.json();
								return body.order && body.order.id !== undefined;
							} catch {
								return false;
							}
						},
					});

					if (checkoutCheck) {
						checkoutTransactions.add(1);
					} else {
						checkoutErrors.add(1);
					}
				});
			});
		});
	});

	// Pausa entre iterações para simular comportamento real
	sleep(Math.random() * 3 + 2); // 2-5 segundos
}

export function handleSummary(data) {
	const checkoutRate = data.metrics.checkout_transactions
		? data.metrics.checkout_transactions.values.rate
		: 0;
	const errorRate = data.metrics.checkout_errors
		? data.metrics.checkout_errors.values.rate * 100
		: 0;

	return {
		"performance/results/checkout-load-summary.json": JSON.stringify(
			data,
			null,
			2,
		),
		"performance/results/checkout-load-summary.html": `
<!DOCTYPE html>
<html>
<head>
    <title>Teste de Carga do Checkout - Resultados</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .metric { margin: 10px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .pass { background-color: #d4edda; border-color: #c3e6cb; }
        .fail { background-color: #f8d7da; border-color: #f5c6cb; }
        .warning { background-color: #fff3cd; border-color: #ffeaa7; }
        .summary { background-color: #e2e3e5; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Resultados do Teste de Carga do Checkout</h1>
    
    <div class="summary">
        <h2>Resumo do Teste</h2>
        <p><strong>Duração:</strong> 19 minutos</p>
        <p><strong>Carga Máxima:</strong> 1000 usuários simultâneos</p>
        <p><strong>Cenário:</strong> Fluxo completo de checkout (Black Friday)</p>
    </div>
    
    <div class="metric ${checkoutRate >= 50 ? "pass" : "fail"}">
        <strong>Throughput de Checkout:</strong> ${checkoutRate.toFixed(2)} transações/segundo
        <br><small>Meta: ≥ 50 transações/segundo</small>
    </div>
    
    <div class="metric ${data.metrics.checkout_response_time && data.metrics.checkout_response_time.values.p95 < 2000 ? "pass" : "fail"}">
        <strong>Tempo de Checkout P95:</strong> ${data.metrics.checkout_response_time ? data.metrics.checkout_response_time.values.p95.toFixed(2) : "N/A"}ms
        <br><small>Meta: < 2000ms</small>
    </div>
    
    <div class="metric ${errorRate < 1 ? "pass" : "fail"}">
        <strong>Taxa de Erro de Checkout:</strong> ${errorRate.toFixed(2)}%
        <br><small>Meta: < 1%</small>
    </div>
    
    <div class="metric">
        <strong>Total de Transações Completadas:</strong> ${data.metrics.checkout_transactions ? data.metrics.checkout_transactions.values.count : 0}
    </div>
    
    <div class="metric">
        <strong>Total de Requisições:</strong> ${data.metrics.http_reqs.values.count}
    </div>
    
    <div class="metric ${data.metrics.http_req_duration.values.p95 < 1500 ? "pass" : data.metrics.http_req_duration.values.p95 < 3000 ? "warning" : "fail"}">
        <strong>Tempo de Resposta Geral P95:</strong> ${data.metrics.http_req_duration.values.p95.toFixed(2)}ms
        <br><small>Bom: < 1500ms, Aceitável: < 3000ms</small>
    </div>
</body>
</html>
    `,
	};
}
