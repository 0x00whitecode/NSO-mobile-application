import { LinearGradient } from 'expo-linear-gradient';
import React, { useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    Image,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { Colors } from '../constants/theme';

const { width, height } = Dimensions.get('window');

interface OnboardingScreenProps {
  onComplete: () => void;
}

interface OnboardingPage {
  id: string;
  title: string;
  body: string;
  features?: string[];
  buttonText: string;
  isLast?: boolean;
}

const onboardingData: OnboardingPage[] = [
  {
    id: 'welcome',
    title: 'Welcome to NSO – Smart Clinical Assistant',
    body: 'Empowering healthcare workers with smart diagnostic tools to deliver fast, accurate, and patient-centered care, even in low-network environments.',
    buttonText: 'Get Started',
  },
  {
    id: 'companion',
    title: 'Your Smart Clinical Companion',
    body: 'NSO is a mobile tool built for healthcare providers. It helps you assess patient complaints and symptoms through guided diagnostic prompts powered by expert-designed clinical algorithms.',
    features: [
      'Designed for field and rural conditions',
      'Works offline, syncs automatically when online',
      'Accurate, context-aware decision support',
    ],
    buttonText: 'Next',
  },
  {
    id: 'offline',
    title: 'Designed for Low Connectivity',
    body: 'No internet? No problem. NSO saves diagnostic sessions and uploads them securely in the background when a network is available. Stay productive, even in remote areas.',
    features: [
      'Offline first',
      'Secure background data sync',
      'Fast, responsive UI',
    ],
    buttonText: 'Next',
  },
  {
    id: 'monitoring',
    title: 'Supervised and Secure',
    body: 'Every diagnostic click is logged with your geolocation and synced to the admin dashboard. Supervisors get real-time visibility into your clinical activities to support accountability and continuous care improvement.',
    features: [
      'Every diagnostic activity recorded',
      'GPS tracking included',
      'Secure cloud dashboard for administrators',
    ],
    buttonText: 'Next',
  },
  {
    id: 'activation',
    title: 'Secure Access via Activation Key',
    body: 'To use NSO, you\'ll need an activation key provided by your administrator. Keys are unique to your device and expire automatically after the set duration.',
    features: [
      'One device per activation',
      'Keys securely encrypted',
      'Validity duration built-in',
    ],
    buttonText: 'Proceed to Activation',
    isLast: true,
  },
];

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const animateTransition = (callback: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      callback();
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleNext = () => {
    if (currentPage < onboardingData.length - 1) {
      animateTransition(() => {
        setCurrentPage(currentPage + 1);
      });
    } else {
      onComplete();
    }
  };

  const currentData = onboardingData[currentPage];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentPage + 1) / onboardingData.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            {currentPage + 1} of {onboardingData.length}
          </Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Icon/Logo Area */}
            <View style={styles.iconContainer}>
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../assets/images/logo1.jpeg')}
                  style={styles.logo1}
                  resizeMode="contain"
                />
                <Image
                  source={require('../assets/images/logo2.jpeg')}
                  style={styles.logo2}
                  resizeMode="contain"
                />
              </View>
            </View>



            {/* Body */}
            <Text style={styles.body}>{currentData.body}</Text>

            {/* Features List */}
            {currentData.features && (
              <View style={styles.featuresContainer}>
                <Text style={styles.featuresTitle}>Feature Highlights:</Text>
                {currentData.features.map((feature, index) => (
                  <View key={index} style={styles.featureItem}>
                    <View style={styles.featureBullet} />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        </ScrollView>

        {/* Bottom Section */}
        <View style={styles.bottomSection}>
          {/* Page Indicators */}
          <View style={styles.pageIndicators}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.pageIndicator,
                  index === currentPage && styles.activePageIndicator,
                ]}
              />
            ))}
          </View>

          {/* Action Button */}
          <TouchableOpacity style={styles.button} onPress={handleNext}>
            <Text style={styles.buttonText}>{currentData.buttonText}</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeElements}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  progressContainer: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.neutral.white,
    borderRadius: 2,
  },
  progressText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  iconContainer: {
    marginBottom: 30,
  },
  logoWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  logo1: {
    width: 60,
    height: 60,
    marginRight: 8,
    borderRadius: 8,
  },
  logo2: {
    width: 60,
    height: 60,
    marginLeft: 8,
    borderRadius: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.neutral.white,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 34,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  body: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  featuresContainer: {
    width: '100%',
    marginBottom: 20,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral.white,
    marginBottom: 15,
    textAlign: 'center',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  featureBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.neutral.white,
    marginRight: 15,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  pageIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  activePageIndicator: {
    backgroundColor: Colors.neutral.white,
    width: 24,
  },
  button: {
    backgroundColor: Colors.neutral.white,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonText: {
    color: Colors.primary.dark,
    fontSize: 16,
    fontWeight: '600',
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
