import type { Request, Response, NextFunction } from "express";

// Middleware to handle 404 Not Found errors
export const notFound = (
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	res.status(404).json({ error: "Rota não encontrada" });
};

// Middleware to handle internal server errors
export const errorHandler = (
	err: Error,
	req: Request,
	res: Response,
	next: NextFunction,
): void => {
	console.error(err.stack);
	res.status(500).json({ error: "Erro interno do servidor" });
};
