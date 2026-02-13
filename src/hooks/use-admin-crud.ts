"use client";

import { useState, useCallback } from "react";

interface Filter {
  column: string;
  operator: string;
  value: unknown;
}

interface OrderBy {
  column: string;
  ascending?: boolean;
}

interface ListParams {
  table: string;
  select?: string;
  filters?: Filter[];
  orderBy?: OrderBy;
  limit?: number;
  offset?: number;
}

interface CrudResponse<T = unknown> {
  data?: T;
  count?: number;
  error?: string;
  success?: boolean;
}

export function useAdminCrud() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T = unknown>(body: Record<string, unknown>): Promise<CrudResponse<T>> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/crud", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        const errMsg = json.error || "Erro desconhecido";
        setError(errMsg);
        return { error: errMsg };
      }

      return json;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro de rede";
      setError(errMsg);
      return { error: errMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const list = useCallback(
    <T = unknown>(params: ListParams) =>
      apiCall<T[]>({ action: "list", ...params }),
    [apiCall]
  );

  const get = useCallback(
    <T = unknown>(table: string, id: string | number, idColumn?: string) =>
      apiCall<T>({ action: "get", table, id, idColumn }),
    [apiCall]
  );

  const create = useCallback(
    <T = unknown>(table: string, data: Record<string, unknown>) =>
      apiCall<T>({ action: "create", table, data }),
    [apiCall]
  );

  const update = useCallback(
    <T = unknown>(table: string, id: string | number, data: Record<string, unknown>, idColumn?: string) =>
      apiCall<T>({ action: "update", table, id, data, idColumn }),
    [apiCall]
  );

  const remove = useCallback(
    (table: string, id: string | number, idColumn?: string) =>
      apiCall({ action: "delete", table, id, idColumn }),
    [apiCall]
  );

  const upsert = useCallback(
    <T = unknown>(table: string, data: Record<string, unknown> | Record<string, unknown>[], onConflict?: string) =>
      apiCall<T[]>({ action: "upsert", table, data, onConflict }),
    [apiCall]
  );

  return { list, get, create, update, remove, upsert, apiCall, loading, error };
}

export function useSofascoreApi() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const call = useCallback(async <T = unknown>(body: Record<string, unknown>): Promise<T | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/sofascore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Erro na API SofaScore");
        return null;
      }

      return json as T;
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Erro de rede";
      setError(errMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { call, loading, error };
}
