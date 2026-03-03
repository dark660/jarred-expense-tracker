import { parseTransaction } from './parser';

const testCases = [
    // Standard SMS format
    "Txn: ₹450.00 spent on Zomato at 12:44 PM. Ref: 123456. Avl Bal: ₹10,230.",

    // Messy UPI string
    "UPI/DR/8932478/Swiggy/swiggy@hsbc/Oid123123. Avl Bal 5000",

    // P2P Transfer
    "Sent ₹2000 to rahul@okicici for rent",

    // Subscription / NACH
    "NACH/Netflix/1234567/499.00/DR",

    // Income / Credit
    "Your a/c no. XXXXXX1234 is credited by INR 50,000.00 on 01/03/26 by employer Salary"
];

async function runTests() {
    console.log("🚀 Starting parser tests...");

    if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
        console.warn('⚠️ No Gemini API key found. Tests will run using offline parser fallback.');
    }

    for (const txn of testCases) {
        console.log(`\n======================================`);
        console.log(`Input: "${txn}"\n`);
        try {
            const result = await parseTransaction(txn);
            console.log("Output:");
            console.log(JSON.stringify(result, null, 2));
        } catch (e) {
            console.error("Test Failed:", e);
        }
    }
}

runTests();
