import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🚀 Riderr App</Text>
      <Text style={styles.subtitle}>Welcome to Riderr Delivery Service</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.buttonText}>Go to Login</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#f0f0f0', marginTop: 10 }]}
        onPress={() => router.push('/(tabs)')}
      >
        <Text style={[styles.buttonText, { color: '#333' }]}>Go to Dashboard</Text>
      </TouchableOpacity>
      
      <Text style={styles.info}>
        If you can see this screen, your app is working!
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#337bff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#337bff',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  info: {
    marginTop: 40,
    color: '#999',
    textAlign: 'center',
    fontSize: 14,
  },
});