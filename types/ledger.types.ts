// types/ledger.types.ts

export interface LedgerEntry {
    id: string;
    entryDate: Date;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    referenceId: string | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateLedgerEntryInput {
    entryDate?: Date;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
    referenceId?: string;
}

export interface UpdateLedgerEntryInput {
    entryDate?: Date;
    description?: string;
    debitAccount?: string;
    creditAccount?: string;
    amount?: number;
    referenceId?: string;
}

export interface LedgerFilters {
    startDate?: Date;
    endDate?: Date;
    account?: string;
    referenceId?: string;
    page?: number;
    limit?: number;
}

export interface PaginatedLedgerEntries {
    entries: LedgerEntry[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}
