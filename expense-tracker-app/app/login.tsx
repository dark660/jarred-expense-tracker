import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { getSupabase } from '../db';
import { Zap } from 'lucide-react-native';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        if (!email) return Alert.alert('Enter your email', 'Please provide a valid email address.');

        setLoading(true);
        try {
            const supabase = getSupabase();
            // Using Magic Link / OTP for a passwordless "Zero-Friction" experience
            const { error } = await supabase.auth.signInWithOtp({
                email: email,
                options: {
                    shouldCreateUser: false // Strictly enforces the Waitlist (Only pre-added emails work)
                }
            });

            if (error) {
                if (error.message.includes("Signups not allowed")) {
                    Alert.alert("Access Denied", "You are not on the CUG waitlist yet!");
                } else {
                    Alert.alert("Error", error.message);
                }
            } else {
                Alert.alert("Check your Email!", "We sent a magic login link to " + email);
            }
        } catch (err: any) {
            Alert.alert("Connection Issue", err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.brandBox}>
                <Zap color="#6c5ce7" fill="#6c5ce7" size={48} />
                <Text style={styles.title}>JARRED</Text>
                <Text style={styles.subtitle}>Closed User Group Access</Text>
            </View>

            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Enter your waitlist email"
                    placeholderTextColor="#666"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
            </View>

            <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                {loading ? (
                    <ActivityIndicator color="#000" />
                ) : (
                    <Text style={styles.buttonText}>Send Magic Link</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', padding: 30, justifyContent: 'center' },
    brandBox: { alignItems: 'center', marginBottom: 60 },
    title: { color: '#fff', fontSize: 42, fontWeight: '900', letterSpacing: 2, marginTop: 15 },
    subtitle: { color: '#6c5ce7', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginTop: 5 },
    inputContainer: { marginBottom: 20 },
    input: { backgroundColor: '#111', color: '#fff', height: 60, borderRadius: 15, paddingHorizontal: 20, fontSize: 16, borderWidth: 1, borderColor: '#333' },
    button: { backgroundColor: '#6c5ce7', height: 60, borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '800' }
});
