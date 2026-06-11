import { QueryClient } from "@tanstack/react-query";

export const queryKeys = {
  financeIntelligence: ["finance", "intelligence"] as const,
  goals: ["goals"] as const,
  recurring: ["recurring"] as const,
  tasks: ["tasks"] as const,
  transactions: ["transactions"] as const,
};

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 30_000,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}
