import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';

export default function Index() {
    const router = useRouter();

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.replace('/(tabs)');
        }, 100);
        return () => clearTimeout(timeout);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: '#050505', justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#6c5ce7" />
        </View>
    );
}
