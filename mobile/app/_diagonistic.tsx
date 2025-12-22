import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function Diagnostic() {
  const router = useRouter();
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎯 App is Loading!</Text>
      <Text style={styles.subtitle}>Your Riderr app is working</Text>
      <Text style={styles.message}>
        If you see this screen, your app is properly configured.
        {"\n\n"}
        Check your terminal for Metro bundler output.
        {"\n\n"}
        Try refreshing the app on your device.
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#337bff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 20,
  },
  message: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    lineHeight: 24,
  },
});