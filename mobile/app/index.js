
 import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { Loading } from '../components/common/Loading';

export default function Index() {
  const { isAuthenticated, user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        if (user.role === 'customer') {
          router.replace('/(customer)/home');
        } else if (user.role === 'rider') {
          router.replace('/(rider)/home');
        } else {
          router.replace('/(auth)/login');
        }
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [isAuthenticated, user, loading]);

  return <Loading />;
}
