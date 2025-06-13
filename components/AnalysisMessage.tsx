// components/AnalysisMessage.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface AnalysisMessageProps {
  message: string;
}

export default function AnalysisMessage({ message }: AnalysisMessageProps) {
  if (!message) {
    return null;
  }

  return (
    <View style={styles.messageContainer}>
      <Text style={styles.messageText}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  messageText: {
    fontSize: 16,
    color: '#2E7D32',
    textAlign: 'center',
    fontWeight: '500',
  },
});