import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, Image as ImageIcon, Calendar, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createReminder, uploadMedia } from '@/lib/reminders';
import { scheduleReminderNotification } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

export default function CreateReminderScreen() {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringType, setRecurringType] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(false);

  const handleImagePicker = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type || 'image');
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission denied', 'Camera permission is required to take photos');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setMediaUri(result.assets[0].uri);
      setMediaType(result.assets[0].type || 'image');
    }
  };

  const handleCreateReminder = async () => {
    if (!title) {
      Alert.alert('Error', 'Please enter a title');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    console.log('Starting reminder creation process...');
    console.log('User ID:', user.id);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Reminder Date:', reminderDate.toISOString());

    try {
      setLoading(true);

      let mediaUrl = null;
      if (mediaUri) {
        console.log('Uploading media...');
        const fileName = `reminder_${Date.now()}.${mediaType === 'video' ? 'mp4' : 'jpg'}`;
        mediaUrl = await uploadMedia(mediaUri, fileName, mediaType || 'image');
        console.log('Media uploaded:', mediaUrl);
      }

      const reminderData = {
        user_id: user.id,
        title,
        description: description || '',
        reminder_date: reminderDate.toISOString(),
        media_url: mediaUrl,
        media_type: mediaType,
        is_recurring: isRecurring,
        recurring_type: isRecurring ? recurringType : null,
        is_completed: false,
      };

      console.log('Creating reminder with data:', reminderData);

      const reminder = await createReminder(reminderData);
      console.log('Reminder created successfully:', reminder);

      // Schedule notification
      try {
        const notificationId = await scheduleReminderNotification(
          reminder.id,
          title,
          description || 'Reminder notification',
          reminderDate,
          mediaUrl || undefined
        );
        if (notificationId) {
          console.log('Notification scheduled successfully:', notificationId);
        } else {
          console.log('Notification not scheduled (web platform or past date)');
        }
      } catch (notificationError) {
        console.warn('Failed to schedule notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }

      Alert.alert('Success', 'Reminder created successfully');
      router.back();
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', `Failed to create reminder: ${error.message || error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter reminder title"
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter description (optional)"
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date & Time</Text>
          <View style={styles.dateTimeContainer}>
            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {reminderDate.toLocaleDateString()}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dateTimeButton}
              onPress={() => setShowTimePicker(true)}
            >
              <Clock size={20} color="#6b7280" />
              <Text style={styles.dateTimeText}>
                {reminderDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>
          </View>

          {showDatePicker && (
            <DateTimePicker
              value={reminderDate}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) {
                  setReminderDate(selectedDate);
                }
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={reminderDate}
              mode="time"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) {
                  setReminderDate(selectedDate);
                }
              }}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Media (Optional)</Text>
          <View style={styles.mediaContainer}>
            <TouchableOpacity style={styles.mediaButton} onPress={handleCamera}>
              <Camera size={20} color="#6b7280" />
              <Text style={styles.mediaButtonText}>Camera</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.mediaButton} onPress={handleImagePicker}>
              <ImageIcon size={20} color="#6b7280" />
              <Text style={styles.mediaButtonText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {mediaUri && (
            <View style={styles.mediaPreview}>
              <Image source={{ uri: mediaUri }} style={styles.previewImage} />
              <TouchableOpacity
                style={styles.removeMediaButton}
                onPress={() => {
                  setMediaUri(null);
                  setMediaType(null);
                }}
              >
                <Text style={styles.removeMediaText}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Recurring</Text>
          <View style={styles.switchContainer}>
            <TouchableOpacity
              style={[styles.switch, isRecurring && styles.switchActive]}
              onPress={() => setIsRecurring(!isRecurring)}
            >
              <View style={[styles.switchThumb, isRecurring && styles.switchThumbActive]} />
            </TouchableOpacity>
            <Text style={styles.switchLabel}>Make this a recurring reminder</Text>
          </View>

          {isRecurring && (
            <View style={styles.recurringOptions}>
              {['daily', 'weekly', 'monthly'].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.recurringOption,
                    recurringType === type && styles.recurringOptionActive,
                  ]}
                  onPress={() => setRecurringType(type as any)}
                >
                  <Text
                    style={[
                      styles.recurringOptionText,
                      recurringType === type && styles.recurringOptionTextActive,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.createButton, loading && styles.createButtonDisabled]}
          onPress={handleCreateReminder}
          disabled={loading}
        >
          <Text style={styles.createButtonText}>
            {loading ? 'Creating...' : 'Create Reminder'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1f2937',
    backgroundColor: '#ffffff',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  dateTimeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  dateTimeText: {
    fontSize: 16,
    color: '#1f2937',
  },
  mediaContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  mediaButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  mediaButtonText: {
    fontSize: 16,
    color: '#374151',
  },
  mediaPreview: {
    marginTop: 12,
    alignItems: 'center',
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 8,
  },
  removeMediaButton: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ef4444',
    borderRadius: 6,
  },
  removeMediaText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switch: {
    width: 48,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  switchActive: {
    backgroundColor: '#3B82F6',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchLabel: {
    fontSize: 16,
    color: '#374151',
  },
  recurringOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  recurringOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  recurringOptionActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  recurringOptionText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  recurringOptionTextActive: {
    color: '#ffffff',
  },
  createButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  createButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});