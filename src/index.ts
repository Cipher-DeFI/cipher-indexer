import { ponder } from "ponder:registry";
import { vault, userStats, VaultStatus } from "ponder:schema";

ponder.on("FUMVault:VaultCreated", async ({ event, context }) => {
    const { vaultId, owner, token, amount, conditionType, unlockTime, targetPrice, priceUp, priceDown, title, message } = event.args;
  
    await context.db
      .insert(vault)
      .values({
        id: vaultId,
        owner,
        token,
        amount,
        unlockTime,
        targetPrice,
        priceUp,
        priceDown,
        conditionType,
        status: VaultStatus.ACTIVE,
        createdAt: event.block.timestamp,
        updatedAt: event.block.timestamp,
        title,
        message,
        autoWithdraw: false,
        creationTxHash: event.transaction.hash,
        creationBlockNumber: event.block.number,
      });
  
    await context.db
      .insert(userStats)
      .values({
        address: owner,
        totalVaults: 1,
        activeVaults: 1,
        totalLockedAmount: amount,
        totalWithdrawnAmount: 0n,
        totalEmergencyPenalty: 0n,
        lastActivityAt: event.block.timestamp,
      })
      .onConflictDoUpdate((existing) => ({
        totalVaults: existing.totalVaults + 1,
        activeVaults: existing.activeVaults + 1,
        totalLockedAmount: existing.totalLockedAmount + amount,
        lastActivityAt: event.block.timestamp,
      }));
  });
  
  ponder.on("FUMVault:VaultUnlocked", async ({ event, context }) => {
    const { vaultId } = event.args;
  
    const vaultRecord = await context.db
      .find(vault, { id: vaultId });
  
    if (!vaultRecord) return;
  
    await context.db
      .update(vault, { id: vaultId })
      .set({
        status: VaultStatus.UNLOCKED,
        unlockedAt: event.block.timestamp,
        unlockedTxHash: event.transaction.hash,
        updatedAt: event.block.timestamp,
      });
  
    await context.db
      .update(userStats, { address: vaultRecord.owner })
      .set((current) => ({
        activeVaults: current.activeVaults > 0 ? current.activeVaults - 1 : 0,
        lastActivityAt: event.block.timestamp,
      }));
  });
  
  ponder.on("FUMVault:VaultWithdrawn", async ({ event, context }) => {
    const { vaultId, owner, amount } = event.args;
  
    await context.db
      .update(vault, { id: vaultId })
      .set({
        status: VaultStatus.WITHDRAWN,
        withdrawnAt: event.block.timestamp,
        withdrawnTxHash: event.transaction.hash,
        updatedAt: event.block.timestamp,
      });
  
    await context.db
      .update(userStats, { address: owner })
      .set((current) => ({
        totalWithdrawnAmount: current.totalWithdrawnAmount + amount,
        lastActivityAt: event.block.timestamp,
      }));
  });
  
  ponder.on("FUMVault:VaultAutoWithdrawn", async ({ event, context }) => {
    const { vaultId, owner, amount } = event.args;
  
    await context.db
      .update(vault, { id: vaultId })
      .set({
        status: VaultStatus.WITHDRAWN,
        withdrawnAt: event.block.timestamp,
        withdrawnTxHash: event.transaction.hash,
        updatedAt: event.block.timestamp,
      });
  
    await context.db
      .update(userStats, { address: owner })
      .set((current) => ({
        totalWithdrawnAmount: current.totalWithdrawnAmount + amount,
        lastActivityAt: event.block.timestamp,
      }));
  });
  
  ponder.on("FUMVault:EmergencyExecuted", async ({ event, context }) => {
    const { vaultId, owner, amount, penalty } = event.args;
  
    await context.db
      .update(vault, { id: vaultId })
      .set({
        status: VaultStatus.EMERGENCY,
        emergencyWithdrawnAt: event.block.timestamp,
        emergencyPenalty: penalty,
        emergencyTxHash: event.transaction.hash,
        updatedAt: event.block.timestamp,
      });
  
    await context.db
      .update(userStats, { address: owner })
      .set((current) => ({
        activeVaults: current.activeVaults > 0 ? current.activeVaults - 1 : 0,
        totalWithdrawnAmount: current.totalWithdrawnAmount + amount,
        totalEmergencyPenalty: current.totalEmergencyPenalty + penalty,
        lastActivityAt: event.block.timestamp,
      }));
  });
  
  ponder.on("FUMVault:VaultAutoWithdrawUpdated", async ({ event, context }) => {
    const { vaultId, autoWithdraw } = event.args;
  
    await context.db
      .update(vault, { id: vaultId })
      .set({
        autoWithdraw,
        updatedAt: event.block.timestamp,
      });
  });