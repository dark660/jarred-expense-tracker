import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { getSupabase } from '../../db';
import { Target, ArrowRight } from 'lucide-react-native';

export default function SubscriptionsTab() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchSubscriptions = async () => {
        try {
            const supabase = getSupabase();
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('is_subscription', true)
                .order('txn_date', { ascending: false });

            if (error) throw error;
            setSubscriptions(data || []);
        } catch (err) {
            console.error("Error fetching subscriptions:", err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSubscriptions();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchSubscriptions();
    };

    const renderItem = ({ item }: { item: any }) => (
        <View style={styles.subCard}>
            <View style={styles.subLeft}>
                <View style={styles.iconBox}>
                    <Target color="#fff" size={20} />
                </View>
                <View>
                    <Text style={styles.merchantName}>{item.merchant}</Text>
                    <Text style={styles.categoryText}>Active • {item.category}</Text>
                </View>
            </View>
            <View style={styles.subAmountBox}>
                <Text style={styles.subAmount}>₹{item.amount.toFixed(0)}</Text>
                <Text style={styles.subCycle}>/mo</Text>
            </View>
        </View>
    );

    const totalMonthlyCost = subscriptions.reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Target color="#ff7675" size={28} />
                <Text style={styles.headerTitle}>SNIPER</Text>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{subscriptions.length} active</Text>
                </View>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>MONTHLY DRAIN</Text>
                <Text style={styles.summaryAmount}>₹{totalMonthlyCost.toFixed(0)}</Text>
            </View>

            <View style={styles.listHeader}>
                <Text style={styles.listTitle}>Recurring Charges</Text>
                <ArrowRight color="#666" size={16} />
            </View>

            {loading ? (
                <ActivityIndicator color="#ff7675" style={{ marginTop: 50 }} />
            ) : (
                <FlatList
                    data={subscriptions}
                    keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff7675" />}
                    ListEmptyComponent={
                        <Text style={styles.emptyText}>No recurring charges detected yet.</Text>
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#050505', paddingTop: 60 },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 25 },
    headerTitle: { color: '#fff', fontSize: 24, fontWeight: '900', marginLeft: 10, letterSpacing: 1 },
    badge: { backgroundColor: '#ff767520', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginLeft: 'auto' },
    badgeText: { color: '#ff7675', fontSize: 12, fontWeight: '700' },
    summaryCard: { marginHorizontal: 20, backgroundColor: '#111', borderRadius: 24, padding: 30, alignItems: 'center', borderColor: '#ff767540', borderWidth: 1, marginBottom: 30 },
    summaryLabel: { color: '#ff7675', fontSize: 13, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
    summaryAmount: { color: '#fff', fontSize: 48, fontWeight: '900' },
    listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 25, marginBottom: 15 },
    listTitle: { color: '#888', fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
    listContent: { paddingHorizontal: 20, paddingBottom: 40 },
    subCard: { backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    subLeft: { flexDirection: 'row', alignItems: 'center' },
    iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginRight: 15 },
    merchantName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
    categoryText: { color: '#2ecc71', fontSize: 13, fontWeight: '600' },
    subAmountBox: { alignItems: 'flex-end' },
    subAmount: { color: '#fff', fontSize: 18, fontWeight: '800' },
    subCycle: { color: '#666', fontSize: 12, fontWeight: '600', marginTop: 2 },
    emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
