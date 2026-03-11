"use client";

import { Suspense, ReactNode, useSyncExternalStore } from "react";
import { ThemeProvider } from "next-themes";
import { NavigationLoadingProvider } from "@/components/ui/navigation-loading-provider";
import { PageLoading } from "@/components/ui/page-loading";

interface ProvidersProps {
  children: ReactNode;
}

const emptySubscribe = () => () => {};
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export function Providers({ children }: ProvidersProps) {
  const mounted = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  if (!mounted) {
    return <PageLoading />;
  }

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
    >
      <Suspense fallback={<PageLoading />}>
        <NavigationLoadingProvider>
          {children}
        </NavigationLoadingProvider>
      </Suspense>
    </ThemeProvider>
  );
}
