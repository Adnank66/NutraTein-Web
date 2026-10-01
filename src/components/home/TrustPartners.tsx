import { ShieldCheck, Lock, CheckCircle2, Award } from "lucide-react"

export default function TrustPartners() {
  return (
    <section className="py-12 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 transition-colors">
      <div className="container-custom">
        <div className="text-center mb-8">
          <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
            Verified Standards & Security Compliance
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { icon: Lock, label: "256-Bit SSL", sub: "Encrypted Transactions" },
            { icon: ShieldCheck, label: "PCI-DSS Level 1", sub: "Payment Security" },
            { icon: CheckCircle2, label: "Lab Tested Batches", sub: "Zero Amino Spiking" },
            { icon: Award, label: "100% Sourced Direct", sub: "Authenticity Guaranteed" },
          ].map(({ icon: Icon, label, sub }) => (
            <div
              key={label}
              className="p-4 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900 border border-zinc-200/70 dark:border-zinc-800 flex flex-col items-center text-center space-y-1 transition-all"
            >
              <Icon size={20} className="text-brand-600 dark:text-brand-400 mb-1" />
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{label}</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">{sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}