import "dotenv/config";
import express from "express";
import { PrismaClient } from "../generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import { createRouter } from "./routes.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in your environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const PORT = 3000;

async function main(): Promise<void> {
  const app = express();
  app.use(express.json());

  app.use("/todos", createRouter(prisma));

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Try: GET http://localhost:${PORT}/todos`);
  });
}

main().catch(console.error);
