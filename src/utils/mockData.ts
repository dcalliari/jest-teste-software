type User = {
	id: string;
	name: string;
	age: number;
};

let users: User[] = [
	{ id: "1", name: "Daniel", age: 28 },
	{ id: "2", name: "João", age: 35 },
	{ id: "3", name: "Maria", age: 22 },
	{ id: "4", name: "Ana", age: 30 },
	{ id: "5", name: "Carlos", age: 40 },
	{ id: "6", name: "Fernanda", age: 25 },
	{ id: "7", name: "Lucas", age: 33 },
	{ id: "8", name: "Beatriz", age: 27 },
	{ id: "9", name: "Pedro", age: 29 },
	{ id: "10", name: "Sofia", age: 24 },
	{ id: "11", name: "Gabriel", age: 31 },
	{ id: "12", name: "Juliana", age: 26 },
	{ id: "13", name: "Ricardo", age: 38 },
	{ id: "14", name: "Patrícia", age: 32 },
	{ id: "15", name: "André", age: 29 },
	{ id: "16", name: "Camila", age: 23 },
	{ id: "17", name: "Rafael", age: 34 },
	{ id: "18", name: "Larissa", age: 28 },
	{ id: "19", name: "Thiago", age: 36 },
	{ id: "20", name: "Isabela", age: 21 },
	{ id: "21", name: "Eduardo", age: 37 },
	{ id: "22", name: "Vanessa", age: 29 },
	{ id: "23", name: "Bruno", age: 33 },
	{ id: "24", name: "Carolina", age: 26 },
	{ id: "25", name: "Felipe", age: 35 },
	{ id: "26", name: "Aline", age: 24 },
	{ id: "27", name: "Gustavo", age: 32 },
	{ id: "28", name: "Natália", age: 27 },
	{ id: "29", name: "Leonardo", age: 30 },
	{ id: "30", name: "Renata", age: 28 },
];

// Função para listar todos os usuários
export const getAllUsers = (): User[] => {
	return users;
};

// Função para buscar um usuário por ID
export const getUserById = (id: string): User | undefined => {
	return users.find((user) => user.id === id);
};

// Função para criar um novo usuário
export const createUser = (name: string, age: number): User => {
	const newUser: User = {
		id: (users.length + 1).toString(),
		name,
		age,
	};
	users.push(newUser);
	return newUser;
};

// Função para atualizar um usuário por ID
export const updateUser = (
	id: string,
	name: string,
	age: number,
): User | null => {
	const userIndex = users.findIndex((user) => user.id === id);
	if (userIndex === -1) return null;

	users[userIndex] = { id, name, age };
	return users[userIndex];
};

// Função para deletar um usuário por ID
export const deleteUser = (id: string): boolean => {
	const initialLength = users.length;
	users = users.filter((user) => user.id !== id);
	return users.length < initialLength;
};
