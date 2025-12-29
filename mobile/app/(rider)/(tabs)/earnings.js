// app/(rider)/(tabs)/earnings.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { deliveryService } from '../../../services/delivery';
import { Loading } from '../../../components/common/Loading';
import { COLORS, DELIVERY_STATUS } from '../../../utils/constants';

export default function EarningsScreen() {
  const [stats, setStats] = useState({
    totalDeliveries: 0,
    completedDeliveries: 0,
    totalEarnings: 0,
    todayEarnings: 0,
    weekEarnings: 0,
    monthEarnings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const response = await deliveryService.getRiderDeliveries();
      const deliveries = response.data || [];

      const completed = deliveries.filter(
        (d) => d.status === DELIVERY_STATUS.DELIVERED
      );

      // Mock earnings calculation (should come from backend)
      const totalEarnings = completed.length * 1500; // ₦1500 per delivery
      const todayEarnings = calculateTodayEarnings(completed);
      const weekEarnings = calculateWeekEarnings(completed);
      const monthEarnings = calculateMonthEarnings(completed);

      setStats({
        totalDeliveries: deliveries.length,
        completedDeliveries: completed.length,
        totalEarnings,
        todayEarnings,
        weekEarnings,
        monthEarnings,
      });
    } catch (error) {
      console.error('Fetch earnings error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateTodayEarnings = (deliveries) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return deliveries.filter((d) => {
      const deliveryDate = new Date(d.completedAt || d.createdAt);
      deliveryDate.setHours(0, 0, 0, 0);
      return deliveryDate.getTime() === today.getTime();
    }).length * 1500;
  };

  const calculateWeekEarnings = (deliveries) => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return deliveries.filter((d) => {
      const deliveryDate = new Date(d.completedAt || d.createdAt);
      return deliveryDate >= weekAgo;
    }).length * 1500;
  };

  const calculateMonthEarnings = (deliveries) => {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    return deliveries.filter((d) => {
      const deliveryDate = new Date(d.completedAt || d.createdAt);
      return deliveryDate >= monthAgo;
    }).length * 1500;
  };

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString('en-NG')}`;
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarnings();
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Earnings</Text>
        <Text style={styles.subtitle}>Track your delivery income</Text>
      </View>

      {/* Main Earnings Card */}
      <View style={styles.mainCard}>
        <Text style={styles.mainCardLabel}>Total Earnings</Text>
        <Text style={styles.mainCardValue}>
          {formatCurrency(stats.totalEarnings)}
        </Text>
        <View style={styles.mainCardStats}>
          <View style={styles.mainCardStat}>
            <Text style={styles.mainCardStatValue}>
              {stats.completedDeliveries}
            </Text>
            <Text style={styles.mainCardStatLabel}>Completed</Text>
          </View>
          <View style={styles.mainCardDivider} />
          <View style={styles.mainCardStat}>
            <Text style={styles.mainCardStatValue}>
              {formatCurrency(
                stats.completedDeliveries > 0
                  ? stats.totalEarnings / stats.completedDeliveries
                  : 0
              )}
            </Text>
            <Text style={styles.mainCardStatLabel}>Avg. per delivery</Text>
          </View>
        </View>
      </View>

      {/* Period Earnings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Earnings Breakdown</Text>

        <View style={styles.periodCard}>
          <View style={styles.periodRow}>
            <View style={styles.periodInfo}>
              <Text style={styles.periodIcon}>📅</Text>
              <Text style={styles.periodLabel}>Today</Text>
            </View>
            <Text style={styles.periodValue}>
              {formatCurrency(stats.todayEarnings)}
            </Text>
          </View>
        </View>

        <View style={styles.periodCard}>
          <View style={styles.periodRow}>
            <View style={styles.periodInfo}>
              <Text style={styles.periodIcon}>📊</Text>
              <Text style={styles.periodLabel}>This Week</Text>
            </View>
            <Text style={styles.periodValue}>
              {formatCurrency(stats.weekEarnings)}
            </Text>
          </View>
        </View>

        <View style={styles.periodCard}>
          <View style={styles.periodRow}>
            <View style={styles.periodInfo}>
              <Text style={styles.periodIcon}>📈</Text>
              <Text style={styles.periodLabel}>This Month</Text>
            </View>
            <Text style={styles.periodValue}>
              {formatCurrency(stats.monthEarnings)}
            </Text>
          </View>
        </View>
      </View>

      {/* Performance Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Performance</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🚚</Text>
            <Text style={styles.statValue}>{stats.totalDeliveries}</Text>
            <Text style={styles.statLabel}>Total Deliveries</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statValue}>{stats.completedDeliveries}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>⭐</Text>
            <Text style={styles.statValue}>4.8</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>

          <View style={styles.statCard}>
            <Text style={styles.statIcon}>🏆</Text>
            <Text style={styles.statValue}>
              {stats.completedDeliveries > 0
                ? Math.round(
                    (stats.completedDeliveries / stats.totalDeliveries) * 100
                  )
                : 0}
              %
            </Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>
      </View>

      {/* Payment Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Text style={styles.infoIcon}>💳</Text>
            <Text style={styles.infoTitle}>Payment Information</Text>
          </View>
          <Text style={styles.infoText}>
            Your earnings are calculated automatically and paid weekly.
          </Text>
          <Text style={styles.infoText}>
            Next payout date: {getNextPayoutDate()}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const getNextPayoutDate = () => {
  const today = new Date();
  const nextMonday = new Date(today);
  nextMonday.setDate(today.getDate() + ((1 + 7 - today.getDay()) % 7 || 7));
  return nextMonday.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingBottom: 24,
  },
  header: {
    backgroundColor: COLORS.white,
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.gray,
    marginTop: 4,
  },
  mainCard: {
    backgroundColor: COLORS.primary,
    margin: 20,
    padding: 24,
    borderRadius: 20,
  },
  mainCardLabel: {
    fontSize: 14,
    color: COLORS.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  mainCardValue: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 20,
  },
  mainCardStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainCardStat: {
    flex: 1,
    alignItems: 'center',
  },
  mainCardStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  mainCardStatLabel: {
    fontSize: 12,
    color: COLORS.white,
    opacity: 0.8,
  },
  mainCardDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.white,
    opacity: 0.3,
  },
  section: {
    marginTop: 8,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  periodCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  periodLabel: {
    fontSize: 16,
    color: COLORS.dark,
    fontWeight: '500',
  },
  periodValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statIcon: {
    fontSize: 28,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: COLORS.primaryLight,
    padding: 20,
    borderRadius: 12,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
    marginBottom: 4,
  },
});