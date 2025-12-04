import React, { useEffect, useState } from 'react';
import { ArrowLeft, Clock, Users, DollarSign, Target, Layers } from 'lucide-react';
import { formatNumber } from '../constants';
import { fetchTierDetails, StockRow, TierDetailResponse } from '../api';

interface IPODetailProps {
    code: string | null;
    allStocks: StockRow[];
    onBack: () => void;
}

const IPODetail: React.FC<IPODetailProps> = ({ code, onBack, allStocks }) => {
    const [detail, setDetail] = useState<TierDetailResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!code) return;
        setLoading(true);
        setError(null);
        fetchTierDetails(code)
            .then(setDetail)
            .catch((err: any) => setError(err.message || '加載失敗'))
            .finally(() => setLoading(false));
    }, [code]);

    const stock = detail?.stock || allStocks.find((i) => i.代码 === code);

    if (!code) return <div className="text-zinc-500">未選擇股票</div>;
    if (loading) return <div className="text-zinc-500">正在加載詳情...</div>;
    if (error) return <div className="text-rose-500">獲取詳情失敗：{error}</div>;
    if (!stock) return <div className="text-zinc-500">未找到該股票</div>;

    const tiers = detail?.tiers || [];
    const deadline = stock.申购截止日期 ? new Date(stock.申购截止日期).toISOString().split('T')[0] : '-';
    const totalApplicants = tiers.reduce((sum, t) => sum + (t.valid_applications || 0), 0);
    const totalWinners = tiers.reduce((sum, t) => sum + (t.winners || 0), 0);
    const oversubscription = totalWinners > 0 ? totalApplicants / totalWinners : null;
    const ipo = {
        code: stock.代码,
        name: stock.股票名,
        deadline,
        fundraising: Number(stock.总发售量) || 0,
        totalApplicants,
        totalWinners,
        oversubscription,
    };

    const finalIssuePriceRaw = (stock as any)['最终发行价'] ?? (stock as any)['发行价'];
    const finalIssuePriceNum =
        finalIssuePriceRaw !== null && finalIssuePriceRaw !== undefined && finalIssuePriceRaw !== ''
            ? Number(finalIssuePriceRaw)
            : null;

    const stats = [
        { label: '申購人數', value: tiers.length ? formatNumber(ipo.totalApplicants) : '暫無數據', icon: Users },
        { label: '超購倍數', value: oversubscription ? `${oversubscription.toFixed(2)}x` : (tiers.length ? '—' : '暫無數據'), icon: Target },
        { label: '募資總額', value: `HKD ${formatNumber(ipo.fundraising)}`, icon: DollarSign },
        {
            label: '最終發行價',
            value: Number.isFinite(finalIssuePriceNum) ? `HKD ${formatNumber(finalIssuePriceNum as number)}` : '—',
            icon: DollarSign,
        },
        { label: '每手股數', value: stock.每手股数 || '-', icon: Layers, highlight: false },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <button 
                onClick={onBack}
                className="group flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors font-medium text-xs mb-4"
            >
                <div className="w-9 h-9 rounded-full bg-white border border-zinc-200 flex items-center justify-center group-hover:border-zinc-900 transition-colors">
                     <ArrowLeft size={16} />
                </div>
                返回市場列表
            </button>

            {/* Header Card */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-[0_10px_20px_rgba(0,0,0,0.02)] mb-5">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="bg-zinc-900 text-white px-3 py-1.5 rounded text-sm font-mono font-bold tracking-wider">
                                {ipo.code || '-'}
                            </span>
                            <span className="flex items-center gap-2 text-zinc-500 text-sm font-medium">
                                <Clock size={14} /> {ipo.deadline}
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 tracking-tight">{ipo.name}</h1>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-zinc-100 rounded-2xl overflow-hidden border border-zinc-100">
                    {stats.map((stat, idx) => (
                        <div key={idx} className="bg-white p-4 hover:bg-zinc-50 transition-colors">
                            <div className="flex items-center gap-2 text-zinc-400 mb-2">
                                <stat.icon size={18} strokeWidth={1.5} />
                                <span className="text-xs uppercase font-bold tracking-widest">{stat.label}</span>
                            </div>
                            <div className={`text-xl font-bold tracking-tight ${stat.highlight ? 'text-emerald-600' : 'text-zinc-900'}`}>
                                {stat.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Analysis Section */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-100 shadow-[0_10px_20px_rgba(0,0,0,0.02)]">
                <div className="mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 tracking-tight">申購檔位分析</h3>
                    <p className="text-zinc-400 text-xs mt-1">配售檔位與分配比例</p>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="table-fixed w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-zinc-50 text-[11px] uppercase text-zinc-400 font-semibold tracking-widest">
                            <tr>
                                <th className="px-5 py-3 rounded-l-xl font-normal w-16 text-center">檔位</th>
                                <th className="px-5 py-3 font-normal w-24 text-center">申購股數</th>
                                <th className="px-5 py-3 font-normal w-32 text-center">認購金額 (HKD)</th>
                                <th className="px-5 py-3 font-normal w-24 text-center">組別</th>
                                <th className="px-5 py-3 font-normal w-36 text-center">中簽 / 申購</th>
                                <th className="px-5 py-3 rounded-r-xl font-normal text-center w-28">分配占申購股份百分比</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {tiers.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-8 text-center text-zinc-400 text-sm">
                                        暫無配售結果或申購檔位數據
                                    </td>
                                </tr>
                            ) : tiers.map((tier, idx) => {
                                const winRate =
                                    tier.approx_alloc_pct !== null && tier.approx_alloc_pct !== undefined
                                        ? Number(tier.approx_alloc_pct) * 100
                                        : tier.winners && tier.valid_applications
                                            ? (tier.winners / tier.valid_applications) * 100
                                            : undefined;

                                return (
                                    <tr key={`${tier.id}-${tier.shares_applied}`} className="hover:bg-zinc-50 transition-colors group">
                                        <td className="px-5 py-4 text-zinc-400 font-mono w-16 text-center">#{idx + 1}</td>
                                        <td className="px-5 py-4 font-semibold text-zinc-900 w-24 text-center">
                                            {formatNumber(Number(tier.shares_applied))}
                                        </td>
                                        <td className="px-5 py-4 font-mono text-zinc-500 w-32 text-center">{tier.max_payment_hkd || '-'}</td>
                                        <td className="px-5 py-4 w-24 text-center">
                                            <span className={`inline-flex items-center px-3 py-1.5 rounded text-sm font-medium border ${
                                                tier.apply_group === '甲组' || tier.apply_group === '甲組'
                                                    ? 'bg-white border-zinc-200 text-zinc-600'
                                                    : 'bg-zinc-900 border-zinc-900 text-white'
                                            }`}>
                                                {tier.apply_group || '-'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-zinc-500 font-mono text-xs w-36 text-center">
                                            <span className="text-zinc-900 font-semibold">{formatNumber(tier.winners || 0)}</span>
                                            <span className="mx-2 text-zinc-300">/</span>
                                            <span>{formatNumber(tier.valid_applications || 0)}</span>
                                        </td>
                                        <td className="px-5 py-4 text-center w-28">
                                            <span className="font-bold text-zinc-900 text-xs">
                                                {Number.isFinite(winRate) ? `${winRate.toFixed(2)}%` : '—'}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IPODetail;
