import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { Plus, Share2, CreditCard as Edit, Trash2 } from 'lucide-react-native';
import { useAuth } from '@/hooks/useAuth';
import { getReminders, deleteReminder, Reminder } from '@/lib/reminders';
import { AuthScreen } from '@/components/AuthScreen';
import { ReminderCard } from '@/components/ReminderCard';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(true);

  useEffect(() => {
    if (user) {
      loadReminders();
    }
  }, [user]);

  const loadReminders = async () => {
    if (!user) return;

    try {
      setLoadingReminders(true);
      console.log('Loading reminders for user:', user.id);
      const data = await getReminders(user.id);
      console.log('Loaded reminders:', data);
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', `Failed to load reminders: ${error.message || error}`);
    } finally {
      setLoadingReminders(false);
    }
  };

  const handleRefresh = async () => {
    console.log('Refreshing reminders...');
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const handleDeleteReminder = async (id: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Deleting reminder:', id);
              await deleteReminder(id);
              console.log('Reminder deleted successfully');
              await loadReminders();
            } catch (error) {
              console.error('Error deleting reminder:', error);
              Alert.alert('Error', `Failed to delete reminder: ${error.message || error}`);
            }
          },
        },
      ]
    );
  };

  const handleShareReminder = (reminder: Reminder) => {
    console.log('Sharing reminder:', reminder.id, reminder.title);
    router.push({
      pathname: '/(modals)/share-reminder',
      params: { reminderId: reminder.id, title: reminder.title },
    });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  const now = new Date();
  const upcomingReminders = reminders.filter(r => !r.is_completed);
  const overdueReminders = reminders.filter(r => !r.is_completed && new Date(r.reminder_date) < now);
  const completedReminders = reminders.filter(r => r.is_completed);

  console.log('Reminders breakdown:', {
    total: reminders.length,
    upcoming: upcomingReminders.length,
    overdue: overdueReminders.length,
    completed: completedReminders.length
  });
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Reminders</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push('/(modals)/create-reminder')}
        >
          <Plus size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {loadingReminders ? (
        <LoadingScreen />
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {upcomingReminders.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No reminders yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first reminder</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {upcomingReminders.map((item) => (
                <ReminderCard
                  key={item.id}
                  reminder={item}
                  onEdit={() => {
                    console.log('Editing reminder:', item.id);
                    router.push({
                      pathname: '/(modals)/edit-reminder',
                      params: { reminderId: item.id }
                    });
                  }}
                  onDelete={() => handleDeleteReminder(item.id)}
                  onShare={() => handleShareReminder(item)}
                />
              ))}
            </View>
          )}

          {completedReminders.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Completed</Text>
              {completedReminders.map((item) => (
                <ReminderCard
                  key={item.id}
                  reminder={item}
                  onEdit={() => {
                    console.log('Editing completed reminder:', item.id);
                    router.push({
                      pathname: '/(modals)/edit-reminder',
                      params: { reminderId: item.id }
                    });
                  }}
                  onDelete={() => handleDeleteReminder(item.id)}
                  onShare={() => handleShareReminder(item)}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  addButton: {
    backgroundColor: '#3B82F6',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  listContainer: {
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#9ca3af',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
});