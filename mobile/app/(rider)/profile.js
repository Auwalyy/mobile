import React, { useState } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { COLORS } from '../../utils/constants';
import * as ImagePicker from 'expo-image-picker';
import api from '../../services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const router = useRouter();
  
  const [loading, setLoading] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    phone: user?.phoneNumber || '',
    avatarUrl: user?.avatarUrl || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const sections = [
    {
      id: 'personal',
      title: 'Personal',
      items: [
        { id: 'profile', label: 'Profile', icon: '👤' },
        { id: 'addresses', label: 'Saved Addresses', icon: '📍' },
        { id: 'payment', label: 'Payment Methods', icon: '💳' },
      ],
    },
    {
      id: 'settings',
      title: 'Settings',
      items: [
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
        { id: 'language', label: 'Language', icon: '🌐' },
        { id: 'help', label: 'Help & Support', icon: '❓' },
      ],
    },
  ];

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleSectionPress = (itemId) => {
    switch (itemId) {
      case 'profile':
        setFormData({
          name: user?.fullName || '',
          phone: user?.phoneNumber || '',
          avatarUrl: user?.avatarUrl || '',
        });
        setEditMode(false);
        setProfileModalVisible(true);
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
        Alert.alert('Help & Support', 'Contact us at support@deliveryapp.com');
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
      setFormData({ ...formData, avatarUrl: result.assets[0].uri });
    }
  };

  const updateProfile = async () => {
    try {
      setLoading(true);

      const response = await api.patch('/users/me', {
        name: formData.name,
        phone: formData.phone,
        avatarUrl: formData.avatarUrl,
      });

      if (response.data.success) {
        // Update auth context
        updateUser({
          ...user,
          fullName: response.data.data.name,
          phoneNumber: response.data.data.phone,
          avatarUrl: response.data.data.avatarUrl,
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

      const response = await api.put('/users/me/password', {
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

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Header with Avatar */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => {
              setFormData({
                name: user?.fullName || '',
                phone: user?.phoneNumber || '',
                avatarUrl: user?.avatarUrl || '',
              });
              setEditMode(false);
              setProfileModalVisible(true);
            }}
          >
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.userName}>{user?.fullName}</Text>
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
                    <Text style={styles.menuIcon}>{item.icon}</Text>
                    <Text style={styles.menuLabel}>{item.label}</Text>
                  </View>
                  <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.version}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Profile Modal */}
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
            <ScrollView style={styles.modalContent}>
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                {formData.avatarUrl ? (
                  <Image
                    source={{ uri: formData.avatarUrl }}
                    style={styles.modalAvatar}
                  />
                ) : (
                  <View style={styles.modalAvatar}>
                    <Text style={styles.modalAvatarText}>
                      {formData.name?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  </View>
                )}
                {editMode && (
                  <TouchableOpacity
                    style={styles.changePhotoButton}
                    onPress={pickImage}
                  >
                    <Text style={styles.changePhotoText}>Change Photo</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Name</Text>
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(text) =>
                      setFormData({ ...formData, name: text })
                    }
                    placeholder="Enter your name"
                  />
                ) : (
                  <Text style={styles.formValue}>{formData.name}</Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <Text style={styles.formValue}>{user?.email}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Phone Number</Text>
                {editMode ? (
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(text) =>
                      setFormData({ ...formData, phone: text })
                    }
                    placeholder="Enter phone number"
                    keyboardType="phone-pad"
                  />
                ) : (
                  <Text style={styles.formValue}>
                    {formData.phone || 'Not set'}
                  </Text>
                )}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Role</Text>
                <Text style={styles.formValue}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Status</Text>
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
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              {editMode ? (
                <>
                  <Button
                    title="Cancel"
                    onPress={() => {
                      setEditMode(false);
                      setFormData({
                        name: user?.fullName || '',
                        phone: user?.phoneNumber || '',
                        avatarUrl: user?.avatarUrl || '',
                      });
                    }}
                    variant="secondary"
                    style={styles.footerButton}
                  />
                  <Button
                    title={loading ? 'Saving...' : 'Save'}
                    onPress={updateProfile}
                    disabled={loading}
                    style={styles.footerButton}
                  />
                </>
              ) : (
                <>
                  <Button
                    title="Change Password"
                    onPress={() => {
                      setProfileModalVisible(false);
                      setPasswordModalVisible(true);
                    }}
                    variant="secondary"
                    style={styles.footerButton}
                  />
                  <Button
                    title="Edit Profile"
                    onPress={() => setEditMode(true)}
                    style={styles.footerButton}
                  />
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Password Modal */}
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
                onPress={() => setPasswordModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            <ScrollView style={styles.modalContent}>
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

              <Text style={styles.passwordHint}>
                Password must be at least 6 characters long
              </Text>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  menuContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  menuItemLast: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuLabel: {
    fontSize: 16,
    color: COLORS.dark,
  },
  chevron: {
    fontSize: 24,
    color: COLORS.gray,
  },
  logoutButton: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.danger,
  },
  footer: {
    alignItems: 'center',
    padding: 24,
  },
  version: {
    fontSize: 12,
    color: COLORS.gray,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.white,
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
    borderBottomColor: COLORS.borderLight,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.dark,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: COLORS.dark,
  },
  modalContent: {
    padding: 20,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalAvatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primaryLight,
    borderRadius: 20,
  },
  changePhotoText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.gray,
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: COLORS.dark,
  },
  input: {
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
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
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    backgroundColor: COLORS.white,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.dark,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  eyeButton: {
    padding: 12,
  },
  eyeIcon: {
    fontSize: 20,
  },
  passwordHint: {
    fontSize: 12,
    color: COLORS.gray,
    fontStyle: 'italic',
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    gap: 12,
  },
  footerButton: {
    flex: 1,
  },
});