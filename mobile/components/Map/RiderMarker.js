
// components/Map/RiderMarker.js
import React from 'react';
import { View, Text, StyleSheet } from 'react';
import { Marker } from 'react-native-maps';
import { COLORS } from '../../utils/constants';

export const RiderMarker = ({ rider, onPress }) => {
  return (
    <Marker
      coordinate={{
        latitude: rider.location.latitude,
        longitude: rider.location.longitude,
      }}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View style={styles.marker}>
          <Text style={styles.markerText}>🏍️</Text>
        </View>
        {rider.name && (
          <View style={styles.nameContainer}>
            <Text style={styles.nameText}>{rider.name}</Text>
          </View>
        )}
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  markerText: {
    fontSize: 20,
  },
  nameContainer: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  nameText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.dark,
  },
});

