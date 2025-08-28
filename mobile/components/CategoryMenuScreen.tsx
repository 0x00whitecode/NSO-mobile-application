import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface CategoryMenuScreenProps {
  onCategorySelect: (category: CategoryItem) => void;
  onBack?: () => void;
}

interface CategoryItem {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  ageGroup: string;
  color: string;
  recordCount: number;
}

const categories: CategoryItem[] = [
  {
    id: 'neonates',
    title: 'Neonatal Care',
    subtitle: 'Immediate newborn care & assessment',
    icon: '👶',
    ageGroup: '0-28 days',
    color: '#E8F5E8',
    recordCount: 3,
  },
  {
    id: 'children',
    title: 'Pediatric Care',
    subtitle: 'Children health & development',
    icon: '🧒',
    ageGroup: '1 month - 5 years',
    color: '#E3F2FD',
    recordCount: 8,
  },
  {
    id: 'school_age',
    title: 'School Health',
    subtitle: 'School-age health screening',
    icon: '🎒',
    ageGroup: '6-12 years',
    color: '#FFF3E0',
    recordCount: 2,
  },
  {
    id: 'adolescents',
    title: 'Adolescent Care',
    subtitle: 'Teen health & mental wellness',
    icon: '🧑‍🎓',
    ageGroup: '12-18 years',
    color: '#F3E5F5',
    recordCount: 4,
  },
  {
    id: 'adults',
    title: 'Adult Medicine',
    subtitle: 'General adult health conditions',
    icon: '👨‍⚕️',
    ageGroup: '18-65 years',
    color: '#E0F2F1',
    recordCount: 6,
  },
  {
    id: 'maternal',
    title: 'Maternal Health',
    subtitle: 'Prenatal & pregnancy care',
    icon: '🤱',
    ageGroup: '15-49 years',
    color: '#FCE4EC',
    recordCount: 4,
  },
  {
    id: 'elderly',
    title: 'Geriatric Care',
    subtitle: 'Elderly health management',
    icon: '👴',
    ageGroup: '65+ years',
    color: '#F1F8E9',
    recordCount: 5,
  },
  {
    id: 'emergency',
    title: 'Emergency Care',
    subtitle: 'Critical & trauma care',
    icon: '🚨',
    ageGroup: 'All ages',
    color: '#FFEBEE',
    recordCount: 3,
  },
];

export default function CategoryMenuScreen({ onCategorySelect, onBack }: CategoryMenuScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const renderCategoryCard = (category: CategoryItem, index: number) => {
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [
        {
          translateY: slideAnim.interpolate({
            inputRange: [0, 30],
            outputRange: [0, 30],
          }),
        },
        {
          scale: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.95, 1],
          }),
        },
      ],
    };

    return (
      <Animated.View
        key={category.id}
        style={[
          animatedStyle,
          {
            transform: [
              {
                translateY: Animated.add(
                  slideAnim,
                  new Animated.Value(index * 10)
                ),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.categoryCard, isLoading && styles.categoryCardDisabled]}
          onPress={() => {
            if (!isLoading) {
              // Add haptic feedback for better mobile UX
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsLoading(true);
              // Add a small delay for visual feedback
              setTimeout(() => {
                onCategorySelect(category);
                setIsLoading(false);
              }, 200);
            }
          }}
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <View style={[styles.iconContainer, { backgroundColor: category.color }]}>
            <Text style={styles.categoryIcon}>{category.icon}</Text>
          </View>
          
          <View style={styles.categoryContent}>
            <View style={styles.categoryHeader}>
              <Text style={styles.categoryTitle}>{category.title}</Text>
              <View style={styles.recordBadge}>
                <Text style={styles.recordCount}>{category.recordCount}</Text>
              </View>
            </View>
            
            <Text style={styles.categorySubtitle}>{category.subtitle}</Text>
            
            <View style={styles.ageGroupContainer}>
              <Text style={styles.ageGroupLabel}>Age Group:</Text>
              <Text style={styles.ageGroupText}>{category.ageGroup}</Text>
            </View>
          </View>
          
          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>›</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {onBack && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onBack();
              }}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Clinical Categories</Text>
            <Text style={styles.headerSubtitle}>
              Select a category to access clinical records and diagnostic tools
            </Text>
          </View>
        </Animated.View>

        {/* Categories Grid */}
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.categoriesContainer}>
            {categories.map((category, index) => renderCategoryCard(category, index))}
          </View>
          
          {/* Footer Info */}
          <Animated.View
            style={[
              styles.footerInfo,
              {
                opacity: fadeAnim,
              },
            ]}
          >
            <Text style={styles.footerText}>
              Each category contains evidence-based clinical protocols and diagnostic guidelines
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg, // Reduced since SafeAreaView handles top padding
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.base,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  backButtonText: {
    color: Colors.neutral.white,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: Spacing.sm,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing['2xl'],
  },
  categoriesContainer: {
    gap: Spacing.base,
  },
  categoryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.base,
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ scale: 1 }],
    minHeight: 100, // Ensure adequate touch target
  },
  categoryCardDisabled: {
    opacity: 0.6,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconContainer: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryIcon: {
    fontSize: 32,
  },
  categoryContent: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  categoryTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.dark,
    flex: 1,
    marginBottom: Spacing.xs,
  },
  recordBadge: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  recordCount: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.neutral.white,
  },
  categorySubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  ageGroupContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageGroupLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.neutral.medium,
    marginRight: Spacing.xs,
  },
  ageGroupText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  arrowContainer: {
    marginLeft: Spacing.sm,
  },
  arrow: {
    fontSize: 24,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.bold,
  },
  footerInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BorderRadius.base,
    padding: Spacing.base,
    marginTop: Spacing.lg,
  },
  footerText: {
    fontSize: Typography.fontSize.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  decorativeElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: -1,
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -75,
    right: -75,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -50,
    left: -50,
  },
});
