import { prisma } from "@/lib/prisma";
import {
    ApproveDayBookInput,
    CloseDayBookInput,
    CreateCashDenominationInput,
    CreateDayBookEntryInput,
    CreateDayBookInput,
    UpdateDayBookEntryInput,
} from "@/lib/validations/daybook.schema";
import { DayBookEntryType, DayBookStatus } from "@prisma/client";
import Decimal from "decimal.js";

const CASH_VARIANCE_TOLERANCE = 100; // Amount in base currency units

class DayBookService {
  /**
   * Open a new day book for a specific date
   */
  async openDayBook(data: CreateDayBookInput, userId: string) {
    const normalizedDate = new Date(data.date);
    normalizedDate.setHours(0, 0, 0, 0);

    // Check if day book already exists for this date
    const existingDayBook = await prisma.dayBook.findFirst({
      where: {
        date: {
          gte: normalizedDate,
          lt: new Date(normalizedDate.getTime() + 86400000), // Next day
        },
      },
    });

    if (existingDayBook) {
      throw new Error(
        `Day book already exists for ${normalizedDate.toDateString()}`
      );
    }

    return await prisma.dayBook.create({
      data: {
        date: normalizedDate,
        openingCashBalance: new Decimal(data.openingCashBalance),
        openingBankBalance: new Decimal(data.openingBankBalance),
        notes: data.notes,
        openedById: userId,
        status: DayBookStatus.OPEN,
      },
      include: {
        openedBy: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Get current (today's) day book or latest open one
   */
  async getCurrentDayBook() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return await prisma.dayBook.findFirst({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 86400000),
        },
      },
      include: {
        openedBy: { select: { id: true, username: true } },
        closedBy: { select: { id: true, username: true } },
        approvedBy: { select: { id: true, username: true } },
        entries: { orderBy: { entryDate: "asc" } },
        denominations: { orderBy: { denomination: "desc" } },
      },
    });
  }

  /**
   * Get day book by ID with all related data
   */
  async getDayBook(dayBookId: string) {
    return await prisma.dayBook.findUnique({
      where: { id: dayBookId },
      include: {
        openedBy: { select: { id: true, username: true } },
        closedBy: { select: { id: true, username: true } },
        approvedBy: { select: { id: true, username: true } },
        entries: { orderBy: { entryDate: "asc" } },
        denominations: { orderBy: { denomination: "desc" } },
      },
    });
  }

  /**
   * Close a day book with reconciliation
   */
  async closeDayBook(
    dayBookId: string,
    data: CloseDayBookInput,
    userId: string
  ) {
    const dayBook = await prisma.dayBook.findUnique({
      where: { id: dayBookId },
      include: { entries: true, denominations: true },
    });

    if (!dayBook) {
      throw new Error("Day book not found");
    }

    if (dayBook.status !== DayBookStatus.OPEN) {
      throw new Error(`Day book status is ${dayBook.status}, cannot close`);
    }

    // Calculate expected closing balance from entries
    let expectedCash = dayBook.openingCashBalance;
    let expectedBank = dayBook.openingBankBalance;

    for (const entry of dayBook.entries) {
      if (entry.entryType === DayBookEntryType.SALE) {
        if (
          entry.paymentMethod === "CASH" ||
          entry.paymentMethod === "DIGITAL_WALLET" ||
          entry.paymentMethod === "MOBILE_WALLET"
        ) {
          expectedCash = expectedCash.plus(entry.amount);
        } else {
          expectedBank = expectedBank.plus(entry.amount);
        }
      } else if (entry.entryType === DayBookEntryType.PURCHASE) {
        if (
          entry.paymentMethod === "CASH" ||
          entry.paymentMethod === "DIGITAL_WALLET" ||
          entry.paymentMethod === "MOBILE_WALLET"
        ) {
          expectedCash = expectedCash.minus(entry.amount);
        } else {
          expectedBank = expectedBank.minus(entry.amount);
        }
      } else if (entry.entryType === DayBookEntryType.EXPENSE) {
        if (entry.paymentMethod === "CASH") {
          expectedCash = expectedCash.minus(entry.amount);
        } else {
          expectedBank = expectedBank.minus(entry.amount);
        }
      } else if (entry.entryType === DayBookEntryType.PAYMENT_IN) {
        expectedCash = expectedCash.plus(entry.amount);
      } else if (entry.entryType === DayBookEntryType.PAYMENT_OUT) {
        expectedCash = expectedCash.minus(entry.amount);
      } else if (entry.entryType === DayBookEntryType.BANK_DEPOSIT) {
        expectedCash = expectedCash.minus(entry.amount);
        expectedBank = expectedBank.plus(entry.amount);
      } else if (entry.entryType === DayBookEntryType.BANK_WITHDRAWAL) {
        expectedCash = expectedCash.plus(entry.amount);
        expectedBank = expectedBank.minus(entry.amount);
      }
    }

    const actualCash = new Decimal(data.closingCashBalance);
    const actualBank = new Decimal(data.closingBankBalance);
    const cashVariance = expectedCash.minus(actualCash);

    // Check if variance is within tolerance
    if (
      cashVariance.abs().greaterThan(new Decimal(CASH_VARIANCE_TOLERANCE))
    ) {
      throw new Error(
        `Cash variance ${cashVariance} exceeds tolerance. Please reconcile.`
      );
    }

    return await prisma.dayBook.update({
      where: { id: dayBookId },
      data: {
        status: DayBookStatus.CLOSED,
        closedById: userId,
        closedAt: new Date(),
        closingCashBalance: actualCash,
        closingBankBalance: actualBank,
        expectedCashBalance: expectedCash,
        actualCashBalance: actualCash,
        cashVariance,
        isReconciled: cashVariance.equals(new Decimal(0)),
        notes: data.notes,
      },
      include: {
        closedBy: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Approve a closed day book
   */
  async approveDayBook(
    dayBookId: string,
    data: ApproveDayBookInput,
    userId: string
  ) {
    const dayBook = await prisma.dayBook.findUnique({
      where: { id: dayBookId },
    });

    if (!dayBook) {
      throw new Error("Day book not found");
    }

    if (dayBook.status !== DayBookStatus.CLOSED) {
      throw new Error(
        "Only closed day books can be approved. Current status: " + dayBook.status
      );
    }

    return await prisma.dayBook.update({
      where: { id: dayBookId },
      data: {
        status: DayBookStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
        notes: data.notes || dayBook.notes,
      },
      include: {
        approvedBy: { select: { id: true, username: true } },
      },
    });
  }

  /**
   * Create an entry in a day book
   */
  async createEntry(data: CreateDayBookEntryInput, userId: string) {
    // Verify day book exists and is open
    const dayBook = await prisma.dayBook.findUnique({
      where: { id: data.dayBookId },
    });

    if (!dayBook) {
      throw new Error("Day book not found");
    }

    if (dayBook.status !== DayBookStatus.OPEN) {
      throw new Error(`Cannot add entries to ${dayBook.status} day book`);
    }

    return await prisma.dayBookEntry.create({
      data: {
        dayBookId: data.dayBookId,
        entryType: data.entryType as DayBookEntryType,
        entryDate: data.entryDate,
        description: data.description,
        amount: new Decimal(data.amount),
        paymentMethod: data.paymentMethod,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        partyType: data.partyType,
        partyId: data.partyId,
        partyName: data.partyName,
        debitAccount: data.debitAccount,
        creditAccount: data.creditAccount,
        expenseCategoryId: data.expenseCategoryId,
        notes: data.notes,
        attachmentUrl: data.attachmentUrl,
        createdById: userId,
      },
      include: {
        createdBy: { select: { id: true, username: true } },
        expenseCategory: true,
      },
    });
  }

  /**
   * Get all entries for a day book
   */
  async getEntries(dayBookId: string, filters?: { type?: string }) {
    return await prisma.dayBookEntry.findMany({
      where: {
        dayBookId,
        ...(filters?.type && { entryType: filters.type as DayBookEntryType }),
      },
      include: {
        createdBy: { select: { id: true, username: true } },
        expenseCategory: true,
      },
      orderBy: { entryDate: "asc" },
    });
  }

  /**
   * Update an entry
   */
  async updateEntry(
    entryId: string,
    data: UpdateDayBookEntryInput
  ) {
    const entry = await prisma.dayBookEntry.findUnique({
      where: { id: entryId },
      include: { dayBook: true },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    if (entry.dayBook.status !== DayBookStatus.OPEN) {
      throw new Error("Cannot modify entries in closed/approved day books");
    }

    return await prisma.dayBookEntry.update({
      where: { id: entryId },
      data: {
        ...Object.fromEntries(
          Object.entries(data).filter(([, v]) => v !== undefined)
        ),
        ...(data.amount && { amount: new Decimal(data.amount) }),
      },
      include: {
        createdBy: { select: { id: true, username: true } },
        expenseCategory: true,
      },
    });
  }

  /**
   * Delete an entry
   */
  async deleteEntry(entryId: string) {
    const entry = await prisma.dayBookEntry.findUnique({
      where: { id: entryId },
      include: { dayBook: true },
    });

    if (!entry) {
      throw new Error("Entry not found");
    }

    if (entry.dayBook.status !== DayBookStatus.OPEN) {
      throw new Error("Cannot delete entries from closed/approved day books");
    }

    return await prisma.dayBookEntry.delete({
      where: { id: entryId },
    });
  }

  /**
   * Record cash denominations
   */
  async recordDenominations(
    dayBookId: string,
    denominations: CreateCashDenominationInput[]
  ) {
    const dayBook = await prisma.dayBook.findUnique({
      where: { id: dayBookId },
    });

    if (!dayBook) {
      throw new Error("Day book not found");
    }

    // Delete existing denominations for this day book
    await prisma.cashDenomination.deleteMany({
      where: { dayBookId },
    });

    // Create new denomination records
    const created = await Promise.all(
      denominations.map((d) =>
        prisma.cashDenomination.create({
          data: {
            dayBookId,
            denomination: d.denomination,
            quantity: d.quantity,
            totalAmount: new Decimal(d.denomination * d.quantity),
            notes: d.notes,
          },
        })
      )
    );

    // Calculate total from denominations
    const totalCash = created.reduce(
      (sum, d) => sum.plus(d.totalAmount),
      new Decimal(0)
    );

    return { created, totalCash };
  }

  /**
   * Get cash reconciliation summary
   */
  async getReconciliationSummary(dayBookId: string) {
    const dayBook = await prisma.dayBook.findUnique({
      where: { id: dayBookId },
      include: {
        entries: true,
        denominations: true,
      },
    });

    if (!dayBook) {
      throw new Error("Day book not found");
    }

    const totalDenominations = dayBook.denominations.reduce(
      (sum, d) => sum.plus(d.totalAmount),
      new Decimal(0)
    );

    return {
      dayBook,
      denominations: dayBook.denominations,
      totalFromDenominations: totalDenominations,
      expectedCash: dayBook.expectedCashBalance,
      actualCash: dayBook.actualCashBalance,
      variance: dayBook.cashVariance,
      isReconciled: dayBook.isReconciled,
    };
  }

  /**
   * List all day books with optional filtering
   */
  async listDayBooks(filters?: {
    status?: DayBookStatus;
    startDate?: Date;
    endDate?: Date;
  }) {
    return await prisma.dayBook.findMany({
      where: {
        ...(filters?.status && { status: filters.status }),
        ...(filters?.startDate &&
          filters?.endDate && {
            date: {
              gte: filters.startDate,
              lte: filters.endDate,
            },
          }),
      },
      include: {
        openedBy: { select: { id: true, username: true } },
        closedBy: { select: { id: true, username: true } },
        approvedBy: { select: { id: true, username: true } },
        _count: { select: { entries: true } },
      },
      orderBy: { date: "desc" },
    });
  }
}

export const daybookService = new DayBookService();
