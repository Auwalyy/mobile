import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../utils/constants';

export default function LoginScreen() {
  const [emailOrPhone, setEmailOrPhone] = useState(''); // Fixed: use setEmailOrPhone
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const router = useRouter();

  const validate = () => {
    const newErrors = {};

    if (!emailOrPhone.trim()) {
      newErrors.emailOrPhone = 'Email or Phone is required';
    } else if (!/\S+@\S+\.\S+/.test(emailOrPhone) && !/^\d{10,}$/.test(emailOrPhone.replace(/\D/g, ''))) {
      newErrors.emailOrPhone = 'Enter a valid email or phone number';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // login handler
const handleLogin = async () => {
  if (!validate()) return;

  setLoading(true);
  try {
    console.log('Attempting login with:', { emailOrPhone, password });
    
    const response = await login({ emailOrPhone, password });
    console.log('Login response:', response);
    
    // Extract user data from the nested structure
    let userData;
    
    if (response.data && response.data.user) {
      // Structure: {data: {user: {...}, accessToken: ...}, message: "...", success: true}
      userData = response.data.user;
    } else if (response.user) {
      // Direct structure (if authService returns it differently)
      userData = response.user;
    } else {
      // Fallback
      userData = response;
    }
    
    console.log('Extracted user data:', userData);
    
    if (!userData) {
      throw new Error('No user data received');
    }
    
    // Navigate based on user role
    if (userData.role === 'customer') {
      router.replace('/(customer)/home');
    } else if (userData.role === 'rider') {
      router.replace('/(rider)/home');
    } else {
      Alert.alert('Error', 'Invalid user role');
    }
    
  } catch (error) {
    console.error('Login error:', error);
    Alert.alert(
      'Login Failed',
      error.response?.data?.message || error.message || 'Invalid credentials'
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Sign in to continue</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Email or Phone"
            value={emailOrPhone} // Fixed: use emailOrPhone
            onChangeText={setEmailOrPhone} // Fixed: use setEmailOrPhone
            placeholder="Enter your email or phone"
            keyboardType="email-address"
            autoCapitalize="none"
            error={errors.emailOrPhone} // Fixed: use emailOrPhone
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry
            error={errors.password}
          />

          <Button
            title="Sign In"
            onPress={handleLogin}
            loading={loading}
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={() => router.push('/(auth)/signup')}
            style={styles.signupLink}
          >
            <Text style={styles.signupText}>
              Don't have an account?{' '}
              <Text style={styles.signupTextBold}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.dark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray,
  },
  form: {
    width: '100%',
  },
  loginButton: {
    marginTop: 8,
  },
  signupLink: {
    marginTop: 24,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: COLORS.gray,
  },
  signupTextBold: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});