import { authenticateUser, getAllUsers } from "./src/utils/mockData";

console.log("All users:", getAllUsers());
console.log("Authenticating daniel@example.com with password123:");
const result = authenticateUser("daniel@example.com", "password123");
console.log("Result:", result);
