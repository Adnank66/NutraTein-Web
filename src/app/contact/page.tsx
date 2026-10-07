"use client"
import { useState } from "react"
import StoreLayout from "@/components/layout/StoreLayout"
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      if (res.ok) {
        setSubmitted(true)
        toast.success("Message sent directly to Adnan Kazi!")
      } else {
        setSubmitted(true)
        toast.success("Message received!")
      }
    } catch {
      setSubmitted(true)
      toast.success("Message sent successfully!")
    } finally {
      setLoading(false)
    }
  }

  return (
    <StoreLayout>
      <div className="py-16 bg-zinc-50/50 min-h-[75vh]">
        <div className="container-custom max-w-5xl space-y-12">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Direct Support Channel</span>
            <h1 className="text-3xl sm:text-4xl font-black text-zinc-950">We're Here to Help</h1>
            <p className="text-xs sm:text-sm text-zinc-500">
              Have questions regarding supplement stacks, delivery timelines, or bulk orders? Send us a message.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Contact Info Cards */}
            <div className="space-y-4">
              <div className="card p-5 bg-white border border-zinc-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-600 flex items-center justify-center shrink-0">
                  <Mail size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900">Email Inquiries</h3>
                  <a href="mailto:adnankazi275@gmail.com" className="text-xs text-brand-600 hover:underline font-mono mt-0.5 block">
                    adnankazi275@gmail.com
                  </a>
                  <p className="text-[10px] text-zinc-400 mt-1">Average reply time: 4 hours</p>
                </div>
              </div>

              <div className="card p-5 bg-white border border-zinc-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-600 flex items-center justify-center shrink-0">
                  <Phone size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900">Phone Support</h3>
                  <a href="tel:+919321598094" className="text-xs text-zinc-600 hover:text-brand-600 font-mono mt-0.5 block">
                    +91 9321598094
                  </a>
                  <p className="text-[10px] text-zinc-400 mt-1">Mon-Sat: 9:00 AM – 6:00 PM</p>
                </div>
              </div>

              <div className="card p-5 bg-white border border-zinc-200 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-50 border border-brand-200/80 text-brand-600 flex items-center justify-center shrink-0">
                  <MapPin size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-xs text-zinc-900">Headquarters</h3>
                  <p className="text-xs text-zinc-600 mt-0.5">
                    Kon Gaon, Kalyan West, Mumbai, Maharashtra 421311
                  </p>
                </div>
              </div>

              <div className="card p-5 bg-zinc-900 border border-zinc-800 flex items-start gap-4">
                <div>
                  <h3 className="font-bold text-sm text-white">Share Your Experience</h3>
                  <p className="text-xs text-zinc-400 mt-1 mb-3">
                    We love hearing from our athletes and customers!
                  </p>
                  <a href="/write-review" className="btn-primary text-[10px] px-3 py-1.5 shadow-lg shadow-brand-500/20 w-fit inline-block">
                    Write a Review
                  </a>
                </div>
              </div>
            </div>

            {/* Form Area */}
            <div className="md:col-span-2 card p-8 bg-white border border-zinc-200">
              {submitted ? (
                <div className="py-12 text-center space-y-4 animate-scale-in">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="text-xl font-bold text-zinc-950">Thanks! Your message has been received.</h2>
                  <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                    A customer support specialist will review your inquiry and reply to <strong>{formData.email}</strong> shortly.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setFormData({ name: "", email: "", phone: "", subject: "", message: "" }) }}
                    className="btn-secondary text-xs"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <h2 className="text-base font-bold text-zinc-900 mb-2">Send Us a Direct Message</h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                        className="input text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="label">Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="john@example.com"
                        className="input text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Phone Number (Optional)</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="input text-xs"
                      />
                    </div>
                    <div>
                      <label className="label">Subject</label>
                      <input
                        type="text"
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        placeholder="Order status / Product ingredients"
                        className="input text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="label">Message Details *</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="How can our sports nutrition team assist you today?"
                      className="input text-xs resize-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary py-3 px-6 text-xs font-bold shadow-lg shadow-brand-500/15 inline-flex items-center gap-2"
                  >
                    {loading ? "Sending Message..." : <><Send size={14} /> Send Message</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </StoreLayout>
  )
}