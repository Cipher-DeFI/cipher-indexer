import { onchainTable, index } from "ponder";

export const ConditionType = {
  TIME_ONLY: 0,
  PRICE_UP_ONLY: 1,
  PRICE_DOWN_ONLY: 2,
  PRICE_UP_OR_DOWN: 3,
  TIME_OR_PRICE: 4,
  TIME_AND_PRICE: 5,
} as const;

export const VaultStatus = {
  ACTIVE: 0,
  UNLOCKED: 1,
  WITHDRAWN: 2,
  EMERGENCY: 3,
} as const;

export const vault = onchainTable("vault", (t) => ({
  id: t.bigint().primaryKey(),
  owner: t.hex().notNull(),
  token: t.hex().notNull(),
  amount: t.bigint().notNull(),
  unlockTime: t.bigint().notNull(),
  targetPrice: t.bigint().notNull(),
  priceUp: t.bigint().notNull(),
  priceDown: t.bigint().notNull(),
  conditionType: t.integer().notNull(),
  status: t.integer().notNull(),
  createdAt: t.bigint().notNull(),
  updatedAt: t.bigint().notNull(),
  title: t.text().notNull(),
  message: t.text().notNull(),
  autoWithdraw: t.boolean().notNull(),
  
  creationTxHash: t.hex().notNull(),
  creationBlockNumber: t.bigint().notNull(),
  
  unlockedAt: t.bigint(),
  unlockedTxHash: t.hex(),
  withdrawnAt: t.bigint(),
  withdrawnTxHash: t.hex(),
  
  emergencyWithdrawnAt: t.bigint(),
  emergencyPenalty: t.bigint(),
  emergencyTxHash: t.hex(),
}), (table) => ({
  ownerIdx: index().on(table.owner),
  tokenIdx: index().on(table.token),
  statusIdx: index().on(table.status),
  creationTxIdx: index().on(table.creationTxHash),
}));

export const userStats = onchainTable("user_stats", (t) => ({
  address: t.hex().primaryKey(),
  totalVaults: t.integer().notNull(),
  activeVaults: t.integer().notNull(),
  totalLockedAmount: t.bigint().notNull(),
  totalWithdrawnAmount: t.bigint().notNull(),
  totalEmergencyPenalty: t.bigint().notNull(),
  lastActivityAt: t.bigint().notNull(),
}), (table) => ({
  activeVaultsIdx: index().on(table.activeVaults),
}));