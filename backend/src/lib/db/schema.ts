import { snakeCase, uuid, text, timestamp, serial, index } from 'drizzle-orm/pg-core'

export const users = snakeCase.table('users', {
  id: uuid().defaultRandom().primaryKey(),
  email: text().notNull().unique(),
  createdAt: timestamp().defaultNow().notNull(),

  tokenHash: text().notNull().default('STALE'),
  tokenSalt: text().notNull().default('STALE'),
})

export const sessions = snakeCase.table('sessions', {
  id: uuid().defaultRandom().primaryKey(),
  userId: uuid().notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text().default('New Chat').notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull().$onUpdate(() => new Date().toISOString())
})

export const messages = snakeCase.table('messages', {
  id: uuid().defaultRandom().primaryKey(),
  sessionId: uuid().notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  role: text({ enum: ['system', 'user', 'assistant', 'tool'] }).notNull(),
  content: text().notNull(),
  createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
  order: serial().notNull(),
  toolCallId: text(),
}, (t) => [
  index('messages_order_idx').on(t.order)
])
