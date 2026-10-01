"use client"

import { useState } from "react"
import {
  Users,
  ShieldCheck,
  Plus,
  Key,
  Trash2,
  Edit2,
  CheckCircle2,
  Lock,
  Mail,
  UserCheck,
} from "lucide-react"
import { toast } from "sonner"

interface StaffMember {
  id: string
  name: string
  email: string
  role: "SUPER_ADMIN" | "ORDER_MANAGER" | "INVENTORY_LEAD" | "SUPPORT"
  status: "ACTIVE" | "INACTIVE"
  lastLogin: string
  permissions: string[]
}

const INITIAL_STAFF: StaffMember[] = [
  {
    id: "staff-1",
    name: "Adnan Kazi",
    email: "adnankazi275@gmail.com",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastLogin: "Active Now",
    permissions: ["Full Store Ownership", "Sales Analytics", "User Database", "System Backups", "Payout Settings"],
  },
  {
    id: "staff-2",
    name: "Store Administrator",
    email: "admin@proteinx.in",
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    lastLogin: "10 mins ago",
    permissions: ["Full Store Ownership", "Orders & Dispatch", "Product Catalog", "Discount Coupons"],
  },
  {
    id: "staff-3",
    name: "Logistics Specialist",
    email: "dispatch@proteinx.in",
    role: "ORDER_MANAGER",
    status: "ACTIVE",
    lastLogin: "2 hours ago",
    permissions: ["Order Management", "Courier AWB Tracking", "Return Approvals", "Customer Invoices"],
  },
]

export default function StaffManager() {
  const [staff, setStaff] = useState<StaffMember[]>(INITIAL_STAFF)
  const [isAdding, setIsAdding] = useState(false)
  const [newStaff, setNewStaff] = useState({
    name: "",
    email: "",
    role: "ORDER_MANAGER" as StaffMember["role"],
  })

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newStaff.name || !newStaff.email) return

    const created: StaffMember = {
      id: `staff-${Date.now()}`,
      name: newStaff.name,
      email: newStaff.email,
      role: newStaff.role,
      status: "ACTIVE",
      lastLogin: "Invited",
      permissions:
        newStaff.role === "SUPER_ADMIN"
          ? ["Full Store Ownership", "All Modules"]
          : newStaff.role === "ORDER_MANAGER"
          ? ["Orders & Invoices", "Dispatch & Tracking"]
          : ["Stock & Products"],
    }

    setStaff((prev) => [...prev, created])
    setIsAdding(false)
    setNewStaff({ name: "", email: "", role: "ORDER_MANAGER" })
    toast.success(`Staff account for ${created.name} created successfully!`)
  }

  const handleToggleStatus = (id: string) => {
    setStaff((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, status: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
          : s
      )
    )
    toast.success("Staff status updated!")
  }

  const handleDelete = (id: string, name: string) => {
    if (name === "Adnan Kazi") {
      toast.error("Super Admin owner account cannot be deleted!")
      return
    }
    if (!confirm(`Are you sure you want to revoke access for ${name}?`)) return
    setStaff((prev) => prev.filter((s) => s.id !== id))
    toast.success("Staff access revoked!")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-brand-600" />
            Staff Roles & Administrative Permissions ({staff.length})
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Manage authorized store managers, customer service team, and role-based access control.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-2"
        >
          <Plus size={15} /> Add Team Member
        </button>
      </div>

      {/* Add Modal */}
      {isAdding && (
        <div className="card p-6 bg-white dark:bg-zinc-900 border-2 border-brand-500/40 rounded-3xl shadow-xl space-y-4">
          <h3 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-2">
            <UserCheck size={16} className="text-brand-500" />
            Provision New Administrative Staff
          </h3>

          <form onSubmit={handleAddSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Full Name
              </label>
              <input
                type="text"
                placeholder="Staff Member Name"
                value={newStaff.name}
                onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Gmail / Email Address
              </label>
              <input
                type="email"
                placeholder="staff@gmail.com"
                value={newStaff.email}
                onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                required
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Assigned Role
              </label>
              <select
                value={newStaff.role}
                onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as any })}
                className="w-full px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white"
              >
                <option value="ORDER_MANAGER">Order & Dispatch Manager</option>
                <option value="INVENTORY_LEAD">Inventory Specialist</option>
                <option value="SUPPORT">Customer Care Agent</option>
                <option value="SUPER_ADMIN">Super Administrator</option>
              </select>
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary text-xs px-4 py-2"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs px-5 py-2">
                Create Staff Account
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {staff.map((s) => (
          <div
            key={s.id}
            className="card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shadow-sm space-y-4"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <span
                  className={`badge text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md ${
                    s.role === "SUPER_ADMIN"
                      ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
                      : "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-300 dark:border-blue-800"
                  }`}
                >
                  {s.role.replace(/_/g, " ")}
                </span>

                <button
                  onClick={() => handleToggleStatus(s.id)}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    s.status === "ACTIVE"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                      : "bg-zinc-200 text-zinc-500"
                  }`}
                >
                  {s.status}
                </button>
              </div>

              <div className="mt-3">
                <h4 className="font-bold text-sm text-zinc-900 dark:text-white">{s.name}</h4>
                <p className="text-xs text-zinc-400 font-mono mt-0.5">{s.email}</p>
              </div>

              <div className="mt-3 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Granted Permissions:</p>
                <div className="flex flex-wrap gap-1">
                  {s.permissions.map((p) => (
                    <span
                      key={p}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
                    >
                      ✓ {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
              <span className="text-[10px]">Last login: {s.lastLogin}</span>
              {s.name !== "Adnan Kazi" && (
                <button
                  onClick={() => handleDelete(s.id, s.name)}
                  className="text-[11px] font-bold text-rose-500 hover:underline"
                >
                  Revoke Access
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
