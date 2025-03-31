import express from "express";
import userRoutes from "./routes/userRoutes";
import { notFound, errorHandler } from "./middlewares/errorMiddleware";
import { setupSwagger } from "./swagger";

const app = express();

app.use(express.json());
app.use("/api", userRoutes);

setupSwagger(app); // Configuração do Swagger

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

export default app;
