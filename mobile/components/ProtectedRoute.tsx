// components/ProtectedRoute.tsx
import { Redirect } from 'expo-router'
import { useAuth } from '../context/AuthContext'
import { ActivityIndicator, View } from 'react-native'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#337bff" />
      </View>
    )
  }

  if (!user) {
    return <Redirect href="/login" />
  }

  return <>{children}</>
}