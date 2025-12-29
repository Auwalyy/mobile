
// app/(customer)/(tabs)/activity.js
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

export default function ActivityScreen() {
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    cancelled: 0,
    ongoing: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await deliveryService.getMyDeliveries();
      const deliveries = response.data || [];

      const completed = deliveries.filter(
        d => d.status === DELIVERY_STATUS.DELIVERED
      ).length;

      const cancelled = deliveries.filter(
        d => d.status === DELIVERY_STATUS.CANCELLED
      ).length;

      const ongoing = deliveries.filter(d =>
        [
          DELIVERY_STATUS.PENDING,
          DELIVERY_STATUS.ASSIGNED,
          DELIVERY_STATUS.PICKED_UP,
          DELIVERY_STATUS.IN_TRANSIT,
        ].includes(d.status)
      ).length;

      setStats({
        total: deliveries.length,
        completed,
        cancelled,
        ongoing,
        totalSpent: 0, // Calculate from delivery prices if available
      });
    } catch (error) {
      console.error('Fetch stats error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
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
        <Text style={styles.title}>Activity</Text>
        <Text style={styles.subtitle}>Your delivery statistics</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, styles.statCardPrimary]}>
          <Text style={styles.statIcon}>📦</Text>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Orders</Text>
        </View>

        <View style={[styles.statCard, styles.statCardSuccess]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>

        <View style={[styles.statCard, styles.statCardWarning]}>
          <Text style={styles.statIcon}>🚚</Text>
          <Text style={styles.statValue}>{stats.ongoing}</Text>
          <Text style={styles.statLabel}>Ongoing</Text>
        </View>

        <View style={[styles.statCard, styles.statCardDanger]}>
          <Text style={styles.statIcon}>❌</Text>
          <Text style={styles.statValue}>{stats.cancelled}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </View>
      </View>

      {/* Success Rate */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Success Rate</Text>
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Delivery Success</Text>
            <Text style={styles.progressPercentage}>
              {stats.total > 0
                ? Math.round((stats.completed / stats.total) * 100)
                : 0}
              %
            </Text>
          </View>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${
                    stats.total > 0
                      ? (stats.completed / stats.total) * 100
                      : 0
                  }%`,
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Additional Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Average Deliveries</Text>
            <Text style={styles.infoValue}>
              {stats.total > 0 ? (stats.total / 7).toFixed(1) : 0}/week
            </Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Most Used Service</Text>
            <Text style={styles.infoValue}>Standard Delivery</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Member Since</Text>
            <Text style={styles.infoValue}>
              {new Date().toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    gap: 12,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  statCardPrimary: {
    backgroundColor: COLORS.primaryLight,
  },
  statCardSuccess: {
    backgroundColor: COLORS.successLight,
  },
  statCardWarning: {
    backgroundColor: COLORS.warningLight,
  },
  statCardDanger: {
    backgroundColor: COLORS.dangerLight,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.gray,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 12,
  },
  progressCard: {
    backgroundColor: COLORS.white,
    padding: 20,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  progressLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.light,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: COLORS.gray,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.dark,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.borderLight,
  },
});