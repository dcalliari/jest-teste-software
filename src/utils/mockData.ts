// E-commerce Data Types
export type User = {
	id: string;
	name: string;
	email: string;
	age: number;
	isAuthenticated?: boolean;
};

export type Product = {
	id: string;
	name: string;
	category: string;
	price: number;
	stock: number;
	description: string;
	rating: number;
	featured?: boolean;
};

export type CartItem = {
	productId: string;
	quantity: number;
	userId: string;
};

export type Order = {
	id: string;
	userId: string;
	items: CartItem[];
	total: number;
	status: "pending" | "confirmed" | "shipped" | "delivered";
	createdAt: Date;
};

// Mock Data
let users: User[] = [
	{ id: "1", name: "Daniel Silva", email: "daniel@example.com", age: 28 },
	{ id: "2", name: "João Santos", email: "joao@example.com", age: 35 },
	{ id: "3", name: "Maria Oliveira", email: "maria@example.com", age: 22 },
	{ id: "4", name: "Ana Costa", email: "ana@example.com", age: 30 },
	{ id: "5", name: "Carlos Ferreira", email: "carlos@example.com", age: 40 },
];

const products: Product[] = [
	{
		id: "1",
		name: "iPhone 15 Pro",
		category: "smartphone",
		price: 4999.99,
		stock: 50,
		description: "Latest iPhone with advanced camera",
		rating: 4.8,
	},
	{
		id: "2",
		name: "MacBook Pro M3",
		category: "laptop",
		price: 8999.99,
		stock: 30,
		description: "Professional laptop for developers",
		rating: 4.9,
	},
	{
		id: "3",
		name: "AirPods Pro",
		category: "headphone",
		price: 1299.99,
		stock: 100,
		description: "Wireless earbuds with noise cancellation",
		rating: 4.7,
	},
	{
		id: "4",
		name: "Sony A7R V",
		category: "camera",
		price: 15999.99,
		stock: 15,
		description: "Professional mirrorless camera",
		rating: 4.6,
	},
	{
		id: "5",
		name: 'Samsung OLED 65"',
		category: "tv",
		price: 6999.99,
		stock: 25,
		description: "4K OLED Smart TV",
		rating: 4.5,
	},
	{
		id: "6",
		name: "Apple Watch Series 9",
		category: "watch",
		price: 2299.99,
		stock: 75,
		description: "Advanced smartwatch with health monitoring",
		rating: 4.7,
	},
	{
		id: "7",
		name: 'iPad Pro 12.9"',
		category: "tablet",
		price: 5499.99,
		stock: 40,
		description: "Professional tablet for creative work",
		rating: 4.8,
	},
	{
		id: "8",
		name: "JBL Flip 6",
		category: "speaker",
		price: 699.99,
		stock: 80,
		description: "Portable Bluetooth speaker",
		rating: 4.4,
	},
	{
		id: "9",
		name: 'Dell UltraSharp 27"',
		category: "monitor",
		price: 2199.99,
		stock: 35,
		description: "4K professional monitor",
		rating: 4.6,
	},
	{
		id: "10",
		name: "Logitech MX Master 3",
		category: "keyboard",
		price: 499.99,
		stock: 60,
		description: "Wireless productivity mouse",
		rating: 4.5,
	},
];

let cart: CartItem[] = [];
const orders: Order[] = [];

// User functions
export const getAllUsers = (): User[] => users;
export const getUserById = (id: string): User | undefined =>
	users.find((user) => user.id === id);
export const getUserByEmail = (email: string): User | undefined =>
	users.find((user) => user.email === email);
export const createUser = (name: string, email: string, age: number): User => {
	const newUser: User = { id: (users.length + 1).toString(), name, email, age };
	users.push(newUser);
	return newUser;
};
export const authenticateUser = (
	email: string,
	password: string,
): User | null => {
	// Simplified authentication - in real app would check hashed password
	if (email.includes("@") && password.length >= 4) {
		const user = getUserByEmail(email);
		if (user) {
			user.isAuthenticated = true;
			return user;
		}
	}
	return null;
};

// Product functions
export const getAllProducts = (): Product[] => products;
export const getProductById = (id: string): Product | undefined =>
	products.find((product) => product.id === id);
export const searchProducts = (query: string, category?: string): Product[] => {
	let filtered = products;

	if (query) {
		filtered = filtered.filter(
			(product) =>
				product.name.toLowerCase().includes(query.toLowerCase()) ||
				product.description.toLowerCase().includes(query.toLowerCase()),
		);
	}

	if (category) {
		filtered = filtered.filter((product) => product.category === category);
	}

	// Simulate search delay for performance testing
	const delay = Math.random() * 100; // 0-100ms random delay
	return filtered;
};

export const getProductsByCategory = (category: string): Product[] => {
	return products.filter((product) => product.category === category);
};

export const updateProductStock = (
	productId: string,
	quantity: number,
): boolean => {
	const product = getProductById(productId);
	if (product && product.stock >= quantity) {
		product.stock -= quantity;
		return true;
	}
	return false;
};

// Cart functions
export const addToCart = (
	userId: string,
	productId: string,
	quantity: number,
): CartItem | null => {
	const product = getProductById(productId);
	if (!product || product.stock < quantity) return null;

	const existingItem = cart.find(
		(item) => item.userId === userId && item.productId === productId,
	);

	if (existingItem) {
		existingItem.quantity += quantity;
		return existingItem;
	}
	const newItem = { userId, productId, quantity };
	cart.push(newItem);
	return newItem;
};

export const getCartByUserId = (userId: string): CartItem[] => {
	return cart.filter((item) => item.userId === userId);
};

export const removeFromCart = (userId: string, productId: string): boolean => {
	const initialLength = cart.length;
	cart = cart.filter(
		(item) => !(item.userId === userId && item.productId === productId),
	);
	return cart.length < initialLength;
};

export const clearCart = (userId: string): void => {
	cart = cart.filter((item) => item.userId !== userId);
};

// Order functions
export const createOrder = (userId: string): Order | null => {
	const userCart = getCartByUserId(userId);
	if (userCart.length === 0) return null;

	let total = 0;
	for (const item of userCart) {
		const product = getProductById(item.productId);
		if (product) {
			total += product.price * item.quantity;
			updateProductStock(item.productId, item.quantity);
		}
	}

	const order: Order = {
		id: (orders.length + 1).toString(),
		userId,
		items: [...userCart],
		total,
		status: "pending",
		createdAt: new Date(),
	};

	orders.push(order);
	clearCart(userId);

	// Simulate processing delay
	setTimeout(() => {
		order.status = "confirmed";
	}, 1000);

	return order;
};

export const getOrderById = (id: string): Order | undefined => {
	return orders.find((order) => order.id === id);
};

export const getOrdersByUserId = (userId: string): Order[] => {
	return orders.filter((order) => order.userId === userId);
};

// Legacy functions for backward compatibility
export const updateUser = (
	id: string,
	name: string,
	age: number,
): User | null => {
	const userIndex = users.findIndex((user) => user.id === id);
	if (userIndex === -1) return null;

	users[userIndex] = { ...users[userIndex], name, age };
	return users[userIndex];
};

export const deleteUser = (id: string): boolean => {
	const initialLength = users.length;
	users = users.filter((user) => user.id !== id);
	return users.length < initialLength;
};
