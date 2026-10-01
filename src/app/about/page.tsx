import StoreLayout from "@/components/layout/StoreLayout"
import { Shield, Award, Zap, Heart, CheckCircle2, ArrowRight } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "About Us | NUTRA TEIN",
  description: "Learn about NUTRA TEIN, our mission for clean sports nutrition and verified quality.",
}

const SOCIAL_LINKS = [
  {
    name: "Instagram",
    handle: "@nutratein",
    desc: "Daily workout tips, athlete showcases & behind the scenes",
    href: "https://www.instagram.com/nutratein?stkn=MXd0ODBqMWs0ZmRvMA==",
    color: "from-pink-500 to-rose-600",
    hoverBg: "hover:border-pink-500/60",
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
      </svg>
    ),
  },
  {
    name: "YouTube",
    handle: "NUTRA TEIN Official",
    desc: "Scientific supplement breakdowns, lab tests & training guides",
    href: "https://www.youtube.com/@nutratein",
    color: "from-red-600 to-red-700",
    hoverBg: "hover:border-red-500/60",
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
      </svg>
    ),
  },
  {
    name: "Facebook",
    handle: "NUTRA TEIN Nutrition",
    desc: "Exclusive community discounts, brand launches & fitness news",
    href: "https://www.facebook.com/nutratein",
    color: "from-blue-600 to-blue-800",
    hoverBg: "hover:border-blue-500/60",
    icon: (
      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
  },
]

export default function AboutPage() {
  return (
    <StoreLayout>
      <div className="py-16 bg-white dark:bg-zinc-950 transition-colors">
        <div className="container-custom max-w-4xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-widest">
              OUR MISSION & VALUES
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-950 dark:text-white">
              Pioneering Clean & Potent Sports Nutrition
            </h1>
            <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
              NUTRA TEIN was founded with a singular conviction: athletes and fitness enthusiasts deserve 100% transparent, certified, and efficacious supplementation without proprietary filler blends.
            </p>
          </div>

          {/* Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center space-y-2 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
                <Shield size={24} />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Pure Ingredients</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Raw materials imported from premier dairy cooperatives in the USA and Europe.
              </p>
            </div>

            <div className="card p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center space-y-2 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <Award size={24} />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Certified Safety</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Every single batch is tested for heavy metals, microbial safety, and protein accuracy.
              </p>
            </div>

            <div className="card p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-center space-y-2 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                <Zap size={24} />
              </div>
              <h3 className="font-bold text-zinc-900 dark:text-white text-base">Instant Mixability</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Micro-filtered instantized formulations designed for smooth texture with zero clumping.
              </p>
            </div>
          </div>

          {/* More Detailed Story / Manufacturing Process */}
          <div className="space-y-6 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 dark:text-white border-b border-zinc-200 dark:border-zinc-800 pb-3">
              Crafted for Peak Performance
            </h2>
            <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
              <p>
                At NUTRA TEIN, we understand that building muscle, enhancing recovery, and reaching peak physical performance requires precision nutrition. That is why our flagship Whey Protein formulations undergo a rigorous, multi-stage microfiltration process that preserves the essential muscle-building protein fractions while stripping out excess carbohydrates, fats, and lactose. 
              </p>
              <p>
                From the moment our raw whey is sourced from free-roaming, pasture-raised cows to the final scoop in your shaker cup, we maintain complete oversight. We partner only with GMP-certified and ISO-accredited manufacturing facilities. This ensures that environmental humidity, temperature, and mixing procedures are strictly controlled.
              </p>
              <p className="font-semibold text-zinc-800 dark:text-zinc-200">
                What sets us apart?
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><span className="font-bold text-zinc-900 dark:text-white">Zero Amino Spiking:</span> We guarantee that the protein content on our label comes exclusively from whole, intact protein sources—not cheap amino acid fillers like Taurine or Glycine.</li>
                <li><span className="font-bold text-zinc-900 dark:text-white">Bioavailable Ingredients:</span> Whether it's our Creatine Monohydrate or our comprehensive Pre-Workout complexes, we use the most highly absorbable forms of every ingredient.</li>
                <li><span className="font-bold text-zinc-900 dark:text-white">Uncompromising Taste:</span> Clean nutrition shouldn't taste like chalk. We’ve spent years dialing in our flavor profiles using premium cocoa, real vanilla bean extract, and balanced sweeteners to deliver a gourmet dessert experience without the added sugar.</li>
              </ul>
            </div>
          </div>

          {/* Social Media Channels Box */}
          <div className="space-y-4">
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-zinc-900 dark:text-white">
                Connect with NUTRA TEIN on Social Media
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Join thousands of dedicated athletes across India on our official social handles.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {SOCIAL_LINKS.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`card p-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl transition-all shadow-xs hover:shadow-lg flex flex-col justify-between group ${s.hoverBg}`}
                >
                  <div className="space-y-3">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                      {s.icon}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span>{s.name}</span>
                        <ArrowRight size={12} className="text-zinc-400 group-hover:translate-x-1 transition-transform" />
                      </h4>
                      <p className="text-xs font-mono font-bold text-red-600 dark:text-red-400 mt-0.5">
                        {s.handle}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-snug">
                        {s.desc}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 mt-4 group-hover:underline">
                    Follow on {s.name} →
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quality Standard */}
          <div id="standards" className="card p-8 bg-zinc-950 text-white rounded-3xl space-y-4 border border-zinc-800 shadow-xl">
            <h2 className="text-2xl font-bold">The NUTRA TEIN Quality Standard</h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
              We eliminate ambiguity. Every container lists exact active amounts of BCAAs, essential amino acids, digestive enzymes, and micronutrients. Zero added maltodextrin, zero amino spiking, zero banned substances.
            </p>
            <div className="pt-2 flex flex-wrap gap-3">
              <Link href="/shop" className="btn-primary text-xs py-2.5 px-5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl">
                Browse Authentic Catalog
              </Link>
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}