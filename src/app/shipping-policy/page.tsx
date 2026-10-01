import StoreLayout from "@/components/layout/StoreLayout"

export const metadata = { title: "Shipping Policy | PROTEINX" }

export default function ShippingPolicyPage() {
  return (
    <StoreLayout>
      <div className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-8 text-dark-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 mb-2">Shipping Policy</h1>
            <p className="text-dark-400 text-xs">Fast & Reliable Dispatch Across India</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">1. Free Shipping Threshold</h2>
            <p>Orders totaling ₹999 or above qualify for FREE standard courier delivery. Orders below ₹999 incur a nominal ₹99 handling and logistics charge.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">2. Estimated Delivery Timelines</h2>
            <p>Metro cities (Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, Kolkata, Pune): 2 to 3 business days. Rest of India: 3 to 5 business days.</p>
          </section>
        </div>
      </div>
    </StoreLayout>
  )
}