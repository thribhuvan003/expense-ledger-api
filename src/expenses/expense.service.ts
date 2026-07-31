import { randomUUID } from "node:crypto";
import { ExpenseRepository } from "./expense.repository";
import {
  CreateExpenseInput,
  Expense,
  ExpenseSummary,
  StoredExpense
} from "./expense.types";

function toExpense(storedExpense: StoredExpense): Expense {
  return {
    id: storedExpense.id,
    title: storedExpense.title,
    amount: storedExpense.amountInPaise / 100,
    category: storedExpense.category,
    date: storedExpense.date
  };
}

export class ExpenseService {
  constructor(private readonly repository: ExpenseRepository) {}

  // Returns null when the caller supplied an ID that is already taken.
  create(input: CreateExpenseInput): Expense | null {
    const id = input.id ?? randomUUID();

    if (this.repository.exists(id)) {
      return null;
    }

    const storedExpense: StoredExpense = {
      id,
      title: input.title,
      amountInPaise: Math.round(input.amount * 100),
      category: input.category,
      date: input.date
    };

    return toExpense(this.repository.create(storedExpense));
  }

  list(category?: string): Expense[] {
    const expenses = this.repository.findAll();

    if (!category) {
      return expenses.map(toExpense);
    }

    const expectedCategory = category.toLowerCase();
    return expenses
      .filter((expense) => expense.category.toLowerCase() === expectedCategory)
      .map(toExpense);
  }

  getSummary(): ExpenseSummary {
    // Categories are grouped the same way they are filtered, so "Food" and
    // "food" count as one category. The first spelling seen is the one shown.
    const totals = new Map<string, { category: string; totalInPaise: number }>();
    let overallInPaise = 0;

    for (const expense of this.repository.findAll()) {
      overallInPaise += expense.amountInPaise;

      const key = expense.category.toLowerCase();
      const total = totals.get(key);

      if (total) {
        total.totalInPaise += expense.amountInPaise;
      } else {
        totals.set(key, {
          category: expense.category,
          totalInPaise: expense.amountInPaise
        });
      }
    }

    // Object.fromEntries defines each key outright. Assigning them one by one
    // would lose a category called "__proto__", because that name goes to the
    // prototype setter instead of becoming a key.
    const byCategory = Object.fromEntries(
      Array.from(totals.values(), ({ category, totalInPaise }) => [
        category,
        totalInPaise / 100
      ])
    );

    return {
      overall: overallInPaise / 100,
      byCategory
    };
  }

  delete(id: string): boolean {
    return this.repository.delete(id);
  }
}
