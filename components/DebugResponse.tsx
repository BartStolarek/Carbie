// components/DebugResponse.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { CarbieResult } from '../types/CarbieTypes';

interface DebugResponseProps {
  fullResponse: CarbieResult;
  initiallyExpanded?: boolean;
}

export default function DebugResponse({ fullResponse, initiallyExpanded = true }: DebugResponseProps) {
  const [showDebugBox, setShowDebugBox] = useState(initiallyExpanded);

  if (!fullResponse) {
    return null;
  }

  return (
    <View style={styles.debugContainer}>
      <View style={styles.debugHeader}>
        <Text style={styles.debugTitle}>Response Details (Debug)</Text>
        <TouchableOpacity 
          onPress={() => setShowDebugBox(!showDebugBox)}
          style={styles.toggleButton}
        >
          <MaterialIcons 
            name={showDebugBox ? "expand-less" : "expand-more"} 
            size={20} 
            color="#2E7D32" 
          />
        </TouchableOpacity>
      </View>
      
      {showDebugBox && (
        <ScrollView style={styles.debugContent} nestedScrollEnabled={true}>
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Model:</Text> {fullResponse.model_name} ({fullResponse.model_version})
          </Text>
          
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Prompt:</Text> {fullResponse.prompt}
          </Text>
          
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Elapsed Time:</Text> {fullResponse.elapsed_time_seconds.toFixed(2)}s
          </Text>
          
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Usage:</Text>
          </Text>
          <View style={styles.usageContainer}>
            {Object.entries(fullResponse.usage).map(([key, value]) => (
              <Text key={key} style={styles.usageText}>
                • {key}: {value}
              </Text>
            ))}
          </View>
          
          <Text style={styles.debugText}>
            <Text style={styles.debugLabel}>Full Response JSON:</Text>
          </Text>
          <Text style={styles.jsonText}>
            {JSON.stringify(fullResponse, null, 2)}
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  debugContainer: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#FFA726',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  debugHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF3E0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E65100',
  },
  toggleButton: {
    padding: 4,
  },
  debugContent: {
    maxHeight: 200,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  debugText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
    lineHeight: 18,
  },
  debugLabel: {
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  usageContainer: {
    paddingLeft: 12,
    marginBottom: 8,
  },
  usageText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 2,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    color: '#444',
    backgroundColor: '#F5F5F5',
    padding: 8,
    borderRadius: 4,
    lineHeight: 16,
  },
});