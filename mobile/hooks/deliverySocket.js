// ============================================
// SERVER SIDE: socket/deliverySocket.js
// ============================================
import DeliveryPerson from "../models/deliveryPerson.model.js";
import Delivery from "../models/delivery.models.js";
import jwt from 'jsonwebtoken';
import User from "../models/user.model.js";

// Store online delivery persons with their socket IDs
const onlineDeliveryPersons = new Map(); // userId -> { socketId, location, services }
const deliveryRequests = new Map(); // deliveryId -> { customer data, timeout }

// Authentication middleware
const authenticateSocket = (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const userId = socket.handshake.auth.userId;
    const userType = socket.handshake.query.userType;

    console.log('🔐 Socket auth attempt:', { 
      socketId: socket.id,
      userId, 
      userType 
    });

    if (!token) {
      console.log('❌ Missing token');
      return next(new Error('Authentication error: Token is required'));
    }

    if (!userId) {
      console.log('❌ Missing userId');
      return next(new Error('Authentication error: User ID is required'));
    }

    // For testing, skip JWT verification in development
    if (process.env.NODE_ENV === 'production') {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      if (decoded.userId !== userId) {
        return next(new Error('Authentication error: Token mismatch'));
      }
    }

    socket.userId = userId;
    socket.userType = userType || 'delivery_person';

    console.log(`✅ Socket authenticated: ${socket.userType} - ${socket.userId}`);
    next();

  } catch (error) {
    console.error('🔐 Socket auth error:', error.message);
    next(new Error(`Authentication error: ${error.message}`));
  }
};

export const setupDeliverySocket = (io) => {
  
  // Apply authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log('\n🔌 CLIENT CONNECTED:');
    console.log('   Socket ID:', socket.id);
    console.log('   User ID:', socket.userId);
    console.log('   User Type:', socket.userType);
    console.log('   Time:', new Date().toISOString());

    // Send connection confirmation
    socket.emit('connection:established', {
      success: true,
      message: `Connected as ${socket.userType}`,
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });

    // ==========================================
    // DELIVERY PERSON EVENTS
    // ==========================================
    
    /**
     * Delivery person goes online
     */
    socket.on('delivery_person:online', async (data) => {
      try {
        const { userId, deliveryPersonId, location, services } = data;
        
        console.log(`🟢 Delivery person ${userId} is going online`);

        // Find delivery person in database
        let deliveryPerson;
        if (deliveryPersonId) {
          deliveryPerson = await DeliveryPerson.findById(deliveryPersonId)
            .populate('userId', 'name email phone avatarUrl');
        } else {
          deliveryPerson = await DeliveryPerson.findOne({ userId })
            .populate('userId', 'name email phone avatarUrl');
        }

        if (!deliveryPerson) {
          console.log(`❌ Delivery person not found for userId: ${userId}`);
          socket.emit('delivery_person:online_error', {
            success: false,
            message: 'Delivery person not found in database'
          });
          return;
        }

        // Store online status
        onlineDeliveryPersons.set(userId, {
          socketId: socket.id,
          userId,
          deliveryPersonId: deliveryPerson._id,
          location: {
            lat: location.lat,
            lng: location.lng
          },
          services: services || { deliveries: true, rides: false },
          updatedAt: new Date(),
          isAvailable: true
        });

        // Update database
        await DeliveryPerson.findByIdAndUpdate(deliveryPerson._id, { 
          isOnline: true,
          isAvailable: true,
          'currentLocation.lat': location.lat,
          'currentLocation.lng': location.lng,
          lastOnlineAt: new Date()
        });

        console.log(`✅ Delivery person ${userId} is now online (${deliveryPerson._id})`);
        console.log(`📍 Location: ${location.lat}, ${location.lng}`);
        console.log(`📊 Total online delivery persons: ${onlineDeliveryPersons.size}`);
        
        socket.emit('delivery_person:online_success', {
          success: true,
          message: 'You are now online and ready to receive deliveries',
          deliveryPersonId: deliveryPerson._id
        });

      } catch (error) {
        console.error('❌ Error setting delivery person online:', error);
        socket.emit('delivery_person:online_error', {
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Delivery person goes offline
     */
    socket.on('delivery_person:offline', async (data) => {
      try {
        const { userId, deliveryPersonId } = data;
        
        // Remove from online map
        onlineDeliveryPersons.delete(userId);

        // Update database
        if (deliveryPersonId) {
          await DeliveryPerson.findByIdAndUpdate(deliveryPersonId, {
            isOnline: false,
            isAvailable: false,
            lastOnlineAt: new Date()
          });
        }

        console.log(`🔴 Delivery person ${userId} is offline`);
        console.log(`📊 Total online delivery persons: ${onlineDeliveryPersons.size}`);
        
        socket.emit('delivery_person:offline_success', {
          success: true,
          message: 'You are now offline'
        });

      } catch (error) {
        console.error('❌ Error setting delivery person offline:', error);
      }
    });

    /**
     * Update delivery person location
     */
    socket.on('delivery_person:location_update', async (data) => {
      try {
        const { userId, location } = data;
        
        // Update in-memory map
        const person = onlineDeliveryPersons.get(userId);
        if (person) {
          person.location = {
            lat: location.lat,
            lng: location.lng
          };
          person.updatedAt = new Date();
          onlineDeliveryPersons.set(userId, person);
        }

        // Update database (debounced in real app)
        await DeliveryPerson.findOneAndUpdate(
          { userId },
          { 
            'currentLocation.lat': location.lat,
            'currentLocation.lng': location.lng,
            'currentLocation.updatedAt': new Date()
          }
        );

      } catch (error) {
        console.error('❌ Error updating location:', error);
      }
    });

    /**
     * Delivery person accepts delivery
     */
    socket.on('delivery_person:accept_delivery', async (data) => {
      try {
        const { deliveryId, deliveryPersonId } = data;

        console.log(`✅ Delivery person ${deliveryPersonId} accepting delivery ${deliveryId}`);

        // Find delivery
        const delivery = await Delivery.findById(deliveryId);
        if (!delivery) {
          socket.emit('delivery:accept_error', {
            success: false,
            message: 'Delivery not found'
          });
          return;
        }

        if (delivery.status !== 'created') {
          socket.emit('delivery:accept_error', {
            success: false,
            message: 'Delivery already assigned'
          });
          return;
        }

        // Find delivery person
        const deliveryPerson = await DeliveryPerson.findById(deliveryPersonId);
        if (!deliveryPerson) {
          socket.emit('delivery:accept_error', {
            success: false,
            message: 'Delivery person not found'
          });
          return;
        }

        // Assign delivery
        delivery.deliveryPersonId = deliveryPersonId;
        delivery.status = 'assigned';
        delivery.assignedAt = new Date();
        await delivery.save();

        // Update delivery person
        await DeliveryPerson.findByIdAndUpdate(deliveryPersonId, {
          currentDeliveryId: deliveryId,
          isAvailable: false,
          lastDeliveryAt: new Date()
        });

        // Clear timeout for this delivery
        const request = deliveryRequests.get(deliveryId);
        if (request?.timeout) {
          clearTimeout(request.timeout);
        }
        deliveryRequests.delete(deliveryId);

        // Notify delivery person
        socket.emit('delivery:assigned_success', {
          success: true,
          message: 'Delivery assigned to you',
          delivery: await delivery.populate('customerId', 'name phone')
        });

        // Notify customer
        const customerSocketId = request?.customerSocketId;
        if (customerSocketId) {
          io.to(customerSocketId).emit('delivery:assigned', {
            success: true,
            message: 'Delivery person assigned!',
            delivery: await delivery.populate([
              { 
                path: 'deliveryPersonId',
                populate: { path: 'userId', select: 'name phone avatarUrl' }
              }
            ])
          });
        }

        console.log(`✅ Delivery ${deliveryId} assigned to ${deliveryPersonId}`);

      } catch (error) {
        console.error('❌ Error accepting delivery:', error);
        socket.emit('delivery:accept_error', {
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Delivery person rejects delivery
     */
    socket.on('delivery_person:reject_delivery', async (data) => {
      try {
        const { deliveryId, reason } = data;
        
        console.log(`❌ Delivery ${deliveryId} rejected: ${reason}`);
        
        // Find next available delivery person
        await findAndNotifyNextDeliveryPerson(deliveryId, io);

      } catch (error) {
        console.error('❌ Error rejecting delivery:', error);
      }
    });

    // ==========================================
    // CUSTOMER EVENTS
    // ==========================================

    /**
     * Customer creates delivery and searches for nearby delivery persons
     */
    socket.on('delivery:create_and_search', async (data) => {
      try {
        const { delivery, pickupLocation } = data;

        console.log('\n📦 NEW DELIVERY REQUEST:');
        console.log('   Delivery ID:', delivery._id);
        console.log('   Pickup Location:', pickupLocation);
        console.log('   Customer ID:', delivery.customerId);

        // Find nearby online delivery persons
        const nearbyPersons = await findNearbyDeliveryPersons(
          pickupLocation.lat,
          pickupLocation.lng,
          10000 // 10km radius
        );

        console.log(`📍 Found ${nearbyPersons.length} nearby delivery persons`);

        if (nearbyPersons.length === 0) {
          console.log('❌ No delivery persons available');
          socket.emit('delivery:no_persons_available', {
            success: false,
            message: 'No delivery persons available in your area',
            delivery
          });
          return;
        }

        // Store delivery request with customer socket ID
        deliveryRequests.set(delivery._id, {
          deliveryId: delivery._id,
          customerSocketId: socket.id,
          pickupLocation,
          nearbyPersons,
          notifiedPersons: [],
          createdAt: new Date()
        });

        console.log(`📝 Stored delivery request for ${delivery._id}`);

        // Notify nearby delivery persons (one at a time)
        await notifyNextDeliveryPerson(delivery._id, io);

        // Set timeout for auto-cancellation (5 minutes)
        const timeout = setTimeout(async () => {
          const request = deliveryRequests.get(delivery._id);
          if (request) {
            await Delivery.findByIdAndUpdate(delivery._id, {
              status: 'cancelled',
              cancellationReason: 'No delivery person accepted within time limit'
            });

            socket.emit('delivery:auto_cancelled', {
              success: false,
              message: 'No delivery person available. Please try again.',
              deliveryId: delivery._id
            });

            deliveryRequests.delete(delivery._id);
            console.log(`⏰ Delivery ${delivery._id} auto-cancelled after 5 minutes`);
          }
        }, 5 * 60 * 1000); // 5 minutes

        deliveryRequests.get(delivery._id).timeout = timeout;

        // Notify customer
        socket.emit('delivery:searching', {
          success: true,
          message: `Searching for delivery persons... Found ${nearbyPersons.length} nearby`,
          nearbyCount: nearbyPersons.length
        });

        console.log(`🔍 Started search for delivery ${delivery._id}`);

      } catch (error) {
        console.error('❌ Error creating and searching delivery:', error);
        socket.emit('delivery:search_error', {
          success: false,
          message: error.message
        });
      }
    });

    /**
     * Customer cancels delivery search
     */
    socket.on('delivery:cancel_search', async (data) => {
      try {
        const { deliveryId } = data;

        const request = deliveryRequests.get(deliveryId);
        if (request?.timeout) {
          clearTimeout(request.timeout);
        }
        deliveryRequests.delete(deliveryId);

        await Delivery.findByIdAndUpdate(deliveryId, {
          status: 'cancelled',
          cancellationReason: 'Cancelled by customer'
        });

        socket.emit('delivery:cancelled', {
          success: true,
          message: 'Delivery search cancelled'
        });

        console.log(`❌ Delivery ${deliveryId} cancelled by customer`);

      } catch (error) {
        console.error('❌ Error cancelling delivery:', error);
      }
    });

    /**
     * Test event
     */
    socket.on('test:event', (data) => {
      console.log('🧪 Test event received:', data);
      socket.emit('test:response', {
        success: true,
        message: 'Test received from server',
        data
      });
    });

    // ==========================================
    // DISCONNECT
    // ==========================================
    socket.on('disconnect', () => {
      console.log('\n🔌 CLIENT DISCONNECTED:');
      console.log('   Socket ID:', socket.id);
      console.log('   User ID:', socket.userId);
      console.log('   Reason: disconnect');
      console.log('   Time:', new Date().toISOString());

      // Find and remove disconnected delivery person
      for (const [userId, person] of onlineDeliveryPersons.entries()) {
        if (person.socketId === socket.id) {
          onlineDeliveryPersons.delete(userId);
          
          // Update database
          DeliveryPerson.findOneAndUpdate(
            { userId },
            { 
              isOnline: false,
              isAvailable: false 
            }
          ).catch(err => console.error('Error updating offline status:', err));
          
          console.log(`❌ Delivery person ${userId} went offline (disconnect)`);
          console.log(`📊 Total online delivery persons: ${onlineDeliveryPersons.size}`);
          break;
        }
      }
    });
  });
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Calculate distance between two coordinates
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find nearby online delivery persons
 */
async function findNearbyDeliveryPersons(lat, lng, maxDistance) {
  const nearby = [];

  console.log(`📍 Searching for delivery persons near ${lat}, ${lng}`);
  console.log(`📍 Max distance: ${maxDistance/1000}km`);
  console.log(`📍 Total online delivery persons: ${onlineDeliveryPersons.size}`);

  for (const [userId, person] of onlineDeliveryPersons.entries()) {
    if (person.services?.deliveries && person.isAvailable) {
      const distance = calculateDistance(
        lat,
        lng,
        person.location.lat,
        person.location.lng
      );

      console.log(`   📍 ${userId}: ${distance.toFixed(2)}km away`);

      if (distance <= maxDistance / 1000) { // Convert to km
        // Get full details from database
        const deliveryPerson = await DeliveryPerson.findById(person.deliveryPersonId)
          .populate('userId', 'name phone avatarUrl');

        if (deliveryPerson && deliveryPerson.isAvailable) {
          nearby.push({
            ...deliveryPerson.toObject(),
            socketId: person.socketId,
            distance,
            distanceText: `${distance.toFixed(1)} km`
          });
          console.log(`   ✅ Added: ${deliveryPerson._id} (${distance.toFixed(2)}km)`);
        }
      }
    }
  }

  // Sort by distance
  nearby.sort((a, b) => a.distance - b.distance);

  console.log(`📍 Found ${nearby.length} nearby delivery persons`);
  return nearby;
}

/**
 * Notify next available delivery person
 */
async function notifyNextDeliveryPerson(deliveryId, io) {
  const request = deliveryRequests.get(deliveryId);
  if (!request) {
    console.log(`❌ No request found for delivery ${deliveryId}`);
    return;
  }

  const { nearbyPersons, notifiedPersons = [] } = request;

  console.log(`📢 Notifying delivery persons for ${deliveryId}`);
  console.log(`   Nearby persons: ${nearbyPersons.length}`);
  console.log(`   Already notified: ${notifiedPersons.length}`);

  // Find next person who hasn't been notified
  const nextPerson = nearbyPersons.find(
    person => !notifiedPersons.includes(person._id.toString())
  );

  if (!nextPerson) {
    // No more persons to notify
    console.log(`❌ No more delivery persons to notify for ${deliveryId}`);
    const customerSocketId = request.customerSocketId;
    if (customerSocketId) {
      io.to(customerSocketId).emit('delivery:no_persons_available', {
        success: false,
        message: 'All nearby delivery persons are busy or declined'
      });
    }
    return;
  }

  // Mark as notified
  notifiedPersons.push(nextPerson._id.toString());
  request.notifiedPersons = notifiedPersons;
  deliveryRequests.set(deliveryId, request);

  // Get delivery details
  const delivery = await Delivery.findById(deliveryId)
    .populate('customerId', 'name phone');

  console.log(`📢 Notifying delivery person ${nextPerson._id} about delivery ${deliveryId}`);
  console.log(`   Socket ID: ${nextPerson.socketId}`);
  console.log(`   Distance: ${nextPerson.distanceText}`);

  // Send notification to delivery person
  io.to(nextPerson.socketId).emit('delivery:new_request', {
    success: true,
    message: 'New delivery request!',
    delivery,
    distance: nextPerson.distanceText,
    expiresIn: 30 // seconds to respond
  });

  // Set timeout for this person to respond (30 seconds)
  setTimeout(async () => {
    const currentRequest = deliveryRequests.get(deliveryId);
    if (currentRequest && currentRequest.notifiedPersons.includes(nextPerson._id.toString())) {
      console.log(`⏰ Delivery person ${nextPerson._id} didn't respond, notifying next`);
      // Person didn't respond, notify next one
      await notifyNextDeliveryPerson(deliveryId, io);
    }
  }, 30000);
}

/**
 * Find and notify next delivery person after rejection
 */
async function findAndNotifyNextDeliveryPerson(deliveryId, io) {
  console.log(`🔄 Finding next delivery person for ${deliveryId}`);
  await notifyNextDeliveryPerson(deliveryId, io);
}

/**
 * Broadcast delivery status update
 */
export function broadcastDeliveryStatusUpdate(io, deliveryId, status, data = {}) {
  io.to(`delivery:${deliveryId}`).emit('delivery:status_update', {
    success: true,
    deliveryId,
    status,
    ...data
  });
}

/**
 * Notify delivery person location update to customer
 */
export function broadcastDeliveryPersonLocation(io, deliveryId, location) {
  io.to(`delivery:${deliveryId}`).emit('delivery_person:location_update', {
    success: true,
    location
  });
}