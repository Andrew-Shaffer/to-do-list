import "dotenv/config";
import { PrismaClient } from "../generated/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
//import { createRouter } from "./routes.js";
import Fastify from 'fastify'
import { andrewsNewRoutes } from "../build/altroutes.js";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in your environment");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

// local host port number
const PORT = 3000;

async function main(): Promise<void> {
  const app = Fastify({ logger: false });

  app.register(andrewsNewRoutes(prisma))
  //app.register(createRouter(prisma), { prefix: "/todos" });

  await app.listen({ port: PORT, host: "localhost" });
  console.log(`Server running on http://localhost:${PORT}`);
  //console.log(`Try: GET http://localhost:${PORT}/todos`);
}

main().catch(console.error);






