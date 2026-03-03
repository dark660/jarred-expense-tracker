import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        // Explicitly replace the navigation state to jump into the Tabs flow.
        // The Waitlist Guard in _layout.tsx will catch them there if they aren't authenticated.
        const timeout = setTimeout(() => {
            router.replace('/(tabs)');
        }, 100);
        return () => clearTimeout(timeout);
    }, [router]);

    return (
        <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
    );
}
