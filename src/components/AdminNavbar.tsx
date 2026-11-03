'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { ShieldAlert, LogOut, Server, ShieldCheck, RefreshCw } from 'lucide-react';

interface BackendHealth {
  status: 'checking' | 'online' | 'offline';
  latencyMs?: number;
  url?: string;
}

export default function AdminNavbar() {
  const { admin, logout } = useAdminAuth();
  const [health, setHealth] = useState<BackendHealth>({ status: 'checking' });
  const [showHealthModal, setShowHealthModal] = useState(false);

  const checkHealth = async () => {
    try {
      const start = Date.now();
      const res = await fetch('/api/health');
      const data = await res.json();
      const duration = Date.now() - start;

      if (data.online) {
        setHealth({
          status: 'online',
          latencyMs: data.durationMs || duration,
          url: data.backendUrl,
        });
      } else {
        setHealth({
          status: 'offline',
          url: data.backendUrl,
        });
      }
    } catch {
      setHealth({ status: 'offline' });
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 45000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/20 group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-zinc-100">Admin Console</span>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-rose-950 text-rose-400 border border-rose-800/60">
                  Role: Admin
                </span>
              </div>
            </div>
          </Link>

          {/* Center Status Pill */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowHealthModal(true)}
              className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors text-zinc-300"
              title="Click for Render/Local backend status"
            >
              <span className="relative flex h-2 w-2">
                {health.status === 'online' && (
                  <>
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </>
                )}
                {health.status === 'checking' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 animate-pulse"></span>
                )}
                {health.status === 'offline' && (
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                )}
              </span>
              <span className="hidden sm:inline">
                Backend:{' '}
                {health.status === 'online'
                  ? `Online (${health.latencyMs}ms)`
                  : health.status === 'checking'
                  ? 'Checking...'
                  : 'Offline'}
              </span>
              <span className="sm:hidden">
                {health.status === 'online' ? 'Online' : 'Offline'}
              </span>
            </button>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {admin ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex flex-col items-end text-xs">
                  <span className="font-medium text-zinc-200">{admin.email}</span>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    ID #{admin.id} &bull; {admin.role}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-rose-400 hover:bg-rose-950/40 hover:border-rose-800/80 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-medium px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin Login</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Backend Status Details Modal */}
      {showHealthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-200 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-zinc-800 text-rose-400">
                <Server className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold text-lg text-white">NestJS Backend Status</h3>
                <p className="text-xs text-zinc-400">Admin Endpoints: /admin/users</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-zinc-950/70 p-4 rounded-xl border border-zinc-800 font-mono">
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Status:</span>
                <span
                  className={`px-2 py-0.5 rounded font-semibold ${
                    health.status === 'online'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {health.status.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-400">Response Latency:</span>
                <span className="text-zinc-200">{health.latencyMs ? `${health.latencyMs}ms` : 'N/A'}</span>
              </div>
              <div className="flex flex-col gap-1 pt-1 border-t border-zinc-800/70">
                <span className="text-zinc-400">Target Endpoint:</span>
                <span className="text-rose-400 break-all select-all font-sans text-xs">
                  {health.url || 'https://nestjs-postgres-prisma.onrender.com'}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-zinc-800/40 rounded-xl text-xs text-zinc-400 leading-relaxed">
              <span className="font-semibold text-zinc-200">ℹ️ Admin Endpoint Requirements:</span>
              <ul className="list-disc pl-4 mt-1.5 space-y-1">
                <li>All requests to <code className="text-zinc-300">/admin/users</code> require an Admin JWT token.</li>
                <li>Users with role <code className="text-rose-400">ADMIN</code> or <code className="text-rose-400">SUPER_ADMIN</code> have full access to view, create, and delete users.</li>
              </ul>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={checkHealth}
                className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-check</span>
              </button>
              <button
                onClick={() => setShowHealthModal(false)}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-500 text-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
