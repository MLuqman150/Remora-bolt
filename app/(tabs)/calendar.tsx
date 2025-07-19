import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { getReminders, deleteReminder, Reminder } from '@/lib/reminders';
import { AuthScreen } from '@/components/AuthScreen';
import { ReminderCard } from '@/components/ReminderCard';
import { LoadingScreen } from '@/components/LoadingScreen';

export default function CalendarScreen() {
  const { user, loading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
      const data = await getReminders(user.id);
      setReminders(data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoadingReminders(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  // Create marked dates for calendar
  const markedDates = reminders.reduce((acc, reminder) => {
    const date = reminder.reminder_date.split('T')[0];
    if (!acc[date]) {
      acc[date] = { marked: true, dotColor: '#3B82F6' };
    }
    return acc;
  }, {} as any);

  // Add selected date
  markedDates[selectedDate] = {
    ...markedDates[selectedDate],
    selected: true,
    selectedColor: '#3B82F6',
  };

  // Filter reminders for selected date
  const selectedDateReminders = reminders.filter(reminder => {
    const reminderDate = reminder.reminder_date.split('T')[0];
    return reminderDate === selectedDate;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Calendar</Text>
      </View>

      {loadingReminders ? (
        <LoadingScreen />
      ) : (
        <View style={styles.content}>
          <Calendar
            onDayPress={(day) => setSelectedDate(day.dateString)}
            markedDates={markedDates}
            theme={{
              backgroundColor: '#ffffff',
              calendarBackground: '#ffffff',
              textSectionTitleColor: '#b6c1cd',
              selectedDayBackgroundColor: '#3B82F6',
              selectedDayTextColor: '#ffffff',
              todayTextColor: '#3B82F6',
              dayTextColor: '#2d4150',
              textDisabledColor: '#d9e1e8',
              dotColor: '#3B82F6',
              selectedDotColor: '#ffffff',
              arrowColor: '#3B82F6',
              disabledArrowColor: '#d9e1e8',
              monthTextColor: '#2d4150',
              indicatorColor: '#3B82F6',
              textDayFontWeight: '500',
              textMonthFontWeight: 'bold',
              textDayHeaderFontWeight: '600',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
          />

          <View style={styles.remindersSection}>
            <Text style={styles.sectionTitle}>
              {selectedDateReminders.length > 0 
                ? `Reminders for ${new Date(selectedDate).toLocaleDateString()}`
                : `No reminders for ${new Date(selectedDate).toLocaleDateString()}`
              }
            </Text>

            <FlatList
              data={selectedDateReminders}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ReminderCard
                  reminder={item}
                  onEdit={() => router.push({
                    pathname: '/(modals)/edit-reminder',
                    params: { reminderId: item.id }
                  })}
                  onDelete={async () => {
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
                              await deleteReminder(item.id);
                              await loadReminders();
                            } catch (error) {
                              console.error('Error deleting reminder:', error);
                              Alert.alert('Error', 'Failed to delete reminder');
                            }
                          },
                        },
                      ]
                    );
                  }}
                  onShare={() => {
                    router.push({
                      pathname: '/(modals)/share-reminder',
                      params: { reminderId: item.id, title: item.title },
                    });
                  }}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.remindersList}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No reminders for this date</Text>
                  <TouchableOpacity
                    style={styles.addButton}
                    onPress={() => router.push('/(modals)/create-reminder')}
                  >
                    <Text style={styles.addButtonText}>Add Reminder</Text>
                  </TouchableOpacity>
                </View>
              }
            />
          </View>
        </View>
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
    flex: 1,
  },
  calendar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  remindersSection: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  remindersList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 20,
  },
  addButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});