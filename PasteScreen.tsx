import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function PasteScreen() {
    const [loading, setLoading] = useState(false);

    const handlePasteAndAnalyze = async () => {
        setLoading(true);
        try {
            // 1. Get text from clipboard
            const text = await Clipboard.getStringAsync();

            if (!text || text.length < 10) {
                Alert.alert("Empty Clipboard", "Please copy a bank SMS or transaction text first.");
                return;
            }

            // 2. Call your Node API 
            // Replace with your local machine's IP address (e.g. http://192.168.1.5:3000/parse)
            const response = await fetch('http://localhost:3000/parse', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ rawText: text, userId: 'cug-user-1' })
            });

            const result = await response.json();

            if (result.success) {
                Alert.alert("Success!", `Captured ₹${result.data.amount} at ${result.data.merchantName}`);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            Alert.alert("Error", err.message || "Failed to parse transaction. Our AI is learning!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Add Transaction</Text>
            <Text style={styles.subtitle}>Copy your bank SMS and tap the button below</Text>

            <TouchableOpacity
                style={styles.button}
                onPress={handlePasteAndAnalyze}
                disabled={loading}
            >
                {loading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <Text style={styles.buttonText}>Paste & Analyze</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
    subtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 40 },
    button: { backgroundColor: '#000', paddingVertical: 18, paddingHorizontal: 40, borderRadius: 12, width: '100%', alignItems: 'center' },
    buttonText: { color: '#FFF', fontSize: 18, fontWeight: '600' }
});
