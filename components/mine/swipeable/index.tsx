import React from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Swipeable from 'react-native-gesture-handler/Swipeable'

interface SwipeableRowProps {
  children: React.ReactNode;
  options: React.ReactNode;
}

export const SwipeableRow = ({ children, options }: SwipeableRowProps) => {
  const renderRightActions = () => {
    return (
      <Pressable style={styles.buttons}>
        {options}
      </Pressable>
    );
  };

  return (
    <Swipeable renderRightActions={renderRightActions}>
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  row: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  buttons: {
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    width: 100,
  },
  deleteText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
