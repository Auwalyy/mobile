import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { Button } from '../../../components/common/Button';
import { COLORS } from '../../../utils/constants';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatarUrl: user?.avatarUrl || user?.profileImage || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch fresh profile data on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setRefreshing(true);
      const response = await api.get('/users/me');
      
      if (response.data.success) {
        const userData = response.data.data;
        
        // Update auth context with fresh data
        updateUser(userData);
        
        // Update local state
        setProfileData({
          name: userData.name || '',
          phone: userData.phone || '',
          avatarUrl: userData.profileImage || userData.avatarUrl || '',
        });
      }
    } catch (error) {
      console.error('Fetch profile error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const sections = [
    {
      id: 'personal',
      title: 'Personal',
      items: [
        { id: 'profile', label: 'Profile', icon: '👤', subtitle: 'View and edit your profile' },
        { id: 'addresses', label: 'Saved Addresses', icon: '📍', subtitle: 'Manage delivery addresses' },
        { id: 'payment', label: 'Payment Methods', icon: '💳', subtitle: 'Manage payment options' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { id: 'notifications', label: 'Notifications', icon: '🔔', subtitle: 'Push notification settings' },
        { id: 'language', label: 'Language', icon: '🌐', subtitle: 'English' },
        { id: 'help', label: 'Help & Support', icon: '❓', subtitle: 'Get help or contact us' },
      ],
    },
    {
      id: 'security',
      title: 'Security',
      items: [
        { id: 'password', label: 'Change Password', icon: '🔒', subtitle: 'Update your password' },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
            }
          },
        },
      ]
    );
  };

  const handleSectionPress = (itemId) => {
    switch (itemId) {
      case 'profile':
        setProfileData({
          name: user?.name || '',
          phone: user?.phone || '',
          avatarUrl: user?.profileImage || user?.avatarUrl || '',
        });
        setEditMode(false);
        setProfileModalVisible(true);
        break;
      case 'password':
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
        setPasswordModalVisible(true);
        break;
      case 'addresses':
        Alert.alert('Coming Soon', 'Saved addresses feature coming soon!');
        break;
      case 'payment':
        Alert.alert('Coming Soon', 'Payment methods feature coming soon!');
        break;
      case 'notifications':
        Alert.alert('Coming Soon', 'Notification settings coming soon!');
        break;
      case 'language':
        Alert.alert('Coming Soon', 'Language settings coming soon!');
        break;
      case 'help':
        Alert.alert('Help & Support', 'Contact us at support@riderr.com');
        break;
      default:
        break;
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        'Please allow access to your photos to upload a profile picture.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setProfileData({ ...profileData, avatarUrl: result.assets[0].uri });
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);

      // Validate inputs
      if (!profileData.name.trim()) {
        Alert.alert('Error', 'Name is required');
        return;
      }

      if (profileData.name.trim().length < 2) {
        Alert.alert('Error', 'Name must be at least 2 characters');
        return;
      }

      const response = await api.patch('/users/me', {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        avatarUrl: profileData.avatarUrl || null,
      });

      if (response.data.success) {
        // Update auth context
        const updatedUser = response.data.data;
        updateUser({
          ...user,
          name: updatedUser.name,
          phone: updatedUser.phone,
          avatarUrl: updatedUser.avatarUrl,
          profileImage: updatedUser.avatarUrl,
        });

        Alert.alert('Success', 'Profile updated successfully!');
        setProfileModalVisible(false);
        setEditMode(false);
      }
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to update profile'
      );
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    try {
      setLoading(true);

      const response = await api.patch('/users/me/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      if (response.data.success) {
        Alert.alert(
          'Success',
          'Password changed successfully. Please log in again.',
          [
            {
              text: 'OK',
              onPress: async () => {
                await logout();
                router.replace('/(auth)/login');
              },
            },
          ]
        );
        setPasswordModalVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }
    } catch (error) {
      console.error('Change password error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to change password'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderProfileModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={profileModalVisible}
      onRequestClose={() => {
        setProfileModalVisible(false);
        setEditMode(false);
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editMode ? 'Edit Profile' : 'Profile Details'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setProfileModalVisible(false);
                setEditMode(false);
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              {profileData.avatarUrl ? (
                <Image
                  source={{ uri: profileData.avatarUrl }}
                  style={styles.modalAvatar}
                />
              ) : (
                <View style={styles.modalAvatar}>
                  <Text style={styles.modalAvatarText}>
                    {profileData.name?.charAt(0).toUpperCase() || user?.name?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {editMode && (
                <TouchableOpacity
                  style={styles.changePhotoButton}
                  onPress={pickImage}
                >
                  <Text style={styles.changePhotoText}>📷 Change Photo</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Full Name</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={profileData.name}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, name: text })
                  }
                  placeholder="Enter your name"
                  placeholderTextColor={COLORS.gray}
                />
              ) : (
                <Text style={styles.formValue}>{profileData.name || user?.name || 'Not set'}</Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Email</Text>
              <Text style={styles.formValue}>{user?.email}</Text>
              <Text style={styles.formHint}>Email cannot be changed</Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Phone Number</Text>
              {editMode ? (
                <TextInput
                  style={styles.input}
                  value={profileData.phone}
                  onChangeText={(text) =>
                    setProfileData({ ...profileData, phone: text })
                  }
                  placeholder="Enter phone number"
                  placeholderTextColor={COLORS.gray}
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.formValue}>
                  {profileData.phone || user?.phone || 'Not set'}
                </Text>
              )}
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Role</Text>
              <Text style={styles.formValue}>
                {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1) || 'Customer'}
              </Text>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Account Status</Text>
              <View style={styles.statusContainer}>
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: user?.isActive
                        ? COLORS.success
                        : COLORS.danger,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.formValue,
                    {
                      color: user?.isActive ? COLORS.success : COLORS.danger,
                    },
                  ]}
                >
                  {user?.isActive ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            {user?.isVerified && (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedIcon}>✓</Text>
                <Text style={styles.verifiedText}>Email Verified</Text>
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            {editMode ? (
              <>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setEditMode(false);
                    setProfileData({
                      name: user?.name || '',
                      phone: user?.phone || '',
                      avatarUrl: user?.profileImage || user?.avatarUrl || '',
                    });
                  }}
                  variant="secondary"
                  style={styles.footerButton}
                />
                <Button
                  title={loading ? 'Saving...' : 'Save Changes'}
                  onPress={updateProfile}
                  disabled={loading}
                  style={styles.footerButton}
                />
              </>
            ) : (
              <Button
                title="Edit Profile"
                onPress={() => setEditMode(true)}
                style={{ flex: 1 }}
              />
            )}
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderPasswordModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={passwordModalVisible}
      onRequestClose={() => {
        setPasswordModalVisible(false);
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });
      }}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TouchableOpacity
              onPress={() => {
                setPasswordModalVisible(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Modal Content */}
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.currentPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, currentPassword: text })
                  }
                  placeholder="Enter current password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showCurrentPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.newPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, newPassword: text })
                  }
                  placeholder="Enter new password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowNewPassword(!showNewPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showNewPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Confirm New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={passwordData.confirmPassword}
                  onChangeText={(text) =>
                    setPasswordData({ ...passwordData, confirmPassword: text })
                  }
                  placeholder="Confirm new password"
                  placeholderTextColor={COLORS.gray}
                  secureTextEntry={!showConfirmPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeButton}
                >
                  <Text style={styles.eyeIcon}>
                    {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.passwordRequirements}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              <Text style={styles.requirementItem}>• At least 6 characters</Text>
              <Text style={styles.requirementItem}>• Different from current password</Text>
            </View>
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <Button
              title="Cancel"
              onPress={() => {
                setPasswordModalVisible(false);
                setPasswordData({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }}
              variant="secondary"
              style={styles.footerButton}
            />
            <Button
              title={loading ? 'Changing...' : 'Change Password'}
              onPress={changePassword}
              disabled={loading}
              style={styles.footerButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <ActivityIndicator 
            animating={refreshing} 
            color={COLORS.primary}
          />
        }
      >
        {/* Header with Avatar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              setProfileData({
                name: user?.name || '',
                phone: user?.phone || '',
                avatarUrl: user?.profileImage || user?.avatarUrl || '',
              });
              setEditMode(false);
              setProfileModalVisible(true);
            }}
          >
            {user?.profileImage || user?.avatarUrl ? (
              <Image 
                source={{ uri: user.profileImage || user.avatarUrl }} 
                style={styles.avatar} 
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
            {user?.isVerified && (
              <View style={styles.verifiedBadgeSmall}>
                <Text style={styles.verifiedCheckmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
        </View>

        {/* Menu Sections */}
        {sections.map((section) => (
          <View key={section.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.menuContainer}>
              {section.items.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index === section.items.length - 1 && styles.menuItemLast,
                  ]}
                  onPress={() => handleSectionPress(item.id)}
                >
                  <View style={styles.menuItemLeft}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.menuIcon}>{item.icon}</Text>
                    </View>
                    <View style={styles.menuTextContainer}>
                      <Text style={styles.menuLabel}>{item.label}</Text>
                      {item.subtitle && (
                        <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutIcon}>🚪</Text>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2024 Riderr. All rights reserved.</Text>
        </View>
      </ScrollView>

      {/* Modals */}
      {renderProfileModal()}
      {renderPasswordModal()}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background || '#f5f5f5',
  },
  header: {
    backgroundColor: COLORS.white || '#fff',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || '#e0e0e0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary || '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white || '#fff',
  },
  verifiedBadgeSmall: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success || '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white || '#fff',
  },
  verifiedCheckmark: {
    color: COLORS.white || '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text || '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: COLORS.gray || '#666',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.gray || '#666',
    marginBottom: 8,
    paddingHorizontal: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  menuContainer: {
    backgroundColor: COLORS.white || '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || '#f0f0f0',
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray || '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuIcon: {
    fontSize: 20,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text || '#333',
  },
  menuSubtitle: {
    fontSize: 13,
    color: COLORS.gray || '#666',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.gray || '#999',
    marginLeft: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.white || '#fff',
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.danger || '#dc3545',
  },
  logoutIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger || '#dc3545',
  },
  footer: {
    alignItems: 'center',
    padding: 32,
  },
  version: {
    fontSize: 12,
    color: COLORS.gray || '#999',
    marginBottom: 4,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.gray || '#999',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white || '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray || '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text || '#333',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.lightGray || '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.text || '#333',
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    maxHeight: '70%',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary || '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white || '#fff',
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.lightBlue || '#e3f2fd',
    borderRadius: 20,
  },
  changePhotoText: {
    color: COLORS.primary || '#007bff',
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text || '#333',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: COLORS.text || '#333',
  },
  formHint: {
    fontSize: 12,
    color: COLORS.gray || '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  input: {
    fontSize: 16,
    color: COLORS.text || '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.lightGray || '#e0e0e0',
    borderRadius: 12,
    backgroundColor: COLORS.white || '#fff',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.lightBlue || '#e3f2fd',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  verifiedIcon: {
    fontSize: 16,
    marginRight: 8,
    color: COLORS.success || '#28a745',
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.success || '#28a745',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.lightGray || '#e0e0e0',
    borderRadius: 12,
    backgroundColor: COLORS.white || '#fff',
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text || '#333',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordRequirements: {
    backgroundColor: COLORS.lightGray || '#f0f0f0',
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text || '#333',
    marginBottom: 8,
  },
  requirementItem: {
    fontSize: 13,
    color: COLORS.gray || '#666',
    marginBottom: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray || '#f0f0f0',
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});