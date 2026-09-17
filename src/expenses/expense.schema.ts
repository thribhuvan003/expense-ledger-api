import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

// Amounts are kept in paise as whole numbers, so one paisa is the smallest
// expense that can be recorded.
const minAmount = 0.01;

// The paise figure has to stay a safe integer, otherwise the exact arithmetic
// this relies on quietly stops holding.
function fitsInSafeInteger(value: number): boolean {
  return Number.isSafeInteger(Math.round(value * 100));
}

function isCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  if (year === undefined || month === undefined || day === undefined) {
    return false;
  }

  if (year < 1) {
    return false;
  }

  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function hasAtMostTwoDecimalPlaces(value: number): boolean {
  return Math.round(value * 100) / 100 === value;
}

export const createExpenseSchema = z
  .object({
    id: z.string().trim().min(1, "ID cannot be empty.").max(100).optional(),
    title: z.string().trim().min(1, "Title is required.").max(100),
    amount: z
      .number({ invalid_type_error: "Amount must be a number." })
      .finite()
      .min(minAmount, "Amount must be at least 0.01.")
      .refine(fitsInSafeInteger, { message: "Amount is too large to record exactly." })
      .refine(hasAtMostTwoDecimalPlaces, {
        message: "Amount can have at most two decimal places."
      }),
    category: z.string().trim().min(1, "Category is required.").max(50),
    date: z.string().refine(isCalendarDate, {
      message: "Date must be a valid calendar date in YYYY-MM-DD format."
    })
  })
  .strict();

export const expenseQuerySchema = z
  .object({
    category: z.string().trim().min(1, "Category cannot be empty.").max(50).optional()
  })
  .strict();

// IDs may be supplied by the caller, so this only checks the shape the API
// stores, not that it looks like a UUID.
export const expenseIdSchema = z
  .string()
  .trim()
  .min(1, "Expense ID cannot be empty.")
  .max(100, "Expense ID is too long.");
