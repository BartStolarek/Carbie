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
    gi_index: number; // Glycemic Index
    peak_bg_time: string; // e.g. "60min"
}

interface TotalAnalysisProps {
    ingredients: IngredientData[];
    aggregated_peak_bg_time_minutes: number; 
}

const { width: screenWidth } = Dimensions.get('window');

// Individual metric card component
const MetricCard = ({
    icon,
    title,
    value,
    subtitle,
    color = '#2E7D32',
    delay = 0,
    both = false,
}: {
    icon: string;
    title: string;
    value: string;
    subtitle?: string;
    color?: string;
    delay?: number;
    both?: boolean;
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
            {/* Icon Section - 1/4 */}
            <View style={styles.iconSection}>
                <View style={[styles.iconContainer, { backgroundColor: `${color}15` }]}>
                    <MaterialIcons name={icon as any} size={24} color={color} />
                </View>
            </View>

            {/* Title Section - 1/4 */}
            <View style={styles.titleSection}>
                <Text style={[styles.metricTitle, { color }]} numberOfLines={1}>{title}</Text>
            </View>

            {/* Value Section - 1/4 */}
            <View style={styles.valueSection}>
                <Text style={styles.metricValue} numberOfLines={both ? 2 : 1}>{value}</Text>
            </View>

            {/* Subtitle Section - 1/4 */}
            <View style={styles.subtitleSection}>
                {subtitle && <Text style={styles.metricSubtitle} numberOfLines={2}>{subtitle}</Text>}
            </View>
        </Animated.View>
    );
};

export default function TotalAnalysis({ aggregated_peak_bg_time_minutes, ingredients }: TotalAnalysisProps) {
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
    // const weightedSum = ingredients.reduce((sum, item) => {
    //     const minutes = parseInt(item.peak_bg_time.match(/(\d+)/)?.[1] || '0', 10);
    //     const avgCarb = (item.low_carb_estimate + item.high_carb_estimate) / 2;
    //     return sum + minutes * avgCarb;
    // }, 0);

    // const weightedAvg = sumAvgCarbs > 0 ? Math.round(weightedSum / sumAvgCarbs) : 0;

    // Format weight display
    let weightDisplay = '0g';
    let weightNameDisplay = ''
    let both = false;
    if (totalWeight > 0 && totalVolume > 0) {
        weightDisplay = `${totalWeight}g + ${totalVolume}ml`;
        weightNameDisplay = 'Food + Liquid';
        both = true;
    } else if (totalWeight > 0) {
        weightDisplay = `${totalWeight}g`;
        weightNameDisplay = 'Food';
    } else if (totalVolume > 0) {
        weightDisplay = `${totalVolume}ml`;
        weightNameDisplay = 'Liquid';
    }

    // Format carbs display
    const carbsValue = Math.round((totalHigh + totalLow) / 2);
    const carbsRange = Math.round((totalHigh - totalLow) / 2);

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
                    <Text style={styles.headerTitle}>Total</Text>
                    <Text style={styles.headerSubtitleWhite}>Estimated Carb Effect</Text>
                </View>
            </View>

            {/* Single Row with 3 Metric Cards */}
            <View style={styles.metricsRow}>
                <MetricCard
                    icon="scale"
                    title="Measure"
                    value={weightDisplay}
                    subtitle={weightNameDisplay}
                    delay={100}
                    both={both}
                />

                <MetricCard
                    icon="grass"
                    title="Carbs"
                    value={`${carbsValue}g`}
                    subtitle={`Range: +/-${carbsRange}g`}
                    color="#4CAF50"
                    delay={200}
                />

                <MetricCard
                    icon="schedule"
                    title="Peak BG"
                    value={`${aggregated_peak_bg_time_minutes}min`}
                    subtitle="Weighted average"
                    color="#FF9800"
                    delay={300}
                />
            </View>

            {/* Spacer for bottom margin */}
            <View style={styles.bottomSpacer} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
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
    headerSubtitleWhite: {
        fontSize: 16,
        color: '#FFFFFF',
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
        padding: 16, // Reduced padding
        // iOS Shadow
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        // Android Shadow
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.04)',
        height: 180, // Increased height to accommodate content better
    },
    iconSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 35, // Ensure minimum space for icon
    },
    iconContainer: {
        width: 40, // Slightly smaller icon
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    titleSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    metricTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: 0.3,
        textAlign: 'center',
        lineHeight: 16,
        paddingVertical: 8,
    },
    valueSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1A1A1A',
        textAlign: 'center',
    },
    subtitleSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
    },
    metricSubtitle: {
        fontSize: 11,
        color: '#888888',
        textAlign: 'center',
        lineHeight: 14,
    },

    // Spacing
    bottomSpacer: {
        height: 20,
    },
});