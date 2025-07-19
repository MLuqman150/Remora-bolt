import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Only set notification handler on mobile platforms
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export const registerForPushNotificationsAsync = async () => {
  // Skip notification registration on web platform
  if (Platform.OS === 'web') {
    console.log('Skipping push notification registration on web platform');
    return null;
  }

  try {
    let token;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Push notification permission not granted');
      return null;
    }

    token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log('Push token obtained:', token);
    return token;
  } catch (error) {
    console.error('Error registering for push notifications:', error);
    return null;
  }
};

export const scheduleReminderNotification = async (
  reminderId: string,
  title: string,
  body: string,
  date: Date,
  imageUri?: string
) => {
  // Skip notification scheduling on web platform
  if (Platform.OS === 'web') {
    console.log('Skipping notification scheduling on web platform');
    return null;
  }

  // Check if date is in the past
  if (date <= new Date()) {
    console.log('Notification date is in the past, skipping scheduling');
    return null;
  }

  console.log('Scheduling notification for:', { reminderId, title, date });

  try {
    const schedulingOptions = {
      content: {
        title,
        body,
        data: { reminderId },
        attachments: imageUri ? [{ url: imageUri }] : undefined,
      },
      trigger: {
        date,
      },
    };

    const notificationId = await Notifications.scheduleNotificationAsync(schedulingOptions);
    console.log('Notification scheduled with ID:', notificationId);
    return notificationId;
  } catch (error) {
    console.error('Failed to schedule notification:', error);
    return null;
  }
};

export const cancelReminderNotification = async (notificationId: string) => {
  if (Platform.OS === 'web') {
    return;
  }
  
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch (error) {
    console.error('Failed to cancel notification:', error);
  }
};

export const cancelAllNotifications = async () => {
  if (Platform.OS === 'web') {
    return;
  }
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Failed to cancel all notifications:', error);
  }
};