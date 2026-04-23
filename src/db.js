'use strict';

const { PrismaClient } = require('@prisma/client');

// Mirror of prisma/schema.prisma as raw SQL. Prisma has no built-in
// "apply schema to this connection" call, so we run these statements
// ourselves in init(). Keep in sync with schema.prisma.
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS accounts (
     name TEXT PRIMARY KEY,
     type TEXT NOT NULL CHECK (type IN ('asset','liability','equity','revenue','expense'))
   )`,
  `CREATE TABLE IF NOT EXISTS journal_entries (
     id             INTEGER PRIMARY KEY AUTOINCREMENT,
     description    TEXT    NOT NULL,
     account_debit  TEXT    NOT NULL REFERENCES accounts(name),
     account_credit TEXT    NOT NULL REFERENCES accounts(name),
     amount         INTEGER NOT NULL CHECK (amount > 0),
     date           TEXT    NOT NULL
   )`,
];

function open(url) {
  return new PrismaClient({ datasources: { db: { url } } });
}

async function init(db) {
  await db.$executeRawUnsafe('PRAGMA foreign_keys = ON');
  for (const stmt of SCHEMA) {
    await db.$executeRawUnsafe(stmt);
  }
}

module.exports = { open, init };
