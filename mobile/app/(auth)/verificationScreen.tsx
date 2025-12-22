import React, { useState, useEffect } from 'react';
import { 
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import axios, { AxiosError } from 'axios';
import { router, useLocalSearchParams } from 'expo-router';

const VerificationScreen = () => {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState<'email' | 'phone' | 'complete'>('email');
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [timer, setTimer] = useState(600); // 10 minutes
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [userData, setUserData] = useState({
    userId: params.userId || '',
    email: params.email || '',
    phone: params.phone || '',
  });

  // Timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0 && currentStep !== 'complete') {
      interval = setInterval(() => {
        setTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer, currentStep]);

  // Check if already verified on mount
  useEffect(() => {
    checkInitialStatus();
  }, []);

  const checkInitialStatus = async () => {
    try {
      // Check if email is already verified
      const checkResponse = await axios.post('http://10.151.213.235:5000/api/auth/check-verification', {
        userId: userData.userId
      });
      
      if (checkResponse.data.isEmailVerified) {
        setIsEmailVerified(true);
        setCurrentStep('phone');
      }
      
      if (checkResponse.data.isPhoneVerified) {
        setIsPhoneVerified(true);
        if (checkResponse.data.isEmailVerified) {
          setCurrentStep('complete');
        }
      }
    } catch (error) {
      console.log('Initial check failed, proceeding normally');
    }
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Verify email - STEP 1 (MANDATORY)
  const handleVerifyEmail = async () => {
    if (!emailCode.trim() || emailCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      console.log('Verifying email...', {
        email: userData.email,
        token: emailCode,
        userId: userData.userId
      });

      const response = await axios.post('http://10.151.213.235:5000/api/auth/verify-email', {
        email: userData.email,
        token: emailCode,
        userId: userData.userId
      });

      console.log('Email verification response:', response.data);

      if (response.data.success) {
        setIsEmailVerified(true);
        setCurrentStep('phone');
        setTimer(600); // Reset timer for phone
        setPhoneCode(''); // Clear phone code input
        
        Alert.alert(
          'Email Verified! ✅',
          'Great! Now please verify your phone number.',
          [{ text: 'Continue', onPress: () => {} }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Email verification failed');
      }
    } catch (error: any) {
      console.error('Email verification error:', error);
      let errorMessage = 'Email verification failed';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Verify phone - STEP 2 (MANDATORY)
  const handleVerifyPhone = async () => {
    if (!phoneCode.trim() || phoneCode.length !== 6) {
      Alert.alert('Error', 'Please enter a valid 6-digit verification code');
      return;
    }

    setLoading(true);
    try {
      console.log('Verifying phone...', {
        phone: userData.phone,
        token: phoneCode,
        userId: userData.userId
      });

      const response = await axios.post('http://10.151.213.235:5000/api/auth/verify-phone', {
        phone: userData.phone,
        token: phoneCode,
        userId: userData.userId
      });

      console.log('Phone verification response:', response.data);

      if (response.data.success) {
        setIsPhoneVerified(true);
        setCurrentStep('complete');
        
        Alert.alert(
          'Phone Verified! ✅',
          'Your account is now fully verified and ready to use.',
          [{ text: 'Continue', onPress: () => {} }]
        );
      } else {
        Alert.alert('Error', response.data.message || 'Phone verification failed');
      }
    } catch (error: any) {
      console.error('Phone verification error:', error);
      let errorMessage = 'Phone verification failed';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Resend verification code
  const handleResendCode = async () => {
    if (timer > 0) {
      Alert.alert('Wait', `Please wait ${formatTime(timer)} before requesting a new code`);
      return;
    }

    try {
      const endpoint = currentStep === 'email' 
        ? 'http://10.151.213.235:5000/api/auth/resend-verification'
        : 'http://10.151.213.235:5000/api/auth/request-verification';

      const data = currentStep === 'email' 
        ? {
            type: 'email',
            identifier: userData.email,
            userId: userData.userId
          }
        : {
            type: 'phone',
            identifier: userData.phone,
            userId: userData.userId
          };

      const response = await axios.post(endpoint, data);

      if (response.data.success) {
        Alert.alert('Success', `Verification code resent to your ${currentStep === 'email' ? 'email' : 'phone'}`);
        setTimer(600); // Reset to 10 minutes
      }
    } catch (error: any) {
      console.error('Resend error:', error);
      let errorMessage = 'Failed to resend code';
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError<{ message?: string }>;
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        }
      }
      
      Alert.alert('Error', errorMessage);
    }
  };

  // Skip email (not recommended but allowed)
  const handleSkipEmail = () => {
    Alert.alert(
      'Skip Email Verification',
      'Email verification is recommended for account security and password recovery. You can verify it later from your profile. Continue to phone verification?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Skip & Continue', 
          onPress: () => {
            setIsEmailVerified(true);
            setCurrentStep('phone');
            setTimer(600);
            Alert.alert('Info', 'Please verify your phone number');
          }
        }
      ]
    );
  };

  // Skip phone (not allowed - mandatory)
  const handleSkipPhone = () => {
    Alert.alert(
      'Phone Verification Required',
      'Phone verification is required for delivery notifications and account security. You must verify your phone number to continue.',
      [{ text: 'OK' }]
    );
  };

  // Go to login (only when both are verified)
  const handleGoToLogin = () => {
    if (isEmailVerified && isPhoneVerified) {
      router.replace('/login');
    } else {
      Alert.alert(
        'Verification Required',
        'Please complete both email and phone verification before logging in.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.content}>
          {/* Title based on current step */}
          <Text style={styles.title}>
            {currentStep === 'email' ? 'Step 1: Verify Email' :
             currentStep === 'phone' ? 'Step 2: Verify Phone' :
             '🎉 Verification Complete!'}
          </Text>
          
          <Text style={styles.subtitle}>
            {currentStep === 'email' ? 'Verify your email address first' :
             currentStep === 'phone' ? 'Now verify your phone number' :
             'Your account is fully verified and ready to use'}
          </Text>

          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {/* Step 1: Email */}
            <View style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                currentStep === 'email' && styles.progressCircleCurrent,
                (currentStep === 'phone' || currentStep === 'complete') && styles.progressCircleActive
              ]}>
                <Text style={styles.progressText}>
                  {currentStep === 'email' ? '1' : '✓'}
                </Text>
              </View>
              <Text style={styles.progressLabel}>Email</Text>
            </View>
            
            {/* Connecting Line */}
            <View style={[
              styles.progressLine,
              (currentStep === 'phone' || currentStep === 'complete') && styles.progressLineActive
            ]} />
            
            {/* Step 2: Phone */}
            <View style={styles.progressStep}>
              <View style={[
                styles.progressCircle,
                currentStep === 'phone' && styles.progressCircleCurrent,
                currentStep === 'complete' && styles.progressCircleActive
              ]}>
                <Text style={styles.progressText}>
                  {currentStep === 'complete' ? '✓' : '2'}
                </Text>
              </View>
              <Text style={styles.progressLabel}>Phone</Text>
            </View>
          </View>

          {/* STEP 1: EMAIL VERIFICATION */}
          {currentStep === 'email' && (
            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Email Verification</Text>
              <Text style={styles.instruction}>
                Enter the 6-digit code sent to:
                {"\n"}
                <Text style={styles.emailHighlight}>{userData.email}</Text>
              </Text>
              
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  Code expires in: <Text style={styles.timerCount}>{formatTime(timer)}</Text>
                </Text>
              </View>
              
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                value={emailCode}
                onChangeText={setEmailCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity 
                style={[styles.verifyButton, (loading || emailCode.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerifyEmail}
                disabled={loading || emailCode.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Email</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2: PHONE VERIFICATION */}
          {currentStep === 'phone' && (
            <View style={styles.verificationSection}>
              <Text style={styles.sectionTitle}>Phone Verification</Text>
              <Text style={styles.instruction}>
                Enter the 6-digit code sent to:
                {"\n"}
                <Text style={styles.phoneHighlight}>{userData.phone}</Text>
              </Text>
              
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>
                  Code expires in: <Text style={styles.timerCount}>{formatTime(timer)}</Text>
                </Text>
              </View>
              
              <TextInput
                style={styles.codeInput}
                placeholder="000000"
                value={phoneCode}
                onChangeText={setPhoneCode}
                keyboardType="number-pad"
                maxLength={6}
                autoFocus
                placeholderTextColor="#999"
              />
              
              <TouchableOpacity 
                style={[styles.verifyButton, (loading || phoneCode.length !== 6) && styles.buttonDisabled]}
                onPress={handleVerifyPhone}
                disabled={loading || phoneCode.length !== 6}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Verify Phone</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 3: COMPLETE */}
          {currentStep === 'complete' && (
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Text style={styles.successIconText}>✓</Text>
              </View>
              <Text style={styles.successTitle}>Verification Complete!</Text>
              <Text style={styles.successMessage}>
                Both your email and phone have been verified.
                {"\n"}
                Your account is now fully activated.
              </Text>
              
              <TouchableOpacity 
                style={styles.loginSuccessButton}
                onPress={() => router.replace('/login')}
              >
                <Text style={styles.loginSuccessButtonText}>Go to Login</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Resend Code Button (only for email/phone steps) */}
          {currentStep !== 'complete' && (
            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleResendCode}
              disabled={timer > 0}
            >
              <Text style={[styles.resendText, timer > 0 && styles.resendDisabled]}>
                {timer > 0 ? `Resend in ${formatTime(timer)}` : 
                 `Resend ${currentStep === 'email' ? 'Email' : 'Phone'} Code`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Skip Button (only for email step) */}
          {currentStep === 'email' && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={handleSkipEmail}
            >
              <Text style={styles.skipText}>Skip email for now</Text>
            </TouchableOpacity>
          )}

          {/* Skip Button for phone (shows warning) */}
          {currentStep === 'phone' && (
            <TouchableOpacity 
              style={[styles.skipButton, styles.skipButtonWarning]}
              onPress={handleSkipPhone}
            >
              <Text style={[styles.skipText, styles.skipTextWarning]}>Skip phone (not recommended)</Text>
            </TouchableOpacity>
          )}

          {/* User Information */}
          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Account Information</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Text style={styles.infoLabel}>Email:</Text>
                {isEmailVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.infoValue}>{userData.email}</Text>
            </View>
            
            <View style={styles.infoRow}>
              <View style={styles.infoLabelContainer}>
                <Text style={styles.infoLabel}>Phone:</Text>
                {isPhoneVerified && (
                  <View style={styles.verifiedBadge}>
                    <Text style={styles.verifiedBadgeText}>✓ Verified</Text>
                  </View>
                )}
              </View>
              <Text style={styles.infoValue}>{userData.phone}</Text>
            </View>
          </View>

          {/* Login Button (always visible but disabled if not complete) */}
          <TouchableOpacity 
            style={[
              styles.loginButton,
              (currentStep !== 'complete') && styles.loginButtonDisabled
            ]}
            onPress={handleGoToLogin}
            disabled={currentStep !== 'complete'}
          >
            <Text style={[
              styles.loginText,
              (currentStep !== 'complete') && styles.loginTextDisabled
            ]}>
              {currentStep === 'complete' ? 'Go to Login' : 'Complete Verification First'}
            </Text>
          </TouchableOpacity>

          {/* Debug Button (optional) */}
          {__DEV__ && (
            <TouchableOpacity 
              style={styles.debugButton}
              onPress={async () => {
                try {
                  const response = await axios.post('http://10.151.213.235:5000/api/auth/debug-user', {
                    userId: userData.userId
                  });
                  
                  Alert.alert(
                    'Debug Info',
                    `User ID: ${userData.userId}\n` +
                    `Email Verified: ${response.data.isEmailVerified ? 'Yes' : 'No'}\n` +
                    `Phone Verified: ${response.data.isPhoneVerified ? 'Yes' : 'No'}\n` +
                    `Current Step: ${currentStep}`
                  );
                } catch (error) {
                  console.error('Debug error:', error);
                }
              }}
            >
              <Text style={styles.debugText}>Debug Info</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#337bff',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressStep: {
    alignItems: 'center',
  },
  progressCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressCircleCurrent: {
    backgroundColor: '#337bff',
    borderWidth: 3,
    borderColor: '#337bff',
  },
  progressCircleActive: {
    backgroundColor: '#4CAF50',
  },
  progressText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  progressLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  progressLine: {
    width: 60,
    height: 3,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 10,
    marginTop: -20,
  },
  progressLineActive: {
    backgroundColor: '#4CAF50',
  },
  verificationSection: {
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },
  instruction: {
    fontSize: 15,
    color: '#666',
    marginBottom: 20,
    lineHeight: 22,
    textAlign: 'center',
  },
  emailHighlight: {
    fontWeight: 'bold',
    color: '#337bff',
    fontSize: 16,
  },
  phoneHighlight: {
    fontWeight: 'bold',
    color: '#337bff',
    fontSize: 16,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 25,
    padding: 12,
    backgroundColor: '#e8f0ff',
    borderRadius: 10,
  },
  timerText: {
    fontSize: 15,
    color: '#666',
  },
  timerCount: {
    fontWeight: 'bold',
    color: '#337bff',
    fontSize: 18,
  },
  codeInput: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 18,
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 25,
    letterSpacing: 10,
    fontWeight: 'bold',
    color: '#333',
  },
  verifyButton: {
    backgroundColor: '#337bff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#337bff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#a0c1ff',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resendButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  resendText: {
    color: '#337bff',
    fontSize: 16,
    fontWeight: '500',
  },
  resendDisabled: {
    color: '#999',
  },
  skipButton: {
    padding: 15,
    alignItems: 'center',
    marginBottom: 25,
  },
  skipButtonWarning: {
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
    paddingVertical: 12,
  },
  skipText: {
    color: '#666',
    fontSize: 15,
  },
  skipTextWarning: {
    color: '#FF9800',
    fontWeight: '500',
  },
  infoBox: {
    backgroundColor: '#f0f8ff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#d1e7ff',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#337bff',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'center',
  },
  infoLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
  },
  infoLabel: {
    fontSize: 15,
    color: '#666',
    marginRight: 8,
  },
  verifiedBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  verifiedBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  successContainer: {
    backgroundColor: '#f0fff0',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 25,
    borderWidth: 1,
    borderColor: '#d0f0d0',
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIconText: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 24,
  },
  loginSuccessButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginSuccessButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginButton: {
    backgroundColor: '#337bff',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 15,
  },
  loginButtonDisabled: {
    backgroundColor: '#e0e0e0',
  },
  loginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginTextDisabled: {
    color: '#999',
  },
  debugButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 10,
  },
  debugText: {
    color: '#666',
    fontSize: 12,
  },
});

export default VerificationScreen;