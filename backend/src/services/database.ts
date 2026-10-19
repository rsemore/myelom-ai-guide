export * as schema from '@/lib/db/schema'
import { relations } from '@/lib/db/relations'
import { drizzle } from 'drizzle-orm/node-postgres'

export const connection = drizzle({
  connection: process.env['DATABASE_URL']!,
  relations
})
