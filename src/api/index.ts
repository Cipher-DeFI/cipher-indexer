import { db } from "ponder:api";
import { vault, userStats, VaultStatus } from "ponder:schema";
import { Hono } from "hono";
import { eq, and, desc, sql } from "drizzle-orm";
import { graphql } from "ponder";
import { serializeBigInts } from "../utils";
import { 
  insertAiInsight, 
  getAiInsightsByVaultId, 
  getAiInsightsByTxHash,
  initializeDatabase 
} from "../config/db";

const app = new Hono();

initializeDatabase().catch(console.error);

app.use("/graphql", graphql({ db, schema: { vault, userStats } }));

app.get("/vaults", async (c) => {
  const limit = parseInt(c.req.query("limit") || "50");
  const offset = parseInt(c.req.query("offset") || "0");
  const owner = c.req.query("owner");
  const status = c.req.query("status");

  const conditions = [];
  if (owner) conditions.push(eq(vault.owner, owner as `0x${string}`));
  if (status !== undefined) conditions.push(eq(vault.status, parseInt(status)));
  
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  
  const results = await db.select()
    .from(vault)
    .where(whereClause)
    .orderBy(desc(vault.createdAt))
    .limit(limit)
    .offset(offset);

  const vaultsWithInsights = await Promise.all(
    results.map(async (vaultData) => {
      const insights = await getAiInsightsByVaultId(vaultData.id);
      return {
        ...vaultData,
        insight: insights.length > 0 ? insights[0] : null
      };
    })
  );

  return c.json({
    vaults: serializeBigInts(vaultsWithInsights),
    pagination: { limit, offset }
  });
});

app.get("/vaults/:id", async (c) => {
  const vaultId = BigInt(c.req.param("id"));

  const vaultData = await db.select()
    .from(vault)
    .where(eq(vault.id, vaultId))
    .limit(1);

  if (vaultData.length === 0) {
    return c.json({ error: "Vault not found" }, 404);
  }

  const insights = await getAiInsightsByVaultId(vaultId);

  return c.json({
    vault: serializeBigInts({
      ...vaultData[0],
      insight: insights.length > 0 ? insights[0] : null
    })
  });
});

app.get("/users/:address/stats", async (c) => {
  const address = c.req.param("address");

  const stats = await db.select()
    .from(userStats)
    .where(eq(userStats.address, address as `0x${string}`))
    .limit(1);

  if (stats.length === 0) {
    return c.json({ error: "User not found" }, 404);
  }

  const recentVaults = await db.select()
    .from(vault)
    .where(eq(vault.owner, address as `0x${string}`))
    .orderBy(desc(vault.createdAt))
    .limit(5);

  return c.json({
    stats: serializeBigInts(stats[0]),
    recentVaults: serializeBigInts(recentVaults)
  });
});

app.get("/analytics", async (c) => {
  const totalVaults = await db.select({ count: sql`count(*)` })
    .from(vault);

  const activeVaults = await db.select({ count: sql`count(*)` })
    .from(vault)
    .where(eq(vault.status, VaultStatus.ACTIVE));

  const totalLocked = await db.select({ sum: sql`sum(amount)` })
    .from(vault)
    .where(eq(vault.status, VaultStatus.ACTIVE));

  return c.json({
    totalVaults: totalVaults[0]?.count || 0,
    activeVaults: activeVaults[0]?.count || 0,
    totalValueLocked: totalLocked[0]?.sum || 0,
  });
});

app.post("/ai-insights", async (c) => {
  try {
    const body = await c.req.json();
    const { vaultId, insight, txHash } = body;
    
    if (!vaultId || !insight || !txHash) {
      return c.json({
        success: false,
        error: "Missing required fields: vaultId, insight, txHash"
      }, 400);
    }

    const aiInsightData = {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      vaultId: BigInt(vaultId),
      txHash: txHash,
      insight: insight,
      createdAt: BigInt(Math.floor(Date.now() / 1000))
    };

    const result = await insertAiInsight(aiInsightData);

    return c.json({
      success: true,
      message: "AI insight created successfully",
      data: serializeBigInts(result)
    }, 201);

  } catch (error) {
    console.error("Error creating AI insight:", error);
    return c.json({
      success: false,
      error: "Failed to create AI insight",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/ai-insights/vault/:vaultId", async (c) => {
  try {
    const vaultId = BigInt(c.req.param("vaultId"));
    const insights = await getAiInsightsByVaultId(vaultId);
    
    return c.json({
      success: true,
      data: serializeBigInts(insights)
    });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return c.json({
      success: false,
      error: "Failed to fetch AI insights",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

app.get("/ai-insights/tx/:txHash", async (c) => {
  try {
    const txHash = c.req.param("txHash");
    const insights = await getAiInsightsByTxHash(txHash);
    
    return c.json({
      success: true,
      data: serializeBigInts(insights)
    });
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return c.json({
      success: false,
      error: "Failed to fetch AI insights",
      details: error instanceof Error ? error.message : "Unknown error"
    }, 500);
  }
});

export default app;