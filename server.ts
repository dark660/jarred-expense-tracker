import express from 'express';
import cors from 'cors';
import { parseTransaction } from './parser';
import { insertTransaction } from './db';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/parse', async (req, res) => {
    try {
        const { rawText, userId = 'cug-user-1' } = req.body;

        if (!rawText) {
            return res.status(400).json({ success: false, error: 'rawText is required' });
        }

        console.log(`\n📥 Received raw text for parsing from user: ${userId}`);

        // 1. Analyze with Gemini Brain
        const parsedData = await parseTransaction(rawText);
        console.log(`🧠 Parsed data: ${JSON.stringify(parsedData)}`);

        // 2. Save securely to Supabase
        await insertTransaction(userId, parsedData);
        console.log(`💾 Saved to Supabase successfully.`);

        return res.json({ success: true, data: parsedData });
    } catch (error: any) {
        console.error("❌ API Error:", error);
        return res.status(500).json({ success: false, error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Api Server running on http://localhost:${PORT}`);
    console.log(`Waiting for transactions on POST /parse...`);
});
