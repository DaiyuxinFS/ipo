import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { IPO } from './types';
import IPOList from './components/IPOList';
import CalculatorView from './components/Calculator';
import IPODetail from './components/IPODetail';
import { fetchStocks, StockRow } from './api';

type View = 'list' | 'calculator' | 'detail';

const App: React.FC = () => {
    const [view, setView] = useState<View>('list');
    const [allStocks, setAllStocks] = useState<StockRow[]>([]);
    const [detailCode, setDetailCode] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const mapStockToIPO = (stock: StockRow): IPO => {
        const deadline = stock.申购截止日期 ? new Date(stock.申购截止日期) : null;
        const formatDate = (d: Date | null) =>
            d ? d.toISOString().split('T')[0] : undefined;

        const numeric = (val: string | number | null | undefined) => {
            if (val === null || val === undefined) return undefined;
            const num = Number(val);
            return Number.isNaN(num) ? undefined : num;
        };

        const totalApplicants = numeric(stock.total_valid_applications);
        const totalWinners = numeric(stock.total_winners);
        const oversubFromTable = numeric(stock['超购倍数']);
        const oversub =
            oversubFromTable !== undefined
                ? oversubFromTable
                : totalApplicants !== undefined && totalWinners !== undefined && totalWinners !== 0
                    ? totalApplicants / totalWinners
                    : undefined;
        const totalOffer = numeric(stock.总发售量);
        const publicOffer = numeric(stock.预估公开发售股数);
        const publicRatio =
            totalOffer !== undefined && totalOffer > 0 && publicOffer !== undefined
                ? publicOffer / totalOffer
                : undefined;
        const mechanism =
            publicRatio !== undefined && Math.abs(publicRatio - 0.1) <= 0.02 ? 'B' : 'A';

        return {
            name: stock.股票名,
            code: stock.代码,
            fundraising: numeric(stock.总发售量),
            priceRange: stock.招股定价上限 ? `HK$ ${stock.招股定价上限}` : undefined,
            mechanism,
            deadline: formatDate(deadline),
            deadlineDate: formatDate(deadline),
            secondaryListing: '否',
            totalApplicants,
            totalWinners,
            oversubscription: oversub,
            listingGain: undefined,
            tiers: [],
        };
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await fetchStocks();
                setAllStocks(data);
            } catch (err: any) {
                setError(err.message || '加载数据失败');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const normalizedIPOs = allStocks.map(mapStockToIPO);
    const now = new Date();
    const ongoingIPOs = normalizedIPOs.filter(
        (ipo) => !ipo.deadlineDate || new Date(ipo.deadlineDate) >= now
    );
    const listedIPOs = normalizedIPOs.filter(
        (ipo) => ipo.deadlineDate && new Date(ipo.deadlineDate) < now
    );

    const handleViewDetail = (code: string) => {
        setDetailCode(code);
        setView('detail');
    };

    const renderView = () => {
        switch (view) {
            case 'list':
                return loading ? (
                    <div className="text-zinc-500">正在加載市場數據...</div>
                ) : error ? (
                    <div className="text-rose-500">數據加載失敗：{error}</div>
                ) : (
                    <IPOList
                        ongoing={ongoingIPOs}
                        listed={listedIPOs}
                        onViewDetail={handleViewDetail}
                    />
                );
            case 'calculator':
                return (
                    <CalculatorView
                        allStocks={allStocks}
                        onBack={() => setView('list')}
                    />
                );
            case 'detail':
                return (
                    <IPODetail
                        code={detailCode}
                        allStocks={allStocks}
                        onBack={() => setView('list')}
                    />
                );
            default:
                return null;
        }
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-zinc-900 font-sans">
            {/* Minimalist Header */}
            <header className="sticky top-0 z-50 w-full bg-[#FAFAFA]/90 backdrop-blur-md border-b border-zinc-100">
                <div className="max-w-6xl mx-auto px-4 md:px-6 h-12 flex items-center justify-between">
                    <div 
                        className="cursor-pointer group flex items-center gap-2"
                        onClick={() => setView('list')}
                    >
                        <div className="w-5 h-5 bg-zinc-900 rounded-sm"></div>
                        <span className="font-bold text-lg tracking-tight text-zinc-900">IPO-CALC</span>
                    </div>

                    <nav className="flex items-center gap-1 bg-zinc-100/70 p-1 rounded-lg">
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                view === 'list' || view === 'detail'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            市場
                        </button>
                        <button
                            onClick={() => setView('calculator')}
                            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                                view === 'calculator'
                                    ? 'bg-white text-zinc-900 shadow-sm'
                                    : 'text-zinc-500 hover:text-zinc-800'
                            }`}
                        >
                            驗證
                        </button>
                    </nav>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto px-4 md:px-6 py-4 lg:py-5">
                {/* Hero Title Section */}
                <div className={view === 'calculator' ? 'mb-4' : 'mb-6'}>
                   <div className="overflow-hidden">
                        <motion.h2 
                            key={view}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className={`font-semibold tracking-tight text-zinc-900 ${view === 'calculator' ? 'text-3xl' : 'text-3xl md:text-4xl'}`}
                        >
                            {view === 'list' ? '市場數據' : view === 'calculator' ? '收益驗證' : '深度分析'}
                        </motion.h2>
                   </div>
                   <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                        className="mt-3 text-zinc-500 max-w-xl text-base font-light leading-relaxed"
                   >
                       {view === 'list' && "實時追蹤最新 IPO 動態與歷史表現數據。"}
                       {view === 'calculator' && "事後驗證單筆申購的實際盈虧、收益率與打和價。"}
                       {view === 'detail' && "詳細的申購檔位分析與中籤率數據。"}
                   </motion.p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4 }}
                    >
                        {renderView()}
                    </motion.div>
                </AnimatePresence>
            </main>

            {/* Premium Floating Action Button */}
            <AnimatePresence>{null}</AnimatePresence>
        </div>
    );
};

export default App;
