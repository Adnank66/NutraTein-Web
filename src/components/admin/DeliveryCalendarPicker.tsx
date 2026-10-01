"use client"

import { useState } from "react"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  RotateCcw,
  Check,
  Download,
  FileText,
  Printer,
  Truck,
  Zap,
} from "lucide-react"
import { toast } from "sonner"

interface DeliveryCalendarPickerProps {
  selectedDate: string // YYYY-MM-DD
  selectedTime: string // e.g. "2:00 PM - 5:00 PM"
  onDateChange: (dateStr: string) => void
  onTimeChange: (timeStr: string) => void
  onClearOverride?: () => void
  autoEstimateDate?: string
  autoEstimateZone?: string
  orderNumber?: string
  customerName?: string
  address?: string
  courierPartner?: string
  trackingNumber?: string
}

const TIME_PRESETS = [
  { label: "Morning Slot", time: "9:00 AM - 1:00 PM", icon: "🌅", tag: "Fast Metro" },
  { label: "Afternoon Slot", time: "1:00 PM - 5:00 PM", icon: "☀️", tag: "Business Hours" },
  { label: "Evening Slot", time: "5:00 PM - 9:00 PM", icon: "🌆", tag: "Residential" },
  { label: "Express Full Day", time: "9:00 AM - 8:00 PM", icon: "⚡", tag: "All Day Flex" },
]

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]

export default function DeliveryCalendarPicker({
  selectedDate,
  selectedTime,
  onDateChange,
  onTimeChange,
  onClearOverride,
  autoEstimateDate,
  autoEstimateZone,
  orderNumber = "ORD-DISPATCH",
  customerName = "Customer",
  address = "Store Delivery Address",
  courierPartner = "Express Courier Partner",
  trackingNumber = "AWB-PENDING",
}: DeliveryCalendarPickerProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Current calendar view month/year
  const initialView = selectedDate ? new Date(selectedDate) : new Date()
  const [viewYear, setViewYear] = useState(initialView.getFullYear())
  const [viewMonth, setViewMonth] = useState(initialView.getMonth())
  const [customTimeInput, setCustomTimeInput] = useState(selectedTime || "")

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear(viewYear - 1)
    } else {
      setViewMonth(viewMonth - 1)
    }
  }

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear(viewYear + 1)
    } else {
      setViewMonth(viewMonth + 1)
    }
  }

  const goToToday = () => {
    setViewYear(today.getFullYear())
    setViewMonth(today.getMonth())
  }

  // Generate calendar days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1)
  let startDay = firstDayOfMonth.getDay() - 1
  if (startDay === -1) startDay = 6 // Sunday is 6

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const days = []
  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
  }

  const formatYMD = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, "0")
    const dd = String(day).padStart(2, "0")
    return `${year}-${mm}-${dd}`
  }

  const setRelativeDay = (offsetDays: number) => {
    const target = new Date()
    target.setDate(target.getDate() + offsetDays)
    const ymd = formatYMD(target.getFullYear(), target.getMonth(), target.getDate())
    onDateChange(ymd)
    setViewYear(target.getFullYear())
    setViewMonth(target.getMonth())
  }

  const setNextMonday = () => {
    const target = new Date()
    const day = target.getDay()
    const diff = (8 - day) % 7 || 7
    target.setDate(target.getDate() + diff)
    const ymd = formatYMD(target.getFullYear(), target.getMonth(), target.getDate())
    onDateChange(ymd)
    setViewYear(target.getFullYear())
    setViewMonth(target.getMonth())
  }

  // Friendly display of selected date
  const friendlySelected = selectedDate
    ? new Date(selectedDate).toLocaleDateString("en-IN", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null

  // 1. Download official Dispatch Pass / Delivery Slip
  const handleDownloadDispatchPass = () => {
    const scheduleDate = selectedDate || autoEstimateDate || "Immediate Dispatch"
    const scheduleTime = selectedTime || "Standard Delivery Hours (9 AM - 7 PM)"
    
    const manifestContent = `================================================================
          NUTRATEIN / PROTEINX LOGISTICS DISPATCH MANIFEST
================================================================
Generated On        : ${new Date().toLocaleString("en-IN")}
Order Number        : ${orderNumber}
Recipient           : ${customerName}
Delivery Address    : ${address}
Scheduled Dispatch  : ${scheduleDate}
Delivery Time Slot  : ${scheduleTime}
Assigned Courier    : ${courierPartner}
Tracking / AWB #    : ${trackingNumber}
Logistics Tier      : ${autoEstimateZone || "Express Priority"}
Tamper Proof Seal   : VERIFIED (ISO-9001 Batch Tested)
================================================================
SPECIAL DELIVERY INSTRUCTIONS FOR COURIER AGENT:
1. Handle with care. Nutrition and health supplements.
2. Confirm OTP or customer signature at consignee doorstep.
3. In case of unavailable consignee, re-attempt in next time slot.
================================================================
Authorized by PROTEINX Logistics & Fulfillment Center, Mumbai India
`
    const blob = new Blob([manifestContent], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Dispatch_Manifest_${orderNumber}_${selectedDate || "schedule"}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Dispatch Manifest downloaded successfully! 📄", {
      description: `Delivery pass saved for Order ${orderNumber}`,
    })
  }

  // 2. Download Calendar Event (.ics format for Google / Outlook / Apple Calendar)
  const handleDownloadCalendarEvent = () => {
    if (!selectedDate) {
      toast.error("Please select a date first to export calendar schedule.")
      return
    }

    const cleanDate = selectedDate.replace(/-/g, "")
    const startDate = `${cleanDate}T090000`
    const endDate = `${cleanDate}T180000`

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PROTEINX//Delivery Schedule//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${orderNumber}-${Date.now()}@proteinx.in
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate}
DTEND:${endDate}
SUMMARY:📦 Delivery Scheduled: ${orderNumber} (${customerName})
DESCRIPTION:Order ${orderNumber} scheduled for delivery.\\nSlot: ${selectedTime || "All Day"}\\nCourier: ${courierPartner}\\nAWB: ${trackingNumber}\\nAddress: ${address}
LOCATION:${address}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `Delivery_${orderNumber}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Delivery calendar invite (.ics) downloaded! 📅")
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 p-4 sm:p-5 space-y-4 shadow-sm transition-colors">
      {/* Top Banner / Selection Display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center gap-1 bg-brand-50 dark:bg-brand-950/60 px-2 py-0.5 rounded-full border border-brand-200 dark:border-brand-800/80">
              <CalendarIcon size={11} /> Interactive Delivery Control Calendar
            </span>
            <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
              Live Dispatch Sync
            </span>
          </div>
          <p className="text-sm font-black text-zinc-900 dark:text-white mt-1.5">
            {friendlySelected ? (
              <span className="text-brand-600 dark:text-brand-400 flex items-center gap-1.5">
                <span>{friendlySelected}</span>
                {selectedTime && <span className="text-zinc-600 dark:text-zinc-300 font-bold">• {selectedTime}</span>}
              </span>
            ) : (
              <span className="text-zinc-400 font-semibold text-xs">Pick a target dispatch day below to lock delivery schedule</span>
            )}
          </p>
        </div>

        {/* Action Buttons: Clear & Quick Downloads */}
        <div className="flex items-center gap-2 flex-wrap">
          {selectedDate && onClearOverride && (
            <button
              type="button"
              onClick={onClearOverride}
              className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Reset manual date override back to AI estimate"
            >
              <RotateCcw size={11} /> Reset
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadDispatchPass}
            className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:text-brand-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-zinc-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
            title="Download printable dispatch slip / courier pass for this order"
          >
            <Download size={12} className="text-brand-600 dark:text-brand-400" />
            <span>Download Slip</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadCalendarEvent}
            className="text-[11px] font-bold text-zinc-700 dark:text-zinc-200 hover:text-brand-600 bg-zinc-50 dark:bg-zinc-800 hover:bg-brand-50 dark:hover:bg-zinc-700 flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 transition-colors shadow-xs"
            title="Export calendar event (.ics) for Google / Outlook Calendar"
          >
            <CalendarIcon size={12} className="text-emerald-600 dark:text-emerald-400" />
            <span>Add to Cal</span>
          </button>
        </div>
      </div>

      {/* Auto-estimate Logistics Insights Banner */}
      {autoEstimateDate && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-orange-50/80 via-amber-50/50 to-zinc-50 dark:from-zinc-800/80 dark:via-zinc-800/50 dark:to-zinc-900 border border-orange-200/80 dark:border-zinc-700/80 text-[11px] flex flex-wrap items-center justify-between gap-2 text-zinc-700 dark:text-zinc-300">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0">
              <Truck size={13} />
            </div>
            <span>
              Pincode Transit Estimate: <strong className="text-brand-600 dark:text-brand-400 font-bold">{autoEstimateDate}</strong>
            </span>
          </div>
          {autoEstimateZone && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600">
              {autoEstimateZone}
            </span>
          )}
        </div>
      )}

      {/* Fast Delivery Quick-Select Chips */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Sparkles size={11} className="text-amber-500" /> 1-Click Dispatch Shortcuts:
          </p>
          <button
            type="button"
            onClick={goToToday}
            className="text-[10px] font-bold text-brand-600 dark:text-brand-400 hover:underline"
          >
            Jump to Current Month
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setRelativeDay(0)}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            ⚡ Today
          </button>
          <button
            type="button"
            onClick={() => setRelativeDay(1)}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            🚀 Tomorrow (+1d)
          </button>
          <button
            type="button"
            onClick={() => setRelativeDay(2)}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            In 2 Days
          </button>
          <button
            type="button"
            onClick={() => setRelativeDay(3)}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            In 3 Days
          </button>
          <button
            type="button"
            onClick={() => setRelativeDay(5)}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            In 5 Days
          </button>
          <button
            type="button"
            onClick={setNextMonday}
            className="text-[11px] font-bold py-1.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 hover:bg-brand-50 hover:border-brand-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-all active:scale-95 shadow-xs"
          >
            📅 Next Monday
          </button>
        </div>
      </div>

      {/* Modern Calendar Shell */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50/50 dark:bg-zinc-800/40 p-3 sm:p-4 space-y-3">
        {/* Month Navigation Header */}
        <div className="p-2 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-between shadow-xs">
          <button
            type="button"
            onClick={prevMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Previous Month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="text-center">
            <span className="font-black text-sm text-zinc-900 dark:text-white">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
          </div>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
            title="Next Month"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Days of Week Grid Header */}
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((wd, i) => (
            <div
              key={wd}
              className={`text-[10px] font-black uppercase py-1 ${
                i === 5
                  ? "text-amber-600 dark:text-amber-400"
                  : i === 6
                  ? "text-rose-500 dark:text-rose-400"
                  : "text-zinc-400 dark:text-zinc-500"
              }`}
            >
              {wd}
            </div>
          ))}

          {/* Calendar Day Cells */}
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-9" />
            }

            const dayDate = new Date(viewYear, viewMonth, day)
            dayDate.setHours(0, 0, 0, 0)
            const ymd = formatYMD(viewYear, viewMonth, day)
            const isSelected = selectedDate === ymd
            const isToday = dayDate.getTime() === today.getTime()
            const isPast = dayDate.getTime() < today.getTime()
            const isSunday = dayDate.getDay() === 0
            const isSaturday = dayDate.getDay() === 6

            return (
              <button
                key={`day-${day}`}
                type="button"
                disabled={isPast}
                onClick={() => onDateChange(ymd)}
                className={`h-9 rounded-xl text-xs font-bold transition-all relative flex flex-col items-center justify-center ${
                  isSelected
                    ? "bg-gradient-to-br from-brand-600 to-amber-600 text-white shadow-md shadow-brand-500/30 scale-105 z-10 font-black"
                    : isPast
                    ? "text-zinc-300 dark:text-zinc-600 cursor-not-allowed opacity-50"
                    : isToday
                    ? "border-2 border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-950/40 hover:bg-brand-100"
                    : isSunday
                    ? "text-rose-600 dark:text-rose-400 hover:bg-white dark:hover:bg-zinc-700 bg-rose-50/30 dark:bg-rose-950/20"
                    : isSaturday
                    ? "text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-zinc-700 bg-amber-50/30 dark:bg-amber-950/20"
                    : "text-zinc-800 dark:text-zinc-200 hover:bg-white dark:hover:bg-zinc-700 bg-white/60 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800"
                }`}
              >
                <span>{day}</span>
                {isToday && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-500 absolute bottom-0.5" />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Delivery Time Window Selector */}
      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
            <Clock size={11} className="text-brand-600" /> Select Customer Delivery Time Window:
          </p>
          <span className="text-[10px] font-medium text-zinc-400">Guaranteed Dispatch Slot</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {TIME_PRESETS.map((slot) => {
            const isChosen = selectedTime === slot.time
            return (
              <button
                key={slot.label}
                type="button"
                onClick={() => {
                  onTimeChange(slot.time)
                  setCustomTimeInput(slot.time)
                }}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  isChosen
                    ? "bg-brand-50/80 dark:bg-brand-950/50 border-brand-500 text-brand-700 dark:text-brand-300 shadow-sm ring-1 ring-brand-500"
                    : "bg-zinc-50/80 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 hover:bg-white dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold flex items-center gap-1.5">
                    <span>{slot.icon}</span>
                    <span className="text-zinc-900 dark:text-white">{slot.label}</span>
                  </span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    {slot.tag}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs font-black text-zinc-800 dark:text-zinc-200">{slot.time}</p>
                  {isChosen && <Check size={14} className="text-brand-600 dark:text-brand-400" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Custom Time Window Entry */}
        <div className="pt-1">
          <label className="block text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mb-1">
            Or Custom Scheduled Window:
          </label>
          <input
            type="text"
            placeholder="e.g. 2:30 PM - 4:00 PM, Priority Morning 10:30 AM..."
            value={customTimeInput}
            onChange={(e) => {
              setCustomTimeInput(e.target.value)
              onTimeChange(e.target.value)
            }}
            className="w-full px-3.5 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-xs text-zinc-900 dark:text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 font-medium"
          />
        </div>
      </div>
    </div>
  )
}
