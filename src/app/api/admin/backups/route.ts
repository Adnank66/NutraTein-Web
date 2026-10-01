import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { withFastTimeout } from "@/lib/fast-data"
import { getBackupOrders } from "@/lib/orders-store"

export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session || (session.user as any)?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "full" // "full" | "products" | "orders"
    const format = (searchParams.get("format") || "json").toLowerCase() // "json" | "text" | "pdf"

    let products: any[] = []
    let orders: any[] = []
    let coupons: any[] = []

    try {
      const results = await withFastTimeout(
        Promise.all([
          prisma.product.findMany({ include: { variants: true, images: true, category: true } }),
          prisma.order.findMany({
            include: {
              items: true,
              address: true,
              payment: true,
              user: { select: { name: true, email: true, phone: true } },
            },
            orderBy: { createdAt: "desc" },
          }),
          prisma.coupon.findMany(),
        ]),
        null,
        3500
      )
      if (results) {
        products = results[0]
        orders = results[1]
        coupons = results[2]
      }
    } catch (err) {
      console.warn("Backup query notice:", err)
    }

    const backupOrders = getBackupOrders()
    const allOrdersMap = new Map<string, any>()
    for (const o of orders) allOrdersMap.set(o.orderNumber, o)
    for (const b of backupOrders) {
      if (!allOrdersMap.has(b.orderNumber)) allOrdersMap.set(b.orderNumber, b)
    }
    const mergedOrders = Array.from(allOrdersMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )

    const dateStr = new Date().toISOString().split("T")[0]

    // ─────────────────────────────────────────────────────────────────────────
    // 1. FORMAT: TEXT / TXT
    // ─────────────────────────────────────────────────────────────────────────
    if (format === "text" || format === "txt") {
      let textOutput = `================================================================================\n`
      textOutput += `                 PROTEINX NUTRITION - OFFICIAL STORE DATA EXPORT\n`
      textOutput += `================================================================================\n`
      textOutput += `Generated on  : ${new Date().toLocaleString("en-IN")}\n`
      textOutput += `Export Scope  : ${type.toUpperCase()}\n`
      textOutput += `Store Domain  : http://localhost:3000\n`
      textOutput += `Total Products: ${products.length} items\n`
      textOutput += `Total Orders  : ${mergedOrders.length} transactions\n`
      textOutput += `================================================================================\n\n`

      if (type === "products" || type === "full") {
        textOutput += `--- PRODUCT CATALOG (${products.length} PRODUCTS) -------------------------------\n\n`
        products.forEach((p, idx) => {
          textOutput += `[${idx + 1}] ${p.name.toUpperCase()}\n`
          textOutput += `    Brand       : ${p.brand || "PROTEINX"}\n`
          textOutput += `    Category    : ${p.category?.name || "General"}\n`
          textOutput += `    Base Price  : Rs. ${p.basePrice} (MRP: Rs. ${p.mrp})\n`
          textOutput += `    Rating      : ${p.rating} / 5.0 (${p.reviewCount} reviews)\n`
          textOutput += `    Status      : ${p.isActive ? "Active / In Stock" : "Inactive"}\n`
          if (p.variants && p.variants.length > 0) {
            textOutput += `    Variants    :\n`
            p.variants.forEach((v: any) => {
              textOutput += `      - SKU: ${v.sku} | ${v.size || "Standard"} | ${v.flavor || "Default"} | Rs. ${v.price} | Stock: ${v.stock}\n`
            })
          }
          textOutput += `\n`
        })
      }

      if (type === "orders" || type === "full") {
        textOutput += `--- ORDER TRANSACTIONS (${mergedOrders.length} ORDERS) -----------------------------\n\n`
        mergedOrders.forEach((o, idx) => {
          const custName = o.user?.name || o.address?.name || o.customer?.name || "Customer"
          const custEmail = o.user?.email || o.customer?.email || "N/A"
          const custPhone = o.user?.phone || o.address?.phone || o.customer?.phone || "N/A"
          const city = o.address?.city ? `${o.address.city}, ${o.address.state || ""}` : "India"

          textOutput += `[${idx + 1}] ORDER #${o.orderNumber} | Date: ${new Date(o.createdAt).toLocaleDateString("en-IN")}\n`
          textOutput += `    Customer    : ${custName} (${custEmail}, Phone: ${custPhone})\n`
          textOutput += `    Destination : ${city} (PIN: ${o.address?.pincode || "N/A"})\n`
          textOutput += `    Amount      : Rs. ${o.totalAmount} (${o.paymentMethod} - ${o.paymentStatus})\n`
          textOutput += `    Delivery    : Status: ${o.deliveryStatus || o.status || "ORDER_PLACED"}\n`
          if (o.courierPartner || o.trackingNumber) {
            textOutput += `    Courier     : ${o.courierPartner || "Carrier"} | AWB: ${o.trackingNumber || "N/A"}\n`
          }
          if (o.items && o.items.length > 0) {
            textOutput += `    Items       :\n`
            o.items.forEach((it: any) => {
              textOutput += `      * ${it.quantity}x ${it.productName} ${it.size ? `(${it.size})` : ""} - Rs. ${it.price * it.quantity}\n`
            })
          }
          textOutput += `\n`
        })
      }

      if (type === "full" && coupons.length > 0) {
        textOutput += `--- DISCOUNT COUPONS (${coupons.length} COUPONS) --------------------------------\n\n`
        coupons.forEach((c) => {
          textOutput += `  - Code: ${c.code} | Discount: ${c.discountValue}${c.discountType === "PERCENT" ? "%" : " Rs"} | Status: ${c.isActive ? "Active" : "Disabled"}\n`
        })
        textOutput += `\n`
      }

      return new Response(textOutput, {
        status: 200,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Content-Disposition": `attachment; filename="proteinx_${type}_catalog_${dateStr}.txt"`,
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. FORMAT: PDF (Print-Ready Document with Auto-Print & Save as PDF)
    // ─────────────────────────────────────────────────────────────────────────
    if (format === "pdf") {
      const title =
        type === "products"
          ? "PRODUCT CATALOG & FORMULATION SPECIFICATIONS"
          : type === "orders"
          ? "CUSTOMER ORDERS & DISPATCH LOGS REPORT"
          : "COMPREHENSIVE STORE BACKUP & INVENTORY REPORT"

      let tableRows = ""

      if (type === "products" || type === "full") {
        tableRows += `
          <h2 style="font-size: 16px; margin: 24px 0 8px; color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">
            Product Catalog (${products.length} Products)
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
            <thead>
              <tr style="background-color: #f4f4f5; text-align: left;">
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Product Name</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Category</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Price</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">MRP</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Variants & Stock</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Status</th>
              </tr>
            </thead>
            <tbody>
              ${products
                .map(
                  (p) => `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold;">${p.name}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7;">${p.category?.name || "General"}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold; color: #ea580c;">₹${p.basePrice}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; text-decoration: line-through; color: #71717a;">₹${p.mrp}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7;">
                    ${(p.variants || [])
                      .map((v: any) => `${v.size || ""} ${v.flavor ? `[${v.flavor}]` : ""}: Stock ${v.stock}`)
                      .join("<br/>") || "1 in stock"}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; color: ${p.isActive ? "#16a34a" : "#dc2626"}; font-weight: bold;">
                    ${p.isActive ? "ACTIVE" : "INACTIVE"}
                  </td>
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
        `
      }

      if (type === "orders" || type === "full") {
        const totalSales = mergedOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0)
        tableRows += `
          <h2 style="font-size: 16px; margin: 24px 0 8px; color: #ea580c; border-bottom: 2px solid #ea580c; padding-bottom: 4px;">
            Order Transactions (${mergedOrders.length} Orders — Total Value: ₹${totalSales.toLocaleString("en-IN")})
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 11px;">
            <thead>
              <tr style="background-color: #f4f4f5; text-align: left;">
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Order Ref</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Date</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Customer & Destination</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Items</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Total</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Delivery Status</th>
                <th style="padding: 8px; border: 1px solid #e4e4e7;">Tracking AWB</th>
              </tr>
            </thead>
            <tbody>
              ${mergedOrders
                .map((o) => {
                  const custName = o.user?.name || o.address?.name || o.customer?.name || "Customer"
                  const city = o.address?.city || "India"
                  const itemsSummary = (o.items || []).map((it: any) => `${it.quantity}x ${it.productName}`).join(", ")
                  return `
                <tr>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-family: monospace; font-weight: bold;">${o.orderNumber}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7;">${new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7;"><strong>${custName}</strong><br/><span style="color: #71717a; font-size: 10px;">${city} (${o.address?.pincode || ""})</span></td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; max-width: 180px;">${itemsSummary || "Supplements"}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold;">₹${o.totalAmount}</td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-weight: bold; color: ${o.deliveryStatus === "DELIVERED" ? "#16a34a" : "#2563eb"};">
                    ${(o.deliveryStatus || o.status || "ORDER_PLACED").replace(/_/g, " ")}
                  </td>
                  <td style="padding: 8px; border: 1px solid #e4e4e7; font-family: monospace; font-size: 10px;">
                    ${o.trackingNumber ? `<strong>${o.courierPartner || "Carrier"}</strong><br/>${o.trackingNumber}` : '<span style="color: #a1a1aa;">Not assigned</span>'}
                  </td>
                </tr>`
                })
                .join("")}
            </tbody>
          </table>
        `
      }

      const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>PROTEINX — ${title}</title>
  <style>
    @media print {
      body { margin: 0; padding: 15mm; }
      .no-print { display: none !important; }
      @page { size: A4 landscape; margin: 10mm; }
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 20px auto;
      max-width: 1000px;
      color: #18181b;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="no-print" style="background-color: #09090b; color: #fff; padding: 12px 20px; border-radius: 12px; margin-bottom: 20px; display: flex; align-items: center; justify-content: space-between;">
    <div>
      <strong style="color: #ea580c; font-size: 14px;">PROTEINX STORE PDF EXPORT</strong>
      <span style="color: #a1a1aa; font-size: 12px; margin-left: 10px;">Print or Save as PDF using your browser dialog</span>
    </div>
    <div style="display: flex; gap: 8px;">
      <button onclick="window.print()" style="background-color: #ea580c; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
        📥 Save as PDF / Print
      </button>
      <button onclick="window.close()" style="background-color: #27272a; color: #fff; border: none; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 12px; cursor: pointer;">
        Close Window
      </button>
    </div>
  </div>

  <div style="border-bottom: 3px solid #18181b; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end;">
    <div>
      <h1 style="font-size: 24px; font-weight: 900; margin: 0; color: #09090b; letter-spacing: -0.5px;">
        PROTEIN<span style="color: #ea580c;">X</span> FITNESS & NUTRITION
      </h1>
      <p style="margin: 3px 0 0; font-size: 12px; color: #52525b; font-weight: 600;">
        ${title}
      </p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #71717a;">
      <p style="margin: 0;">Date: <strong>${new Date().toLocaleDateString("en-IN", { dateStyle: "long" })}</strong></p>
      <p style="margin: 2px 0 0;">Store URL: <strong>http://localhost:3000</strong></p>
    </div>
  </div>

  ${tableRows}

  <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #e4e4e7; font-size: 10px; color: #71717a; display: flex; justify-content: space-between;">
    <span>PROTEINX E-Commerce Management System • Confidential & Proprietary</span>
    <span>Page 1 of 1</span>
  </div>

  <script>
    window.onload = function() {
      // Auto open print dialog if opened in new tab/window
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`

      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
        },
      })
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. FORMAT: JSON (Full Data Archive)
    // ─────────────────────────────────────────────────────────────────────────
    const snapshot = {
      backupTimestamp: new Date().toISOString(),
      store: "PROTEINX Nutrition Inc.",
      environment: process.env.NODE_ENV || "development",
      counts: {
        products: products.length,
        orders: mergedOrders.length,
        coupons: coupons.length,
      },
      data: {
        products: type === "orders" ? undefined : products,
        orders: type === "products" ? undefined : mergedOrders,
        coupons: type === "full" ? coupons : undefined,
      },
    }

    return new Response(JSON.stringify(snapshot, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="proteinx_backup_${type}_${dateStr}.json"`,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
