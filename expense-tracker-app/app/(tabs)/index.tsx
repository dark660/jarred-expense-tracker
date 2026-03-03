import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Wallet, Zap } from 'lucide-react-native';
import { getSupabase } from '../../db';

export default function JarredHome() {
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [loading, setLoading] = useState(false);

  // Logic to calculate Safe-to-Spend
  const refreshBudget = async () => {
    try {
      const supabase = getSupabase();
      const { data: txns, error } = await supabase.from('transactions').select('amount');

      if (error) {
        console.error("Supabase Error:", error);
        return;
      }

      const monthlyLimit = 30000;
      const spent = txns?.reduce((acc: any, curr: any) => acc + curr.amount, 0) || 0;

      // Math: (Limit - Spent) / Days Remaining
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysLeft = daysInMonth - now.getDate();

      setSafeToSpend(Math.max(0, (monthlyLimit - spent) / (daysLeft || 1)));
    } catch (err) {
      console.error("Failed to fetch from DB:", err);
    }
  };

  useEffect(() => { refreshBudget(); }, []);

  const handleScan = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text || text.length < 10) return Alert.alert("Nothing to parse", "Copy a bank SMS first!");

    setLoading(true);
    try {
      // Connects to your live Render "Brain"
      const response = await fetch('https://jarred-api.onrender.com/parse', { // using correct API endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text })
      });

      if (response.ok) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refreshBudget(); // Instant UI update
        Alert.alert("Success", "Transaction analyzed and saved.");
      } else {
        const result = await response.json();
        throw new Error(result.error);
      }
    } catch (e: any) {
      Alert.alert("Connection Error", e.message || "The AI takes a moment to wake up on the free tier. Try again in 10s!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Zap color="#6c5ce7" fill="#6c5ce7" size={24} />
        <Text style={styles.brandText}>JARRED</Text>
      </View>

      <View style={styles.mainCard}>
        <Text style={styles.label}>AVAILABLE FOR TODAY</Text>
        <Text style={styles.amount}>₹{safeToSpend.toFixed(0)}</Text>
        <View style={styles.pill}>
          <Text style={styles.pillText}>Safe Limit</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <>
              <Wallet color="#fff" size={20} style={{ marginRight: 12 }} />
              <Text style={styles.buttonText}>Scan Clipboard</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', padding: 25, justifyContent: 'center' },
  header: { position: 'absolute', top: 60, left: 25, flexDirection: 'row', alignItems: 'center' },
  brandText: { color: '#fff', fontSize: 22, fontWeight: '900', marginLeft: 10, letterSpacing: 1 },
  mainCard: { backgroundColor: '#111', padding: 45, borderRadius: 35, alignItems: 'center', borderColor: '#222', borderWidth: 1 },
  label: { color: '#555', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  amount: { color: '#fff', fontSize: 84, fontWeight: '900' },
  pill: { backgroundColor: '#6c5ce720', paddingHorizontal: 15, paddingVertical: 5, borderRadius: 20, marginTop: 15 },
  pillText: { color: '#6c5ce7', fontSize: 12, fontWeight: '700' },
  buttonContainer: { marginTop: 40 },
  scanButton: { backgroundColor: '#6c5ce7', height: 75, borderRadius: 22, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
