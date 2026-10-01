import StoreLayout from "@/components/layout/StoreLayout"

export const metadata = { title: "Return Policy | PROTEINX" }

export default function ReturnPolicyPage() {
  return (
    <StoreLayout>
      <div className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-8 text-dark-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 mb-2">7-Day Replacement Policy</h1>
            <p className="text-dark-400 text-xs">Hassle-Free Returns on Damaged or Incorrect Items</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">1. Eligibility</h2>
            <p>Supplements that arrive with broken seals, damaged outer tubs, or incorrect flavors/sizes can be returned or exchanged within 7 days of verified delivery.</p>
          </section>
        </div>
      </div>
    </StoreLayout>
  )
}