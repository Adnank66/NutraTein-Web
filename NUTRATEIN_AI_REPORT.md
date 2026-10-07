# NUTRATEIN AI Chatbot Integration Report

## 1. Files Changed
- **`src/app/api/ai/chat/route.ts`**: Replaced the static/mock chatbot with a powerful LLM-driven handler that supports tool-calling.
- **`src/components/chat/AiWhatsAppChatWidget.tsx`**: Updated the payload being sent to the backend. It now sends the full conversational history (`messages`) instead of just the last string, enabling conversation memory.
- **`src/lib/ai-tools.ts`**: Created this entirely new file to house the database tool functions used by the AI.

## 2. APIs/Tools Created
Created secure backend tool functions mapped to the existing database structure:
- `searchProducts(query)`: Uses Prisma to find products by name, tag, or benefit.
- `getProductById(idOrSlug)`: Retrieves detailed information (pricing, variants, images, approved reviews) for a specific product.
- `getOrderStatus(orderId, userEmail)`: Checks the status, tracking number, and items of a specific order (requires the user to be authenticated matching the order's email).
- `getActiveCoupons()`: Fetches coupons that are currently active and valid.
- `getLegalPage(slug)`: Retrieves shipping, returns, or privacy policy content dynamically.

## 3. Database Queries Added
The tools use `prisma` to query existing models safely:
- `prisma.product.findMany` (for search)
- `prisma.product.findFirst` (for exact lookup with relations)
- `prisma.order.findFirst` (strict `where` clause ensuring order ID and user email match)
- `prisma.coupon.findMany` (filtering out expired or inactive coupons)
- `prisma.legalPage.findUnique`

## 4. AI Model Integration
Integrated **Google Gemini 2.5 Flash** using the `@google/generative-ai` SDK.
- **System Instructions**: Pre-prompted the AI with a strict persona ("NUTRATEIN AI Assistant") and rules preventing hallucinations, fake prices, or fake delivery dates.
- **Function Calling**: The AI dynamically calls the backend tools above when a user asks a question, waits for the real database response, and formulates an answer based on facts.
- **Rich UI Cards**: The AI triggers the frontend to display rich product cards by appending a hidden `PRODUCTS_TO_SHOW: [...]` array, which the API parses and populates with actual database imagery and links.

## 5. Environment Variables Required
You must add the following variable to your `.env` file to activate the AI:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
```
*(If the key is missing, the chatbot gracefully returns a "Setup Mode" message instructing the user to configure the API key).*

## 6. How to Run Locally
1. Stop the current dev server if running.
2. Ensure you have run `npm install @google/generative-ai` (which I already executed).
3. Add the `GEMINI_API_KEY` to your `.env` file.
4. Run `npm run dev` to start the server locally.

## 7. How to Deploy with Vercel
1. Push your latest code changes to GitHub.
2. In your Vercel Dashboard, go to your project settings -> **Environment Variables**.
3. Add `GEMINI_API_KEY` and paste your key.
4. Trigger a new deployment. The Edge/Serverless functions will automatically pick up the new SDK and API route.

## 8. Remaining Limitations
- The AI currently executes one tool per turn. If a user asks "Compare my order #123 with order #124", it will only fetch one order per message.
- Stock availability logic is currently mocked to always be `true` in the tool until full inventory tracking fields are used in your Prisma schema.
- To fully support the "Protein Calculator" logic, a dedicated math/calculator tool should be added to `ai-tools.ts` later if you want the AI to calculate exact macros based on user weight.
