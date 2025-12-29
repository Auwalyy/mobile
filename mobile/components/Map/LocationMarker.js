// components/Map/LocationMarker.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../../utils/constants';

export const LocationMarker = ({ type }) => {
  const isPickup = type === 'pickup';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.marker,
          { backgroundColor: isPickup ? COLORS.success : COLORS.danger },
        ]}
      >
        <View style={styles.innerMarker} />
      </View>
      <View style={styles.label}>
        <Text style={styles.labelText}>{isPickup ? 'Pickup' : 'Dropoff'}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  marker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  innerMarker: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  label: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  labelText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.dark,
  },
});