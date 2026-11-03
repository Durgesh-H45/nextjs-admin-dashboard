'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/AdminAuthContext';
import { UserItem, UserRole } from '@/lib/types';
import AddUserModal from '@/components/AddUserModal';
import DeleteUserModal from '@/components/DeleteUserModal';
import {
  Users,
  UserPlus,
  Trash2,
  Search,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserX,
  Calendar,
  AlertCircle,
  Filter,
} from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { admin, loading: authLoading } = useAdminAuth();

  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchLatency, setRefetchLatency] = useState<number | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserItem | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !admin) {
      router.push('/login');
    }
  }, [admin, authLoading, router]);

  // Toast auto-dismiss
  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setRefetchLatency(Date.now() - start);

      if (!res.ok || !data.success) {
        setError(data.error || 'Failed to fetch users list');
        setUsers([]);
      } else {
        setUsers(Array.isArray(data.users) ? data.users : []);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Network error loading users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (admin) {
      fetchUsers();
    }
  }, [admin, fetchUsers]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter(
      (u) =>
        u.role?.toUpperCase().includes('ADMIN') ||
        u.role?.toUpperCase() === 'SUPER_ADMIN' ||
        u.role?.toUpperCase() === 'ADMIN'
    ).length;
    const regular = users.filter((u) => u.role === 'USER').length;
    const blocked = users.filter((u) => u.blocked).length;
    return { total, admins, regular, blocked };
  }, [users]);

  // Filtered list
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      // Search
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !search ||
        user.email.toLowerCase().includes(search) ||
        (user.firstName && user.firstName.toLowerCase().includes(search)) ||
        (user.lastName && user.lastName.toLowerCase().includes(search)) ||
        user.id.toString() === search;

      // Role filter
      const matchesRole =
        selectedRole === 'ALL' || user.role?.toUpperCase() === selectedRole;

      // Status filter
      const matchesStatus =
        selectedStatus === 'ALL' ||
        (selectedStatus === 'ACTIVE' && !user.blocked) ||
        (selectedStatus === 'BLOCKED' && user.blocked);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, selectedRole, selectedStatus]);

  const getRoleBadge = (role: string) => {
    const r = role?.toUpperCase();
    if (r === 'SUPER_ADMIN') {
      return 'bg-purple-950/80 text-purple-300 border-purple-700/70';
    }
    if (r === 'ADMIN') {
      return 'bg-rose-950/80 text-rose-300 border-rose-700/70';
    }
    if (r === 'MANAGER' || r === 'SUB_ADMIN') {
      return 'bg-amber-950/80 text-amber-300 border-amber-700/70';
    }
    if (r === 'CONTRIBUTOR') {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/70';
    }
    return 'bg-zinc-800 text-zinc-300 border-zinc-700';
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return 'N/A';
    try {
      return new Date(isoString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  if (authLoading || !admin) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <RefreshCw className="w-6 h-6 animate-spin text-rose-500 mx-auto" />
          <p className="text-xs text-zinc-400">Verifying Admin permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Success Toast */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-subtle">
          <div className="bg-emerald-950 border border-emerald-700 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-rose-500" />
            User Management Console
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Connected to NestJS <code className="text-zinc-300">/admin/users</code> &bull; Real-time
            PostgreSQL User Records
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            onClick={fetchUsers}
            disabled={loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-rose-400' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition-all"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Total Users</span>
            <Users className="w-4 h-4 text-zinc-500" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{stats.total}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Registered in database</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Admins & SuperAdmins</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{stats.admins}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Elevated privileges</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Regular Users</span>
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-400 mt-2">{stats.regular}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Role: USER</div>
        </div>

        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-400">Blocked Accounts</span>
            <UserX className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{stats.blocked}</div>
          <div className="text-[10px] text-zinc-500 mt-1">Access suspended</div>
        </div>
      </div>

      {/* Latency notification */}
      {refetchLatency !== null && (
        <div className="flex items-center justify-between text-[11px] text-zinc-400 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800/60 font-mono">
          <span>Backend sync status: OK</span>
          <span>Response latency: {refetchLatency}ms</span>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-950/70 border border-rose-800 text-rose-200 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchUsers}
            className="px-3 py-1 rounded-lg bg-rose-900 hover:bg-rose-800 text-rose-100 font-medium text-[11px] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by email, name, or ID #..."
            className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Filter className="w-3.5 h-3.5 text-zinc-500" />
            <span className="hidden sm:inline">Role:</span>
          </div>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">ADMIN</option>
            <option value="SUPER_ADMIN">SUPER_ADMIN</option>
            <option value="USER">USER</option>
            <option value="SUB_ADMIN">SUB_ADMIN</option>
            <option value="MANAGER">MANAGER</option>
            <option value="CONTRIBUTOR">CONTRIBUTOR</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-zinc-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="BLOCKED">Blocked</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/60 text-zinc-400 font-medium">
                <th className="py-3.5 px-4 w-16">ID</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Created Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {loading && users.length === 0 ? (
                // Skeletons
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-4 w-8 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-40 bg-zinc-800 rounded mb-1" />
                      <div className="h-3 w-24 bg-zinc-850 rounded" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-5 w-14 bg-zinc-800 rounded-full" />
                    </td>
                    <td className="py-4 px-4">
                      <div className="h-4 w-24 bg-zinc-800 rounded" />
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="h-8 w-8 bg-zinc-800 rounded-lg ml-auto" />
                    </td>
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-zinc-500">
                    <Users className="w-8 h-8 mx-auto text-zinc-600 mb-2 opacity-50" />
                    <p className="text-sm font-medium text-zinc-400">No users found</p>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {searchQuery || selectedRole !== 'ALL' || selectedStatus !== 'ALL'
                        ? 'Try clearing or modifying your search filters.'
                        : 'No user records exist in the database yet.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isCurrentAdmin = admin.id === user.id;
                  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ');

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-4 font-mono text-zinc-400">#{user.id}</td>

                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700/60 flex items-center justify-center text-zinc-200 font-semibold text-xs shrink-0">
                            {user.firstName ? user.firstName[0].toUpperCase() : user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-medium text-zinc-200">
                              <span>{user.email}</span>
                              {isCurrentAdmin && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            {fullName && (
                              <div className="text-[11px] text-zinc-400">{fullName}</div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold border ${getRoleBadge(
                            user.role
                          )}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.blocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-rose-950/60 text-rose-400 border border-rose-800/50">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50">
                            Active
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-zinc-400 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          <span>{formatDate(user.createdAt)}</span>
                        </div>
                      </td>

                      {/* Action: Delete */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setUserToDelete(user)}
                          disabled={isCurrentAdmin}
                          title={
                            isCurrentAdmin
                              ? 'Cannot delete your own logged-in admin account'
                              : `Delete user #${user.id} (${user.email})`
                          }
                          className="p-2 rounded-xl text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 border border-transparent hover:border-rose-900/60 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-400">
          <span>
            Showing <strong className="text-zinc-200">{filteredUsers.length}</strong> of{' '}
            <strong className="text-zinc-200">{users.length}</strong> users
          </span>
          <span className="font-mono text-[10px] text-zinc-500">
            Prisma User Model &bull; PostgreSQL
          </span>
        </div>
      </div>

      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setSuccessToast('New user created successfully!');
          fetchUsers();
        }}
      />

      {/* Delete User Modal */}
      <DeleteUserModal
        isOpen={Boolean(userToDelete)}
        user={userToDelete}
        currentAdminId={admin?.id}
        onClose={() => setUserToDelete(null)}
        onSuccess={() => {
          setSuccessToast(`User #${userToDelete?.id} deleted successfully!`);
          setUserToDelete(null);
          fetchUsers();
        }}
      />
    </div>
  );
}
