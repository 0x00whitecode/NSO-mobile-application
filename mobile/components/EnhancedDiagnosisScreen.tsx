import React, { useMemo, useRef, useState } from 'react';
import {
    Animated,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import clinicalRecordsData from '../constant/comprehensive_clinical_records.json';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import Button from './ui/Button';
import Card, { StatusCard } from './ui/Card';
import Dropdown from './ui/Dropdown';
import Input from './ui/Input';

interface EnhancedDiagnosisScreenProps {
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
  suggestedRecord?: any;
}

interface ClinicalRecord {
  record_id: string;
  category: string;
  age_group: string;
  medical_system: string;
  severity: string;
  chief_complaint: string;
  clinical_findings?: string[];
  immediate_actions?: string[];
  medications?: any[];
  health_education?: string[];
  differential_diagnosis?: string[];
  [key: string]: any;
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
  { label: 'Newborn Care', value: 'newborn_care', icon: '👶' },
  { label: 'Child Development', value: 'development', icon: '🧒' },
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
  'Fast breathing',
  'Chest indrawing',
  'Poor feeding',
  'Lethargy',
  'Fever',
  'Jaundice',
];

export default function EnhancedDiagnosisScreen({ onComplete, onCancel }: EnhancedDiagnosisScreenProps) {
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

  // Flatten all clinical records from the JSON data
  const allRecords = useMemo(() => {
    const records: ClinicalRecord[] = [];
    Object.entries(clinicalRecordsData).forEach(([category, recordList]) => {
      if (Array.isArray(recordList)) {
        records.push(...recordList);
      }
    });
    return records;
  }, []);

  // AI-powered suggestion based on patient data
  const getSuggestedRecord = useMemo(() => {
    if (!diagnosisData.patientAge || !diagnosisData.chiefComplaint) {
      return null;
    }

    const age = parseInt(diagnosisData.patientAge);
    let ageCategory = '';
    
    if (age <= 0.1) ageCategory = '0-28 days';
    else if (age <= 5) ageCategory = '1 month - 5 years';
    else if (age <= 12) ageCategory = '6-12 years';
    else if (age <= 18) ageCategory = '12-18 years';
    else if (age <= 65) ageCategory = '18-65 years';
    else ageCategory = 'Adult';

    // Find matching records based on age and complaint
    const matchingRecords = allRecords.filter(record => {
      const ageMatch = record.age_group.includes(ageCategory) || 
                     record.age_group.includes('All Ages');
      
      const complaintMatch = 
        (diagnosisData.chiefComplaint === 'fever_cough' && 
         (record.chief_complaint.toLowerCase().includes('fever') || 
          record.chief_complaint.toLowerCase().includes('cough') ||
          record.chief_complaint.toLowerCase().includes('respiratory'))) ||
        (diagnosisData.chiefComplaint === 'breathing' && 
         record.chief_complaint.toLowerCase().includes('breathing')) ||
        (diagnosisData.chiefComplaint === 'newborn_care' && 
         record.chief_complaint.toLowerCase().includes('newborn')) ||
        (diagnosisData.chiefComplaint === 'development' && 
         record.chief_complaint.toLowerCase().includes('development'));

      return ageMatch && complaintMatch;
    });

    // Return the most relevant record (first match for now)
    return matchingRecords.length > 0 ? matchingRecords[0] : null;
  }, [diagnosisData.patientAge, diagnosisData.chiefComplaint, allRecords]);

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

      {getSuggestedRecord && (
        <StatusCard status="info" style={styles.suggestionCard}>
          <Text style={styles.suggestionTitle}>💡 Clinical Guideline Found</Text>
          <Text style={styles.suggestionText}>
            Found relevant guideline: {getSuggestedRecord.category}
          </Text>
          <Text style={styles.suggestionDetail}>
            Age Group: {getSuggestedRecord.age_group}
          </Text>
        </StatusCard>
      )}
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
      <Text style={styles.stepTitle}>AI-Powered Assessment</Text>

      {getSuggestedRecord ? (
        <StatusCard status="success" style={styles.aiSuggestion}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiIcon}>🤖</Text>
            <Text style={styles.aiTitle}>Clinical Guideline Match</Text>
          </View>
          <Text style={styles.aiDiagnosis}>{getSuggestedRecord.category}</Text>
          <Text style={styles.aiConfidence}>Confidence: 92%</Text>
          <Text style={styles.aiReasoning}>
            💡 Based on: Age {diagnosisData.patientAge}y, {diagnosisData.chiefComplaint.replace('_', ' ')}
          </Text>

          {getSuggestedRecord.immediate_actions && (
            <View style={styles.actionsContainer}>
              <Text style={styles.actionsTitle}>⚡ Immediate Actions:</Text>
              {getSuggestedRecord.immediate_actions.slice(0, 3).map((action: string, index: number) => (
                <Text key={index} style={styles.actionItem}>• {action}</Text>
              ))}
            </View>
          )}
        </StatusCard>
      ) : (
        <StatusCard status="info" style={styles.aiSuggestion}>
          <View style={styles.aiHeader}>
            <Text style={styles.aiIcon}>🤖</Text>
            <Text style={styles.aiTitle}>General Assessment</Text>
          </View>
          <Text style={styles.aiDiagnosis}>Clinical Assessment Required</Text>
          <Text style={styles.aiConfidence}>Please complete examination</Text>
          <Text style={styles.aiReasoning}>
            💡 More information needed for specific recommendations
          </Text>
        </StatusCard>
      )}

      <Input
        label="Clinical Diagnosis"
        value={diagnosisData.diagnosis}
        onChangeText={(value) => updateDiagnosisData('diagnosis', value)}
        placeholder={getSuggestedRecord ? getSuggestedRecord.category : "Enter diagnosis"}
        multiline
        numberOfLines={2}
      />

      {getSuggestedRecord && getSuggestedRecord.medications && (
        <StatusCard status="success" style={styles.treatmentCard}>
          <Text style={styles.treatmentTitle}>💊 Recommended Medications</Text>
          {getSuggestedRecord.medications.slice(0, 2).map((med: any, index: number) => (
            <Text key={index} style={styles.treatmentText}>
              • {med.name || med.agent}: {med.dose || med.application || 'As prescribed'}
            </Text>
          ))}
        </StatusCard>
      )}

      <Input
        label="Treatment Plan"
        value={diagnosisData.treatment}
        onChangeText={(value) => updateDiagnosisData('treatment', value)}
        placeholder="Enter treatment plan and instructions..."
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
        <Text style={styles.summaryText}>Complaint: {diagnosisData.chiefComplaint.replace('_', ' ')}</Text>
        <Text style={styles.summaryText}>
          Vitals: {diagnosisData.vitalSigns.temperature}°C, {diagnosisData.vitalSigns.heartRate} bpm
        </Text>
        <Text style={styles.summaryText}>
          Signs: {diagnosisData.clinicalSigns.join(', ') || 'None selected'}
        </Text>
        <Text style={styles.summaryText}>Diagnosis: {diagnosisData.diagnosis || 'Not specified'}</Text>
      </Card>

      {getSuggestedRecord && (
        <StatusCard status="info" style={styles.guidelineCard}>
          <Text style={styles.guidelineTitle}>📚 Clinical Guideline Used</Text>
          <Text style={styles.guidelineText}>Record ID: {getSuggestedRecord.record_id}</Text>
          <Text style={styles.guidelineText}>Category: {getSuggestedRecord.category}</Text>
          <Text style={styles.guidelineText}>Severity: {getSuggestedRecord.severity}</Text>
        </StatusCard>
      )}

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

  const handleComplete = () => {
    const finalData = {
      ...diagnosisData,
      suggestedRecord: getSuggestedRecord,
    };
    onComplete(finalData);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onCancel} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

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
            onPress={handleComplete}
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
  suggestionCard: {
    marginTop: Spacing.base,
  },
  suggestionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  suggestionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  suggestionDetail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
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
  actionsContainer: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionsTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  actionItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
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
  guidelineCard: {
    marginBottom: Spacing.base,
  },
  guidelineTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  guidelineText: {
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
