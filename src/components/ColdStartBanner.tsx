'use client';

import React from 'react';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { Loader2, Server } from 'lucide-react';

export default function ColdStartBanner() {
  const { coldStarting, pendingSeconds } = useAdminAuth();

  if (!coldStarting) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-xl animate-bounce-subtle">
      <div className="bg-amber-950/95 text-amber-200 border border-amber-600/70 rounded-2xl p-4 shadow-2xl backdrop-blur-md">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
          <div className="flex-1 text-sm">
            <div className="flex items-center justify-between font-semibold text-amber-100">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-amber-400" />
                Render Backend Waking Up
              </span>
              <span className="font-mono text-xs bg-amber-900/80 px-2 py-0.5 rounded-md border border-amber-700/60">
                ⏱️ {pendingSeconds}s
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-200/90 leading-relaxed">
              Render free tier spins down after inactivity. The first request takes 30–50s while
              the NestJS container boots. Please wait without refreshing!
            </p>
            <div className="w-full bg-amber-900/50 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="bg-amber-400 h-1.5 rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${Math.min(95, Math.max(10, (pendingSeconds / 45) * 100))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
