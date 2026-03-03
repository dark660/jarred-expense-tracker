import { GoogleGenAI, Type } from '@google/genai';
import type { Schema } from '@google/genai';

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
4. Output strict JSON matching this exact shape:
{
  "merchantName": string,
  "category": string,
  "amount": number,
  "currency": string,
  "txnType": "DEBIT" | "CREDIT",
  "date": string | null,
  "confidenceScore": number,
  "isSubscription": boolean
}
`;

type ParsedTransaction = {
    merchantName: string;
    category: string;
    amount: number;
    currency: string;
    txnType: 'DEBIT' | 'CREDIT';
    date: string | null;
    confidenceScore: number;
    isSubscription: boolean;
};

function titleCase(value: string) {
    return value
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function detectMerchant(raw: string): string {
    const lower = raw.toLowerCase();

    if (lower.includes('salary') || lower.includes('credited')) return 'Bank Credit';

    const toMatch = [
        /(?:spent on|paid to|payment to|to)\s+([a-z0-9@._/-]+)/i,
        /upi\/dr\/[^/]+\/([^/]+)/i,
        /nach\/([^/]+)/i,
        /at\s+([a-z0-9& ._-]+)/i,
        /by\s+([a-z0-9& ._-]+)/i,
    ];

    for (const pattern of toMatch) {
        const match = raw.match(pattern);
        if (match?.[1]) {
            const cleaned = match[1]
                .replace(/@.*/g, '')
                .replace(/[^a-zA-Z0-9\s&.-]/g, ' ')
                .trim();
            if (cleaned) return titleCase(cleaned);
        }
    }

    return 'Unknown Merchant';
}

function detectAmount(raw: string): number {
    const normalized = raw.replace(/,/g, '');

    const currencyMatch = normalized.match(/(?:₹|inr\s*)(\d+(?:\.\d+)?)/i);
    if (currencyMatch?.[1]) return Number(currencyMatch[1]);

    const decimalMatches = [...normalized.matchAll(/(\d+\.\d{1,2})/g)].map((m) => Number(m[1]));
    if (decimalMatches.length > 0) return decimalMatches[decimalMatches.length - 1];

    const allNumbers = [...normalized.matchAll(/\b(\d{2,})\b/g)]
        .map((m) => Number(m[1]))
        .filter((n) => n < 1000000);

    if (allNumbers.length > 0) return allNumbers[allNumbers.length - 1];

    return 0;
}

function detectTxnType(raw: string): 'DEBIT' | 'CREDIT' {
    const lower = raw.toLowerCase();
    if (/(credited|received|deposit|salary)/.test(lower)) return 'CREDIT';
    return 'DEBIT';
}

function detectDate(raw: string): string | null {
    const match = raw.match(/(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
    if (!match) return null;

    const day = Number(match[1]);
    const month = Number(match[2]) - 1;
    let year = Number(match[3]);
    if (year < 100) year += 2000;

    const parsed = new Date(Date.UTC(year, month, day));
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function detectSubscription(raw: string): boolean {
    return /(nach|autopay|subscription|emi|sip|netflix|spotify|prime)/i.test(raw);
}

function detectCategory(raw: string, merchant: string, txnType: 'DEBIT' | 'CREDIT', isSubscription: boolean): string {
    const lower = `${raw} ${merchant}`.toLowerCase();

    if (txnType === 'CREDIT') return 'Income';
    if (isSubscription) return 'Subscriptions';
    if (/(upi|transfer|sent|rent|friend|p2p)/.test(lower)) return 'Transfers';
    if (/(zomato|swiggy|food|restaurant|cafe)/.test(lower)) return 'Food & Dining';
    if (/(uber|ola|metro|fuel|petrol|transport|travel)/.test(lower)) return 'Transportation';
    if (/(grocery|mart|supermarket|dmart|bigbasket|blinkit|zepto)/.test(lower)) return 'Groceries';
    if (/(electricity|water|gas|bill|utility|recharge|broadband|wifi)/.test(lower)) return 'Utilities';
    if (/(amazon|flipkart|myntra|shopping)/.test(lower)) return 'Shopping';

    return 'Unknown';
}

function parseTransactionOffline(rawString: string): ParsedTransaction {
    const merchantName = detectMerchant(rawString);
    const amount = detectAmount(rawString);
    const txnType = detectTxnType(rawString);
    const date = detectDate(rawString);
    const isSubscription = detectSubscription(rawString);
    const category = detectCategory(rawString, merchantName, txnType, isSubscription);

    return {
        merchantName,
        category,
        amount,
        currency: 'INR',
        txnType,
        date,
        confidenceScore: 0.65,
        isSubscription,
    };
}

async function parseWithGemini(rawString: string, apiKey: string) {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash',
        contents: `Parse this transaction: "${rawString}"`,
        config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: transactionSchema,
            temperature: 0.1,
        }
    });

    if (!response.text) {
        throw new Error('Received empty response from Gemini.');
    }

    return JSON.parse(response.text);
}

async function parseWithOpenRouter(rawString: string, apiKey: string) {
    const model = process.env.OPENROUTER_MODEL || 'openrouter/auto';

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            ...(process.env.OPENROUTER_APP_NAME ? { 'X-Title': process.env.OPENROUTER_APP_NAME } : {}),
        },
        body: JSON.stringify({
            model,
            temperature: 0.1,
            messages: [
                { role: 'system', content: SYSTEM_INSTRUCTION },
                { role: 'user', content: `Parse this transaction and respond with strict JSON only: "${rawString}"` },
            ],
        }),
    });

    if (!response.ok) {
        throw new Error(`OpenRouter request failed: ${response.status} ${response.statusText}`);
    }

    const payload: any = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (!content || typeof content !== 'string') {
        throw new Error('OpenRouter returned empty content.');
    }

    // Accept pure JSON or JSON wrapped in markdown fences.
    const jsonCandidate = content.includes('{')
        ? content.slice(content.indexOf('{'), content.lastIndexOf('}') + 1)
        : content;

    return JSON.parse(jsonCandidate);
}

/**
 * Parses a raw transaction string into structured JSON.
 * Provider order: Gemini -> OpenRouter -> local heuristic fallback.
 */
export async function parseTransaction(rawString: string) {
    const geminiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    if (geminiKey) {
        try {
            return await parseWithGemini(rawString, geminiKey);
        } catch (error) {
            console.warn('⚠️ Gemini parsing failed. Falling back to next provider.', error);
        }
    }

    if (openRouterKey) {
        try {
            return await parseWithOpenRouter(rawString, openRouterKey);
        } catch (error) {
            console.warn('⚠️ OpenRouter parsing failed. Falling back to offline parser.', error);
        }
    }

    console.warn('⚠️ No AI provider key found. Falling back to offline parser.');
    return parseTransactionOffline(rawString);
}
