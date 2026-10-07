"use client"

import { useState } from "react"
import {
  Users,
  Search,
  ShoppingBag,
  Phone,
  Mail,
  MapPin,
  Calendar,
  TrendingUp,
  Award,
  RotateCcw,
  Download,
  Filter,
  Package,
  Trash2,
} from "lucide-react"
import { formatPrice } from "@/lib/utils"
import { toast } from "sonner"

export interface CustomerType {
  id: string
  name: string
  email: string
  phone?: string | null
  role: string
  createdAt: string | Date
  addresses: any[]
  orders: any[]
  totalSpent: number
  lastOrder?: any
  topProduct?: string
}

export default function CustomersManager({ initialCustomers }: { initialCustomers: CustomerType[] }) {
  const [customers, setCustomers] = useState<CustomerType[]>(initialCustomers)
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeFilter, setActiveFilter] = useState("ALL")

  const totalRevenue = customers.reduce((sum, c) => sum + c.totalSpent, 0)
  const totalOrdersCount = customers.reduce((sum, c) => sum + c.orders.length, 0)
  const activeBuyersCount = customers.filter((c) => c.orders.length > 0).length
  const loyalCustomersCount = customers.filter((c) => c.orders.length >= 2).length

  // Selection handlers
  const toggleSelectCustomer = (id: string) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCustomerIds.length === filteredCustomers.length) {
      setSelectedCustomerIds([])
    } else {
      setSelectedCustomerIds(filteredCustomers.map((c) => c.id))
    }
  }

  // Clear ONLY ONE customer from admin panel view (MongoDB safe)
  const handleClearOneCustomer = (id: string, name: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== id))
    setSelectedCustomerIds((prev) => prev.filter((x) => x !== id))
    toast.success(`Customer profile "${name}" cleared from admin view. (Saved safely in MongoDB)`)
  }

  // Clear ONLY SELECTED customers from admin panel view (MongoDB safe)
  const handleClearSelectedCustomers = () => {
    if (selectedCustomerIds.length === 0) return
    const count = selectedCustomerIds.length
    setCustomers((prev) => prev.filter((c) => !selectedCustomerIds.includes(c.id)))
    setSelectedCustomerIds([])
    toast.success(`${count} selected customer(s) cleared from admin view. (Saved safely in MongoDB)`)
  }

  // Clear ALL customers from admin panel view (MongoDB safe)
  const handleClearAllCustomers = () => {
    if (!confirm("Clear all customer profiles from admin panel view? (Note: User accounts and purchase histories stay safely in MongoDB)")) {
      return
    }
    setCustomers([])
    setSelectedCustomerIds([])
    toast.success("All customers cleared from admin view. (Saved safely in MongoDB)")
  }

  // Restore All customers from initialCustomers
  const handleRestoreAllCustomers = () => {
    setCustomers(initialCustomers)
    setSelectedCustomerIds([])
    toast.success("Customers restored to view from database!")
  }


  // Export Customer Directory to CSV
  const handleExportCustomers = () => {
    const headers = ["Customer Name,Email,Phone,Role,Total Orders,Lifetime Spend,Delivery Address,Member Since"]
    const rows = filteredCustomers.map((c) => {
      const addr = c.addresses[0] ? `${c.addresses[0].city || ""}, ${c.addresses[0].state || ""} ${c.addresses[0].pincode || ""}` : "N/A"
      const memberDate = new Date(c.createdAt).toLocaleDateString("en-IN")
      return `"${(c.name || "Customer").replace(/,/g, " ")}","${c.email}","${c.phone || "N/A"}","${c.role}",${c.orders.length},${c.totalSpent},"${addr.replace(/,/g, " ")}","${memberDate}"`
    })

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n")
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `proteinx_customers_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success("Customer directory exported to CSV!")
  }

  const filteredCustomers = customers.filter((c) => {
    if (activeFilter === "ACTIVE" && c.orders.length === 0) return false
    if (activeFilter === "LOYAL" && c.orders.length < 2) return false
    if (activeFilter === "NO_ORDERS" && c.orders.length > 0) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchName = (c.name || "").toLowerCase().includes(q)
      const matchEmail = (c.email || "").toLowerCase().includes(q)
      const matchPhone = (c.phone || "").includes(q)
      const matchCity = c.addresses.some((a) => (a.city || "").toLowerCase().includes(q))
      const matchOrder = c.orders.some((o) => (o.orderNumber || "").toLowerCase().includes(q))
      return matchName || matchEmail || matchPhone || matchCity || matchOrder
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-white flex items-center gap-2">
            <Users size={24} className="text-brand-600" />
            Customer Directory & Purchaser Profiles
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Maintained from MongoDB database. Real-time profiles with complete purchase records and shipping destinations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a href="/api/admin/export/customers?format=csv" download
             className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-4 rounded-xl text-xs">
            <Download size={13} /> Export Customers CSV
          </a>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Customers</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{customers.length}</p>
        </div>
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Active Buyers</p>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeBuyersCount}</p>
        </div>
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Total Orders</p>
          <p className="text-2xl font-black text-brand-600 mt-0.5">{totalOrdersCount}</p>
        </div>
        <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
          <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Lifetime Revenue</p>
          <p className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">{formatPrice(totalRevenue)}</p>
        </div>
      </div>

      {/* Controls: Search, Filter Tabs, Clear Data */}
      <div className="card p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by customer name, email, phone, city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl text-xs border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-white outline-none focus:border-brand-500"
          />
        </div>

        {/* Filter Tabs & Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end flex-wrap">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
            {[
              { id: "ALL", label: "All Customers" },
              { id: "ACTIVE", label: `Buyers (${activeBuyersCount})` },
              { id: "LOYAL", label: `Loyal (${loyalCustomersCount})` },
              { id: "NO_ORDERS", label: "Prospects" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`text-[10px] font-bold py-1.5 px-3 rounded-lg whitespace-nowrap transition-colors ${
                  activeFilter === tab.id
                    ? "bg-brand-600 text-white shadow-sm"
                    : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 ml-auto">
            {/* Select All Checkbox Button */}
            {filteredCustomers.length > 0 && (
              <button
                type="button"
                onClick={toggleSelectAll}
                className="text-[10px] font-bold py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                title="Select all visible customers"
              >
                {selectedCustomerIds.length === filteredCustomers.length ? "Deselect All" : "Select All"}
              </button>
            )}

            {/* Clear Selected or Clear One Button */}
            {selectedCustomerIds.length > 0 ? (
              <button
                type="button"
                onClick={handleClearSelectedCustomers}
                className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 shrink-0"
                title="Clear selected customers from admin view"
              >
                <Trash2 size={12} />
                <span>Clear Selected ({selectedCustomerIds.length})</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  if (customers.length > 0) {
                    handleClearOneCustomer(customers[0].id, customers[0].name || customers[0].email)
                  }
                }}
                disabled={customers.length === 0}
                className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 py-1.5 px-3 rounded-lg transition-colors flex items-center gap-1 shrink-0 disabled:opacity-40"
                title="Clear one individual customer from admin view"
              >
                <Trash2 size={12} />
                <span>Clear One</span>
              </button>
            )}

            {/* Restore from Database Button */}
            {customers.length < initialCustomers.length && (
              <button
                type="button"
                onClick={handleRestoreAllCustomers}
                className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline py-1.5 px-2 flex items-center gap-1 shrink-0"
                title="Restore all customers from database"
              >
                <RotateCcw size={12} />
                <span>Restore ({initialCustomers.length})</span>
              </button>
            )}

            {/* Clear All Data Button (View Only) */}
            <button
              type="button"
              onClick={handleClearAllCustomers}
              className="text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 py-1.5 px-3 rounded-lg shadow-sm transition-colors flex items-center gap-1 shrink-0"
              title="Clear all customers from admin panel view (MongoDB user records remain safe)"
            >
              <RotateCcw size={12} /> Clear All Data
            </button>
          </div>
        </div>
      </div>


      {/* Customer Profiles List */}
      <div className="space-y-4">
        {filteredCustomers.length === 0 ? (
          <div className="card p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-3">
            <Users size={32} className="mx-auto text-zinc-400" />
            <p className="font-bold text-zinc-700 dark:text-zinc-300">No customers found</p>
            <p className="text-xs text-zinc-400">Click Restore to reload customer profiles from the database.</p>
            <button onClick={handleRestoreAllCustomers} className="btn-secondary text-xs py-1.5 px-3 inline-flex items-center gap-1">
              <RotateCcw size={12} /> Restore Customers
            </button>
          </div>
        ) : (
          filteredCustomers.map((u, idx) => {
            const defaultAddress = u.addresses[0]
            const lastOrder = u.lastOrder || u.orders[0]

            return (
              <div
                key={`${u.id || "customer"}_${u.email || ""}_${idx}`}
                className="card bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-sm"
              >
                {/* Customer Card Header */}
                <div className="p-4 sm:p-5 border-b border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={selectedCustomerIds.includes(u.id)}
                      onChange={() => toggleSelectCustomer(u.id)}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-brand-600 focus:ring-brand-500 cursor-pointer shrink-0"
                      title="Select customer"
                    />
                    <div className="w-10 h-10 rounded-xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center shrink-0">
                      {u.name?.charAt(0)?.toUpperCase() || u.email?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">{u.name || "Customer"}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span
                          className={`badge text-[9px] font-bold px-1.5 py-0.5 ${
                            u.role === "ADMIN"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.orders.length >= 2 && (
                          <span className="badge text-[9px] font-bold px-1.5 py-0.5 bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Award size={9} className="inline mr-0.5" />
                            Loyal Customer
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 text-xs text-right">
                    <div>
                      <p className="text-zinc-400 text-[10px]">Total Orders</p>
                      <p className="font-black text-zinc-900 dark:text-white text-base">{u.orders.length}</p>
                    </div>
                    <div>
                      <p className="text-zinc-400 text-[10px]">Lifetime Spend</p>
                      <p className="font-black text-emerald-600 text-base">{formatPrice(u.totalSpent)}</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleClearOneCustomer(u.id, u.name || u.email)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                      title="Clear only this customer profile from admin view (MongoDB stays safe)"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Contact & Destination Details */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-zinc-100 dark:border-zinc-800 text-xs">
                  <div className="flex items-start gap-2">
                    <Mail size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Email Address</p>
                      <p className="font-mono text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">{u.email}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <Phone size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Phone Number</p>
                      <p className="font-medium text-zinc-800 dark:text-zinc-200 mt-0.5">
                        {u.phone || (
                          <span className="text-zinc-300 dark:text-zinc-600">Not provided</span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Delivery Address</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-0.5 text-[11px]">
                        {defaultAddress ? (
                          <>
                            {defaultAddress.houseFlat}, {defaultAddress.street},<br />
                            {defaultAddress.city}, {defaultAddress.state} – {defaultAddress.pincode}
                          </>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">No address saved</span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Activity & Order Summary */}
                <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="flex items-start gap-2">
                    <Calendar size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Member Since</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {new Date(u.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <ShoppingBag size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Last Order</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {lastOrder ? (
                          <>
                            <span className="font-mono font-bold">{lastOrder.orderNumber}</span>
                            <span className="ml-1 text-zinc-400">
                              ({new Date(lastOrder.createdAt).toLocaleDateString("en-IN")})
                            </span>
                          </>
                        ) : (
                          <span className="text-zinc-300 dark:text-zinc-600">No orders yet</span>
                        )}
                      </p>
                      {lastOrder && (
                        <p className="mt-0.5">
                          <span
                            className={`badge text-[9px] font-bold px-1.5 py-0.5 ${
                              lastOrder.status === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700"
                                : lastOrder.status === "CANCELLED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-brand-50 text-brand-700"
                            }`}
                          >
                            {lastOrder.status}
                          </span>
                          <span className="ml-1 text-zinc-500 font-mono">{formatPrice(lastOrder.totalAmount)}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <TrendingUp size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-zinc-400 text-[10px] uppercase font-bold">Most Purchased</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-0.5">
                        {u.topProduct || (
                          <span className="text-zinc-300 dark:text-zinc-600">No purchases yet</span>
                        )}
                      </p>
                      {u.orders.length > 0 && (
                        <p className="text-zinc-400 text-[10px] mt-0.5">
                          Avg: {formatPrice(u.totalSpent / u.orders.length)} / order
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Orders Accordion / History */}
                {u.orders.length > 0 && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-2">
                      Recent Transactions ({u.orders.length} orders)
                    </p>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {u.orders.map((order: any) => (
                        <div
                          key={order.id}
                          className="flex items-center justify-between text-[11px] px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
                        >
                          <span className="font-mono text-zinc-800 dark:text-zinc-200 font-bold">
                            #{order.orderNumber}
                          </span>
                          <span className="text-zinc-500 dark:text-zinc-400">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                          </span>
                          <span className="text-zinc-900 dark:text-white font-bold">
                            {formatPrice(order.totalAmount)}
                          </span>
                          <span
                            className={`badge text-[9px] font-bold px-1.5 py-0.5 ${
                              (order.deliveryStatus || order.status) === "DELIVERED"
                                ? "bg-emerald-50 text-emerald-700"
                                : (order.deliveryStatus || order.status) === "CANCELLED"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-blue-50 text-blue-700"
                            }`}
                          >
                            {(order.deliveryStatus || order.status).replace(/_/g, " ")}
                          </span>
                          <span className="text-zinc-400 text-[10px]">{order.paymentMethod}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
