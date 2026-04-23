import { defineConfig } from "prisma/config";
import * as dotenv from "dotenv";

dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in your environment");
}

export default defineConfig({
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
