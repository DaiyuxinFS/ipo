import React from 'react';
import { ArrowRight, Clock, Hash, DollarSign, Activity } from 'lucide-react';
import { IPO } from '../types';
import { formatNumber } from '../constants';

interface IPOListProps {
    ongoing: IPO[];
    listed: IPO[];
    onViewDetail: (code: string) => void;
}

const IPOList: React.FC<IPOListProps> = ({ ongoing, listed, onViewDetail }) => {
    return (
        <div className="space-y-12">
            {/* Ongoing Section */}
            <section>
                <div className="flex items-end justify-between mb-6 border-b border-zinc-100 pb-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">正在申購</h3>
                    <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                        {ongoing.length} Active
                    </span>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-base whitespace-nowrap">
                        <thead className="text-xs uppercase text-zinc-400 font-semibold tracking-widest">
                            <tr>
                                <th className="px-4 py-3 font-normal">名字 / 代碼</th>
                                <th className="px-4 py-3 font-normal">募資量 (HKD)</th>
                                <th className="px-4 py-3 font-normal">股價</th>
                                <th className="px-4 py-3 font-normal">機制</th>
                                <th className="px-4 py-3 font-normal">截止時間</th>
                                <th className="px-4 py-3 font-normal text-right">二次上市</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {ongoing.map((ipo) => (
                                <tr key={ipo.code} className="group hover:bg-white transition-colors">
                                    <td className="px-4 py-5">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-semibold text-zinc-900 text-lg">{ipo.name}</span>
                                            <span className="font-mono text-zinc-400 text-sm">{ipo.code}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-zinc-600 font-mono text-lg">{formatNumber(ipo.fundraising)}</td>
                                    <td className="px-4 py-5 text-zinc-600 text-lg">{ipo.priceRange || '-'}</td>
                                    <td className="px-4 py-5">
                                        <span className="inline-flex items-center justify-center w-9 h-9 rounded border border-zinc-200 text-sm font-medium text-zinc-600 bg-zinc-50">
                                            {ipo.mechanism || '-'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-5">
                                        <div className="flex items-center gap-2 text-zinc-900 text-lg">
                                            <Clock size={20} className="text-zinc-400" />
                                            {ipo.deadline || '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-5 text-right text-zinc-500">
                                        {ipo.secondaryListing === '否' ? (
                                            <span className="text-zinc-300 text-sm">—</span>
                                        ) : (
                                            <span className="bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded text-sm">
                                                {ipo.secondaryListing}
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Listed Section */}
            <section>
                <div className="flex items-end justify-between mb-6 border-b border-zinc-100 pb-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-zinc-900">已上市</h3>
                    <span className="text-sm font-medium text-zinc-500 uppercase tracking-widest">
                        {listed.length} Listed
                    </span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-base whitespace-nowrap">
                        <thead className="text-xs uppercase text-zinc-400 font-semibold tracking-widest">
                            <tr>
                                <th className="px-4 py-3 font-normal">名字 / 代碼</th>
                                <th className="px-4 py-3 font-normal">截止日期</th>
                                <th className="px-4 py-3 font-normal">募資 / 認購</th>
                                <th className="px-4 py-3 font-normal">數據概覽</th>
                                <th className="px-4 py-3 font-normal text-right">詳情</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-50">
                            {listed.map((ipo) => (
                                <tr key={ipo.code} className="group transition-all duration-300 hover:bg-white">
                                    <td className="px-4 py-6 align-middle">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="font-semibold text-lg text-zinc-700 group-hover:text-zinc-900 transition-colors">
                                                {ipo.name}
                                            </span>
                                            <span className="font-mono text-zinc-400 text-sm flex items-center gap-1.5">
                                                <Hash size={12} /> {ipo.code}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 align-middle text-zinc-500 text-lg">
                                        {ipo.deadline}
                                    </td>
                                    <td className="px-4 py-6 align-middle">
                                        <div className="flex flex-col gap-2 text-sm">
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <DollarSign size={16} className="text-zinc-400" />
                                                <span className="font-mono text-base">{formatNumber(ipo.fundraising)}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <Activity size={16} className="text-zinc-400" />
                                                <span className="text-base">
                                                    {ipo.oversubscription ? `${ipo.oversubscription.toFixed(2)}x 超購` : '—'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 align-middle">
                                        <div className="flex flex-col gap-1 text-zinc-500 text-sm">
                                            <span className="text-base">中: {formatNumber(ipo.totalWinners)}</span>
                                            <span className="text-base">申: {formatNumber(ipo.totalApplicants)}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-6 align-middle text-right">
                                        <button 
                                            onClick={() => onViewDetail(ipo.code)}
                                            className="p-3 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 rounded-full transition-all"
                                        >
                                            <ArrowRight size={24} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default IPOList;
