import { createClient } from '@supabase/supabase-js'

let supabaseInstance: any = null;

export const getSupabase = () => {
    if (!supabaseInstance) {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase credentials missing. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set.");
        }

        supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    }
    return supabaseInstance;
};

/**
 * Saves a parsed transaction into Supabase.
 * Uses 'upsert' to prevent duplicates in our CUG data.
 */
export async function insertTransaction(userId: string, data: any) {
    const supabase = getSupabase();
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
