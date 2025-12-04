# API & 数据源概览

当前后端在 `backend/server.js` 中使用 Express 暴露 REST 接口，数据源为 PostgreSQL（`pg` 连接池）。

## 数据库连接
- Driver: `pg`
- Connection string: `postgresql://root:1m3s2R7xe6LlSYJ0fq8oVKTk5Ny4P9Fu@sjc1.clusters.zeabur.com:31080/daxin`
- Pool config: `max=20`, `idleTimeoutMillis=30000`, `connectionTimeoutMillis=10000`, `ssl=false`
- 主要表：
  - `招股书`：新股基础信息
  - `申购明细`：申购档位详情
  - `apply_tiers`：配售结果（申购档位的中签率等）

## 已实现接口
Base URL: `/api`

### GET `/api/stocks`
- 作用：获取全部新股数据
- 查询：`SELECT * FROM 招股书 ORDER BY 申购截止日期 DESC`
- 前端使用：`StockTable`, `PostCalculator`, `Calculator`

### GET `/api/stock-details/:stockCode`
- 作用：获取指定股票的基础信息 + 申购明细 + 配售结果
- 步骤：
  1) `SELECT * FROM 招股书 WHERE "代码" = $1`
  2) `SELECT DISTINCT ON (id, shares_applied) * FROM 申购明细 WHERE id = $1 ORDER BY id, shares_applied`
  3) 如果有申购明细，再查配售结果：`SELECT * FROM apply_tiers WHERE id = $1`
- 前端使用：`StockDetail`

### GET `/api/tier-details/:stockCode`
- 作用：获取指定股票的档位详情（明细 + 配售结果合并）
- 步骤：
  1) `SELECT * FROM 招股书 WHERE "代码" = $1`
  2) 联合查询明细与配售结果：
     ```sql
     SELECT 
       am.id,
       am.shares_applied,
       am.max_payment_hkd,
       am.apply_group,
       am.match_key,
       at.approx_alloc_pct,
       at.valid_applications,
       at.winners
     FROM 申购明细 am
     LEFT JOIN apply_tiers at ON am.match_key = at.match_key
       OR (am.id = at.id AND ABS(am.shares_applied - at.shares_applied) < 0.01)
     WHERE am.id = $1
     ORDER BY am.shares_applied ASC;
     ```
- 前端使用：`PostCalculator`

### GET `/api/health`
- 作用：健康检查，返回 `{ status: 'ok', timestamp }`

## 相关前端封装
`frontend/src/api/index.js` 提供：
- `fetchStocks()` → `/api/stocks`
- `fetchStockDetails(stockCode)` → `/api/stock-details/:stockCode`
- `fetchTierDetails(stockCode)` → `/api/tier-details/:stockCode`
