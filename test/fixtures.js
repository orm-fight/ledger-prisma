'use strict';

const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs/promises');
const { open, init } = require('../src/db');

async function createFixture() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'ledger-prisma-'));
  const db = open(`file:${path.join(dir, 'test.db')}`);
  await init(db);
  return {
    db,
    cleanup: async () => {
      await db.$disconnect();
      await fs.rm(dir, { recursive: true, force: true });
    },
  };
}

module.exports = { createFixture };
