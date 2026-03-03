import express from 'express';
import cors from 'cors';
import { parseTransaction } from './parser';
import { getSupabase, insertTransaction } from './db';

const app = express();
app.use(cors({ origin: process.env.APP_ORIGIN || '*' }));
app.use(express.json());

app.post('/parse', async (req, res) => {
    try {
        const { rawText } = req.body;
        const authHeader = req.headers.authorization;

        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ success: false, error: 'Missing bearer token' });
        }

        const accessToken = authHeader.slice('Bearer '.length);
        const supabase = getSupabase();
        const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

        if (authError || !authData.user) {
            return res.status(401).json({ success: false, error: 'Invalid access token' });
        }

        const userId = authData.user.id;

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
