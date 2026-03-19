"use client";

import { Suspense, ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { NavigationLoadingProvider } from "@/components/ui/navigation-loading-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Suspense>
        <NavigationLoadingProvider>
          {children}
        </NavigationLoadingProvider>
      </Suspense>
    </ThemeProvider>
  );
}
