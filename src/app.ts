import express from "express";
import userRoutes from "./routes/userRoutes";
import productRoutes from "./routes/productRoutes";
import cartRoutes from "./routes/cartRoutes";
import checkoutRoutes from "./routes/checkoutRoutes";
import { notFound, errorHandler } from "./middlewares/errorMiddleware";

const app = express();

app.use(express.json());

// Health check endpoint for performance monitoring
app.get("/health", (req, res) => {
	const startTime = Date.now();
	res.status(200).json({
		status: "OK",
		timestamp: new Date().toISOString(),
		uptime: process.uptime(),
		responseTime: `${Date.now() - startTime}ms`,
		environment: process.env.NODE_ENV || "development",
	});
});

// API Routes
app.use("/api", userRoutes);
app.use("/api", productRoutes);
app.use("/api", cartRoutes);
app.use("/api", checkoutRoutes);

// Error handling middlewares
app.use(notFound);
app.use(errorHandler);

export default app;
