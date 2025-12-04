const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3000;

const connectionString =
  process.env.DAXIN_DATABASE_URL ||
  'postgresql://root:1m3s2R7xe6LlSYJ0fq8oVKTk5Ny4P9Fu@sjc1.clusters.zeabur.com:31080/daxin';

const pool = new Pool({
  connectionString,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  ssl: false,
});

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stocks', async (req, res, next) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*,
             agg.total_valid_applications,
             agg.total_winners
      FROM "招股书" s
      LEFT JOIN (
        SELECT id,
               SUM(valid_applications) AS total_valid_applications,
               SUM(winners) AS total_winners
        FROM apply_tiers
        GROUP BY id
      ) agg ON lpad(agg.id::text, GREATEST(4, length(s."代码")), '0') = s."代码"
      LEFT JOIN "招股书" zs ON zs."代码" = s."代码"
      ORDER BY "申购截止日期" DESC
    `);
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

app.get('/api/stock-details/:stockCode', async (req, res, next) => {
  const { stockCode } = req.params;
  try {
    const stockResult = await pool.query('SELECT * FROM "招股书" WHERE "代码" = $1', [stockCode]);
    if (stockResult.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const idForQuery = parseInt(stockCode, 10);
    const paddedCode = stockCode.padStart(Math.max(4, stockCode.length), '0');

    const detailResult = await pool.query(
      `
      SELECT DISTINCT ON (id, shares_applied) *
      FROM "申购明细"
      WHERE id = $1 OR lpad(id::text, $2, '0') = $3
      ORDER BY id, shares_applied
      `,
      [idForQuery, paddedCode.length, paddedCode]
    );

    let tierResult = { rows: [] };
    if (detailResult.rowCount > 0) {
      tierResult = await pool.query(
        `
        SELECT * FROM apply_tiers
        WHERE id = $1 OR lpad(id::text, $2, '0') = $3
        ORDER BY shares_applied
        `,
        [idForQuery, paddedCode.length, paddedCode]
      );
    }

    res.json({
      stock: stockResult.rows[0],
      applyDetails: detailResult.rows,
      applyTiers: tierResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

app.get('/api/tier-details/:stockCode', async (req, res, next) => {
  const { stockCode } = req.params;
  try {
    const stockResult = await pool.query('SELECT * FROM "招股书" WHERE "代码" = $1', [stockCode]);
    if (stockResult.rowCount === 0) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    const idForQuery = parseInt(stockCode, 10);
    const paddedCode = stockCode.padStart(Math.max(4, stockCode.length), '0');
    const { rows } = await pool.query(
      `
      WITH am AS (
        SELECT id, shares_applied::numeric AS shares_applied, max_payment_hkd, apply_group, match_key
        FROM "申购明细"
        WHERE id = $1 OR lpad(id::text, $2, '0') = $3
      ),
      at AS (
        SELECT id, shares_applied::numeric AS shares_applied, approx_alloc_pct, valid_applications, winners, match_key
        FROM apply_tiers
        WHERE id = $1 OR lpad(id::text, $2, '0') = $3
      )
      SELECT 
        am.id,
        am.shares_applied,
        am.max_payment_hkd,
        am.apply_group,
        am.match_key,
        at.approx_alloc_pct,
        at.valid_applications,
        at.winners
      FROM am
      LEFT JOIN at ON am.match_key = at.match_key
        OR ABS(am.shares_applied - at.shares_applied) < 0.01
      ORDER BY am.shares_applied ASC;
      `,
      [idForQuery, paddedCode.length, paddedCode]
    );

    res.json({ stock: stockResult.rows[0], tiers: rows });
  } catch (err) {
    next(err);
  }
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
