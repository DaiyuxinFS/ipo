export interface StockRow {
    id: number;
    股票名: string;
    代码: string;
    申购截止日期: string | null;
    中签暗盘时间: string | null;
    招股定价上限: string | null;
    发行价?: string | null;
    最终发行价?: string | null;
    总发售量: string | null;
    预估公开发售股数: string | null;
    每手股数: number | null;
    开盘时间: string | null;
    超购倍数?: string | null;
    total_valid_applications?: number | null;
    total_winners?: number | null;
}

export interface ApplyDetailRow {
    唯一id: number;
    id: number;
    shares_applied: string;
    max_payment_hkd: string | null;
    match_key: string | null;
    apply_group: string | null;
}

export interface ApplyTierRow {
    unique_id: number;
    id: number;
    shares_applied: string;
    valid_applications: number | null;
    winners: number | null;
    avg_shares_per_winner: string | null;
    approx_alloc_pct: string | null;
    match_key: string | null;
}

export interface TierDetailRow {
    id: number;
    shares_applied: string;
    max_payment_hkd: string | null;
    apply_group: string | null;
    match_key: string | null;
    approx_alloc_pct: string | null;
    valid_applications: number | null;
    winners: number | null;
}

export interface StockDetailResponse {
    stock: StockRow;
    applyDetails: ApplyDetailRow[];
    applyTiers: ApplyTierRow[];
}

export interface TierDetailResponse {
    stock: StockRow;
    tiers: TierDetailRow[];
}

// 移除末尾斜杠，防止双斜杠问题
const API_BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) || '').replace(/\/$/, '');

async function request<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
    }
    return res.json();
}

export const fetchStocks = () => request<StockRow[]>('/api/stocks');
export const fetchStockDetails = (code: string) => request<StockDetailResponse>(`/api/stock-details/${encodeURIComponent(code)}`);
export const fetchTierDetails = (code: string) => request<TierDetailResponse>(`/api/tier-details/${encodeURIComponent(code)}`);
