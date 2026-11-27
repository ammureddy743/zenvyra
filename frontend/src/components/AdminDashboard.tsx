"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Shield,
  Users,
} from "lucide-react";
import { useAuth } from "./AuthContext";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000";

interface ToolMetric {
  tool_id: string;
  total_runs: number;
  successful_runs: number;
  error_count: number;
  avg_processing_ms: number;
}

interface RecentError {
  tool_id: string;
  error_message: string;
  created_at: string;
}

interface AdminMetricsResponse {
  source: string;
  total_users: number | null;
  total_runs: number;
  total_errors: number;
  tools: ToolMetric[];
  recent_errors: RecentError[];
}

export function AdminDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<AdminMetricsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/metrics`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Backend returned ${res.status}`);
      const data = (await res.json()) as AdminMetricsResponse;
      setMetrics(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not load admin metrics."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const maxRuns = Math.max(
    1,
    ...(metrics?.tools.map((t) => t.total_runs) ?? [1])
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-200 dark:border-violet-900/60 bg-violet-50 dark:bg-violet-950/40 px-3 py-1 text-xs font-medium text-violet-700 dark:text-violet-300 mb-2">
            <Shield className="h-3.5 w-3.5" />
            Admin Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Zenvyra Platform Metrics
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
            Monitor total users, usage per AI tool, and error logs.
            {user ? ` Signed in as ${user.email}.` : ""}
          </p>
        </div>

        <button
          type="button"
          onClick={loadMetrics}
          disabled={loading}
          className="inline-flex items-center gap-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 px-3.5 py-2 text-xs font-semibold hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/30 p-4 text-sm text-rose-800 dark:text-rose-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-rose-500 mt-0.5" />
          <div>
            <p className="font-semibold">Unable to fetch metrics</p>
            <p className="text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
            <span>Total Users</span>
            <Users className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">
            {metrics?.total_users !== null && metrics?.total_users !== undefined
              ? metrics.total_users
              : "—"}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            {metrics?.total_users === null
              ? "Set SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY on backend for user count"
              : "Synced from Supabase profiles"}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
            <span>Total AI Tool Runs</span>
            <Activity className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">
            {metrics?.total_runs ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            Source: {metrics?.source ?? "loading..."}
          </p>
        </div>

        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5">
          <div className="flex items-center justify-between text-xs font-medium text-zinc-500">
            <span>Total Errors</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="mt-2 text-3xl font-bold">
            {metrics?.total_errors ?? 0}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            HTTP 5xx &amp; failed processing jobs
          </p>
        </div>
      </div>

      {/* Usage per Tool */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4 w-4 text-violet-500" />
          <h2 className="text-base font-semibold">Usage per Tool</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500">
                <th className="py-2.5 pr-4 font-medium">Tool</th>
                <th className="py-2.5 px-4 font-medium">Runs</th>
                <th className="py-2.5 px-4 font-medium">Success</th>
                <th className="py-2.5 px-4 font-medium">Errors</th>
                <th className="py-2.5 px-4 font-medium">Avg Time</th>
                <th className="py-2.5 pl-4 font-medium w-40">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
              {(metrics?.tools ?? []).map((row) => {
                const pct = Math.round((row.total_runs / maxRuns) * 100);
                return (
                  <tr key={row.tool_id}>
                    <td className="py-3 pr-4 font-medium capitalize">
                      {row.tool_id.replace("-", " ")}
                    </td>
                    <td className="py-3 px-4 font-mono">{row.total_runs}</td>
                    <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">
                      {row.successful_runs}
                    </td>
                    <td className="py-3 px-4 font-mono text-rose-600 dark:text-rose-400">
                      {row.error_count}
                    </td>
                    <td className="py-3 px-4 font-mono text-zinc-500">
                      {row.avg_processing_ms ? `${row.avg_processing_ms}ms` : "—"}
                    </td>
                    <td className="py-3 pl-4">
                      <div className="h-2 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-600 to-cyan-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Errors */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <h2 className="text-base font-semibold mb-3">Recent Errors</h2>
        {!metrics?.recent_errors.length ? (
          <p className="text-xs text-zinc-500">No errors recorded.</p>
        ) : (
          <div className="space-y-2">
            {metrics.recent_errors.map((err, i) => (
              <div
                key={`${err.tool_id}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 px-3.5 py-2.5 text-xs"
              >
                <div>
                  <span className="font-semibold capitalize mr-2">
                    {err.tool_id.replace("-", " ")}:
                  </span>
                  <span className="text-rose-700 dark:text-rose-300">
                    {err.error_message}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-zinc-500">
                  {new Date(err.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
