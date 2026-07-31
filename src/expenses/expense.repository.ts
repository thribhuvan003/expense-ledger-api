import { StoredExpense } from "./expense.types";

export class ExpenseRepository {
  private readonly expenses = new Map<string, StoredExpense>();

  create(expense: StoredExpense): StoredExpense {
    this.expenses.set(expense.id, expense);
    return expense;
  }

  exists(id: string): boolean {
    return this.expenses.has(id);
  }

  findAll(): StoredExpense[] {
    return Array.from(this.expenses.values());
  }

  delete(id: string): boolean {
    return this.expenses.delete(id);
  }
}
