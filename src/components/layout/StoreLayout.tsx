import Header from "./Header"
import Footer from "./Footer"
import AiWhatsAppChatWidget from "@/components/chat/AiWhatsAppChatWidget"
import FloatingCompareBar from "@/components/product/FloatingCompareBar"
import ScrollToTop from "./ScrollToTop"

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden w-full">
      <ScrollToTop />
      <Header />
      <main className="flex-1 w-full overflow-x-hidden">{children}</main>
      <Footer />
      <FloatingCompareBar />
      <AiWhatsAppChatWidget />
    </div>
  )
}
