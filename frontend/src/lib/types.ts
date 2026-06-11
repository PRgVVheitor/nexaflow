export interface ApiUser {
  id: string;
  name: string;
  email: string;
  emailVerified?: boolean;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  date: string;
  createdAt: string;
}

export type TaskPriority = "alta" | "media" | "baixa";

export interface Task {
  id: string;
  title: string;
  priority: TaskPriority;
  done: boolean;
  dueDate: string | null;
  createdAt?: string;
}

export interface Goal {
  id: string;
  category: string;
  monthlyLimit: number;
}

export interface RecurringTransaction {
  id: string;
  description: string;
  category: string;
  type: TransactionType;
  amount: number;
  dayOfMonth: number;
  active: boolean;
}

export type InsightType = "info" | "success" | "warning";

export interface Insight {
  id: string;
  type: InsightType;
  title: string;
  message: string;
}

export interface ForecastPeriod {
  days: number;
  balance: number;
}

export interface Intelligence {
  generatedAt?: string;
  score: {
    value: number;
    label: string;
    components: {
      savings: number;
      balance: number;
      control: number;
      consistency: number;
    };
  };
  forecast: {
    currentBalance: number;
    dailyNet: number;
    risk: "low" | "medium" | "high";
    riskLabel: string;
    periods: ForecastPeriod[];
  };
  anomalies: unknown[];
  insights: Insight[];
}

export interface Totals {
  income: number;
  expense: number;
  balance: number;
  savingsRate: number;
}

export interface AuthResponse {
  token?: string;
  user: ApiUser;
}
