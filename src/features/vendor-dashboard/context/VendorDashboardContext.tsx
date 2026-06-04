import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { mockVendor, type WithdrawalRow } from "../data/mockVendor";

const STORAGE_KEY = "vendor-dash:v1";

export interface PendingChange {
  id: string;
  section: string;
  fields: Record<string, unknown>;
  submittedAt: number;
  status: "pending" | "approved";
}

interface State {
  vendor: typeof mockVendor;
  withdrawals: WithdrawalRow[];
  pendingChanges: PendingChange[];
  onboardingComplete: boolean;
}

interface Ctx extends State {
  addWithdrawal: (amount: number, note?: string) => WithdrawalRow;
  enqueueChange: (section: string, fields: Record<string, unknown>) => void;
  approvePending: (id: string) => void;
  cancelPending: (id: string) => void;
  getPendingForSection: (section: string) => PendingChange | undefined;
  toggleOnboarding: () => void;
}

const VendorContext = createContext<Ctx | null>(null);

function loadState(): State {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        vendor: { ...mockVendor, ...(parsed.vendor || {}) },
        withdrawals: parsed.withdrawals ?? mockVendor.withdrawals,
        pendingChanges: parsed.pendingChanges ?? [],
        onboardingComplete: parsed.onboardingComplete ?? mockVendor.onboarding.complete,
      };
    }
  } catch {}
  return {
    vendor: mockVendor,
    withdrawals: mockVendor.withdrawals,
    pendingChanges: [],
    onboardingComplete: mockVendor.onboarding.complete,
  };
}

export const VendorDashboardProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<State>(loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  const addWithdrawal = useCallback((amount: number, note?: string) => {
    const id = `WD-${Date.now().toString().slice(-8)}`;
    const today = new Date();
    const date = `۱۴۰۵/۰۳/${String(today.getDate()).padStart(2, "0")}`;
    const row: WithdrawalRow = { id, date, amount, status: "pending" };
    setState((s) => ({
      ...s,
      withdrawals: [row, ...s.withdrawals],
      vendor: {
        ...s.vendor,
        payouts: { ...s.vendor.payouts, withdrawable: Math.max(0, s.vendor.payouts.withdrawable - amount) },
        home: { ...s.vendor.home, withdrawableBalance: Math.max(0, s.vendor.home.withdrawableBalance - amount) },
      },
    }));
    void note;
    return row;
  }, []);

  const enqueueChange = useCallback((section: string, fields: Record<string, unknown>) => {
    setState((s) => {
      // replace previous pending for same section
      const others = s.pendingChanges.filter((p) => p.section !== section);
      return {
        ...s,
        pendingChanges: [
          ...others,
          { id: `${section}-${Date.now()}`, section, fields, submittedAt: Date.now(), status: "pending" },
        ],
      };
    });
  }, []);

  const approvePending = useCallback((id: string) => {
    setState((s) => {
      const target = s.pendingChanges.find((p) => p.id === id);
      if (!target) return s;
      const remaining = s.pendingChanges.filter((p) => p.id !== id);
      const v = { ...s.vendor };
      // merge fields into appropriate section
      if (target.section === "profile") v.profile = { ...v.profile, ...(target.fields as any) };
      else if (target.section === "returnPolicy") v.returnPolicy = { ...v.returnPolicy, ...(target.fields as any) };
      else if (target.section === "account") v.account = { ...v.account, ...(target.fields as any) };
      else if (target.section === "banking") v.banking = { ...v.banking, ...(target.fields as any) };
      return { ...s, vendor: v, pendingChanges: remaining };
    });
  }, []);

  const cancelPending = useCallback((id: string) => {
    setState((s) => ({ ...s, pendingChanges: s.pendingChanges.filter((p) => p.id !== id) }));
  }, []);

  const getPendingForSection = useCallback(
    (section: string) => state.pendingChanges.find((p) => p.section === section),
    [state.pendingChanges],
  );

  const toggleOnboarding = useCallback(() => {
    setState((s) => ({ ...s, onboardingComplete: !s.onboardingComplete }));
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ...state, addWithdrawal, enqueueChange, approvePending, cancelPending, getPendingForSection, toggleOnboarding }),
    [state, addWithdrawal, enqueueChange, approvePending, cancelPending, getPendingForSection, toggleOnboarding],
  );

  return <VendorContext.Provider value={value}>{children}</VendorContext.Provider>;
};

export const useVendorDashboard = () => {
  const ctx = useContext(VendorContext);
  if (!ctx) throw new Error("useVendorDashboard must be used within VendorDashboardProvider");
  return ctx;
};
