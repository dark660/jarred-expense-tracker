import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Wallet, Zap } from 'lucide-react-native';
import { getSupabase } from '../../db';

export default function JarredHome() {
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [loading, setLoading] = useState(false);

  // 1. Logic to calculate Safe-to-Spend from Supabase
  const refreshBudget = async () => {
    try {
      const supabase = getSupabase();
      const { data: txns, error } = await supabase.from('transactions').select('amount');

      if (error) {
        console.error("Supabase Error:", error);
        return;
      }

      const monthlyLimit = 30000; // This can be dynamic later
      const spent = txns?.reduce((acc: any, curr: any) => acc + curr.amount, 0) || 0;
      const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - new Date().getDate();

      setSafeToSpend(Math.max(0, (monthlyLimit - spent) / (daysLeft || 1)));
    } catch (err) {
      console.error("Failed to fetch from DB:", err);
    }
  };

  useEffect(() => { refreshBudget(); }, []);

  // 2. The "Brain" Trigger
  const handleAnalyze = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text || text.length < 10) return Alert.alert("Nothing to parse", "Copy a bank SMS first!");

    setLoading(true);
    try {
      // Using the confirmed Render API endpoint
      const response = await fetch('https://jarred-api.onrender.com/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text })
      });

      if (response.ok) {
        const result = await response.json();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshBudget(); // Update the UI immediately
        Alert.alert("Success", `Transaction added to your history.\nSpent ₹${result?.data?.amount || ''} at ${result?.data?.merchantName || 'merchant'}`);
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e.message || "Ensure your Render server is live!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Zap color="#6c5ce7" fill="#6c5ce7" size={24} />
        <Text style={styles.brand}>JARRED</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.label}>AVAILABLE FOR TODAY</Text>
        <Text style={styles.amount}>₹{safeToSpend.toFixed(0)}</Text>
        <View style={styles.divider} />
        <Text style={styles.subtext}>Based on your ₹30k monthly goal</Text>
      </View>

      <TouchableOpacity style={styles.actionButton} onPress={handleAnalyze} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Wallet color="#fff" size={20} style={{ marginRight: 10 }} />
            <Text style={styles.buttonText}>Scan Clipboard SMS</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000', padding: 25, justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 40, position: 'absolute', top: 60, left: 25 },
  brand: { color: '#fff', fontSize: 20, fontWeight: '900', marginLeft: 8, letterSpacing: 1 },
  mainCard: { backgroundColor: '#111', padding: 40, borderRadius: 32, borderColor: '#222', borderStyle: 'solid', borderWidth: 1, alignItems: 'center' },
  label: { color: '#666', fontSize: 12, fontWeight: '700', letterSpacing: 2 },
  amount: { color: '#fff', fontSize: 72, fontWeight: '900', marginVertical: 10 },
  divider: { width: 40, height: 4, backgroundColor: '#6c5ce7', borderRadius: 2, marginVertical: 15 },
  subtext: { color: '#444', fontSize: 13 },
  actionButton: { backgroundColor: '#6c5ce7', height: 70, borderRadius: 20, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '700' }
});
