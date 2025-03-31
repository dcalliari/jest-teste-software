import express from "express";
import userRoutes from "./routes/userRoutes";
import { notFound, errorHandler } from "./middlewares/errorMiddleware";

const app = express();

app.use(express.json());
app.use("/api", userRoutes);

// Middlewares de erro
app.use(notFound);
app.use(errorHandler);

export default app;
