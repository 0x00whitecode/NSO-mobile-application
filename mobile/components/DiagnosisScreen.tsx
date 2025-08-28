import React, { useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import Button from './ui/Button';
import Card, { StatusCard } from './ui/Card';
import Dropdown from './ui/Dropdown';
import Input from './ui/Input';

interface DiagnosisScreenProps {
  onComplete: (diagnosisData: DiagnosisData) => void;
  onCancel: () => void;
}

interface DiagnosisData {
  patientAge: string;
  patientGender: string;
  chiefComplaint: string;
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
  };
  clinicalSigns: string[];
  additionalNotes: string;
  diagnosis: string;
  treatment: string;
}

const genderOptions = [
  { label: 'Male', value: 'male', icon: '♂️' },
  { label: 'Female', value: 'female', icon: '♀️' },
  { label: 'Other', value: 'other', icon: '⚧️' },
  { label: 'Prefer not to say', value: 'not_specified', icon: '❓' },
];

const complaintOptions = [
  { label: 'Fever and Cough', value: 'fever_cough', icon: '🤒' },
  { label: 'Headache and Nausea', value: 'headache_nausea', icon: '🤕' },
  { label: 'Stomach Pain', value: 'stomach_pain', icon: '🤢' },
  { label: 'Chest Pain', value: 'chest_pain', icon: '💔' },
  { label: 'Difficulty Breathing', value: 'breathing', icon: '😮‍💨' },
  { label: 'Skin Rash', value: 'skin_rash', icon: '🔴' },
  { label: 'Joint Pain', value: 'joint_pain', icon: '🦴' },
  { label: 'Other', value: 'other', icon: '📝' },
];

const clinicalSignsOptions = [
  'Runny nose',
  'Sore throat',
  'Difficulty breathing',
  'Chest pain',
  'Fatigue/weakness',
  'Nausea/vomiting',
  'Headache',
  'Dizziness',
  'Muscle aches',
  'Loss of appetite',
];

export default function DiagnosisScreen({ onComplete, onCancel }: DiagnosisScreenProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [diagnosisData, setDiagnosisData] = useState<DiagnosisData>({
    patientAge: '',
    patientGender: '',
    chiefComplaint: '',
    vitalSigns: {
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
    },
    clinicalSigns: [],
    additionalNotes: '',
    diagnosis: '',
    treatment: '',
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const updateDiagnosisData = (field: string, value: any) => {
    setDiagnosisData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateVitalSigns = (field: string, value: string) => {
    setDiagnosisData(prev => ({
      ...prev,
      vitalSigns: {
        ...prev.vitalSigns,
        [field]: value,
      },
    }));
  };

  const toggleClinicalSign = (sign: string) => {
    setDiagnosisData(prev => ({
      ...prev,
      clinicalSigns: prev.clinicalSigns.includes(sign)
        ? prev.clinicalSigns.filter(s => s !== sign)
        : [...prev.clinicalSigns, sign],
    }));
  };

  const nextStep = () => {
    if (currentStep < 4) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep - 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }
  };

  const getProgressPercentage = () => {
    return (currentStep / 4) * 100;
  };

  const renderStep1 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.stepTitle}>Patient Information</Text>
      
      <Input
        label="Patient Age"
        value={diagnosisData.patientAge}
        onChangeText={(value) => updateDiagnosisData('patientAge', value)}
        placeholder="Enter age in years"
        keyboardType="numeric"
        required
      />

      <Dropdown
        label="Gender"
        placeholder="Select gender"
        options={genderOptions}
        value={diagnosisData.patientGender}
        onSelect={(option) => updateDiagnosisData('patientGender', option.value)}
        required
      />

      <Dropdown
        label="Chief Complaint"
        placeholder="Select primary complaint"
        options={complaintOptions}
        value={diagnosisData.chiefComplaint}
        onSelect={(option) => updateDiagnosisData('chiefComplaint', option.value)}
        required
      />
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.stepTitle}>Clinical Findings</Text>
      
      <Text style={styles.sectionTitle}>Vital Signs</Text>
      <View style={styles.vitalsContainer}>
        <Input
          label="Temperature (°C)"
          value={diagnosisData.vitalSigns.temperature}
          onChangeText={(value) => updateVitalSigns('temperature', value)}
          placeholder="37.0"
          keyboardType="decimal-pad"
          containerStyle={styles.vitalInput}
        />
        <Input
          label="Heart Rate (bpm)"
          value={diagnosisData.vitalSigns.heartRate}
          onChangeText={(value) => updateVitalSigns('heartRate', value)}
          placeholder="80"
          keyboardType="numeric"
          containerStyle={styles.vitalInput}
        />
        <Input
          label="Respiratory Rate (/min)"
          value={diagnosisData.vitalSigns.respiratoryRate}
          onChangeText={(value) => updateVitalSigns('respiratoryRate', value)}
          placeholder="20"
          keyboardType="numeric"
          containerStyle={styles.vitalInput}
        />
      </View>

      <Text style={styles.sectionTitle}>Clinical Signs</Text>
      <View style={styles.clinicalSignsContainer}>
        {clinicalSignsOptions.map((sign) => (
          <TouchableOpacity
            key={sign}
            style={[
              styles.clinicalSignItem,
              diagnosisData.clinicalSigns.includes(sign) && styles.clinicalSignSelected
            ]}
            onPress={() => toggleClinicalSign(sign)}
          >
            <Text style={[
              styles.clinicalSignText,
              diagnosisData.clinicalSigns.includes(sign) && styles.clinicalSignTextSelected
            ]}>
              {diagnosisData.clinicalSigns.includes(sign) ? '☑️' : '☐'} {sign}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Input
        label="Additional Notes"
        value={diagnosisData.additionalNotes}
        onChangeText={(value) => updateDiagnosisData('additionalNotes', value)}
        placeholder="Any additional observations..."
        multiline
        numberOfLines={3}
      />
    </Animated.View>
  );

  const renderStep3 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.stepTitle}>Diagnosis Summary</Text>
      
      <StatusCard status="info" style={styles.aiSuggestion}>
        <View style={styles.aiHeader}>
          <Text style={styles.aiIcon}>🤖</Text>
          <Text style={styles.aiTitle}>AI-Generated Assessment</Text>
        </View>
        <Text style={styles.aiDiagnosis}>Upper Respiratory Tract Infection (Common Cold)</Text>
        <Text style={styles.aiConfidence}>Confidence: 85%</Text>
        <Text style={styles.aiReasoning}>
          💡 Based on: Fever, cough, runny nose, sore throat
        </Text>
      </StatusCard>

      <Input
        label="Manual Override (Optional)"
        value={diagnosisData.diagnosis}
        onChangeText={(value) => updateDiagnosisData('diagnosis', value)}
        placeholder="Enter custom diagnosis if needed"
        multiline
        numberOfLines={2}
      />

      <StatusCard status="success" style={styles.treatmentCard}>
        <Text style={styles.treatmentTitle}>💊 Treatment Recommendations</Text>
        <Text style={styles.treatmentText}>• Rest and hydration</Text>
        <Text style={styles.treatmentText}>• Monitor temperature</Text>
        <Text style={styles.treatmentText}>• Return if symptoms worsen or persist over 7 days</Text>
      </StatusCard>

      <Input
        label="Treatment Notes"
        value={diagnosisData.treatment}
        onChangeText={(value) => updateDiagnosisData('treatment', value)}
        placeholder="Additional treatment instructions..."
        multiline
        numberOfLines={3}
      />
    </Animated.View>
  );

  const renderStep4 = () => (
    <Animated.View style={[styles.stepContainer, { opacity: fadeAnim }]}>
      <Text style={styles.stepTitle}>Review & Submit</Text>
      
      <Card style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>👤 Patient Summary</Text>
        <Text style={styles.summaryText}>Age: {diagnosisData.patientAge} years</Text>
        <Text style={styles.summaryText}>Gender: {diagnosisData.patientGender}</Text>
        <Text style={styles.summaryText}>Complaint: {diagnosisData.chiefComplaint}</Text>
        <Text style={styles.summaryText}>
          Vitals: {diagnosisData.vitalSigns.temperature}°C, {diagnosisData.vitalSigns.heartRate} bpm
        </Text>
        <Text style={styles.summaryText}>
          Signs: {diagnosisData.clinicalSigns.join(', ') || 'None selected'}
        </Text>
      </Card>

      <StatusCard status="info" style={styles.dataNotice}>
        <Text style={styles.dataNoticeTitle}>ℹ️ Data Collection Notice</Text>
        <Text style={styles.dataNoticeText}>This diagnosis will be:</Text>
        <Text style={styles.dataNoticeText}>• Saved locally on device</Text>
        <Text style={styles.dataNoticeText}>• Synced to admin portal</Text>
        <Text style={styles.dataNoticeText}>• Include GPS location</Text>
        <Text style={styles.dataNoticeText}>• Timestamped securely</Text>
      </StatusCard>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Begin Diagnosis</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Progress */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Step {currentStep} of 4</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${getProgressPercentage()}%` }]} />
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation */}
      <View style={styles.navigation}>
        {currentStep > 1 && (
          <Button variant="secondary" onPress={previousStep} style={styles.navButton}>
            ← Back
          </Button>
        )}
        
        <View style={styles.navSpacer} />
        
        {currentStep < 4 ? (
          <Button variant="primary" onPress={nextStep} style={styles.navButton}>
            Next →
          </Button>
        ) : (
          <Button 
            variant="primary" 
            onPress={() => onComplete(diagnosisData)}
            style={styles.navButton}
          >
            Save Diagnosis
          </Button>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: 50,
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: Typography.fontSize.lg,
    color: Colors.text.primary,
  },
  headerTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.border.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary.main,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  stepContainer: {
    paddingVertical: Spacing.base,
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
    marginTop: Spacing.base,
  },
  vitalsContainer: {
    marginBottom: Spacing.lg,
  },
  vitalInput: {
    marginBottom: Spacing.sm,
  },
  clinicalSignsContainer: {
    marginBottom: Spacing.lg,
  },
  clinicalSignItem: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.xs,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.neutral.light,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  clinicalSignSelected: {
    backgroundColor: Colors.primary.lightest,
    borderColor: Colors.primary.main,
  },
  clinicalSignText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  clinicalSignTextSelected: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  aiSuggestion: {
    marginBottom: Spacing.lg,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  aiIcon: {
    fontSize: Typography.fontSize.lg,
    marginRight: Spacing.sm,
  },
  aiTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
  },
  aiDiagnosis: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
  },
  aiConfidence: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  aiReasoning: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  treatmentCard: {
    marginVertical: Spacing.base,
  },
  treatmentTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  treatmentText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  summaryCard: {
    marginBottom: Spacing.lg,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  dataNotice: {
    marginBottom: Spacing.lg,
  },
  dataNoticeTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  dataNoticeText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  navigation: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  navButton: {
    flex: 1,
  },
  navSpacer: {
    width: Spacing.base,
  },
});
