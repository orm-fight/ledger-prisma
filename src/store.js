'use strict';

function balance({ type, debit_total, credit_total }) {
  return ['asset', 'expense'].includes(type)
    ? debit_total - credit_total
    : credit_total - debit_total;
}

function nowIso() {
  return new Date().toISOString();
}

async function createAccount(db, { name, type }) {
  await db.account.create({ data: { name, type } });
}

async function postEntry(db, { description, debit, credit, amount, date }) {
  if (!Number.isInteger(amount) || amount <= 0) {
    throw new Error(`amount must be a positive integer (got ${amount})`);
  }

  const entry = await db.journalEntry.create({
    data: {
      description,
      accountDebit: debit,
      accountCredit: credit,
      amount,
      date,
    },
  });
  return entry.id;
}

async function getBalance(db, accountName) {
  const account = await db.account.findUnique({ where: { name: accountName } });
  if (!account) throw new Error(`unknown account: ${accountName}`);

  const [debitAgg, creditAgg] = await Promise.all([
    db.journalEntry.aggregate({
      where: { accountDebit: accountName },
      _sum: { amount: true },
    }),
    db.journalEntry.aggregate({
      where: { accountCredit: accountName },
      _sum: { amount: true },
    }),
  ]);

  return balance({
    type: account.type,
    debit_total: debitAgg._sum.amount ?? 0,
    credit_total: creditAgg._sum.amount ?? 0,
  });
}

async function trialBalance(db) {
  const accounts = await db.account.findMany({ orderBy: { name: 'asc' } });

  const [debitTotals, creditTotals] = await Promise.all([
    db.journalEntry.groupBy({ by: ['accountDebit'],  _sum: { amount: true } }),
    db.journalEntry.groupBy({ by: ['accountCredit'], _sum: { amount: true } }),
  ]);

  const debitBy  = Object.fromEntries(debitTotals .map((t) => [t.accountDebit,  t._sum.amount ?? 0]));
  const creditBy = Object.fromEntries(creditTotals.map((t) => [t.accountCredit, t._sum.amount ?? 0]));

  return accounts.map((a) => ({
    account: a.name,
    type: a.type,
    balance: balance({
      type: a.type,
      debit_total:  debitBy [a.name] ?? 0,
      credit_total: creditBy[a.name] ?? 0,
    }),
  }));
}

module.exports = { createAccount, postEntry, getBalance, trialBalance, nowIso };
