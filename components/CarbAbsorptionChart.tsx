// components/CarbAbsorptionChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Svg, Path, Text as SvgText, Line, G } from 'react-native-svg';

interface IngredientData {
  ingredient: string;
  is_liquid: boolean;
  estimated_weight_volume: number;
  low_carb_estimate: number;
  high_carb_estimate: number;
  gi_index: number;
  peak_bg_time: string;
}

interface CarbAbsorptionChartProps {
  ingredients: IngredientData[];
}

interface ParsedIngredient {
  ingredient: string;
  peakTimeMinutes: number;
  carbAmount: number;
  color: string;
  giIndex: number;
}

const CHART_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
];

export default function CarbAbsorptionChart({ ingredients }: CarbAbsorptionChartProps) {
  if (!ingredients || ingredients.length === 0) {
    return null;
  }

  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 60;
  const chartHeight = 200;
  const padding = 40;
  const plotWidth = chartWidth - (padding * 2);
  const plotHeight = chartHeight - (padding * 2);

  // Parse peak times from strings like "90min", "45min", etc.
  const parseTimeToMinutes = (timeStr: string): number => {
    const match = timeStr.match(/(\d+)\s*min/i);
    if (match) {
      return parseInt(match[1], 10);
    }
    const hourMatch = timeStr.match(/(\d+(?:\.\d+)?)\s*h/i);
    if (hourMatch) {
      return parseFloat(hourMatch[1]) * 60;
    }
    return 60;
  };

  // Parse ingredients data
  const parsedIngredients: ParsedIngredient[] = ingredients
    .filter(ingredient => (ingredient.low_carb_estimate + ingredient.high_carb_estimate) > 0)
    .map((ingredient, index) => ({
      ingredient: ingredient.ingredient,
      peakTimeMinutes: parseTimeToMinutes(ingredient.peak_bg_time),
      carbAmount: (ingredient.low_carb_estimate + ingredient.high_carb_estimate) / 2,
      color: CHART_COLORS[index % CHART_COLORS.length],
      giIndex: ingredient.gi_index,
    }));

  // Find the maximum values for scaling
  const maxTime = Math.max(...parsedIngredients.map(i => i.peakTimeMinutes));
  const maxCarbs = Math.max(...parsedIngredients.map(i => i.carbAmount));

  // Set time range to 2.5x the largest peak time for better visualization
  const timeRange = maxTime * 2.5;
  const carbRange = maxCarbs * 1.2;

  // Generate skewed curve for each ingredient
  const generateAbsorptionCurve = (peakTime: number, carbAmount: number, giIndex: number): string => {
    const points: string[] = [];
    
    if (carbAmount === 0) {
      return '';
    }
    
    // Calculate skewness based on GI
    // Higher GI = more right-skewed (faster absorption, slower clearance)
    // Lower GI = more symmetric (slower absorption, balanced clearance)
    const skewness = 1.5 + (giIndex / 100 * 1.5); // Range: 1.5 to 3
    
    // Calculate shape parameters for gamma distribution
    const alpha = 2 + (giIndex / 100 * 2); // Shape parameter (2-4)
    const beta = 1 / skewness; // Rate parameter
    
    // Find the mode (peak) of the gamma distribution
    const mode = (alpha - 1) / beta;
    
    // Calculate scaling factor to ensure peak reaches carbAmount
    let maxHeight = 0;
    const testPoints = 200;
    
    // First pass: find the maximum height
    for (let i = 0; i <= testPoints; i++) {
      const t = (i / testPoints) * timeRange;
      if (t > 0) {
        const x = (t / peakTime) * mode;
        if (x > 0) {
          const gammaValue = Math.pow(x, alpha - 1) * Math.exp(-x * beta) * Math.pow(beta, alpha);
          maxHeight = Math.max(maxHeight, gammaValue);
        }
      }
    }
    
    // Calculate normalization factor
    const normalizationFactor = carbAmount / maxHeight;
    
    // Generate points
    const numPoints = 100;
    for (let i = 0; i <= numPoints; i++) {
      const t = (i / numPoints) * timeRange;
      
      let height = 0;
      
      if (t > 0) {
        // Scale time to match peak time
        const x = (t / peakTime) * mode;
        
        if (x > 0) {
          // Gamma distribution PDF
          const gammaValue = Math.pow(x, alpha - 1) * Math.exp(-x * beta) * Math.pow(beta, alpha);
          
          // Normalize to ensure peak reaches carbAmount
          height = gammaValue * normalizationFactor;
          
          // Apply additional dampening for very long tails
          if (t > peakTime * 3) {
            const dampening = Math.exp(-((t - peakTime * 3) / (peakTime * 2)));
            height *= dampening;
          }
          
          // Ensure height doesn't exceed carbAmount
          height = Math.min(height, carbAmount);
        }
      }
      
      // Convert to SVG coordinates
      const x = padding + (t / timeRange) * plotWidth;
      const y = padding + plotHeight - (height / carbRange) * plotHeight;
      
      if (i === 0) {
        points.push(`M ${x} ${padding + plotHeight}`); // Start at (0,0)
      } else {
        points.push(`L ${x} ${y}`);
      }
    }
    
    return points.join(' ');
  };

  // Generate time axis labels
  const timeLabels = [];
  for (let t = 0; t <= timeRange; t += 30) {
    const x = padding + (t / timeRange) * plotWidth;
    const hours = Math.floor(t / 60);
    const minutes = t % 60;
    const label = minutes === 0 ? `${hours}h` : `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    timeLabels.push(
      <G key={t}>
        <Line
          x1={x}
          y1={padding + plotHeight}
          x2={x}
          y2={padding + plotHeight + 5}
          stroke="#666"
          strokeWidth={1}
        />
        <SvgText
          x={x}
          y={padding + plotHeight + 18}
          textAnchor="middle"
          fontSize={10}
          fill="#666"
        >
          {label}
        </SvgText>
      </G>
    );
  }

  // Generate carb axis labels
  const carbLabels = [];
  const carbStep = Math.ceil(carbRange / 4 / 5) * 5;
  for (let c = 0; c <= carbRange; c += carbStep) {
    if (c > carbRange) break;
    const y = padding + plotHeight - (c / carbRange) * plotHeight;
    
    carbLabels.push(
      <G key={c}>
        <Line
          x1={padding - 5}
          y1={y}
          x2={padding}
          y2={y}
          stroke="#666"
          strokeWidth={1}
        />
        <SvgText
          x={padding - 8}
          y={y + 3}
          textAnchor="end"
          fontSize={10}
          fill="#666"
        >
          {Math.round(c)}g
        </SvgText>
      </G>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Carb Absorption Timeline</Text>
      <Text style={styles.subtitle}>Estimated blood glucose impact over time</Text>
      
      <View style={styles.chartContainer}>
        <Svg width={chartWidth} height={chartHeight}>
          {/* Background grid lines */}
          {timeLabels.map((_, index) => {
            const t = index * 30;
            const x = padding + (t / timeRange) * plotWidth;
            return (
              <Line
                key={`grid-${t}`}
                x1={x}
                y1={padding}
                x2={x}
                y2={padding + plotHeight}
                stroke="#E0E0E0"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
            );
          })}
          
          {/* Horizontal grid lines */}
          {carbLabels.map((_, index) => {
            const c = index * carbStep;
            if (c > carbRange) return null;
            const y = padding + plotHeight - (c / carbRange) * plotHeight;
            return (
              <Line
                key={`hgrid-${c}`}
                x1={padding}
                y1={y}
                x2={padding + plotWidth}
                y2={y}
                stroke="#E0E0E0"
                strokeWidth={0.5}
                strokeDasharray="2,2"
              />
            );
          })}
          
          {/* Carb curves for each ingredient */}
          {parsedIngredients.map((ingredient, index) => {
            const pathData = generateAbsorptionCurve(
              ingredient.peakTimeMinutes, 
              ingredient.carbAmount, 
              ingredient.giIndex
            );
            
            if (!pathData) return null;
            
            return (
              <Path
                key={index}
                d={pathData}
                stroke={ingredient.color}
                strokeWidth={2.5}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
          
          {/* Axes */}
          <Line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={padding + plotHeight}
            stroke="#333"
            strokeWidth={2}
          />
          <Line
            x1={padding}
            y1={padding + plotHeight}
            x2={padding + plotWidth}
            y2={padding + plotHeight}
            stroke="#333"
            strokeWidth={2}
          />
          
          {/* Axis labels */}
          {timeLabels}
          {carbLabels}
          
          {/* Axis titles */}
          <SvgText
            x={padding + plotWidth / 2}
            y={chartHeight - 5}
            textAnchor="middle"
            fontSize={12}
            fill="#333"
            fontWeight="600"
          >
            Time
          </SvgText>
          <SvgText
            x={15}
            y={padding + plotHeight / 2}
            textAnchor="middle"
            fontSize={12}
            fill="#333"
            fontWeight="600"
            transform={`rotate(-90, 15, ${padding + plotHeight / 2})`}
          >
            Carbs (g)
          </SvgText>
        </Svg>
      </View>
      
      {/* Legend with GI indicator - Now vertical */}
      <View style={styles.legend}>
        {parsedIngredients.map((ingredient, index) => (
          <View key={`legend-${index}-${ingredient.ingredient}`} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: ingredient.color }]} />
            <Text style={styles.legendText}>
              {ingredient.ingredient} (GI: {ingredient.giIndex})
            </Text>
          </View>
        ))}
      </View>
      
      {/* GI explanation */}
      <View style={styles.giInfo}>
        <Text style={styles.giInfoText}>
          Higher GI foods show faster absorption with extended tails
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 15,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  legend: {
    // Changed from flexDirection: 'row' to column layout
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 10,
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%', // Take full width
    paddingVertical: 4,
  },
  legendColor: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 10,
    flexShrink: 0, // Prevent shrinking
  },
  legendText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
    fontWeight: '500',
  },
  giInfo: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  giInfoText: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});