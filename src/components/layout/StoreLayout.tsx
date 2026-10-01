import AnnouncementBar from "./AnnouncementBar"
import Header from "./Header"
import Footer from "./Footer"
import AiWhatsAppChatWidget from "@/components/chat/AiWhatsAppChatWidget"
import FloatingCompareBar from "@/components/product/FloatingCompareBar"
import ScrollToTop from "./ScrollToTop"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <ScrollToTop />
      <AnnouncementBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <FloatingCompareBar />
      <AiWhatsAppChatWidget />
    </div>
  )
}
