import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = useRef();
  const responseListener = useRef();

  // Load the weatherData.json file
  useEffect(() => {
    const loadWeatherData = async () => {
      try {
        const weatherFile = Asset.fromModule(require('./assets/weatherData.json')).uri;
        const data = await FileSystem.readAsStringAsync(weatherFile);
        const parsedData = JSON.parse(data);
        setWeatherData(parsedData);

        // Check for alerts and send notification
        parsedData.weather.forEach(day => {
          if (day.alerts) {
            sendPushNotification(day.alerts.title, day.alerts.description);
          }
        });

      } catch (error) {
        console.error('Error loading weather data:', error);
      }
    };

    loadWeatherData();
    registerForPushNotificationsAsync();

    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Push Notification Registration
  async function registerForPushNotificationsAsync() {
    let token;

    // Check if the device supports push notifications
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // If permission is not granted, ask for permission
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notification!');
        return;
      }

      token = (await Notifications.getExpoPushTokenAsync()).data;
      setExpoPushToken(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }
  }

  // Send Notification Function
  async function sendPushNotification(title, body) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: body,
        sound: true,
      },
      trigger: { seconds: 1 },
    });
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {weatherData ? (
        <>
          <Text style={styles.title}>Weather for {weatherData.city.name}</Text>

          {weatherData.weather.map((day, index) => (
            <View key={index} style={styles.weatherBlock}>
              <Text style={styles.date}>{day.date}</Text>
              <Text style={styles.text}>Condition: {day.condition}</Text>
              <Text style={styles.text}>Temperature: {day.temperature.current}°C</Text>

              {day.alerts && (
                <TouchableOpacity
                  style={styles.alertButton}
                  onPress={() => setSelectedAlert(day.alerts)}
                >
                  <Text style={styles.alertButtonText}>View Alert</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}

          {selectedAlert && (
            <View style={styles.alertBlock}>
              <Text style={styles.alertTitle}>{selectedAlert.title}</Text>
              <Text style={styles.alertDesc}>{selectedAlert.description}</Text>
              <Text style={styles.advice}>Advice: {selectedAlert.advice}</Text>
            </View>
          )}
        </>
      ) : (
        <Text>Loading weather data...</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weatherBlock: {
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#e0f7fa',
    borderRadius: 10,
    width: '100%',
  },
  date: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  text: {
    fontSize: 16,
  },
  alertButton: {
    marginTop: 10,
    backgroundColor: '#f44336',
    padding: 10,
    borderRadius: 5,
  },
  alertButtonText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
  alertBlock: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#ffccbc',
    borderRadius: 10,
    width: '100%',
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
  },
  alertDesc: {
    fontSize: 14,
    marginBottom: 5,
  },
  advice: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});
