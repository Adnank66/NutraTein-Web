import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { MapPin, Plus, Trash2 } from "lucide-react"

export const dynamic = "force-dynamic"

function isValidObjectId(id: string | null | undefined): boolean {
  if (!id) return false
  return /^[a-f\d]{24}$/i.test(id)
}

export default async function AddressesPage() {
  const session = await auth()
  const userId = session?.user?.id

  let addresses: any[] = []
  if (isValidObjectId(userId)) {
    try {
      addresses = await prisma.address.findMany({
        where: { userId },
        orderBy: { isDefault: "desc" },
      })
    } catch (err) {
      console.error("Addresses fetch error:", err)
    }
  }


  return (
    <div className="card p-6 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-dark-100">
        <div>
          <h1 className="text-xl font-bold text-dark-900">Saved Addresses ({addresses.length})</h1>
          <p className="text-xs text-dark-500 mt-0.5">Manage delivery addresses for faster checkout.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((a) => (
          <div key={a.id} className="p-4 rounded-xl border border-dark-200 bg-white space-y-2 text-xs relative">
            {a.isDefault && (
              <span className="badge bg-brand-100 text-brand-700 text-[10px] font-bold">DEFAULT</span>
            )}
            <p className="font-bold text-dark-900">{a.name}</p>
            <p className="text-dark-600">{a.houseFlat}, {a.street}</p>
            <p className="text-dark-600">{a.city}, {a.state} - {a.pincode}</p>
            <p className="text-dark-500">Phone: {a.phone}</p>
          </div>
        ))}
      </div>
    </div>
  )
}