import { IPO } from './types';

export const MOCK_ONGOING_IPOS: IPO[] = [
    {
        name: '理想汽車',
        code: '2015',
        fundraising: 15800000000,
        priceRange: 'HKD 118.00 - 128.00',
        mechanism: 'A',
        deadline: '2025-11-15 12:00',
        deadlineDate: '2025-11-15',
        secondaryListing: '否'
    },
    {
        name: '科大訊飛',
        code: '9876',
        fundraising: 8500000000,
        priceRange: 'HKD 68.00 - 78.00',
        mechanism: 'B',
        deadline: '2025-11-15 12:00',
        deadlineDate: '2025-11-15',
        secondaryListing: '否'
    },
    {
        name: '華為雲計算',
        code: '6666',
        fundraising: 22000000000,
        priceRange: 'HKD 158.00 - 178.00',
        mechanism: 'A',
        deadline: '2025-11-18 16:00',
        deadlineDate: '2025-11-18',
        secondaryListing: '否'
    },
    {
        name: '京東健康',
        code: '6618',
        fundraising: 12500000000,
        priceRange: 'HKD 88.00 - 98.00',
        mechanism: 'B',
        deadline: '2025-11-18 16:00',
        deadlineDate: '2025-11-18',
        secondaryListing: '是 -8%'
    },
    {
        name: '網易有道',
        code: '8888',
        fundraising: 4500000000,
        priceRange: 'HKD 38.00 - 45.00',
        mechanism: 'A',
        deadline: '2025-11-20 12:00',
        deadlineDate: '2025-11-20',
        secondaryListing: '是 -10%'
    }
];

export const MOCK_LISTED_IPOS: IPO[] = [
    {
        name: '小馬智行',
        code: '2026',
        deadline: '2025-11-02',
        fundraising: 7552026000,
        totalApplicants: 37062,
        totalWinners: 21421,
        oversubscription: 1.73,
        listingGain: 15.2,
        tiers: [
            { id: 1, shares: 2000, fee: 318000, group: '甲組', applicants: 15000, winners: 8500, ratio: 56.67 },
            { id: 2, shares: 10000, fee: 1590000, group: '甲組', applicants: 12000, winners: 7200, ratio: 60.00 },
            { id: 3, shares: 50000, fee: 7950000, group: '乙組', applicants: 10062, winners: 5721, ratio: 56.86 }
        ]
    },
    {
        name: '明略科技',
        code: '2718',
        deadline: '2025-10-27',
        fundraising: 1017879000,
        totalApplicants: 283629,
        totalWinners: 18048,
        oversubscription: 15.72,
        listingGain: 8.5,
        tiers: [
            { id: 1, shares: 4000, fee: 564000, group: '甲組', applicants: 180000, winners: 10000, ratio: 5.56 },
            { id: 2, shares: 20000, fee: 2820000, group: '甲組', applicants: 80000, winners: 6000, ratio: 7.50 },
            { id: 3, shares: 100000, fee: 14100000, group: '乙組', applicants: 23629, winners: 2048, ratio: 8.67 }
        ]
    },
    {
        name: '蘇州旺山旺水生物醫藥',
        code: '2630',
        deadline: '2025-11-02',
        fundraising: 598325200,
        totalApplicants: 265188,
        totalWinners: 8799,
        oversubscription: 30.14,
        listingGain: 22.8,
        tiers: [
            { id: 1, shares: 2000, fee: 450200, group: '甲組', applicants: 150000, winners: 5000, ratio: 3.33 },
            { id: 2, shares: 10000, fee: 2251000, group: '甲組', applicants: 90000, winners: 3000, ratio: 3.33 },
            { id: 3, shares: 35000, fee: 7878500, group: '乙組', applicants: 25188, winners: 799, ratio: 3.17 }
        ]
    },
    {
        name: '賽力斯集團',
        code: '9927',
        deadline: '2025-10-30',
        fundraising: 13176300000,
        totalApplicants: 202321,
        totalWinners: 57928,
        oversubscription: 3.49,
        listingGain: 12.3,
        tiers: [
            { id: 1, shares: 5000, fee: 1625000, group: '甲組', applicants: 120000, winners: 35000, ratio: 29.17 },
            { id: 2, shares: 20000, fee: 6500000, group: '甲組', applicants: 60000, winners: 18000, ratio: 30.00 },
            { id: 3, shares: 40000, fee: 13000000, group: '乙組', applicants: 22321, winners: 4928, ratio: 22.08 }
        ]
    },
    {
        name: '文遠知行',
        code: '0800',
        deadline: '2025-11-02',
        fundraising: 3088750000,
        totalApplicants: 64949,
        totalWinners: 19609,
        oversubscription: 3.31,
        listingGain: 18.7,
        tiers: [
            { id: 1, shares: 2000, fee: 950000, group: '甲組', applicants: 40000, winners: 12000, ratio: 30.00 },
            { id: 2, shares: 10000, fee: 4750000, group: '甲組', applicants: 18000, winners: 5500, ratio: 30.56 },
            { id: 3, shares: 25000, fee: 11875000, group: '乙組', applicants: 6949, winners: 2109, ratio: 30.35 }
        ]
    }
];

export const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return '-';
    return num.toLocaleString('zh-HK');
};

export const getColorForDeadline = (date: string) => {
    // Simple hash-like function for consistent colors
    const hash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = [
        'bg-blue-50 border-l-4 border-blue-500',
        'bg-amber-50 border-l-4 border-amber-500',
        'bg-emerald-50 border-l-4 border-emerald-500',
        'bg-rose-50 border-l-4 border-rose-500',
        'bg-purple-50 border-l-4 border-purple-500',
    ];
    return colors[hash % colors.length];
};
