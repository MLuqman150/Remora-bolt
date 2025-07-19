import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Share2, Edit, Trash2, Clock, CheckCircle } from 'lucide-react-native';
import { Reminder } from '@/lib/reminders';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
}

export const ReminderCard = ({ reminder, onEdit, onDelete, onShare }: ReminderCardProps) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isOverdue = new Date(reminder.reminder_date) < new Date() && !reminder.is_completed;

  return (
    <View style={[styles.card, isOverdue && styles.overdueCard]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{reminder.title}</Text>
          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton} onPress={onShare}>
              <Share2 size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
              <Edit size={16} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
              <Trash2 size={16} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {reminder.description && (
          <Text style={styles.description}>{reminder.description}</Text>
        )}

        <View style={styles.footer}>
          <View style={styles.dateContainer}>
            {reminder.is_completed ? (
              <CheckCircle size={16} color="#10b981" />
            ) : (
              <Clock size={16} color={isOverdue ? "#ef4444" : "#6b7280"} />
            )}
            <Text style={[styles.date, isOverdue && styles.overdueText]}>
              {formatDate(reminder.reminder_date)}
            </Text>
          </View>

          {reminder.is_recurring && (
            <Text style={styles.recurringBadge}>
              {reminder.recurring_type}
            </Text>
          )}
        </View>

        {reminder.media_url && (
          <Image source={{ uri: reminder.media_url }} style={styles.thumbnail} />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  date: {
    fontSize: 14,
    color: '#6b7280',
  },
  overdueText: {
    color: '#ef4444',
  },
  recurringBadge: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: 'capitalize',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginTop: 12,
  },
});