import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import apiService from '../services/api.service';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await apiService.getSubscription();
      setSubscription(response.data);
    } catch (error) {
      // No subscription found
    } finally {
      setLoading(false);
    }
  };

  const getTrialStatus = () => {
    if (!user?.trialEnd) return null;

    const trialEnd = new Date(user.trialEnd);
    const now = new Date();
    const hoursRemaining = Math.max(0, (trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60));

    if (hoursRemaining > 0) {
      return `${Math.floor(hoursRemaining)} hours remaining`;
    }
    return 'Expired';
  };

  const handleExportChat = async () => {
    setExporting(true);
    try {
      const response = await apiService.exportChat('json');
      
      // Save to file
      const filename = `zynx-chat-${Date.now()}.json`;
      const fileUri = FileSystem.documentDirectory + filename;
      
      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(response, null, 2)
      );

      // Share file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Success', `Chat exported to ${filename}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to export chat');
    } finally {
      setExporting(false);
    }
  };

  const handleCancelSubscription = async () => {
    Alert.alert(
      'Cancel Subscription',
      'Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.cancelSubscription();
              Alert.alert('Success', 'Subscription will be canceled at the end of the billing period');
              loadSubscription();
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel subscription');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Email:</Text>
          <Text style={styles.value}>{user?.email}</Text>
        </View>
        {user?.phone && (
          <View style={styles.infoRow}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{user.phone}</Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription Status</Text>
        {subscription ? (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Plan:</Text>
              <Text style={[styles.value, styles.planName]}>
                {subscription.plan.toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Status:</Text>
              <Text style={[styles.value, styles.activeStatus]}>
                {subscription.status.toUpperCase()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Renews:</Text>
              <Text style={styles.value}>
                {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
              </Text>
            </View>
            {subscription.cancelAtPeriodEnd && (
              <Text style={styles.cancelNotice}>
                Subscription will be canceled at the end of the billing period
              </Text>
            )}
            {!subscription.cancelAtPeriodEnd && (
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelSubscription}
              >
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Trial Status:</Text>
              <Text style={styles.value}>{getTrialStatus()}</Text>
            </View>
            <Text style={styles.trialNotice}>
              Subscribe to continue using ZYNX AI after your trial ends
            </Text>
          </>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions</Text>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleExportChat}
          disabled={exporting}
        >
          <Text style={styles.actionButtonText}>
            {exporting ? 'Exporting...' : 'Export Chat History'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>ZYNX AI v1.0.0</Text>
        <Text style={styles.footerText}>© 2024 ZYNX Team</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 16,
    color: '#666',
  },
  value: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  planName: {
    color: '#6366f1',
    fontWeight: 'bold',
  },
  activeStatus: {
    color: '#10b981',
    fontWeight: 'bold',
  },
  trialNotice: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  cancelNotice: {
    fontSize: 14,
    color: '#ef4444',
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButton: {
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
