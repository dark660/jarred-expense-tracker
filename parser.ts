import { GoogleGenAI, Type, Schema } from '@google/genai';

// We defer Gemini client initialization so Render servers don't crash on startup if the key isn't set yet.

// 1. Define the strict JSON Schema for Gemini to adhere to
const transactionSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        merchantName: {
            type: Type.STRING,
            description: "Clean, human-readable name of the merchant or recipient. Strip out VPA suffixes, 'UPI/DR/', and bank jargon. Capitalize properly."
        },
        category: {
            type: Type.STRING,
            description: "Categorize the transaction. Examples: Food & Dining, Groceries, Utilities, Subscriptions, Transfers, Transportation, Shopping, Income, Unknown."
        },
        amount: {
            type: Type.NUMBER,
            description: "The absolute transaction amount as a float."
        },
        currency: {
            type: Type.STRING,
            description: "The 3-letter currency code, usually INR."
        },
        txnType: {
            type: Type.STRING,
            enum: ["DEBIT", "CREDIT"],
            description: "Direction of cash flow."
        },
        date: {
            type: Type.STRING,
            description: "ISO8601 formatted date if present in text, or null if missing.",
            nullable: true
        },
        confidenceScore: {
            type: Type.NUMBER,
            description: "Float between 0.0 and 1.0 indicating how confident you are in this parsing and categorization."
        },
        isSubscription: {
            type: Type.BOOLEAN,
            description: "True ONLY if this looks like a recurring payment, EMI, SIP, mutual fund, Netflix/Spotify, NACH, or AutoPay."
        }
    },
    required: ["merchantName", "category", "amount", "currency", "txnType", "confidenceScore", "isSubscription"]
};

const SYSTEM_INSTRUCTION = `
You are a highly intelligent financial parsing engine optimized for Indian Banking data (SMS & PDFs).
Your job is to extract clean transaction data from messy strings.
CRITICAL RULES:
1. Normalize merchant names (e.g., 'UPI/DR/123/ZOMATO/okicici' -> 'Zomato').
2. Classify P2P UPI (e.g., sending money to a friend's VPA) as 'Transfers'.
3. Never include PII (Account numbers, full Phone numbers) in the \`merchantName\`.
4. Output strict JSON matching the provided schema.
`;

/**
 * Parses a raw transaction string into structured JSON.
 * @param rawString The raw bank SMS or PDF row
 */
export async function parseTransaction(rawString: string) {
    try {
        // Initialize AI client only when actually parsing.
        // It strictly requires GEMINI_API_KEY to be set in the environment variables (e.g. Render dashboard)
        const ai = new GoogleGenAI({});

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash',
            contents: `Parse this transaction: "${rawString}"`,
            config: {
                systemInstruction: SYSTEM_INSTRUCTION,
                responseMimeType: 'application/json',
                responseSchema: transactionSchema,
                temperature: 0.1, // Low temperature for deterministic, factual extraction
            }
        });

        if (!response.text) {
            throw new Error("Received empty response from Gemini.");
        }

        // The response is guaranteed to match our Schema
        const cleanedTxn = JSON.parse(response.text);
        return cleanedTxn;

    } catch (error) {
        console.error("❌ Transaction Parsing Failed:", error);
        throw error;
    }
}
