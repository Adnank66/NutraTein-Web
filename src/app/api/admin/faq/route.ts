import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const DEFAULT_HOMEPAGE_FAQS = [
  {
    question: "How do I choose the right protein formula for my goals?",
    answer: "If your goal is lean muscle recovery with minimal carbs and fats, choose 100% Whey Isolate. If you follow a plant-based or dairy-free lifestyle, choose our Clean Plant Protein. If you are struggling to consume enough calories to gain muscle weight, select Mass Gainer Extreme.",
    sortOrder: 1,
    isActive: true,
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major Indian payment methods: UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking across 40+ banks, and Cash on Delivery (COD).",
    sortOrder: 2,
    isActive: true,
  },
  {
    question: "How long does express shipping take across India?",
    answer: "Orders in metro cities (Mumbai, Delhi NCR, Bangalore, Pune, Hyderabad, Chennai) are typically delivered within 2 to 3 business days. Non-metro locations take 3 to 5 business days. Real-time courier tracking is provided via SMS and your account dashboard.",
    sortOrder: 3,
    isActive: true,
  },
  {
    question: "Are all PROTEINX batches lab tested for purity?",
    answer: "Yes. Every single batch is tested for heavy metals, microbial safety, and accurate active protein percentage. We strictly prohibit amino spiking and proprietary filler blends.",
    sortOrder: 4,
    isActive: true,
  },
  {
    question: "What is your return and replacement policy?",
    answer: "We offer a hassle-free 7-day replacement policy on items that arrive damaged, with broken tamper seals, or incorrect formulas. Simply contact our support team or file a request via your account order page.",
    sortOrder: 5,
    isActive: true,
  },
  {
    question: "How does the 15% discount on the Combo Builder work?",
    answer: "When you select at least one core protein and one performance product in the 'Build Your Stack' builder, a 15% bundle discount is automatically applied to all items in the stack upon adding to cart.",
    sortOrder: 6,
    isActive: true,
  },
  {
    question: "How do I apply coupon codes at checkout?",
    answer: "You can enter promotional discount codes (such as FIRST10, SAVE20, or FLAT300) directly in the Cart drawer, Cart page, or during Step 3 of checkout to see instant price deductions.",
    sortOrder: 7,
    isActive: true,
  },
]

async function requireAdmin() {
  const session = await auth()
  if (!session || (session.user as any)?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  return null
}


export async function GET() {
  try {
    let faqs = await prisma.fAQ.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    })

    // If database FAQ collection is empty, auto-seed with the 7 homepage FAQs
    if (faqs.length === 0) {
      try {
        for (const item of DEFAULT_HOMEPAGE_FAQS) {
          await prisma.fAQ.create({ data: item })
        }
        faqs = await prisma.fAQ.findMany({
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        })
      } catch (seedErr) {
        console.warn("FAQ auto-seed note:", seedErr)
      }
    }

    return NextResponse.json({ faqs })
  } catch (err: any) {
    return NextResponse.json({ faqs: [], error: err.message })
  }
}

export async function POST(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const body = await req.json()

    // Handle manual seed request
    if (body.action === "seed_defaults") {
      const existing = await prisma.fAQ.count()
      if (existing === 0) {
        for (const item of DEFAULT_HOMEPAGE_FAQS) {
          await prisma.fAQ.create({ data: item })
        }
      }
      const faqs = await prisma.fAQ.findMany({
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      })
      return NextResponse.json({ success: true, faqs })
    }

    const { question, answer, sortOrder, isActive } = body
    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json({ error: "Question and answer are required" }, { status: 400 })
    }
    const faq = await prisma.fAQ.create({
      data: {
        question: question.trim(),
        answer: answer.trim(),
        sortOrder: sortOrder ?? 0,
        isActive: isActive ?? true,
      },
    })
    return NextResponse.json({ faq })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PATCH(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id, question, answer, sortOrder, isActive } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    const faq = await prisma.fAQ.update({
      where: { id },
      data: {
        ...(question !== undefined && { question }),
        ...(answer !== undefined && { answer }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return NextResponse.json({ faq })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function DELETE(req: Request) {
  const err = await requireAdmin()
  if (err) return err
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })
    await prisma.fAQ.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
