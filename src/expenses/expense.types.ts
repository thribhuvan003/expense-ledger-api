export type CreateExpenseInput = {
  id?: string;
  title: string;
  amount: number;
  category: string;
  date: string;
};

export type Expense = Required<CreateExpenseInput>;

export type StoredExpense = Omit<Expense, "amount"> & {
  amountInPaise: number;
};

export type ExpenseSummary = {
  overall: number;
  byCategory: Record<string, number>;
};
