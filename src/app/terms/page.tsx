import StoreLayout from "@/components/layout/StoreLayout"

export const metadata = { title: "Terms & Conditions | PROTEINX" }

export default function TermsPage() {
  return (
    <StoreLayout>
      <div className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-8 text-dark-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 mb-2">Terms & Conditions</h1>
            <p className="text-dark-400 text-xs">Last Updated: September 2024</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">1. Product Usage Disclaimer</h2>
            <p>Dietary supplements sold on PROTEINX are intended for general fitness and nutritional support. Statements regarding dietary supplements have not been evaluated by government regulatory bodies for diagnosing, treating, or curing any medical disease.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">2. Pricing & Orders</h2>
            <p>All prices listed are in Indian Rupees (INR) inclusive of applicable GST taxes. We reserve the right to modify pricing, cancel suspected unauthorized orders, or correct typographical errors.</p>
          </section>
        </div>
      </div>
    </StoreLayout>
  )
}