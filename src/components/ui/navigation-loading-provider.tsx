"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import { PageLoading } from "./page-loading";

interface NavigationLoadingContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
});

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext);
}

interface NavigationLoadingProviderProps {
  children: ReactNode;
}

export function NavigationLoadingProvider({ children }: NavigationLoadingProviderProps) {
  const [isLoading, setIsLoading] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMountedRef = useRef(false);
  const pendingLoadingRef = useRef(false);

  const startLoading = useCallback(() => {
    if (isMountedRef.current) {
      setIsLoading(true);
    } else {
      pendingLoadingRef.current = true;
    }
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
    pendingLoadingRef.current = false;
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    if (pendingLoadingRef.current) {
      setIsLoading(true);
      pendingLoadingRef.current = false;
    }
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (isMountedRef.current) {
      setIsLoading(false);
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => {
      if (isMountedRef.current) {
        setIsLoading(true);
      } else {
        pendingLoadingRef.current = true;
      }
    };

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      queueMicrotask(handleStart);
      return result;
    };

    history.replaceState = function (...args) {
      return originalReplaceState.apply(this, args);
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor) {
        const href = anchor.getAttribute("href");
        const isInternal = href && (href.startsWith("/") || href.startsWith("#"));
        const isSameOrigin = anchor.origin === window.location.origin;
        const isNewTab = anchor.target === "_blank";
        const currentUrl = new URL(window.location.href);
        const targetUrl = href ? new URL(anchor.href, currentUrl) : null;
        const isSameDocumentNavigation =
          !!targetUrl &&
          targetUrl.pathname === currentUrl.pathname &&
          targetUrl.search === currentUrl.search;
        
        if (isInternal && isSameOrigin && !isNewTab && !isSameDocumentNavigation) {
          queueMicrotask(handleStart);
        }
      }
    };

    const handleHashChange = () => {
      setIsLoading(false);
    };

    document.addEventListener("click", handleClick, true);
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      history.pushState = originalPushState;
      history.replaceState = originalReplaceState;
      document.removeEventListener("click", handleClick, true);
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [pathname]);

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      <AnimatePresence mode="wait">
        {isLoading && <PageLoading key="nav-loading" />}
      </AnimatePresence>
      {children}
    </NavigationLoadingContext.Provider>
  );
}
