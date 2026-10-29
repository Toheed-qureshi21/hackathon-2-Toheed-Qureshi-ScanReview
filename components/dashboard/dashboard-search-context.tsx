"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type DashboardSearchContextValue = {
  globalSearch: string;
  setGlobalSearch: (value: string) => void;
};

const DashboardSearchContext =
  createContext<DashboardSearchContextValue | null>(null);

export function DashboardSearchProvider({ children }: { children: ReactNode }) {
  const [globalSearch, setGlobalSearch] = useState("");
  const value = useMemo(
    () => ({ globalSearch, setGlobalSearch }),
    [globalSearch],
  );
  return (
    <DashboardSearchContext.Provider value={value}>
      {children}
    </DashboardSearchContext.Provider>
  );
}

export function useDashboardSearch(): DashboardSearchContextValue {
  const ctx = useContext(DashboardSearchContext);
  if (!ctx) {
    throw new Error("useDashboardSearch must be used within DashboardSearchProvider");
  }
  return ctx;
}
