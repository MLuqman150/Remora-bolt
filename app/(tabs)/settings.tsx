import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { AuthScreen } from '@/components/AuthScreen';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function SettingsScreen() {
  const { user, loading } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    if (user) {
      checkNotificationPermissions();
    }
  }, [user]);

  const checkNotificationPermissions = async () => {
    try {
      // Skip on web platform
      if (Platform.OS === 'web') {
        setNotificationsEnabled(false);
        return;
      }
      
      const token = await registerForPushNotificationsAsync();
      setNotificationsEnabled(!!token);
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    // Skip on web platform
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Push notifications are not available on web platform');
      return;
    }
    
    if (enabled) {
      try {
        const token = await registerForPushNotificationsAsync();
        if (token) {
          setNotificationsEnabled(true);
          Alert.alert('Success', 'Notifications enabled successfully');
        } else {
          setNotificationsEnabled(false);
          Alert.alert('Error', 'Failed to enable notifications. Please check your device settings.');
        }
      } catch (error) {
        console.error('Error enabling notifications:', error);
        setNotificationsEnabled(false);
        Alert.alert('Error', 'Failed to enable notifications');
      }
    } else {
      setNotificationsEnabled(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications for your reminders
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#e5e7eb', true: '#3B82F6' }}
              thumbColor={notificationsEnabled ? '#ffffff' : '#f4f4f5'}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Version</Text>
            <Text style={styles.infoValue}>1.0.0</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Build</Text>
            <Text style={styles.infoValue}>1</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Alert.alert('Help', 'Help documentation coming soon')}
          >
            <Text style={styles.linkText}>Help & Support</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Alert.alert('Privacy', 'Privacy policy coming soon')}
          >
            <Text style={styles.linkText}>Privacy Policy</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => Alert.alert('Terms', 'Terms of service coming soon')}
          >
            <Text style={styles.linkText}>Terms of Service</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  content: {
    padding: 20,
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
  },
  settingDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: '#374151',
  },
  infoValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  linkItem: {
    paddingVertical: 12,
  },
  linkText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
});