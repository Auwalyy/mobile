import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'

interface OrderItem {
  id: string
  name: string
  quantity: number
  price: number
  restaurantId: string
}

interface OrderSummaryProps {
  items: OrderItem[]
  onCheckout: () => void
}

const OrderSummary: React.FC<OrderSummaryProps> = ({ items, onCheckout }) => {
  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const calculateItemCount = () => {
    return items.reduce((count, item) => count + item.quantity, 0)
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.cartInfo}>
          <Ionicons name="cart" size={20} color="#337bff" />
          <Text style={styles.cartText}>
            {calculateItemCount()} item{calculateItemCount() !== 1 ? 's' : ''} in cart
          </Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="chevron-up" size={24} color="#666" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.itemsScroll}
        contentContainerStyle={styles.itemsContainer}
      >
        {items.map(item => (
          <View key={item.id} style={styles.itemBadge}>
            <Text style={styles.itemBadgeText}>
              {item.quantity}x {item.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalAmount}>₦{calculateTotal().toLocaleString()}</Text>
        </View>
        <TouchableOpacity style={styles.checkoutButton} onPress={onCheckout}>
          <Text style={styles.checkoutText}>Checkout</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  itemsScroll: {
    marginBottom: 12,
  },
  itemsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  itemBadge: {
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  itemBadgeText: {
    fontSize: 12,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  totalLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#337bff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})

export default OrderSummary