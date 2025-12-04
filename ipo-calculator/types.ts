export interface IPO {
    name: string;
    code: string;
    fundraising: number;
    // For Ongoing
    priceRange?: string;
    mechanism?: string; // A or B
    deadline?: string;
    deadlineDate?: string;
    secondaryListing?: string;
    // For Listed
    totalApplicants?: number;
    totalWinners?: number;
    oversubscription?: number;
    listingGain?: number;
    tiers?: Tier[];
}

export interface Tier {
    id: number;
    shares: number;
    fee: number;
    group: string;
    applicants: number;
    winners: number;
    ratio: number;
}

export interface AccountIPO {
    code: string;
    shares: string; // Keep as string for input handling, convert to number for calc
    customInput?: boolean;
}

export interface AccountPlan {
    id: number;
    name: string;
    ipos: AccountIPO[];
    brokerRate?: number;
    bankFee?: string;
}

export interface CalculationResult {
    type: 'user' | 'system';
    name: string;
    totalInvestment: number;
    expectedReturn: number;
    returnRate: number;
    accountCount: number;
    accountDetails: AccountDetail[];
}

export interface AccountDetail {
    accountName: string;
    ipos: CalculatedIPO[];
    totalInvestment: number;
    totalReturn: number;
}

export interface CalculatedIPO {
    name: string;
    code: string;
    shares: number;
    cost: number;
    expectedReturn: number;
    allocationRate: number;
    gain: number;
}
