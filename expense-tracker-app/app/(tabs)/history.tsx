import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { getSupabase } from '../../db';
import { History as HistoryIcon, ArrowDownRight, ArrowUpRight } from 'lucide-react-native';

export default function HistoryTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('txn_date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) {
      console.error("Error fetching history:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.txnCard}>
      <View style={styles.txnLeft}>
        <View style={[styles.iconBox, { backgroundColor: item.txn_type === 'CREDIT' ? '#2ecc7120' : '#e74c3c20' }]}>
          {item.txn_type === 'CREDIT'
            ? <ArrowUpRight color="#2ecc71" size={20} />
            : <ArrowDownRight color="#e74c3c" size={20} />}
        </View>
        <View>
          <Text style={styles.merchantName}>{item.merchant}</Text>
          <Text style={styles.categoryText}>{item.category} • {new Date(item.txn_date).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={[styles.txnAmount, { color: item.txn_type === 'CREDIT' ? '#2ecc71' : '#fff' }]}>
        {item.txn_type === 'CREDIT' ? '+' : '-'}₹{item.amount.toFixed(0)}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <HistoryIcon color="#6c5ce7" size={24} />
        <Text style={styles.headerTitle}>HISTORY</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#6c5ce7" style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6c5ce7" />}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No transactions analyzed yet.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#050505', paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 25, marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '900', marginLeft: 10, letterSpacing: 1 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  txnCard: { backgroundColor: '#111', borderRadius: 20, padding: 18, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#222' },
  txnLeft: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  merchantName: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  categoryText: { color: '#666', fontSize: 13, fontWeight: '500' },
  txnAmount: { fontSize: 18, fontWeight: '800' },
  emptyText: { color: '#666', textAlign: 'center', marginTop: 40, fontSize: 16 }
});
