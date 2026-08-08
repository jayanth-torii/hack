"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect, type ReactNode } from "react";
import { useAuthStore } from "@/store/authStore";
import { ThemeProvider } from "@/lib/useTheme";
import { Toaster } from "@/components/ui/toast";
import { ConfirmDialogHost } from "@/components/ui/ConfirmDialog";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000 },
        },
      })
  );

  useEffect(() => {
    useAuthStore.getState().initAuth();
  }, []);

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      <Toaster />
      <ConfirmDialogHost />
    </ThemeProvider>
  );
}
