"use client"
import { useState, useEffect } from "react"
import { ChevronDown, HelpCircle } from "lucide-react"
import RevealText from "@/components/ui/reveal-text"

const FALLBACK_FAQS = [
  {
    id: "1",
    question: "How do I choose the right protein formula for my goals?",
    answer: "If your goal is lean muscle recovery with minimal carbs and fats, choose 100% Whey Isolate. If you follow a plant-based or dairy-free lifestyle, choose our Clean Plant Protein. If you are struggling to consume enough calories to gain muscle weight, select Mass Gainer Extreme.",
  },
  {
    id: "2",
    question: "What payment methods do you accept?",
    answer: "We accept all major Indian payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking across 40+ banks, and Cash on Delivery (COD).",
  },
  {
    id: "3",
    question: "How long does express shipping take across India?",
    answer: "Orders in metro cities (Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad, Chennai) are typically delivered within 2 to 3 business days. Non-metro locations take 3 to 5 business days. Real-time courier tracking is provided via SMS and your account dashboard.",
  },
  {
    id: "4",
    question: "Are all NUTRA TEIN batches lab tested for purity?",
    answer: "Yes. Every single batch is tested for heavy metals, microbial safety, and accurate active protein percentage. We strictly prohibit amino spiking and proprietary filler blends.",
  },
  {
    id: "5",
    question: "What is your return and replacement policy?",
    answer: "We offer a hassle-free 7-day replacement policy on items that arrive damaged, with broken tamper seals, or incorrect formulas. Simply contact our support team or file a request via your account order page.",
  },
  {
    id: "6",
    question: "How does the 15% discount on the Combo Builder work?",
    answer: "When you select at least one core protein and one performance product in the 'Build Your Stack' builder, a 15% bundle discount is automatically applied to all items in the stack upon adding to cart.",
  },
  {
    id: "7",
    question: "How do I apply coupon codes at checkout?",
    answer: "You can enter promotional discount codes (such as FIRST10, SAVE20, or FLAT300) directly in the Cart drawer, Cart page, or during Step 3 of checkout to see instant price deductions.",
  },
]

interface FAQ {
  id: string
  question: string
  answer: string
  isActive?: boolean
}

export default function HomeFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)
  const [faqs, setFaqs] = useState<FAQ[]>(FALLBACK_FAQS)

  useEffect(() => {
    fetch("/api/admin/faq")
      .then(r => r.json())
      .then(data => {
        const active = (data.faqs || []).filter((f: FAQ) => f.isActive !== false)
        if (active.length > 0) setFaqs(active)
      })
      .catch(() => {}) // silently fall back to hardcoded FAQs
  }, [])

  return (
    <section
      id="faq"
      className="w-full py-16 sm:py-20 bg-zinc-950 border-b border-zinc-800 text-white"
      aria-label="Frequently Asked Questions"
    >
      <div className="container-custom max-w-3xl">
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900/80 border border-white/10 text-red-300 text-xs font-bold uppercase tracking-wider">
            <HelpCircle size={13} />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <RevealText
            text="Got Questions? We Have Answers"
            as="h2"
            size="custom"
            duration={0.35}
            stagger={0.02}
            className="section-title !justify-center !text-center !text-white drop-shadow-md"
          />
          <p className="section-subtitle mx-auto text-zinc-300">
            Everything you need to know about our supplements, shipping, and guarantees.
          </p>
        </div>

        <div className="divide-y divide-white/10 card bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl rounded-2xl overflow-hidden">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx
            return (
              <div key={faq.id} className="p-5 sm:p-6 transition-colors hover:bg-white/[0.03]">
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex items-center justify-between w-full text-left font-bold text-xs sm:text-sm text-white gap-4"
                >
                  <span>{faq.question}</span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen
                        ? "rotate-180 bg-red-600 text-white shadow-md shadow-red-600/30"
                        : "bg-zinc-800 text-zinc-300"
                    }`}
                  >
                    <ChevronDown size={14} />
                  </div>
                </button>
                {isOpen && (
                  <p className="mt-3 text-xs sm:text-sm text-zinc-300 leading-relaxed animate-fade-in pr-6">
                    {faq.answer}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}