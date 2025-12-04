import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCcw, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { StockRow, TierDetailRow, fetchTierDetails } from '../api';

const SELL_FEE_RATE = 0.0013219;

interface CalculatorProps {
    allStocks: StockRow[];
    onBack: () => void;
}

interface CalculationResult {
    paidAmount: number;
    sellRevenue: number;
    grossProfit: number;
    winningFee: number;
    financingCost: number;
    totalFees: number;
    netProfit: number;
    returnRate: number;
    breakEven: number;
    principal: number;
    financingAmount: number;
    sellFeeUsed: number;
}

const toNumber = (value: string | number | null | undefined): number | null => {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    const cleaned = value.replace(/[^0-9.-]/g, '');
    const num = parseFloat(cleaned);
    return Number.isFinite(num) ? num : null;
};

const formatMoney = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '-';
    return value.toLocaleString('zh-HK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
};

const pickIssuePrice = (stock: StockRow | null): string => {
    if (!stock) return '';
    const finalPrice = toNumber((stock as any)['最终发行价']);
    const direct = toNumber((stock as any)['发行价']);
    const cap = toNumber((stock as any)['招股定价上限']);
    const price = finalPrice ?? direct ?? cap;
    return price !== null ? price.toString() : '';
};

const ratioFromApprox = (approx: string | number | null | undefined): number | null => {
    const num = toNumber(
        typeof approx === 'number' ? approx : typeof approx === 'string' ? approx.replace('%', '') : null
    );
    if (num === null) return null;
    return num > 1 ? num / 100 : num;
};

const Calculator: React.FC<CalculatorProps> = ({ allStocks, onBack }) => {
    const [stockInput, setStockInput] = useState('');
    const [selectedStock, setSelectedStock] = useState<StockRow | null>(null);
    const [issuePrice, setIssuePrice] = useState('');
    const [applyShares, setApplyShares] = useState('');
    const [winningShares, setWinningShares] = useState('');
    const [winningManual, setWinningManual] = useState(false);
    const [sellPrice, setSellPrice] = useState('');
    const [applyFee, setApplyFee] = useState('100');
    const [sellFee, setSellFee] = useState('0');
    const [sellFeeManual, setSellFeeManual] = useState(false);
    const [financingEnabled, setFinancingEnabled] = useState(false);
    const [leverage, setLeverage] = useState('1');
    const [annualRate, setAnnualRate] = useState('3.68');
    const [holdingDays, setHoldingDays] = useState('3');

    const [tierDetails, setTierDetails] = useState<TierDetailRow[]>([]);
    const [matchedTier, setMatchedTier] = useState<TierDetailRow | null>(null);
    const [tierFormula, setTierFormula] = useState<string>('');
    const [tierLoading, setTierLoading] = useState(false);
    const [tierError, setTierError] = useState<string | null>(null);

    const [result, setResult] = useState<CalculationResult | null>(null);
    const [error, setError] = useState<string | null>(null);

    const reset = () => {
        setStockInput('');
        setSelectedStock(null);
        setIssuePrice('');
        setApplyShares('');
        setWinningShares('');
        setWinningManual(false);
        setSellPrice('');
        setApplyFee('100');
        setSellFee('0');
        setSellFeeManual(false);
        setFinancingEnabled(false);
        setLeverage('1');
        setAnnualRate('3.68');
        setHoldingDays('3');
        setTierDetails([]);
        setMatchedTier(null);
        setTierFormula('');
        setTierError(null);
        setResult(null);
        setError(null);
    };

    const matchedStock = useMemo(() => {
        if (!stockInput) return null;
        return allStocks.find(
            (s) => s.代码 === stockInput.trim() || s.股票名 === stockInput.trim() || `${s.代码} ${s.股票名}` === stockInput.trim()
        );
    }, [allStocks, stockInput]);

    useEffect(() => {
        if (!stockInput.trim()) {
            setSelectedStock(null);
            setTierDetails([]);
            setMatchedTier(null);
            setTierFormula('');
            setTierError(null);
            setIssuePrice('');
            return;
        }

        if (matchedStock && matchedStock.代码 !== selectedStock?.代码) {
            setSelectedStock(matchedStock);
            const price = pickIssuePrice(matchedStock);
            setIssuePrice(price);
        } else if (!matchedStock) {
            setSelectedStock(null);
            setTierDetails([]);
            setMatchedTier(null);
            setTierFormula('');
            setTierError('未找到匹配的 IPO，請檢查代碼或名稱');
        }
    }, [matchedStock, selectedStock, stockInput]);

    useEffect(() => {
        const loadTier = async () => {
            if (!selectedStock?.代码) return;
            try {
                setTierLoading(true);
                setTierError(null);
                const res = await fetchTierDetails(selectedStock.代码);
                setTierDetails(res.tiers || []);
            } catch (err: any) {
                setTierError(err.message || '檔位信息獲取失敗');
                setTierDetails([]);
            } finally {
                setTierLoading(false);
            }
        };
        loadTier();
    }, [selectedStock]);

    useEffect(() => {
        if (!tierDetails.length) {
            setMatchedTier(null);
            setTierFormula('');
            return;
        }
        const apply = toNumber(applyShares);
        if (!apply || apply <= 0) {
            setMatchedTier(null);
            setTierFormula('');
            return;
        }
        const tier = tierDetails.find((t) => {
            const sharesApplied = toNumber(t.shares_applied);
            if (sharesApplied === null) return false;
            return Math.abs(sharesApplied - apply) <= 0.01;
        });
        if (!tier) {
            setMatchedTier(null);
            setTierFormula('');
            return;
        }
        setMatchedTier(tier);

        const approx = ratioFromApprox(tier.approx_alloc_pct);
        const validApps = toNumber(tier.valid_applications);
        const winners = toNumber(tier.winners);
        const lotSize = selectedStock?.每手股数 && selectedStock.每手股数 > 0 ? selectedStock.每手股数 : 1;

        if (approx && validApps && winners && winners !== 0) {
            const estimatedRaw = (approx * validApps * apply) / winners;
            const estimatedLots = Math.round(estimatedRaw / lotSize);
            const estimated = estimatedLots * lotSize;
            setTierFormula(
                `預估中簽股數 = (配發比例 ${(approx * 100).toFixed(2)}% × 有效申購數 ${validApps}) / 中簽人數 ${winners}，按每手 ${lotSize} 取整`
            );
            if (!winningManual || !winningShares) {
                setWinningShares(String(estimated));
            }
        } else {
            setTierFormula('');
        }
    }, [applyShares, tierDetails, winningManual, winningShares, selectedStock]);

    useEffect(() => {
        const win = toNumber(winningShares);
        const price = toNumber(sellPrice);
        if (!sellFeeManual && win && price) {
            const next = +(win * price * SELL_FEE_RATE).toFixed(2);
            if (toNumber(sellFee) !== next) {
                setSellFee(next.toString());
            }
        }
    }, [sellPrice, sellFee, sellFeeManual, winningShares]);

    const totalRequired = useMemo(() => {
        const apply = toNumber(applyShares);
        const price = toNumber(issuePrice);
        if (!apply || !price) return 0;
        return apply * price;
    }, [applyShares, issuePrice]);

    const principal = useMemo(() => {
        if (!financingEnabled) return totalRequired;
        const leverageNum = toNumber(leverage);
        if (!leverageNum || leverageNum <= 0) return totalRequired;
        return totalRequired / leverageNum;
    }, [financingEnabled, leverage, totalRequired]);

    const financingAmount = Math.max(totalRequired - principal, 0);

    const calculate = () => {
        const apply = toNumber(applyShares);
        const price = toNumber(issuePrice);
        const win = toNumber(winningShares);
        const sell = toNumber(sellPrice);
        const applyFeeNum = toNumber(applyFee) ?? 0;
        const sellFeeNum = toNumber(sellFee) ?? 0;

        if (!apply || !price || !win || !sell || apply <= 0 || price <= 0 || win <= 0 || sell <= 0) {
            setError('請填寫正確的申購股數、發行價、中簽股數與賣出價格');
            setResult(null);
            return;
        }
        setError(null);

        const paidAmount = win * price;
        const sellRevenue = win * sell;
        const grossProfit = sellRevenue - paidAmount;

        let financingCost = 0;
        if (financingEnabled) {
            const leverageNum = toNumber(leverage);
            const annualRateNum = toNumber(annualRate);
            const holdingDaysNum = toNumber(holdingDays);
            if (leverageNum && annualRateNum && holdingDaysNum && leverageNum > 0) {
                const amount = Math.max(apply * price - principal, 0);
                financingCost = amount * (annualRateNum / 100) * (holdingDaysNum / 365);
            }
        }

        const winningFee = paidAmount * 0.01;
        const totalFees = applyFeeNum + financingCost + sellFeeNum + winningFee;
        const netProfit = grossProfit - totalFees;
        const returnRate = (netProfit / (apply * price)) * 100;
        const breakEven =
            win > 0
                ? (price * win + applyFeeNum + financingCost + winningFee) / (win * (1 - SELL_FEE_RATE))
                : NaN;

        setResult({
            paidAmount,
            sellRevenue,
            grossProfit,
            winningFee,
            financingCost,
            totalFees,
            netProfit,
            returnRate,
            breakEven,
            principal,
            financingAmount,
            sellFeeUsed: sellFeeNum,
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="text-zinc-400 hover:text-zinc-800 transition-colors p-2 -ml-2 rounded-full hover:bg-zinc-100"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <h2 className="text-xl font-semibold text-zinc-900">收益驗證</h2>
                        <p className="text-sm text-zinc-500">輸入實際申購與賣出信息，輸出實際盈虧拆解</p>
                    </div>
                </div>
                <button
                    onClick={reset}
                    className="text-xs text-zinc-500 hover:text-zinc-900 flex items-center gap-1.5 px-3 py-1.5 rounded-md hover:bg-zinc-100 transition-colors"
                >
                    <RefreshCcw size={14} /> 重置
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-start">
                <div className="space-y-4">
                    <section className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-zinc-900">IPO 選擇</h3>
                            {tierLoading && <Loader2 className="animate-spin text-zinc-400" size={16} />}
                        </div>
                        <div className="space-y-2.5">
                            <div>
                                <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">代碼 / 名稱</label>
                                <input
                                    list="ipo-list"
                                    value={stockInput}
                                    onChange={(e) => setStockInput(e.target.value)}
                                    onBlur={(e) => setStockInput(e.target.value.trim())}
                                    placeholder="輸入或選擇 IPO 代碼/名稱"
                                    className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                />
                                <datalist id="ipo-list">
                                    {allStocks.map((s) => (
                                        <option key={s.id} value={s.代码}>
                                            {`${s.代码} ${s.股票名}`}
                                        </option>
                                    ))}
                                </datalist>
                                {tierError && <p className="text-amber-600 text-xs mt-2">{tierError}</p>}
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">發行價</label>
                                    <input
                                        type="number"
                                        value={issuePrice}
                                        onChange={(e) => setIssuePrice(e.target.value)}
                                        className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                    />
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">申購股數</label>
                                    <input
                                        type="number"
                                        value={applyShares}
                                        onChange={(e) => setApplyShares(e.target.value)}
                                        className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                    />
                                </div>
                            </div>
                        </div>
                        </section>

                        <section className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-900">費用與融資</h3>
                            <div className="grid grid-cols-2 gap-2.5 items-start">
                                <div className="flex flex-col justify-start">
                                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">申購費</label>
                                    <input
                                        type="number"
                                        value={applyFee}
                                        onChange={(e) => setApplyFee(e.target.value)}
                                        className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                    />
                                </div>
                                <div className="flex flex-col justify-start">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">賣出費</label>
                                        <button
                                            className="text-[11px] text-zinc-400 hover:text-zinc-700"
                                            onClick={() => {
                                                setSellFeeManual(false);
                                                const win = toNumber(winningShares);
                                                const price = toNumber(sellPrice);
                                                if (win && price) {
                                                    const next = +(win * price * SELL_FEE_RATE).toFixed(2);
                                                    setSellFee(next.toString());
                                                } else {
                                                    setSellFee('0');
                                                }
                                            }}
                                        >
                                            按比例重算
                                    </button>
                                </div>
                                <input
                                    type="number"
                                    value={sellFee}
                                    onChange={(e) => {
                                        setSellFeeManual(true);
                                        setSellFee(e.target.value);
                                    }}
                                    className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                />
                                <p className="text-[11px] text-zinc-400 mt-1">默認按 {(
                                    SELL_FEE_RATE * 100
                                ).toFixed(5)}% 計算，可手動填寫固定金額</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                                <input
                                    id="financing"
                                    type="checkbox"
                                    checked={financingEnabled}
                                    onChange={(e) => setFinancingEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-300"
                                />
                                <label htmlFor="financing" className="text-zinc-700">啟用融資</label>
                            </div>

                            {financingEnabled && (
                                <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">融資倍數</label>
                                        <input
                                            type="number"
                                            value={leverage}
                                            onChange={(e) => setLeverage(e.target.value)}
                                            className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">融資年化利率 (%)</label>
                                        <input
                                            type="number"
                                            value={annualRate}
                                            onChange={(e) => setAnnualRate(e.target.value)}
                                            className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">持有天數</label>
                                        <input
                                            type="number"
                                            value={holdingDays}
                                            onChange={(e) => setHoldingDays(e.target.value)}
                                            className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                        />
                                    </div>
                                </div>
                            )}

                        </section>

                        <section className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm space-y-3">
                            <h3 className="text-sm font-semibold text-zinc-900">申購與賣出</h3>
                            <div className="grid grid-cols-2 gap-2.5">
                                <div>
                                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">中簽股數</label>
                                    <input
                                        type="number"
                                        value={winningShares}
                                        onChange={(e) => {
                                            setWinningManual(true);
                                            setWinningShares(e.target.value);
                                        }}
                                        className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                    />
                                    {tierFormula && (
                                        <p className="text-[11px] text-zinc-500 mt-1">{tierFormula}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">賣出價格</label>
                                    <input
                                        type="number"
                                        value={sellPrice}
                                        onChange={(e) => setSellPrice(e.target.value)}
                                        className="w-full mt-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-zinc-200"
                                    />
                                </div>
                            </div>
                        </section>

                    <div className="pt-1 pb-1">
                        <button
                            onClick={calculate}
                            className="w-full bg-zinc-900 text-white py-3 rounded-lg font-medium shadow-md hover:bg-zinc-800 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                        >
                            <TrendingUp size={18} /> 開始計算
                        </button>
                        {error && <p className="text-rose-500 text-sm mt-2">{error}</p>}
                    </div>
                </div>

                <div className="space-y-2.5 sticky top-20" id="results-area">
                    <div className="bg-white p-4 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <h3 className="text-sm font-semibold text-zinc-900">結果</h3>
                                <p className="text-[11px] text-zinc-400">格式化展示，保留 2 位小數</p>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                <Wallet size={14} /> 需資金 HKD {formatMoney(principal)}
                            </div>
                        </div>

                        {!result ? (
                            <div className="h-40 rounded-xl border border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400">
                                <Sparkles size={28} className="mb-2" />
                                <p className="text-sm">填寫數據並點擊計算以查看收益</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <ResultCard title="淨收益" value={`HKD ${formatMoney(result.netProfit)}`} highlight />
                                    <ResultCard title="收益率" value={`${result.returnRate.toFixed(2)}%`} highlight />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <ResultCard title="打和價" value={`HKD ${formatMoney(result.breakEven)}`} />
                                    <ResultCard
                                        title="總費用"
                                        value={`HKD ${formatMoney(result.totalFees)}`}
                                        subtitle={`申購費 ${formatMoney(toNumber(applyFee) ?? 0)} · 融資費 ${formatMoney(result.financingCost)} · 中簽費 ${formatMoney(result.winningFee)} · 賣出費 ${formatMoney(result.sellFeeUsed)}`}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <ResultCard title="付出金額" value={`HKD ${formatMoney(result.paidAmount)}`} />
                                    <ResultCard title="賣出收入" value={`HKD ${formatMoney(result.sellRevenue)}`} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <ResultCard title="毛利" value={`HKD ${formatMoney(result.grossProfit)}`} />
                                    <ResultCard
                                        title="融資資訊"
                                        value={`本金 HKD ${formatMoney(result.principal)} · 融資額 HKD ${formatMoney(result.financingAmount)}`}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-zinc-100 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-sm font-semibold text-zinc-900">自動檔位識別</h3>
                            {matchedTier && (
                                <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
                                    已匹配檔位
                                </span>
                            )}
                        </div>
                        {!tierDetails.length ? (
                            <p className="text-sm text-zinc-400">無檔位數據，請手動輸入中簽股數</p>
                        ) : matchedTier ? (
                            <div className="space-y-1 text-sm text-zinc-700">
                                <p>申購檔位：{toNumber(matchedTier.shares_applied)?.toLocaleString('zh-HK')}</p>
                                <p>組別：{matchedTier.apply_group || '-'}</p>
                                <p>
                                    配發比例：{ratioFromApprox(matchedTier.approx_alloc_pct) !== null
                                        ? `${(ratioFromApprox(matchedTier.approx_alloc_pct)! * 100).toFixed(2)}%`
                                        : '-'}
                                </p>
                                <p>有效申購：{matchedTier.valid_applications ?? '-'}</p>
                                <p>中簽人數：{matchedTier.winners ?? '-'}</p>
                                {tierFormula && <p className="text-[11px] text-zinc-500">{tierFormula}</p>}
                            </div>
                        ) : (
                            <p className="text-sm text-zinc-500">未匹配到對應檔位，請檢查申購股數或手動填寫</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface ResultCardProps {
    title: string;
    value: string;
    highlight?: boolean;
    subtitle?: string;
}

const ResultCard: React.FC<ResultCardProps> = ({ title, value, highlight, subtitle }) => (
    <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-3 rounded-xl border ${highlight ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-100 bg-zinc-50'}`}
    >
        <div className="text-[11px] uppercase tracking-wider font-medium text-zinc-400">{title}</div>
        <div className={`mt-1 text-lg font-semibold ${highlight ? 'text-white' : 'text-zinc-900'}`}>{value}</div>
        {subtitle && <div className="text-[11px] text-zinc-500 mt-0.5 leading-tight">{subtitle}</div>}
    </motion.div>
);

export default Calculator;
