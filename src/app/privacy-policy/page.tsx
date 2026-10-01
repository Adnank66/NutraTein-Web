import StoreLayout from "@/components/layout/StoreLayout"

export const metadata = { title: "Privacy Policy | PROTEINX" }

export default function PrivacyPolicyPage() {
  return (
    <StoreLayout>
      <div className="py-16 bg-white">
        <div className="container-custom max-w-3xl space-y-8 text-dark-700 text-xs sm:text-sm leading-relaxed">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark-900 mb-2">Privacy Policy</h1>
            <p className="text-dark-400 text-xs">Last Updated: September 2024</p>
          </div>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">1. Information We Collect</h2>
            <p>We collect information you provide directly when creating an account, making a purchase, applying promo codes, or contacting customer support. This includes name, phone number, email address, delivery addresses, and order history.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">2. How We Use Information</h2>
            <p>Your information is used strictly to process orders, dispatch shipments with courier partners, process refunds, provide customer support, and prevent fraudulent transactions.</p>
          </section>

          <section className="space-y-2">
            <h2 className="font-bold text-base text-dark-900">3. Data Protection & Security</h2>
            <p>We employ industry standard 256-bit SSL encryption. We never store complete credit card or debit card numbers on our servers; payments are processed securely through PCI-DSS compliant gateways.</p>
          </section>
        </div>
      </div>
    </StoreLayout>
  )
}