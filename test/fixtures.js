'use strict';

const { open, init } = require('../src/db');

async function createFixture() {
  const db = open();
  await init(db);
  return {
    db,
    cleanup: () => db.$disconnect(),
  };
}

module.exports = { createFixture };
