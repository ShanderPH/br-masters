"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";

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
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const startLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
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
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          if (isMountedRef.current) setIsLoading(false);
        }, 8000);
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
      {isLoading && <NavigationProgressBar />}
      {children}
    </NavigationLoadingContext.Provider>
  );
}

function NavigationProgressBar() {
  const [progress, setProgress] = useState(20);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        const increment = prev < 50 ? 8 : prev < 70 ? 4 : 1;
        return Math.min(prev + increment, 90);
      });
    }, 200);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none"
      role="progressbar"
      aria-valuenow={progress}
    >
      <div
        className="h-[3px] bg-gradient-to-r from-brm-primary via-brm-secondary to-brm-primary transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
      <div
        className="absolute top-0 right-0 h-[3px] w-24 bg-gradient-to-l from-brm-secondary/80 to-transparent opacity-80 animate-pulse"
        style={{ transform: `translateX(-${100 - progress}%)` }}
      />
    </div>
  );
}
