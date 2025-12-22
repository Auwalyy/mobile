// app/(auth)/login.tsx
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const [emailOrPhone, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleLogin = async () => {
  if (!emailOrPhone || !password) {
    Alert.alert('Error', 'Please fill all fields');
    return;
  }

  try {
    setLoading(true);
    await login(emailOrPhone, password);
    
    router.replace('/(tabs)');
    
  } catch (error: any) {
    let errorMessage = 'Login failed';
    
    if (error.response?.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (error.response?.status === 403) {
      // If account not verified, redirect to verification
      const userId = error.response.data?.userId;
      const email = error.response.data?.email;
      const phone = error.response.data?.phone;
      
      if (userId) {
        Alert.alert(
          'Verification Required',
          'Please verify your account to continue',
          [
            {
              text: 'Verify Now',
              onPress: () => {
                router.push({
                  pathname: '/verificationScreen',
                  params: {
                    userId,
                    email: email || emailOrPhone,
                    phone: phone || '',
                  }
                });
              }
            },
            { text: 'Cancel', style: 'cancel' }
          ]
        );
        return;
      }
      errorMessage = 'Account not verified. Please check your email.';
    } else if (error.response?.status === 404) {
      errorMessage = 'Account not found';
    } else if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    Alert.alert('Error', errorMessage);
  } finally {
    setLoading(false);
  }
};

  return (
    <ScrollView 
      contentContainerStyle={styles.scrollContainer}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <Text style={styles.appTitle}>Riderr</Text>
        <Text style={styles.title}>Login to Your Account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={emailOrPhone}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          editable={!loading}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!loading}
        />
        
        <TouchableOpacity style={styles.forgotPassword}>
          <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>
        
        <View style={styles.signupLinkContainer}>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={styles.signupLink}>
              Don't have an account? <Text style={styles.signupLinkBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: 'white',
    justifyContent: 'center',
  },
  appTitle: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#337bff',
    textAlign: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#337bff',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    color: '#337bff',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#337bff',
    padding: 16,
    borderRadius: 10,
    marginTop: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#a0c1ff',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  signupLinkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  signupLink: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  signupLinkBold: {
    color: '#337bff',
    fontWeight: 'bold',
  },
});