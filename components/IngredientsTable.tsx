// components/IngredientsTable.tsx
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export interface ResultItem {
  ingredient: string;
  weightVolume: string;
  carbRange: string;
  peakTime: string;
}

interface IngredientsTableProps {
  results: ResultItem[];
}

export default function IngredientsTable({ results }: IngredientsTableProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <ScrollView style={styles.resultsContainer} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={styles.table}>
        {/* Header Row */}
        <View style={[styles.row, styles.headerRow]}>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.35 }]}>Ingredient</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.2 }]}>Amount</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.25 }]}>Carbs</Text>
          <Text style={[styles.cell, styles.headerCell, { flex: 0.2 }]}>Peak BG</Text>
        </View>

        {/* Data Rows */}
        {results.map((item, index) => (
          <View
            key={index.toString()}
            style={[
              styles.row,
              index % 2 === 0 ? styles.evenRow : styles.oddRow,
            ]}
          >
            <Text style={[styles.cell, { flex: 0.35 }]} numberOfLines={2}>
              {item.ingredient}
            </Text>
            <Text style={[styles.cell, { flex: 0.2 }]}>{item.weightVolume}</Text>
            <Text style={[styles.cell, { flex: 0.25 }]}>{item.carbRange}</Text>
            <Text style={[styles.cell, { flex: 0.2 }]}>{item.peakTime}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  resultsContainer: {
    flex: 1,
  },
  table: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  headerRow: {
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  evenRow: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  oddRow: {
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  cell: {
    fontSize: 14,
    color: '#333',
  },
  headerCell: {
    fontWeight: 'bold',
    color: '#2E7D32',
    fontSize: 14,
  },
});