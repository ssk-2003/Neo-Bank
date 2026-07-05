import 'dotenv/config'
import { defineConfig } from 'prisma/config'

// Use process.env directly so prisma generate doesn't throw
// when DATABASE_URL isn't set yet (e.g. during Vercel's npm install phase).
// An empty fallback is fine because prisma generate never connects to the DB.
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://placeholder:placeholder@localhost/placeholder',
  },
  migrations: {
    seed: 'npx tsx prisma/seed.ts',
  },
})
