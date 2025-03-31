import type { Express } from "express";
import swaggerJsDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const swaggerOptions = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "API de Usuários",
			version: "1.0.0",
			description: "Documentação da API de Usuários",
		},
		servers: [
			{
				url: "http://localhost:3000/api",
			},
		],
	},
	apis: ["./src/routes/*.ts"], // Caminho para os arquivos de rotas
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

export const setupSwagger = (app: Express): void => {
	app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));
};
