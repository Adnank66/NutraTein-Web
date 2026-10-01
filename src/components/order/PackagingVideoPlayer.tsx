"use client"

import { useState } from "react"
import { Package, Share2, Check, Download, Video, ExternalLink } from "lucide-react"
import { toast } from "sonner"

interface PackagingVideoPlayerProps {
  videoUrl: string
  orderNumber: string
}

export default function PackagingVideoPlayer({ videoUrl, orderNumber }: PackagingVideoPlayerProps) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const fullUrl = videoUrl.startsWith("http") ? videoUrl : `${window.location.origin}${videoUrl}`
    const shareData = {
      title: `Nutratein Order #${orderNumber} Packaging Video`,
      text: `Watch how my Nutratein parcel for order #${orderNumber} was packed with 100% authentic quality check!`,
      url: fullUrl,
    }

    if (navigator.share) {
      try {
        await navigator.share(shareData)
        toast.success("Packaging video shared!")
        return
      } catch (err) {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(fullUrl)
      setCopied(true)
      toast.success("Video link copied to clipboard! You can paste and share it anywhere.")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.info(`Video link: ${fullUrl}`)
    }
  }

  const handleWhatsAppShare = () => {
    const fullUrl = videoUrl.startsWith("http") ? videoUrl : `${window.location.origin}${videoUrl}`
    const text = encodeURIComponent(
      `Watch how my Nutratein parcel (Order #${orderNumber}) was packed:\n${fullUrl}`
    )
    window.open(`https://api.whatsapp.com/send?text=${text}`, "_blank")
  }

  return (
    <div className="p-4 sm:p-6 rounded-2xl bg-gradient-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-900 dark:via-zinc-900/90 dark:to-zinc-950 border border-zinc-200/90 dark:border-zinc-800 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800/80">
        <div>
          <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <span className="p-1 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Package size={16} />
            </span>
            Watch Your Order Being Packed
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Verified recording of your parcel during dispatch and seal inspection.
          </p>
        </div>

        <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 w-fit">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Verified Packaging
        </span>
      </div>

      {/* Video Container */}
      <div className="rounded-2xl overflow-hidden bg-black aspect-video relative max-w-lg mx-auto shadow-xl border border-zinc-800">
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full h-full object-contain"
        />
      </div>

      {/* Sharing & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          {/* Native / Copy Share */}
          <button
            type="button"
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-brand-600 hover:bg-brand-700 text-white shadow-sm transition-colors cursor-pointer active:scale-95"
          >
            {copied ? <Check size={14} /> : <Share2 size={14} />}
            <span>{copied ? "Link Copied!" : "Share Video"}</span>
          </button>

          {/* WhatsApp Share */}
          <button
            type="button"
            onClick={handleWhatsAppShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-[#25D366] hover:bg-[#20ba59] text-white shadow-sm transition-colors cursor-pointer active:scale-95"
            title="Share via WhatsApp"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.886-9.888 9.886m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>WhatsApp</span>
          </button>

          {/* Download to Gallery / Files */}
          <a
            href={videoUrl}
            download={`packaging_order_${orderNumber}.mp4`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <Download size={13} />
            <span>Save to Files</span>
          </a>
        </div>

        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
        >
          <span>Open Fullscreen</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  )
}
