// components/TotalAnalysis.tsx
import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing, 
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export interface IngredientData {
  ingredient: string;
  is_liquid: boolean;
  estimated_weight_volume: number;
  low_carb_estimate: number;
  high_carb_estimate: number;
  peak_bg_time: string; // e.g. "60min"
}

interface TotalAnalysisProps {
  ingredients: IngredientData[];
}

const { width: screenWidth } = Dimensions.get('window');

// Individual metric card component
const MetricCard = ({ 
  icon, 
  title, 
  value, 
  subtitle, 
  color = '#2E7D32',
  delay = 0 
}: {
  icon: string;
  title: string;
  value: string;
  subtitle?: string;
  color?: string;
  delay?: number;
}) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.metricCard,
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim }
          ],
        },
      ]}
    >
      <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
        <MaterialIcons name={icon as any} size={24} color={color} />
      </View>
      
      <View style={styles.metricContent}>
        <Text style={[styles.metricTitle, { color }]}>{title}</Text>
        <Text style={styles.metricValue}>{value}</Text>
        {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
      </View>
    </Animated.View>
  );
};

// Summary card component
const SummaryCard = ({ 
  title, 
  items, 
  delay = 0 
}: {
  title: string;
  items: Array<{ label: string; value: string; color?: string }>;
  delay?: number;
}) => {
  const slideAnim = useRef(new Animated.Value(30)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        delay,
        easing: Easing.out(Easing.bezier(0.25, 0.46, 0.45, 0.94)),
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        delay,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.summaryCard,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <Text style={styles.summaryTitle}>{title}</Text>
      <View style={styles.summaryContent}>
        {items.map((item, index) => (
          <View key={index} style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>{item.label}</Text>
            <Text style={[styles.summaryValue, item.color && { color: item.color }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
};

export default function TotalAnalysis({ ingredients }: TotalAnalysisProps) {
  // Calculate totals
  const totalWeight = ingredients
    .filter(item => !item.is_liquid)
    .reduce((sum, item) => sum + item.estimated_weight_volume, 0);
  
  const totalVolume = ingredients
    .filter(item => item.is_liquid)
    .reduce((sum, item) => sum + item.estimated_weight_volume, 0);

  let sumAvgCarbs = 0;
  let totalLow = 0;
  let totalHigh = 0;
  
  ingredients.forEach(item => {
    totalLow += item.low_carb_estimate;
    totalHigh += item.high_carb_estimate;
    sumAvgCarbs += (item.low_carb_estimate + item.high_carb_estimate) / 2;
  });

  // Weighted average peak time calculation
  const weightedSum = ingredients.reduce((sum, item) => {
    const minutes = parseInt(item.peak_bg_time.match(/(\d+)/)?.[1] || '0', 10);
    const avgCarb = (item.low_carb_estimate + item.high_carb_estimate) / 2;
    return sum + minutes * avgCarb;
  }, 0);
  
  const weightedAvg = sumAvgCarbs > 0 ? Math.round(weightedSum / sumAvgCarbs) : 0;
  const peakTimeDisplay = `${weightedAvg} min`;

  // Format weight display
  const weightDisplay = totalWeight > 0 && totalVolume > 0 
    ? `${totalWeight}g + ${totalVolume}ml`
    : totalWeight > 0 
    ? `${totalWeight}g`
    : totalVolume > 0 
    ? `${totalVolume}ml`
    : '0g';

  // Format carbs display
  const carbsDisplay = totalLow === totalHigh 
    ? `${totalLow}g` 
    : `${totalLow}-${totalHigh}g`;

  const carbsRange = totalHigh - totalLow;
  const avgCarbs = Math.round((totalLow + totalHigh) / 2);

  // Summary items for the detailed card
  const summaryItems = [
    { 
      label: 'Ingredients', 
      value: `${ingredients.length} item${ingredients.length !== 1 ? 's' : ''}` 
    },
    { 
      label: 'Avg. Carbs', 
      value: `${avgCarbs}g`,
      color: '#2E7D32'
    },
    { 
      label: 'Range', 
      value: `±${Math.round(carbsRange / 2)}g`,
      color: carbsRange > 10 ? '#FF6B35' : '#4CAF50'
    },
  ];

  if (!ingredients.length) {
    return null;
  }

  return (
    <View 
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerIconContainer}>
          <MaterialIcons name="analytics" size={28} color="#2E7D32" />
        </View>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Meal Analysis</Text>
          <Text style={styles.headerSubtitle}>Nutritional breakdown of your meal</Text>
        </View>
      </View>

      {/* Single Row with 3 Metric Cards */}
      <View style={styles.metricsRow}>
        <MetricCard
          icon="scale"
          title="Total Weight"
          value={weightDisplay}
          subtitle={totalWeight > 0 && totalVolume > 0 ? "Solid + Liquid" : undefined}
          delay={100}
        />
        
        <MetricCard
          icon="grass"
          title="Carbohydrates"
          value={carbsDisplay}
          subtitle={carbsRange > 0 ? `Range: ${carbsRange}g` : "Exact estimate"}
          color="#4CAF50"
          delay={200}
        />

        <MetricCard
          icon="schedule"
          title="Peak BG Time"
          value={peakTimeDisplay}
          subtitle="Weighted average"
          color="#FF9800"
          delay={300}
        />
      </View>

      {/* Detailed Summary Card */}
      <SummaryCard
        title="Meal Summary"
        items={summaryItems}
        delay={400}
      />

      {/* Spacer for bottom margin */}
      <View style={styles.bottomSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  
  // Header Styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 4,
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#E8F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
    lineHeight: 20,
  },

  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },

  // Metric Card Styles
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    // iOS Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Android Shadow
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  metricContent: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  metricSubtitle: {
    fontSize: 12,
    color: '#888888',
    lineHeight: 16,
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    // iOS Shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    // Android Shadow
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.04)',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryContent: {
    gap: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
  },

  // Spacing
  bottomSpacer: {
    height: 20,
  },
});