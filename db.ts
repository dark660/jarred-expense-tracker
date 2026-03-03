import { createClient } from '@supabase/supabase-js'

// Veteran Tip: Never hardcode keys. Bun/Node reads these from your .env file
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Saves a parsed transaction into Supabase.
 * Uses 'upsert' to prevent duplicates in our CUG data.
 */
export async function insertTransaction(userId: string, data: any) {
    const { error } = await supabase
        .from('transactions')
        .upsert({
            user_id: userId,
            merchant: data.merchantName,
            amount: data.amount,
            category: data.category,
            txn_date: data.date || new Date().toISOString(),
            is_subscription: data.isSubscription
        }, {
            onConflict: 'user_id, merchant, amount, txn_date'
        });

    if (error) throw error;
    return { success: true };
}
