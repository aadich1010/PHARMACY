import React, { useState } from 'react';
import { UserPlus, Users, ShieldCheck, Mail, Building2, KeyRound, Pencil } from 'lucide-react';
import { usePharmacy } from '../context/PharmacyContext';
import { AppUser, UserRole } from '../types';
import { api } from '../services/api';

// Human-readable role labels used across the screen.
const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: 'Owner (Full Network)',
  tenant_admin: 'Manager (Branch Admin)',
  pharmacist: 'Pharmacist',
  cashier: 'Cashier',
};

const ROLE_BADGE: Record<UserRole, string> = {
  super_admin: 'bg-purple-500/15 text-purple-800 border-purple-500/30',
  tenant_admin: 'bg-cyan-500/15 text-cyan-800 border-cyan-500/30',
  pharmacist: 'bg-emerald-500/15 text-emerald-800 border-emerald-500/30',
  cashier: 'bg-amber-500/15 text-amber-800 border-amber-500/30',
};

const emptyForm = {
  name: '',
  email: '',
  role: 'cashier' as UserRole,
  tenantId: '' as string,
  password: '',
};

/**
 * Staff login management. Visible to owner (any pharmacy, any role) and manager
 * (own pharmacy only, staff roles only). Real authorization is enforced on the
 * server; this screen just mirrors those limits in the UI.
 */
export const UsersManager: React.FC = () => {
  const { users, tenants, currentUser, refreshData, addNotification } = usePharmacy();

  const isOwner = currentUser?.role === 'super_admin';
  // A manager may only ever assign these roles; the owner may assign any.
  const assignableRoles: UserRole[] = isOwner
    ? ['super_admin', 'tenant_admin', 'pharmacist', 'cashier']
    : ['tenant_admin', 'pharmacist', 'cashier'];

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editing, setEditing] = useState<AppUser | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);

  const tenantName = (id: string | null) =>
    id ? tenants.find((t) => t.id === id)?.name || 'Unknown Branch' : 'All Branches (HQ)';

  const openAdd = () => {
    setEditing(null);
    setForm({
      ...emptyForm,
      role: isOwner ? 'cashier' : 'cashier',
      // Manager is locked to their own pharmacy.
      tenantId: isOwner ? '' : currentUser?.tenantId || '',
    });
    setIsAddOpen(true);
  };

  const openEdit = (u: AppUser) => {
    setEditing(u);
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      tenantId: u.tenantId || '',
      password: '',
    });
    setIsAddOpen(true);
  };

  const closeModal = () => {
    setIsAddOpen(false);
    setEditing(null);
    setForm({ ...emptyForm });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const needsTenant = form.role !== 'super_admin';
      const tenantId = isOwner ? (needsTenant ? form.tenantId : null) : currentUser?.tenantId || null;

      if (needsTenant && !tenantId) {
        addNotification('warning', 'Pharmacy Required', 'Please select a pharmacy for this user.');
        setSubmitting(false);
        return;
      }

      if (editing) {
        const patch: Partial<{ name: string; email: string; role: UserRole; password: string }> = {
          name: form.name,
          email: form.email,
          role: form.role,
        };
        if (form.password) patch.password = form.password;
        await api.updateUser(editing.id, patch);
        addNotification('success', 'User Updated', `${form.name}'s account has been updated.`);
      } else {
        if (!form.password) {
          addNotification('warning', 'Password Required', 'Please set a password for the new user.');
          setSubmitting(false);
          return;
        }
        await api.createUser({
          name: form.name,
          email: form.email,
          role: form.role,
          password: form.password,
          tenantId,
        });
        addNotification('success', 'Staff Login Created', `${form.name} can now sign in.`);
      }
      closeModal();
      await refreshData();
    } catch (err: any) {
      addNotification('error', editing ? 'Update Failed' : 'Could Not Create User', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-xl shadow-blue-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Users className="w-5 h-5 text-cyan-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Staff & User Management</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-600/10 text-cyan-800 text-xs font-bold border border-cyan-500/20">
              {users.length} Accounts
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isOwner
              ? 'Create and manage logins for any pharmacy branch across the network.'
              : 'Create and manage staff logins for your pharmacy branch.'}
          </p>
        </div>

        <button
          id="btn-add-user"
          onClick={openAdd}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-cyan-300" />
          <span>Add New User</span>
        </button>
      </div>

      {/* Users list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {users.length === 0 && (
          <div className="col-span-full text-center text-sm text-slate-500 bg-white/50 rounded-3xl border border-white/60 p-10">
            No user accounts to show yet.
          </div>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className="bg-white/50 backdrop-blur-xl rounded-3xl p-6 border border-white/60 shadow-xl shadow-blue-500/5 transition-all flex flex-col justify-between hover:bg-white/70"
          >
            <div className="space-y-3.5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-slate-900 to-cyan-950 text-cyan-300 font-black text-sm flex items-center justify-center shadow-md uppercase">
                    {u.name.slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{u.name}</h3>
                    <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Mail className="w-3 h-3 text-cyan-700" />
                      <span>{u.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200/50">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_BADGE[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-700 text-[10px] font-bold border border-slate-400/20 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {tenantName(u.tenantId)}
                </span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-200/50 flex items-center justify-end">
              <button
                onClick={() => openEdit(u)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold text-xs transition-all cursor-pointer border border-white/80 shadow-xs"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit / Reset Password
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit modal */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white/85 backdrop-blur-2xl rounded-3xl max-w-md w-full p-6 sm:p-7 border border-white/70 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200/50 pb-3">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-700" />
                {editing ? `Edit ${editing.name}` : 'Create Staff Login'}
              </h3>
              <button
                onClick={closeModal}
                className="w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-slate-500 hover:text-slate-800 text-sm cursor-pointer shadow-xs border border-white/70"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-cyan-950 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ayesha Khan"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1">Email (used to sign in) *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ayesha@pharmacy.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Role *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                  >
                    {assignableRoles.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-cyan-950 block mb-1">Pharmacy Branch</label>
                  {isOwner ? (
                    <select
                      value={form.role === 'super_admin' ? '' : form.tenantId}
                      disabled={form.role === 'super_admin'}
                      onChange={(e) => setForm({ ...form, tenantId: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none disabled:opacity-50"
                    >
                      <option value="">
                        {form.role === 'super_admin' ? 'All Branches (HQ)' : 'Select a branch…'}
                      </option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      disabled
                      value={tenantName(currentUser?.tenantId || null)}
                      className="w-full px-3 py-2 rounded-xl border border-white/80 bg-slate-100/80 text-slate-500 shadow-xs"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="font-bold text-cyan-950 block mb-1 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5" />
                  {editing ? 'Reset Password (leave blank to keep)' : 'Password *'}
                </label>
                <input
                  type="text"
                  required={!editing}
                  placeholder={editing ? 'Enter a new password to reset' : 'Set a login password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-white/80 bg-white/90 text-slate-800 shadow-xs focus:ring-2 focus:ring-cyan-500/20 outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-200/50">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl bg-white/80 hover:bg-white text-slate-700 font-bold border border-white/80 shadow-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold shadow-md shadow-cyan-600/20 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Saving…' : editing ? 'Save Changes' : 'Create Login'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
