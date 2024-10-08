import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Platform, ImageBackground } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Permissions from 'expo-permissions';
import Constants from 'expo-constants';
import weatherData from './assets/weatherData.json';

const backgroundImg = require('./assets/background.jpeg'); 

export default function App() {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [notification, setNotification] = useState(false);
  const notificationListener = React.useRef();
  const responseListener = React.useRef();

  // Request permission and set up notifications
  useEffect(() => {
    registerForPushNotificationsAsync().then(token => setExpoPushToken(token));

    // When a notification is received
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      setNotification(notification);
    });

    // When a user interacts with the notification (i.e. tap)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log(response);
    });

    return () => {
      Notifications.removeNotificationSubscription(notificationListener.current);
      Notifications.removeNotificationSubscription(responseListener.current);
    };
  }, []);

  // Function to send a push notification
  const sendNotification = async (alert) => {
    if (alert) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: alert.title,
          body: alert.description,
        },
        trigger: null, // Immediate notification
      });
    }
  };

  // Register device for push notifications
  async function registerForPushNotificationsAsync() {
    let token;
    if (Constants.isDevice) {
      const { status: existingStatus } = await Permissions.getAsync(Permissions.NOTIFICATIONS);
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        alert('Failed to get push token for push notifications!');
        return;
      }
      token = (await Notifications.getExpoPushTokenAsync()).data;
      console.log(token);
    } else {
      alert('Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  // Render location list
  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => {
        setSelectedLocation(item);
        if (item.alerts) {
          sendNotification(item.alerts); // Send notification when location with alerts is selected
        }
      }}
    >
      <Text style={styles.locationText}>{item.location}</Text>
      {item.alerts && <Text style={styles.alertText}>⚠️ Alert: {item.alerts.title}</Text>}
    </TouchableOpacity>
  );

  // Detailed view of selected location
  const renderLocationDetails = (location) => (
    <ScrollView contentContainerStyle={styles.detailsContainer}>
      <Text style={styles.locationTitle}>{location.location}</Text>
      <Text style={styles.weatherCondition}>{location.condition}</Text>
      <Text style={styles.temperature}>Current: {location.temperature.current}°C</Text>
      <Text style={styles.temperature}>High: {location.temperature.high}°C, Low: {location.temperature.low}°C</Text>

      {location.alerts && (
        <View style={styles.alertContainer}>
          <Text style={styles.alertTitle}>{location.alerts.title}</Text>
          <Text style={styles.alertDescription}>{location.alerts.description}</Text>
          <Text style={styles.advice}>Advice: {location.alerts.advice}</Text>
        </View>
      )}
    </ScrollView>
  );

  return (
    <ImageBackground source={backgroundImg} style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.heading}>Climate Alert</Text>
        {selectedLocation ? (
          <View style={styles.detailsView}>
            <TouchableOpacity onPress={() => setSelectedLocation(null)} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            {renderLocationDetails(selectedLocation)}
          </View>
        ) : (
          <FlatList
            data={weatherData.weather}
            keyExtractor={(item) => item.location}
            renderItem={renderLocationItem}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    resizeMode: 'cover',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20, 
    paddingTop: 50,
  },
  list: {
    paddingBottom: 20,
  },
  locationItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', 
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  locationText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  alertText: {
    marginTop: 5,
    color: 'red',
    fontWeight: 'bold',
  },
  detailsView: {
    flex: 1,
  },
  backButton: {
    marginBottom: 20,
  },
  backButtonText: {
    color: '#007BFF',
    fontSize: 23,
  },
  detailsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)', 
    padding: 20,
    borderRadius: 10,
    borderColor: '#ddd',
    borderWidth: 1,
  },
  locationTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  weatherCondition: {
    fontSize: 20,
    marginBottom: 10,
    color: '#333',
  },
  heading: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'yellow',
    textAlign: 'center',
    marginBottom: 20,
  },
  temperature: {
    fontSize: 18,
    marginBottom: 5,
    color: '#333',
  },
  alertContainer: {
    marginTop: 20,
    backgroundColor: '#ffebee',
    padding: 15,
    borderRadius: 10,
  },
  alertTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
  },
  alertDescription: {
    marginTop: 5,
    fontSize: 16,
    color: '#333',
  },
  advice: {
    marginTop: 10,
    fontStyle: 'italic',
    color: '#333',
  },
});
