'use client';

import React, { useState } from 'react';
import { Trash2, AlertTriangle, X, Loader2 } from 'lucide-react';
import { UserItem } from '@/lib/types';

interface DeleteUserModalProps {
  isOpen: boolean;
  user: UserItem | null;
  currentAdminId?: number;
  onClose: () => void;
  onSuccess: () => void;
}

export default function DeleteUserModal({
  isOpen,
  user,
  currentAdminId,
  onClose,
  onSuccess,
}: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isSelf = currentAdminId !== undefined && user.id === currentAdminId;

  const handleDelete = async () => {
    if (isSelf) {
      setError('You cannot delete your own logged-in admin account.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || `Failed to delete user #${user.id}`);
        setLoading(false);
        return;
      }

      setLoading(false);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error deleting user');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 text-zinc-200 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-400">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-white">Delete User</h3>
            <p className="text-xs text-zinc-400">
              Admin endpoint: <code className="text-zinc-300">DELETE /admin/users/{user.id}</code>
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-200 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 leading-relaxed">{error}</div>
          </div>
        )}

        <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-400">Target User:</span>
            <span className="font-medium text-zinc-200">{user.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">User ID:</span>
            <span className="font-mono text-zinc-200">#{user.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Role:</span>
            <span className="font-mono font-semibold text-rose-400 uppercase">{user.role}</span>
          </div>
          {(user.firstName || user.lastName) && (
            <div className="flex justify-between">
              <span className="text-zinc-400">Full Name:</span>
              <span className="text-zinc-300">
                {[user.firstName, user.lastName].filter(Boolean).join(' ')}
              </span>
            </div>
          )}
        </div>

        {isSelf ? (
          <div className="mt-4 p-3 rounded-xl bg-amber-950/60 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong>Self-deletion disabled:</strong> You are currently logged in with this account.
              To avoid permanent lockout, self-deletion is prevented.
            </div>
          </div>
        ) : (
          <p className="mt-4 text-xs text-zinc-400 leading-relaxed">
            Are you sure you want to delete this user from PostgreSQL? This action cannot be undone.
          </p>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || isSelf}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed text-white flex items-center gap-1.5 shadow-lg shadow-rose-600/30 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
