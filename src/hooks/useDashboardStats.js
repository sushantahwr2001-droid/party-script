import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const defaultStats = {
  eventsCount: 0,
  openTasks: 0,
  totalTasks: 0,
  completedTasks: 0,
  totalVendors: 0,
  totalContacts: 0,
  totalSpent: 0,
  totalBudget: 0,
  budgetUsed: 0,
  vendorCategoryData: [],
  spendTrend: [],
  upcomingEvents: [],
  needsAttention: [],
};

function normalizeStats(payload) {
  return {
    eventsCount: Number(payload?.events_count) || 0,
    openTasks: Number(payload?.open_tasks) || 0,
    totalTasks: Number(payload?.total_tasks) || 0,
    completedTasks: Number(payload?.completed_tasks) || 0,
    totalVendors: Number(payload?.total_vendors) || 0,
    totalContacts: Number(payload?.total_contacts) || 0,
    totalSpent: Number(payload?.total_spend) || 0,
    totalBudget: Number(payload?.total_budget) || 0,
    budgetUsed: Number(payload?.budget_used) || 0,
    vendorCategoryData: Array.isArray(payload?.vendor_category_data)
      ? payload.vendor_category_data
      : [],
    spendTrend: Array.isArray(payload?.spend_trend) ? payload.spend_trend : [],
    upcomingEvents: Array.isArray(payload?.upcoming_events) ? payload.upcoming_events : [],
    needsAttention: Array.isArray(payload?.needs_attention) ? payload.needs_attention : [],
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const { data, error: rpcError } = await supabase.rpc("get_dashboard_stats");

      if (rpcError) {
        throw rpcError;
      }

      setStats(normalizeStats(data));
    } catch (nextError) {
      setStats(defaultStats);
      setError(nextError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
