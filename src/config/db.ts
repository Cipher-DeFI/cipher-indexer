import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function createAiInsightTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ai_insight (
      id TEXT PRIMARY KEY,
      vault_id BIGINT NOT NULL,
      tx_hash TEXT NOT NULL,
      insight TEXT NOT NULL,
      created_at BIGINT NOT NULL
    );
  `;

  try {
    await pool.query(createTableQuery);
    console.log('AI insight table created/verified successfully');
  } catch (error) {
    console.error('Error creating AI insight table:', error);
    throw error;
  }
}

export async function initializeDatabase() {
  try {
    await createAiInsightTable();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export async function insertAiInsight({ id, vaultId, txHash, insight, createdAt }: {
  id: string;
  vaultId: bigint;
  txHash: string;
  insight: string;
  createdAt: bigint;
}) {
  const query = `
    INSERT INTO ai_insight (id, vault_id, tx_hash, insight, created_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const values = [id, vaultId.toString(), txHash, insight, createdAt.toString()];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function getAiInsightsByVaultId(vaultId: bigint) {
  const query = `
    SELECT * FROM ai_insight 
    WHERE vault_id = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [vaultId.toString()]);
  return rows;
}

export async function getAiInsightsByTxHash(txHash: string) {
  const query = `
    SELECT * FROM ai_insight 
    WHERE tx_hash = $1 
    ORDER BY created_at DESC
  `;
  const { rows } = await pool.query(query, [txHash]);
  return rows;
}

export async function getAllAiInsights(limit: number = 50, offset: number = 0) {
  const query = `
    SELECT * FROM ai_insight 
    ORDER BY created_at DESC 
    LIMIT $1 OFFSET $2
  `;
  const { rows } = await pool.query(query, [limit, offset]);
  return rows;
}

export async function deleteAiInsight(id: string) {
  const query = `
    DELETE FROM ai_insight 
    WHERE id = $1 
    RETURNING *
  `;
  const { rows } = await pool.query(query, [id]);
  return rows[0];
}

export async function updateAiInsight(id: string, updates: {
  insight?: string;
  txHash?: string;
}) {
  const setClause = Object.keys(updates)
    .map((key, index) => `${key === 'txHash' ? 'tx_hash' : key} = $${index + 2}`)
    .join(', ');
  
  const query = `
    UPDATE ai_insight 
    SET ${setClause}
    WHERE id = $1 
    RETURNING *
  `;
  
  const values = [id, ...Object.values(updates)];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

export async function closeDatabase() {
  await pool.end();
}
