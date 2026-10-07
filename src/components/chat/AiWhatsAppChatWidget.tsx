"use client"

import React, { useState, useRef, useEffect } from "react"
import Link from "next/link"
import {
  Sparkles,
  MessageSquare,
  Send,
  X,
  Bot,
  ExternalLink,
  ShoppingCart,
  Check,
  Phone,
  Zap,
} from "lucide-react"
import { useCartStore } from "@/store/cart"
import { toast } from "sonner"

import { useTranslation } from "@/hooks/useTranslation"

interface ChatMessage {
  id: string
  sender: "user" | "ai"
  text: string
  products?: any[]
  suggestions?: string[]
}

const WHATSAPP_NUMBER = "919321598094"
const WHATSAPP_DISPLAY = "+91 93215 98094"

const GREETINGS = {
  en: "Hi! I am your **Nutratein AI Supplement Advisor**. Ask me anything about choosing the right protein, creatine dosage, mass gainers, or supplements tailored to your budget!",
  hi: "नमस्ते! मैं आपका **Nutratein AI फिटनेस सलाहकार** हूँ। सही व्हे प्रोटीन, क्रिएटिन, वजन बढ़ाने या बजट के अनुसार बेस्ट सप्लीमेंट्स के बारे में मुझसे कुछ भी पूछें!",
  mr: "नमस्कार! मी तुमचा **Nutratein AI सहाय्यक** आहे. तुमच्या फिटनेस ध्येयानुसार सर्वोत्तम व्हे प्रोटीन, क्रिएटिन आणि सप्लीमेंट्सची माहिती घेण्यासाठी मला विचारा!",
  ta: "வணக்கம்! நான் உங்கள் **Nutratein AI ஊட்டச்சத்து ஆலோசகர்**. சரியான புரோட்டீன், கிரியேட்டின் அளவு, அல்லது உங்கள் பட்ஜெட்டுக்கு ஏற்ற சப்ளிமெண்ட்ஸ் பற்றி என்னிடம் கேளுங்கள்!",
}

const DEFAULT_SUGGESTIONS = {
  en: [
    "Best protein for muscle building",
    "Tell me about Creatine",
    "Supplements under ₹2000",
    "Fat Loss & Cutting stack",
    "Talk to WhatsApp Support",
  ],
  hi: [
    "मांसपेशियों के लिए सबसे अच्छा प्रोटीन",
    "क्रिएटिन के क्या फायदे हैं?",
    "₹2000 के अंदर सप्लीमेंट्स",
    "फैट लॉस कॉम्बो",
    "व्हाट्सएप पर बात करें",
  ],
  mr: [
    "स्नायू वाढवण्यासाठी व्हे प्रोटीन",
    "क्रिएटिनचे फायदे सांगा",
    "₹२००० च्या आतील सप्लीमेंट्स",
    "फॅट लॉस स्टॅक",
    "व्हॉट्सॲपवर संपर्क करा",
  ],
  ta: [
    "தசை வளர்ச்சிக்கான சிறந்த புரோட்டீன்",
    "கிரியேட்டின் பயன்கள்",
    "₹2000-க்குள் சிறந்த சப்ளிமெண்ட்ஸ்",
    "கொழுப்பு குறைக்கும் ஸ்டாக்",
    "வாட்ஸ்அப்பில் பேசவும்",
  ],
}

export default function AiWhatsAppChatWidget() {
  const { language: siteLanguage, t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const language = siteLanguage as "en" | "hi" | "mr" | "ta"
  const [inputMessage, setInputMessage] = useState("")
  const [loading, setLoading] = useState(false)
  
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Update welcome message when language changes
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "msg-welcome",
          sender: "ai",
          text: GREETINGS[language],
          suggestions: DEFAULT_SUGGESTIONS[language],
        },
      ])
    } else {
      // Just update the last welcome message if they haven't chatted yet
      if (messages.length === 1 && messages[0].id === "msg-welcome") {
        setMessages([
          {
            id: "msg-welcome",
            sender: "ai",
            text: GREETINGS[language],
            suggestions: DEFAULT_SUGGESTIONS[language],
          },
        ])
      }
    }
  }, [language])

  const chatBodyRef = useRef<HTMLDivElement>(null)
  const { addItem } = useCartStore()

  // Scroll to bottom on new message
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight
    }
  }, [messages, loading])


  const openWhatsApp = (customMsg?: string) => {
    const text = customMsg || "Hello Nutratein, I need assistance with product recommendations."
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`
    window.open(url, "_blank", "noopener,noreferrer")
  }

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim()
    if (!text) return

    // If user clicked WhatsApp suggestion
    if (text.toLowerCase().includes("whatsapp") || text.includes("व्हाट्सएप") || text.includes("व्हॉट्सॲप")) {
      openWhatsApp("Hello Nutratein, I would like to consult a specialist about supplements.")
      return
    }

    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "user",
      text,
    }

    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    if (!textToSend) setInputMessage("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, language }),
      })

      const data = await res.json()

      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            id: "ai-" + Date.now(),
            sender: "ai",
            text: data.reply,
            products: data.products,
            suggestions: data.suggestions,
          },
        ])
      } else {
        throw new Error(data.message)
      }
    } catch {
      // Instant intelligent fallback if network error
      setMessages((prev) => [
        ...prev,
        {
          id: "ai-" + Date.now(),
          sender: "ai",
          text:
            language === "hi"
              ? "हमारे फ्लैगशिप **Nitrotein Performance Whey** (₹3,199) और **CreaCore Creatine** (₹549) सबसे लोकप्रिय विकल्प हैं। आप सीधे व्हाट्सएप पर भी हमारे विशेषज्ञ से बात कर सकते हैं।"
              : "Our flagship **Nitrotein Performance Whey Protein** (₹3,199) and **CreaCore Creatine Monohydrate** (₹549) are our top-rated recommendations. You can also chat directly with our team on WhatsApp!",
          suggestions: ["Best protein for muscle", "Creatine Monohydrate", "Connect on WhatsApp"],
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAddToCart = (p: any) => {
    addItem({
      id: p.id,
      productId: p.id,
      name: p.name,
      brand: p.brand || "NUTRATEIN",
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      stock: 50,
      quantity: 1,
      slug: p.slug,
    })
    toast.success(`Added ${p.name} to cart!`, {
      description: `₹${p.price.toLocaleString("en-IN")} — View in Cart Drawer`,
    })
  }

  const formatText = (content: string) => {
    const parts = content.split(/(\*\*.*?\*\*)/g)
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={index} className="font-extrabold text-brand-600 dark:text-brand-400">
            {part.slice(2, -2)}
          </strong>
        )
      }
      return part
    })
  }

  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipExiting, setTooltipExiting] = useState(false)

  useEffect(() => {
    // When website is loaded/reloaded, pop up after 1.2 seconds, and auto-dismiss after 7.5 seconds
    const showTimer = setTimeout(() => {
      setShowTooltip(true)
    }, 1200)

    const hideTimer = setTimeout(() => {
      setTooltipExiting(true)
      setTimeout(() => setShowTooltip(false), 500)
    }, 8700) // 1.2s delay + 7.5s display = auto dismiss within 5-10s window

    return () => {
      clearTimeout(showTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      setShowTooltip(false)
    }
  }, [isOpen])

  return (
    <>
      {/* ── FLOATING ACTION LAUNCHERS (Bottom-Right) ────────────────────────── */}
      <div className="fixed bottom-6 right-4 sm:right-6 z-50 flex flex-col items-end gap-3 pointer-events-auto">
        
        {/* Tooltip Bubble — animated pop-up for 5 to 10 seconds on reload */}
        {!isOpen && showTooltip && (
          <div
            className={`relative mr-2 mb-1 transition-all duration-500 transform ${
              tooltipExiting
                ? "opacity-0 translate-y-2 scale-95 pointer-events-none"
                : "opacity-100 translate-y-0 scale-100 animate-bounce-subtle"
            }`}
          >
            <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-[0_10px_30px_rgba(0,0,0,0.35)] border border-brand-500/30 flex items-center gap-3 backdrop-blur-md">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Sparkles size={14} className="text-amber-400" />
                <span>{t("chat.needHelp", undefined) || "Need Help? Chat!"}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setTooltipExiting(true)
                  setTimeout(() => setShowTooltip(false), 300)
                }}
                className="text-zinc-400 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1 cursor-pointer"
                title={t("chat.dismiss", undefined) || "Dismiss"}
              >
                <X size={11} />
              </button>
            </div>
            {/* Triangle pointer */}
            <div className="absolute -bottom-2 right-6 w-0 h-0 border-l-[6px] border-l-transparent border-t-[8px] border-t-zinc-900 border-r-[6px] border-r-transparent"></div>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* 1. Quick WhatsApp Launcher Button - only visible when chat is open */}
          {isOpen && (
            <button
              onClick={() => openWhatsApp()}
              className="group relative flex items-center justify-center bg-[#25D366] hover:bg-[#20ba59] text-white w-10 h-10 rounded-full shadow-[0_6px_20px_rgb(37,211,102,0.35)] transition-all duration-300 hover:scale-110 active:scale-95 border border-white/40 animate-fade-in-up"
              title={`Chat with us on WhatsApp (${WHATSAPP_DISPLAY})`}
              aria-label={t("chat.whatsappSupport", undefined) || "WhatsApp Support"}
            >
              {/* Animated Ping Ring */}
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border border-white"></span>
              </span>

              <svg className="w-5 h-5 fill-current drop-shadow-md" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.888 9.886m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
            </button>
          )}

          {/* 2. Main AI Chat Launcher Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`flex items-center gap-2 px-3 h-10 rounded-full shadow-[0_6px_20px_rgb(234,88,12,0.25)] transition-all duration-300 hover:scale-105 active:scale-95 border ${
              isOpen
                ? "bg-zinc-900 border-zinc-700 text-white hover:bg-zinc-800"
                : "bg-gradient-to-r from-brand-600 via-orange-500 to-amber-500 border-white/40 text-white"
            }`}
            aria-label="Nutratein AI Assistant"
          >
            {isOpen ? (
              <>
                <X size={16} />
                <span className="font-bold text-xs hidden sm:block">{t("chat.close", undefined) || "Close"}</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="animate-spin text-amber-200" style={{ animationDuration: "8s" }} />
                <span className="font-bold text-xs tracking-wide">{t("chat.aiChat", undefined) || "AI Chat"}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── AI CHAT FLOATING WINDOW ────────────────────────────────────────── */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-32px)] sm:w-[420px] max-h-[85vh] h-[640px] bg-white rounded-3xl shadow-2xl border border-zinc-200 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="bg-zinc-950 text-white p-4 flex items-center justify-between border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-amber-500 flex items-center justify-center font-black text-white text-sm shadow-md">
                  NX
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-sm tracking-tight text-white">Nutratein AI Advisor</h3>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/30">
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">Supplement & Nutrition Intelligence</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-900 transition-colors"
                title={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Quick WhatsApp Escalation Banner inside Chat */}
          <div className="bg-emerald-50 border-b border-emerald-100 px-4 py-2 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold text-[11px]">
              <Phone size={13} className="text-emerald-600" />
              <span>Prefer WhatsApp chat?</span>
            </div>
            <button
              onClick={() => openWhatsApp("Hi, I want to talk with a Nutratein supplement expert.")}
              className="font-bold text-[11px] text-emerald-700 hover:text-emerald-900 underline flex items-center gap-1"
            >
              Open WhatsApp <ExternalLink size={11} />
            </button>
          </div>

          {/* Chat Messages Body */}
          <div ref={chatBodyRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-zinc-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white rounded-br-none shadow-md font-medium"
                      : "bg-white text-zinc-800 rounded-bl-none shadow-sm border border-zinc-200/80"
                  }`}
                >
                  <p>{formatText(msg.text)}</p>
                </div>

                {/* Render Products in Chat if returned */}
                {msg.products && msg.products.length > 0 && (
                  <div className="mt-2.5 w-full space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                      Recommended Matches:
                    </p>
                    {msg.products.map((p: any) => (
                      <div
                        key={p.id}
                        className="bg-white rounded-2xl p-3 border border-zinc-200/80 shadow-sm flex items-center gap-3 hover:border-brand-500/40 transition-colors"
                      >
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-14 h-14 object-cover rounded-xl bg-zinc-100 border border-zinc-200 flex-shrink-0"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/assets/products/whey.jpg"
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-xs text-zinc-900 truncate">{p.name}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-black text-sm text-brand-600">
                              ₹{p.price?.toLocaleString("en-IN")}
                            </span>
                            {p.mrp && (
                              <span className="text-[11px] text-zinc-400 line-through">
                                ₹{p.mrp?.toLocaleString("en-IN")}
                              </span>
                            )}
                            {p.discountPercent > 0 && (
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                                {p.discountPercent}% OFF
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => handleQuickAddToCart(p)}
                              className="btn-primary py-1 px-2.5 text-[11px] font-bold flex items-center gap-1 rounded-lg"
                            >
                              <ShoppingCart size={12} /> + Cart
                            </button>
                            <Link
                              href={`/shop/${p.slug}`}
                              onClick={() => setIsOpen(false)}
                              className="text-[11px] font-semibold text-zinc-600 hover:text-brand-600 flex items-center gap-0.5 ml-1"
                            >
                              Details <ExternalLink size={10} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions Chips */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5 max-w-[90%]">
                    {msg.suggestions.map((sug, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendMessage(sug)}
                        className="text-[11px] font-semibold bg-white hover:bg-brand-50 hover:text-brand-600 hover:border-brand-300 text-zinc-700 px-3 py-1.5 rounded-full border border-zinc-200 transition-all shadow-2xs text-left"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-zinc-400 text-xs py-2">
                <div className="w-6 h-6 rounded-full bg-brand-100 flex items-center justify-center animate-pulse">
                  <Bot size={14} className="text-brand-600" />
                </div>
                <span className="font-semibold text-[11px]">Nutratein AI is formulating recommendations...</span>
              </div>
            )}
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            className="p-3 bg-white border-t border-zinc-200 flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={
                language === "hi"
                  ? "प्रोटीन, क्रिएटिन या बजट के बारे में पूछें..."
                  : language === "mr"
                  ? "सप्लिमेंट्स किंवा आहाराबद्दल विचारा..."
                  : "Ask about proteins, goals, dosage, budget..."
              }
              className="flex-1 bg-zinc-50 border border-zinc-200 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 rounded-xl px-3.5 py-2.5 text-xs text-zinc-900 outline-none transition-all placeholder:text-zinc-400"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-40 disabled:hover:bg-brand-600 text-white transition-all shadow-md active:scale-95 flex-shrink-0"
              aria-label="Send message"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  )
}
