import axios, { AxiosError } from 'axios'
import { router } from 'expo-router'
import React, { useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native'

const SignupScreen = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhoneNo] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  
  const handleSignup = async () => {
    // Validation
    if (!name || !email || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill all fields')
      return
    }
    
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match')
      return
    }
    
    // Accept 10 or 11 digits (including leading 0)
    if (phone.length < 10 || phone.length > 11) {
      Alert.alert('Error', 'Phone number must be 10-11 digits')
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address')
      return
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if (!passwordRegex.test(password)) {
      Alert.alert(
        'Error',
        'Password must be at least 8 characters with:\n• One uppercase letter\n• One lowercase letter\n• One number\n• One special character'
      )
      return
    }
    
    setLoading(true)
    
    try {
      console.log('🚀 Signup attempt:', { name, email, phone })
      
      const response = await axios.post('http://10.151.213.235:5000/api/auth/signup', {
        name,
        email,
        phone,
        password,
        role: "customer"
      })

      console.log('✅ Signup response:', response.data)

      if (response.data.requiresVerification) {
        // Redirect to verification screen
        router.push({
          pathname: '/verificationScreen',
          params: {
            userId: response.data.data.user._id,
            email: response.data.data.user.email,
            phone: response.data.data.user.phone,
          }
        })
      } else {
        Alert.alert('Success', 'Account created successfully!')
        router.push('/login')
      }
      
    } catch (error: unknown) {
      console.error('❌ Signup error details:', error)
      
      let errorMessage = 'Signup failed'
      
      if (axios.isAxiosError(error)) {
        // Type guard for AxiosError
        const axiosError = error as AxiosError<{ message?: string }>
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message
        } else if (axiosError.message) {
          errorMessage = axiosError.message
        }
      } else if (error instanceof Error) {
        // Type guard for standard Error
        errorMessage = error.message
      }
      
      Alert.alert('Error', errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.scrollContainer}>
      <View style={styles.container}>
        <Text style={styles.appTitle}>Riderr</Text>
        <Text style={styles.title}>Create Customer Account</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Phone Number (e.g., 07012345678)"
          value={phone}
          onChangeText={setPhoneNo}
          keyboardType="phone-pad"
          maxLength={11}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TextInput
          style={styles.input}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.loginLinkContainer} 
          onPress={() => router.push('/login')}
        >
          <Text style={styles.loginLink}>
            Already have an account? <Text style={styles.loginLinkBold}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
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
  loginLinkContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  loginLink: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
  },
  loginLinkBold: {
    color: '#337bff',
    fontWeight: 'bold',
  },
})

export default SignupScreen