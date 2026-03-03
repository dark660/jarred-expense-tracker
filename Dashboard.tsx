import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getSupabase } from './db';

export default function SafeToSpend() {
    const [safeAmount, setSafeAmount] = useState(0);

    useEffect(() => {
        calculateBudget();
    }, []);

    const calculateBudget = async () => {
        const supabase = getSupabase();
        const { data: txns } = await supabase.from('transactions').select('*');

        const monthlyLimit = 30000; // Let's say Govind sets this
        const spentSoFar = txns?.reduce((acc: number, curr: { amount: number }) => acc + curr.amount, 0) || 0;
        const daysLeft = 30 - new Date().getDate(); // Simplified

        // The "Veteran" Formula
        const dailyAllowable = (monthlyLimit - spentSoFar) / (daysLeft || 1);
        setSafeAmount(Math.max(0, dailyAllowable));
    };

    return (
        <View style={styles.container}>
            <Text style={styles.label}>SAFE TO SPEND TODAY</Text>
            <Text style={styles.amount}>₹{safeAmount.toFixed(0)}</Text>
            <Text style={styles.subtext}>Stay under this to hit your savings goal!</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { padding: 40, alignItems: 'center', backgroundColor: '#F8F9FA', borderRadius: 20 },
    label: { fontSize: 14, color: '#6C757D', fontWeight: '600' },
    amount: { fontSize: 64, fontWeight: 'bold', color: '#2D3436' },
    subtext: { fontSize: 12, color: '#A0AEC0', marginTop: 10 }
});
