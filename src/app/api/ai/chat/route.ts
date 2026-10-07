import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getProducts, searchProducts, getProductById, getOrderStatus, getActiveCoupons, getLegalPage } from "@/lib/ai-tools"

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "")

const systemInstruction = `
You are the "NUTRATEIN AI Assistant", an expert customer support and supplement advisor for the NUTRATEIN e-commerce website.
Your main goals are to:
1. Help customers find products, understand ingredients, check prices, and track orders.
2. ALWAYS use the provided tools to fetch REAL, LIVE data from the NUTRATEIN database. Never invent prices, products, discounts, stock, or order details.
3. If a tool returns no data or an error, politely inform the user that the information is currently unavailable.
4. Keep your responses friendly, concise, and helpful. Use a professional tone.
5. If the user asks a question in Hindi or Marathi, respond in that language.
6. For product recommendations, briefly explain why the product fits their goal.
7. DO NOT provide medical diagnoses or claim supplements cure diseases.

Available Tools:
- searchProducts: Use this to find products by name, category, or goal (e.g., "whey", "creatine", "muscle gain").
- getProductById: Use this to get detailed info (ingredients, price, variants) for a specific product.
- getOrderStatus: Use this when a user asks about their order. You MUST pass their authenticated email and the order ID.
- getActiveCoupons: Use this to list currently active discount codes.

If the user wants to see products, you can return a JSON block at the end of your message with product IDs to trigger the UI to show product cards, like this:
PRODUCTS_TO_SHOW: [ "product-id-1", "product-id-2" ]
`

export async function POST(req: Request) {
  try {
    const session = await auth()
    const { messages, language } = await req.json()

    if (!process.env.GEMINI_API_KEY) {
      // Fallback if no API key is set
      return NextResponse.json({
        success: true,
        reply: "The NUTRATEIN AI Assistant is currently in setup mode. Please add your GEMINI_API_KEY to the environment variables to enable full AI capabilities.",
        products: [],
        suggestions: ["Add API Key"]
      })
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite",
      systemInstruction,
      tools: [
        {
          functionDeclarations: [
            {
              name: "searchProducts",
              description: "Search for products based on a query.",
              parameters: {
                type: "OBJECT",
                properties: { query: { type: "STRING" } },
                required: ["query"]
              }
            },
            {
              name: "getProductById",
              description: "Get detailed information about a specific product by its ID or slug.",
              parameters: {
                type: "OBJECT",
                properties: { idOrSlug: { type: "STRING" } },
                required: ["idOrSlug"]
              }
            },
            {
              name: "getOrderStatus",
              description: "Get the status of an order.",
              parameters: {
                type: "OBJECT",
                properties: { 
                  orderId: { type: "STRING", description: "The order ID provided by the user" } 
                },
                required: ["orderId"]
              }
            },
            {
              name: "getActiveCoupons",
              description: "Get a list of currently active coupons.",
              parameters: {
                type: "OBJECT",
                properties: {},
                required: []
              }
            },
            {
              name: "getLegalPage",
              description: "Get the content of a legal policy page (e.g. 'refund-policy', 'shipping-policy', 'terms').",
              parameters: {
                type: "OBJECT",
                properties: { slug: { type: "STRING" } },
                required: ["slug"]
              }
            }
          ]
        }
      ]
    })

    const chat = model.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }))
    })

    const userMessage = messages[messages.length - 1].text

    let result = await chat.sendMessage(userMessage)
    let functionCalls = result.response.functionCalls()

    // Handle tool calls automatically (simple 1-level deep)
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0]
      let functionResponse: any = {}

      if (call.name === "searchProducts") {
        functionResponse = await searchProducts((call.args as any).query)
      } else if (call.name === "getProductById") {
        functionResponse = await getProductById((call.args as any).idOrSlug)
      } else if (call.name === "getOrderStatus") {
        if (!session?.user?.email) {
          functionResponse = { error: "User is not authenticated. Please log in to check order status." }
        } else {
          functionResponse = await getOrderStatus((call.args as any).orderId, session.user.email)
        }
      } else if (call.name === "getActiveCoupons") {
        functionResponse = await getActiveCoupons()
      } else if (call.name === "getLegalPage") {
        functionResponse = await getLegalPage((call.args as any).slug)
      }

      result = await chat.sendMessage([{
        functionResponse: {
          name: call.name,
          response: Array.isArray(functionResponse) ? { result: functionResponse } : (functionResponse || {})
        }
      }])
    }

    let reply = result.response.text()
    let productsToDisplay: any[] = []

    // Extract products to show
    const productMatch = reply.match(/PRODUCTS_TO_SHOW:\s*\[(.*?)\]/)
    if (productMatch) {
      const ids = productMatch[1].split(",").map(id => id.replace(/["'\s]/g, "").trim()).filter(Boolean)
      reply = reply.replace(/PRODUCTS_TO_SHOW:\s*\[.*?\]/, "").trim()
      
      // Fetch full product info for UI
      for (const id of ids) {
        const p = await getProductById(id)
        if (p) {
          productsToDisplay.push({
            id: p.id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            mrp: p.mrp,
            discountPercent: p.discount || 0,
            rating: p.rating,
            reviewCount: p.reviewCount,
            image: p.image || (p.images?.[0]?.url),
            category: p.category,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      reply,
      products: productsToDisplay,
      suggestions: ["What's new?", "Track my order"]
    })

  } catch (err: any) {
    console.error("AI Chat Error:", err)
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process chat" },
      { status: 500 }
    )
  }
}
