import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Wallet, PlusCircle } from 'lucide-react-native';

export default function Dashboard() {
  const [safeToSpend, setSafeToSpend] = useState(0);
  const [loading, setLoading] = useState(false);

  // This is where we call your RENDER backend
  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (!text) return Alert.alert("Clipboard Empty", "Copy a bank SMS first!");

    setLoading(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      const response = await fetch('https://jarred-api.onrender.com/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: text })
      });
      const result = await response.json();
      if (result.success) {
        Alert.alert("Parsed!", `Spent ₹${result.data.amount} at ${result.data.merchantName}`);
        // We'll add logic to refresh the budget here next
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      Alert.alert("Server Waking Up", "The AI is taking a second to wake up. Try again in 10 seconds!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Wallet color="#6c5ce7" size={32} />
        <Text style={styles.label}>SAFE TO SPEND TODAY</Text>
        <Text style={styles.amount}>₹{safeToSpend}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePaste} disabled={loading}>
        <PlusCircle color="#fff" size={24} />
        <Text style={styles.buttonText}>{loading ? "Analyzing..." : "Paste Bank SMS"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7F9FC', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 24, alignItems: 'center', elevation: 5, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  label: { fontSize: 14, color: '#A0AEC0', fontWeight: '700', marginTop: 15 },
  amount: { fontSize: 52, fontWeight: '800', color: '#2D3436', marginVertical: 10 },
  button: { backgroundColor: '#1A1A1A', flexDirection: 'row', height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: '600', marginLeft: 10 }
});
