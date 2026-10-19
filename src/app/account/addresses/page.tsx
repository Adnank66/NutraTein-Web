"use client"

import { useState, useEffect } from "react"
import { MapPin, Plus, Trash2, Edit2, CheckCircle2, Loader2, X, Phone, Building, Home } from "lucide-react"
import { toast } from "sonner"

interface Address {
  id: string
  name: string
  phone: string
  houseFlat: string
  street: string
  area?: string | null
  city: string
  state: string
  pincode: string
  country: string
  isDefault: boolean
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh", "Chandigarh", "Puducherry"
]

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form fields
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [houseFlat, setHouseFlat] = useState("")
  const [street, setStreet] = useState("")
  const [area, setArea] = useState("")
  const [city, setCity] = useState("")
  const [state, setState] = useState("Maharashtra")
  const [pincode, setPincode] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  const fetchAddresses = async () => {
    try {
      const res = await fetch("/api/user/addresses")
      const data = await res.json()
      if (data.success && Array.isArray(data.addresses)) {
        setAddresses(data.addresses)
      }
    } catch (err) {
      console.error("Failed to load addresses:", err)
      toast.error("Could not load addresses")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddresses()
  }, [])

  const openAddModal = () => {
    setEditingAddress(null)
    setName("")
    setPhone("")
    setHouseFlat("")
    setStreet("")
    setArea("")
    setCity("")
    setState("Maharashtra")
    setPincode("")
    setIsDefault(addresses.length === 0)
    setModalOpen(true)
  }

  const openEditModal = (addr: Address) => {
    setEditingAddress(addr)
    setName(addr.name || "")
    setPhone(addr.phone || "")
    setHouseFlat(addr.houseFlat || "")
    setStreet(addr.street || "")
    setArea(addr.area || "")
    setCity(addr.city || "")
    setState(addr.state || "Maharashtra")
    setPincode(addr.pincode || "")
    setIsDefault(Boolean(addr.isDefault))
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditingAddress(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    const cleanName = name.trim()
    const cleanPhone = phone.replace(/\D/g, "").slice(0, 15)
    const cleanHouse = houseFlat.trim()
    const cleanStreet = street.trim()
    const cleanArea = area.trim()
    const cleanCity = city.trim()
    const cleanState = state.trim()
    const cleanPincode = pincode.replace(/\D/g, "").slice(0, 10)

    if (!cleanName || !cleanPhone || !cleanHouse || !cleanStreet || !cleanCity || !cleanState || !cleanPincode) {
      toast.error("Please fill in all required fields")
      return
    }

    if (cleanPhone.length < 10) {
      toast.error("Please enter a valid 10-digit phone number")
      return
    }

    if (cleanPincode.length !== 6) {
      toast.error("Please enter a valid 6-digit PIN code")
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: cleanName,
        phone: cleanPhone,
        houseFlat: cleanHouse,
        street: cleanStreet,
        area: cleanArea || undefined,
        city: cleanCity,
        state: cleanState,
        pincode: cleanPincode,
        country: "India",
        isDefault,
      }

      if (editingAddress) {
        // Edit current address
        const res = await fetch(`/api/user/addresses/${editingAddress.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to update address")
        toast.success("Address updated successfully!")
      } else {
        // Add new address
        const res = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || "Failed to add address")
        toast.success("New address added successfully!")
      }

      closeModal()
      await fetchAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this address?")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/user/addresses/${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to delete address")

      toast.success("Address deleted successfully")
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      await fetchAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address")
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetDefault = async (addr: Address) => {
    try {
      const res = await fetch(`/api/user/addresses/${addr.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addr,
          isDefault: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to set default address")

      toast.success("Default address updated")
      await fetchAddresses()
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address")
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="card p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 dark:bg-zinc-900 dark:border-zinc-800">
        <div>
          <h1 className="text-xl font-bold text-dark-900 dark:text-white flex items-center gap-2">
            <MapPin className="text-brand-500" size={22} />
            Saved Addresses
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {addresses.length}
            </span>
          </h1>
          <p className="text-xs text-dark-500 dark:text-zinc-400 mt-1">
            Manage your delivery and billing addresses for fast, one-click checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-2 shadow-sm shrink-0"
        >
          <Plus size={16} />
          Add New Address
        </button>
      </div>

      {/* Address List */}
      {loading ? (
        <div className="card p-12 flex items-center justify-center dark:bg-zinc-900 dark:border-zinc-800">
          <Loader2 className="animate-spin text-brand-500" size={28} />
        </div>
      ) : addresses.length === 0 ? (
        <div className="card p-10 text-center space-y-4 dark:bg-zinc-900 dark:border-zinc-800">
          <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 flex items-center justify-center mx-auto">
            <Home size={28} />
          </div>
          <div>
            <h3 className="text-base font-bold text-dark-900 dark:text-white">No Saved Addresses Found</h3>
            <p className="text-xs text-dark-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto leading-relaxed">
              You haven't saved any delivery addresses yet. Add your home or office address to make ordering faster.
            </p>
          </div>
          <button
            type="button"
            onClick={openAddModal}
            className="btn-primary text-xs py-2.5 px-5 inline-flex items-center gap-2 shadow-md"
          >
            <Plus size={16} />
            Add Your First Address
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((a) => (
            <div
              key={a.id}
              className={`p-5 rounded-2xl border transition-all relative flex flex-col justify-between ${
                a.isDefault
                  ? "border-brand-500/50 bg-brand-50/20 dark:bg-brand-950/10 shadow-sm"
                  : "border-dark-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-dark-300 dark:hover:border-zinc-700"
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-dark-900 dark:text-white">{a.name}</span>
                    {a.isDefault && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-100 text-brand-700 dark:bg-brand-950/60 dark:text-brand-400 border border-brand-200 dark:border-brand-900/50">
                        <CheckCircle2 size={11} />
                        Default
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-dark-700 dark:text-zinc-300 leading-relaxed">
                  <span className="font-medium text-dark-900 dark:text-zinc-100">{a.houseFlat}</span>
                  {a.street && `, ${a.street}`}
                  {a.area && `, ${a.area}`}
                  <br />
                  <span>{a.city}, {a.state} – <strong className="font-semibold text-dark-900 dark:text-zinc-100">{a.pincode}</strong></span>
                  <br />
                  <span className="text-dark-500 dark:text-zinc-400">{a.country}</span>
                </p>

                <p className="text-xs text-dark-600 dark:text-zinc-400 flex items-center gap-1.5 pt-1">
                  <Phone size={12} className="text-brand-600 shrink-0" />
                  <span>+91 {a.phone}</span>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-dark-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                <div>
                  {!a.isDefault ? (
                    <button
                      type="button"
                      onClick={() => handleSetDefault(a)}
                      className="text-[11px] font-semibold text-dark-600 hover:text-brand-600 dark:text-zinc-400 dark:hover:text-brand-400 transition-colors"
                    >
                      Set as Default
                    </button>
                  ) : (
                    <span className="text-[11px] text-zinc-400 font-medium">Primary Address</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(a)}
                    className="p-1.5 rounded-lg border border-dark-200 dark:border-zinc-700 text-dark-700 dark:text-zinc-300 hover:bg-dark-50 dark:hover:bg-zinc-800 text-xs font-semibold flex items-center gap-1 transition-colors"
                    title="Edit address"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="p-1.5 rounded-lg border border-red-200 dark:border-red-950/60 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                    title="Delete address"
                  >
                    {deletingId === a.id ? (
                      <Loader2 size={13} className="animate-spin" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Add / Edit Address Modal ── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150 relative max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={closeModal}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center shrink-0">
                <Building size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                  {editingAddress ? "Edit Saved Address" : "Add New Delivery Address"}
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {editingAddress ? "Update your existing address details below." : "Enter your full address for order deliveries."}
                </p>
              </div>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label dark:text-zinc-400">Full Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Adnan Kazi"
                    required
                    className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="label dark:text-zinc-400">Phone Number (10 Digits) *</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="8779060033"
                    maxLength={10}
                    required
                    className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="label dark:text-zinc-400">Flat / House No. / Building / Apartment *</label>
                <input
                  type="text"
                  value={houseFlat}
                  onChange={(e) => setHouseFlat(e.target.value)}
                  placeholder="Flat 402, Building A, Heights Residency"
                  required
                  className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="label dark:text-zinc-400">Street / Road / Colony *</label>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="Near Shivaji Chowk, Kon Gaon"
                  required
                  className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="label dark:text-zinc-400">Area / Landmark (Optional)</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Behind NutraTein Warehouse"
                  className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label dark:text-zinc-400">City *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kalyan / Mumbai"
                    required
                    className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="label dark:text-zinc-400">State *</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                    className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  >
                    {INDIAN_STATES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label dark:text-zinc-400">PIN Code (6 Digits) *</label>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="421311"
                    maxLength={6}
                    required
                    className="input text-xs dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(e) => setIsDefault(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 focus:ring-brand-500 border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800"
                  />
                  <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    Make this my default delivery address
                  </span>
                </label>
              </div>

              <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-semibold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary py-2.5 px-6 flex items-center gap-2 shadow-sm"
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={14} />
                      {editingAddress ? "Update Address" : "Save Address"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}