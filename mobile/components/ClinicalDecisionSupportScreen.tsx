import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import clinicalRecords from '../constant/comprehensive_clinical_records.json';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';
import { useBackendIntegration } from '../hooks/useBackendIntegration';
import Button from './ui/Button';
import Card, { StatusCard } from './ui/Card';
import Input from './ui/Input';

interface ClinicalDecisionSupportScreenProps {
  onBack: () => void;
}

interface PatientInfo {
  age: string;
  ageGroup: string;
  chiefComplaint: string;
  symptoms: string[];
  vitalSigns: {
    temperature: string;
    heartRate: string;
    respiratoryRate: string;
    bloodPressure: string;
  };
}

interface ClinicalRecommendation {
  record: any;
  matchScore: number;
  reasoning: string[];
}

const ClinicalDecisionSupportScreen: React.FC<ClinicalDecisionSupportScreenProps> = ({ onBack }) => {
  const [, { trackActivity, trackScreen, trackError }] = useBackendIntegration();
  const [currentStep, setCurrentStep] = useState(1);
  const [sessionStartTime] = useState(Date.now());
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    age: '',
    ageGroup: '',
    chiefComplaint: '',
    symptoms: [],
    vitalSigns: {
      temperature: '',
      heartRate: '',
      respiratoryRate: '',
      bloodPressure: '',
    },
  });
  const [recommendations, setRecommendations] = useState<ClinicalRecommendation[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);

  // Track screen view on component mount
  useEffect(() => {
    trackActivity({
      activityType: 'screen_view',
      screen: {
        name: 'Clinical Decision Support',
        category: 'clinical_tools'
      },
      action: {
        name: 'screen_entered',
        target: 'clinical_decision_support'
      },
      clinicalContext: {
        category: 'decision_support',
        severity: 'medium'
      }
    });

    return () => {
      // Track session duration when leaving
      const duration = Date.now() - sessionStartTime;
      trackActivity({
        activityType: 'screen_view',
        screen: { name: 'Clinical Decision Support' },
        performance: { duration },
        action: {
          name: 'screen_exited',
          target: 'clinical_decision_support'
        }
      });
    };
  }, []);

  // Track step changes
  useEffect(() => {
    if (currentStep > 1) {
      trackActivity({
        activityType: 'clinical_workflow',
        screen: { name: 'Clinical Decision Support' },
        action: {
          name: 'step_changed',
          target: `step_${currentStep}`,
          value: currentStep
        },
        clinicalContext: {
          category: 'workflow_navigation',
          severity: 'low'
        }
      });
    }
  }, [currentStep]);


  const commonSymptoms = [
    'Fever', 'Cough', 'Difficulty breathing', 'Vomiting', 'Diarrhea',
    'Abdominal pain', 'Headache', 'Rash', 'Poor feeding', 'Lethargy',
    'Chest pain', 'Palpitations', 'Dizziness', 'Confusion', 'Seizures',
  ];

  // Get age group based on age input
  const getAgeGroup = (age: string): string => {
    const ageNum = parseFloat(age);
    if (isNaN(ageNum)) return '';

    if (ageNum <= 0.1) return '0-28 days (Neonate)';
    if (ageNum < 0.5) return '2 months - 5 years';
    if (ageNum < 2) return '2-24 months';
    if (ageNum < 5) return '2 months - 5 years';
    if (ageNum < 12) return '6-12 years (School Age)';
    if (ageNum < 18) return '12-18 years (Adolescent)';
    if (ageNum >= 15 && ageNum <= 49) return 'Reproductive Age (15-49 years)';
    if (ageNum < 65) return '18-65 years (Adult)';
    return '65+ years (Elderly)';
  };

  // Get severity color
  const getSeverityColor = (severity: string): string => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('routine')) return Colors.medical.routine;
    if (severityLower.includes('moderate')) return Colors.medical.moderate;
    if (severityLower.includes('severe')) return Colors.medical.severe;
    if (severityLower.includes('critical')) return Colors.medical.critical;
    if (severityLower.includes('emergency')) return Colors.medical.emergency;
    return Colors.neutral.main;
  };

  // Find matching clinical records
  const findClinicalMatches = (): ClinicalRecommendation[] => {
    const matches: ClinicalRecommendation[] = [];

    // Flatten all records from all categories
    const allRecords: any[] = [];
    Object.values(clinicalRecords).forEach((categoryRecords: any) => {
      if (Array.isArray(categoryRecords)) {
        allRecords.push(...categoryRecords);
      }
    });



    allRecords.forEach((record) => {
      let matchScore = 0;
      const reasoning: string[] = [];

      // Age group matching (high weight) - more flexible matching
      const ageNum = parseFloat(patientInfo.age);
      let ageMatches = false;

      if (record.age_group === 'All ages') {
        ageMatches = true;
      } else if (record.age_group === patientInfo.ageGroup) {
        ageMatches = true;
      } else if (!isNaN(ageNum)) {
        // Flexible age matching based on age ranges
        if (ageNum <= 0.1 && record.age_group.includes('0-28 days')) ageMatches = true;
        else if (ageNum >= 0.1 && ageNum < 5 && record.age_group.includes('month') && record.age_group.includes('5 years')) ageMatches = true;
        else if (ageNum >= 6 && ageNum < 12 && record.age_group.includes('6-12')) ageMatches = true;
        else if (ageNum >= 12 && ageNum < 18 && record.age_group.includes('12-18')) ageMatches = true;
        else if (ageNum >= 15 && ageNum <= 49 && record.age_group.includes('15-49')) ageMatches = true;
        else if (ageNum >= 18 && ageNum < 65 && record.age_group.includes('18-65')) ageMatches = true;
        else if (ageNum >= 65 && record.age_group.includes('65+')) ageMatches = true;
      }

      if (ageMatches) {
        matchScore += 30;
        reasoning.push(`Age group match: ${record.age_group}`);
      }

      // Chief complaint matching
      if (patientInfo.chiefComplaint && 
          record.chief_complaint?.toLowerCase().includes(patientInfo.chiefComplaint.toLowerCase())) {
        matchScore += 25;
        reasoning.push(`Chief complaint similarity`);
      }

      // Symptoms matching
      patientInfo.symptoms.forEach((symptom) => {
        const symptomLower = symptom.toLowerCase();
        if (record.clinical_findings?.some((finding: string) => 
            finding.toLowerCase().includes(symptomLower)) ||
            record.chief_complaint?.toLowerCase().includes(symptomLower)) {
          matchScore += 15;
          reasoning.push(`Symptom match: ${symptom}`);
        }
      });

      // Category relevance
      if (record.category && patientInfo.chiefComplaint) {
        const categoryWords = record.category.toLowerCase().split(' ');
        const complaintWords = patientInfo.chiefComplaint.toLowerCase().split(' ');
        const commonWords = categoryWords.filter(word => 
          complaintWords.some(cWord => cWord.includes(word) || word.includes(cWord))
        );
        if (commonWords.length > 0) {
          matchScore += 10;
          reasoning.push(`Category relevance: ${record.category}`);
        }
      }

      if (matchScore > 20) { // Minimum threshold
        matches.push({
          record,
          matchScore,
          reasoning,
        });
      }
    });

    return matches.sort((a, b) => b.matchScore - a.matchScore).slice(0, 5);
  };

  const handleAgeChange = (age: string) => {
    setPatientInfo(prev => ({
      ...prev,
      age,
      ageGroup: getAgeGroup(age),
    }));
  };

  // Helper function to track neonatal care activities
  const trackNeonatalCareActivity = async (activityType: string, details: any) => {
    await trackActivity({
      activityType: 'neonatal_care_start',
      screen: { name: 'Clinical Decision Support' },
      action: {
        name: activityType,
        target: 'neonatal_care',
        value: details.action || activityType
      },
      medicalContext: {
        patientAge: patientInfo.age,
        ageGroup: 'neonate',
        chiefComplaint: patientInfo.chiefComplaint,
        category: 'neonatal_care',
        severity: details.severity || 'routine',
        medicalSystem: 'Neonatal Care',
        interventionType: details.interventionType || 'assessment'
      },
      clinicalContext: {
        urgencyLevel: details.urgencyLevel || 'medium',
        followUpRequired: true,
        guidelineSource: 'comprehensive_clinical_records'
      },
      metadata: {
        isNeonatalCare: true,
        careType: details.careType,
        immediateAction: details.immediateAction || false
      }
    });
  };

  const toggleSymptom = async (symptom: string) => {
    const isAdding = !patientInfo.symptoms.includes(symptom);

    setPatientInfo(prev => ({
      ...prev,
      symptoms: prev.symptoms.includes(symptom)
        ? prev.symptoms.filter(s => s !== symptom)
        : [...prev.symptoms, symptom],
    }));

    // Track symptom selection with enhanced medical context
    await trackActivity({
      activityType: 'symptom_selection',
      screen: { name: 'Clinical Decision Support' },
      action: {
        name: isAdding ? 'symptom_added' : 'symptom_removed',
        target: 'symptom_selector',
        value: symptom
      },
      medicalContext: {
        patientAge: patientInfo.age,
        ageGroup: patientInfo.ageGroup,
        chiefComplaint: patientInfo.chiefComplaint,
        category: 'symptom_collection',
        severity: 'routine',
        interventionType: 'assessment'
      },
      clinicalContext: {
        urgencyLevel: 'low',
        followUpRequired: false
      },
      interaction: {
        inputMethod: 'touch',
        gestureType: 'tap',
        successful: true
      }
    });
  };

  const handleGenerateRecommendations = async () => {
    const startTime = Date.now();

    // Track the start of recommendation generation
    await trackActivity({
      activityType: 'clinical_decision_support',
      screen: { name: 'Clinical Decision Support' },
      action: {
        name: 'generate_recommendations',
        target: 'recommendation_engine',
        value: 'recommendation_generation_started'
      },
      medicalContext: {
        patientAge: patientInfo.age,
        ageGroup: patientInfo.ageGroup,
        chiefComplaint: patientInfo.chiefComplaint,
        category: 'clinical_decision_support',
        severity: 'routine',
        interventionType: 'assessment'
      },
      clinicalContext: {
        urgencyLevel: 'medium',
        followUpRequired: true
      },
      metadata: {
        sessionStartTime: sessionStartTime,
        currentStep: currentStep,
        symptomsCount: patientInfo.symptoms.length,
        vitalSignsProvided: !!(patientInfo.vitalSigns.temperature || patientInfo.vitalSigns.heartRate)
      }
    });

    if (!patientInfo.ageGroup || !patientInfo.chiefComplaint) {
      Alert.alert('Missing Information', 'Please provide age and chief complaint');

      // Track validation error
      await trackActivity({
        activityType: 'error',
        screen: { name: 'Clinical Decision Support' },
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required patient information',
          severity: 'medium',
          recoverable: true
        },
        action: {
          name: 'validation_failed',
          target: 'patient_info_form'
        }
      });
      return;
    }

    try {
      const matches = findClinicalMatches();
      setRecommendations(matches);
      setCurrentStep(3);

      const duration = Date.now() - startTime;

      // Check if this is neonatal care and track accordingly
      const isNeonatalCase = patientInfo.ageGroup === 'neonate' ||
                            matches.some(match => match.record.category?.toLowerCase().includes('neonate'));

      if (isNeonatalCase) {
        await trackNeonatalCareActivity('neonatal_assessment', {
          careType: 'immediate_newborn_care',
          severity: 'routine',
          interventionType: 'assessment',
          urgencyLevel: 'high',
          immediateAction: true
        });
      }

      // Track successful recommendation generation
      await trackActivity({
        activityType: 'diagnosis_complete',
        screen: { name: 'Clinical Decision Support' },
        action: {
          name: 'recommendations_generated',
          target: 'recommendation_engine',
          value: {
            recommendationsCount: matches.length,
            patientInfo: {
              ageGroup: patientInfo.ageGroup,
              chiefComplaint: patientInfo.chiefComplaint,
              symptoms: patientInfo.symptoms,
              vitalSigns: patientInfo.vitalSigns
            },
            recommendations: matches.map(match => ({
              category: match.record.category,
              matchScore: match.matchScore,
              severity: match.record.severity
            }))
          }
        },
        clinicalContext: {
          category: 'clinical_decision_support',
          severity: matches.some(m => m.record.severity === 'high') ? 'high' : 'medium',
          diagnosisId: `cds_${Date.now()}`,
          recordId: matches[0]?.record.id
        },
        performance: {
          duration,
          loadTime: duration
        },
        interaction: {
          successful: true,
          inputMethod: 'touch'
        }
      });

      // Track clinical record interactions for recommendations
      await trackActivity({
        activityType: 'clinical_record_view',
        screen: { name: 'Clinical Decision Support' },
        action: {
          name: 'recommendations_reviewed',
          target: 'clinical_records',
          value: matches.slice(0, 3).map(match => ({
            id: match.record.id,
            category: match.record.category,
            severity: match.record.severity,
            matchScore: match.matchScore
          }))
        },
        clinicalContext: {
          category: 'clinical_records',
          severity: 'medium'
        }
      });

    } catch (error) {
      console.error('Error generating recommendations:', error);

      // Track error
      await trackActivity({
        activityType: 'error',
        screen: { name: 'Clinical Decision Support' },
        error: {
          code: 'RECOMMENDATION_ERROR',
          message: 'Failed to generate clinical recommendations',
          severity: 'high',
          recoverable: true
        },
        action: {
          name: 'recommendation_failed',
          target: 'recommendation_engine'
        },
        performance: {
          duration: Date.now() - startTime
        }
      });

      Alert.alert('Error', 'Failed to generate recommendations. Please try again.');
    }
  };

  const renderPatientInfoStep = () => (
    <View style={styles.stepContainer}>
      <Card style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>👤</Text>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Patient Information</Text>
            <Text style={styles.stepDescription}>Basic patient details and presenting symptoms</Text>
          </View>
        </View>

        <View style={styles.inputSection}>
          <Input
            label="Patient Age (years/months)"
            value={patientInfo.age}
            onChangeText={handleAgeChange}
            placeholder="e.g., 5 years, 6 months, 0.5 (for 6 months)"
            keyboardType="numeric"
          />

          {patientInfo.ageGroup ? (
            <StatusCard status="info" style={styles.ageGroupCard}>
              <View style={styles.ageGroupContent}>
                <Text style={styles.ageGroupIcon}>🎯</Text>
                <Text style={styles.ageGroupText}>Age Group: {patientInfo.ageGroup}</Text>
              </View>
            </StatusCard>
          ) : null}

          <Input
            label="Chief Complaint"
            value={patientInfo.chiefComplaint}
            onChangeText={(text) => setPatientInfo(prev => ({ ...prev, chiefComplaint: text }))}
            placeholder="Main reason for visit (e.g., fever, cough, difficulty breathing)"
            multiline
          />
        </View>

        <View style={styles.symptomsSection}>
          <Text style={styles.sectionTitle}>
            <Text style={styles.sectionIcon}>🩺</Text>
            Common Symptoms (Select all that apply)
          </Text>
          <View style={styles.symptomsContainer}>
            {commonSymptoms.map((symptom) => (
              <TouchableOpacity
                key={symptom}
                style={[
                  styles.symptomChip,
                  patientInfo.symptoms.includes(symptom) && styles.symptomChipSelected,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  toggleSymptom(symptom);
                }}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.symptomChipText,
                  patientInfo.symptoms.includes(symptom) && styles.symptomChipTextSelected,
                ]}>
                  {symptom}
                </Text>
                {patientInfo.symptoms.includes(symptom) && (
                  <Text style={styles.symptomCheckmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Button
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentStep(2);
          }}
          disabled={!patientInfo.ageGroup || !patientInfo.chiefComplaint}
          style={styles.continueButton}
        >
          Continue to Vital Signs →
        </Button>
      </Card>
    </View>
  );

  const renderVitalSignsStep = () => (
    <View style={styles.stepContainer}>
      <Card style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>🩺</Text>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Vital Signs</Text>
            <Text style={styles.stepDescription}>Record patient's vital signs for assessment</Text>
          </View>
        </View>

        <View style={styles.vitalSignsGrid}>
          <View style={styles.vitalSignCard}>
            <Text style={styles.vitalSignIcon}>🌡️</Text>
            <Input
              label="Temperature (°C)"
              value={patientInfo.vitalSigns.temperature}
              onChangeText={(text) => setPatientInfo(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, temperature: text }
              }))}
              placeholder="37.5"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.vitalSignCard}>
            <Text style={styles.vitalSignIcon}>❤️</Text>
            <Input
              label="Heart Rate (bpm)"
              value={patientInfo.vitalSigns.heartRate}
              onChangeText={(text) => setPatientInfo(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, heartRate: text }
              }))}
              placeholder="80"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.vitalSignCard}>
            <Text style={styles.vitalSignIcon}>🫁</Text>
            <Input
              label="Respiratory Rate (breaths/min)"
              value={patientInfo.vitalSigns.respiratoryRate}
              onChangeText={(text) => setPatientInfo(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, respiratoryRate: text }
              }))}
              placeholder="20"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.vitalSignCard}>
            <Text style={styles.vitalSignIcon}>🩸</Text>
            <Input
              label="Blood Pressure (mmHg)"
              value={patientInfo.vitalSigns.bloodPressure}
              onChangeText={(text) => setPatientInfo(prev => ({
                ...prev,
                vitalSigns: { ...prev.vitalSigns, bloodPressure: text }
              }))}
              placeholder="120/80"
            />
          </View>
        </View>

        <View style={styles.buttonRow}>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrentStep(1);
            }}
            variant="secondary"
            style={styles.halfButton}
          >
            ← Back
          </Button>
          <Button
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              handleGenerateRecommendations();
            }}
            style={styles.halfButton}
          >
            Generate Recommendations →
          </Button>
        </View>
      </Card>
    </View>
  );

  const renderRecommendationsStep = () => (
    <View style={styles.stepContainer}>
      <Card style={styles.stepCard}>
        <View style={styles.stepHeader}>
          <Text style={styles.stepIcon}>📋</Text>
          <View style={styles.stepHeaderText}>
            <Text style={styles.stepTitle}>Clinical Recommendations</Text>
            <Text style={styles.stepDescription}>
              Based on NSO Guidelines for {patientInfo.ageGroup}
            </Text>
          </View>
        </View>

      {recommendations.length === 0 ? (
        <StatusCard status="warning">
          <Text style={styles.noResultsText}>
            No specific guidelines found for the provided information.
            Please review patient details or consult general protocols.
          </Text>
        </StatusCard>
      ) : (
        recommendations.map((recommendation, index) => (
          <Card key={index} style={styles.recommendationCard}>
            <View style={styles.recommendationHeader}>
              <View style={styles.recommendationTitleRow}>
                <Text style={styles.recommendationTitle}>
                  {recommendation.record.category}
                </Text>
                <View style={[
                  styles.severityBadge,
                  { backgroundColor: getSeverityColor(recommendation.record.severity) }
                ]}>
                  <Text style={styles.severityText}>
                    {recommendation.record.severity}
                  </Text>
                </View>
              </View>
              <Text style={styles.matchScore}>
                Match: {recommendation.matchScore}% confidence
              </Text>
            </View>

            <Text style={styles.chiefComplaint}>
              {recommendation.record.chief_complaint}
            </Text>

            <View style={styles.reasoningContainer}>
              <Text style={styles.reasoningTitle}>Matching Criteria:</Text>
              {recommendation.reasoning.map((reason, idx) => (
                <Text key={idx} style={styles.reasoningItem}>
                  • {reason}
                </Text>
              ))}
            </View>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={async () => {
                setSelectedRecord(recommendation.record);

                // Track clinical record access
                await trackActivity({
                  activityType: 'clinical_record_access',
                  screen: { name: 'Clinical Decision Support' },
                  action: {
                    name: 'view_detailed_guidance',
                    target: 'clinical_record',
                    value: recommendation.record.record_id
                  },
                  medicalContext: {
                    patientAge: patientInfo.age,
                    ageGroup: patientInfo.ageGroup,
                    chiefComplaint: patientInfo.chiefComplaint,
                    clinicalRecordId: recommendation.record.record_id,
                    category: recommendation.record.category,
                    severity: recommendation.record.severity,
                    medicalSystem: recommendation.record.medical_system,
                    interventionType: 'education'
                  },
                  clinicalContext: {
                    recommendationId: recommendation.record.record_id,
                    matchScore: recommendation.matchScore,
                    confidence: recommendation.matchScore / 100,
                    guidelineSource: 'comprehensive_clinical_records',
                    urgencyLevel: recommendation.record.severity?.toLowerCase().includes('emergency') ? 'critical' :
                                 recommendation.record.severity?.toLowerCase().includes('severe') ? 'high' :
                                 recommendation.record.severity?.toLowerCase().includes('moderate') ? 'medium' : 'low',
                    followUpRequired: recommendation.record.category?.toLowerCase().includes('neonatal') ||
                                    recommendation.record.severity?.toLowerCase().includes('severe')
                  },
                  metadata: {
                    matchReasoning: recommendation.reasoning,
                    isNeonatalCare: recommendation.record.category?.toLowerCase().includes('neonate')
                  }
                });
              }}
            >
              <Text style={styles.viewDetailsText}>View Detailed Guidance</Text>
            </TouchableOpacity>
          </Card>
        ))
      )}

        <Button
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCurrentStep(1);
            setPatientInfo({
              age: '',
              ageGroup: '',
              chiefComplaint: '',
              symptoms: [],
              vitalSigns: {
                temperature: '',
                heartRate: '',
                respiratoryRate: '',
                bloodPressure: '',
              },
            });
            setRecommendations([]);
            setSelectedRecord(null);
          }}
          variant="secondary"
          style={styles.newAssessmentButton}
        >
          🔄 Start New Assessment
        </Button>
      </Card>
    </View>
  );

  const renderDetailedGuidance = () => (
    <View style={styles.detailedGuidanceContainer}>
      <View style={styles.detailedHeader}>
        <TouchableOpacity
          onPress={() => setSelectedRecord(null)}
          style={styles.closeButton}
        >
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.detailedTitle}>{selectedRecord.category}</Text>
        <Text style={styles.detailedSubtitle}>
          {selectedRecord.age_group} • {selectedRecord.medical_system}
        </Text>
      </View>

      <ScrollView style={styles.detailedContent}>
        {/* Clinical Findings */}
        {selectedRecord.clinical_findings && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Clinical Findings</Text>
            {selectedRecord.clinical_findings.map((finding: string, index: number) => (
              <Text key={index} style={styles.guidanceItem}>• {finding}</Text>
            ))}
          </View>
        )}

        {/* Immediate Actions */}
        {selectedRecord.immediate_actions && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Immediate Actions</Text>
            {selectedRecord.immediate_actions.map((action: string, index: number) => (
              <Text key={index} style={styles.guidanceItem}>• {action}</Text>
            ))}
          </View>
        )}

        {/* Medications */}
        {selectedRecord.medications && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Medications</Text>
            {selectedRecord.medications.map((med: any, index: number) => (
              <View key={index} style={styles.medicationCard}>
                <Text style={styles.medicationName}>{med.name || med.agent}</Text>
                <Text style={styles.medicationDose}>{med.dose || med.application}</Text>
                {med.timing && <Text style={styles.medicationTiming}>{med.timing}</Text>}
                {med.indication && <Text style={styles.medicationIndication}>{med.indication}</Text>}
              </View>
            ))}
          </View>
        )}

        {/* Referral Criteria */}
        {selectedRecord.referral_criteria && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Referral Criteria</Text>
            {selectedRecord.referral_criteria.map((criteria: string, index: number) => (
              <Text key={index} style={styles.guidanceItem}>• {criteria}</Text>
            ))}
          </View>
        )}

        {/* Health Education */}
        {selectedRecord.health_education && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Health Education</Text>
            {selectedRecord.health_education.map((education: string, index: number) => (
              <Text key={index} style={styles.guidanceItem}>• {education}</Text>
            ))}
          </View>
        )}

        {/* Differential Diagnosis */}
        {selectedRecord.differential_diagnosis && (
          <View style={styles.guidanceSection}>
            <Text style={styles.guidanceSectionTitle}>Differential Diagnosis</Text>
            {selectedRecord.differential_diagnosis.map((diagnosis: string, index: number) => (
              <Text key={index} style={styles.guidanceItem}>• {diagnosis}</Text>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary.dark} />

      {/* Enhanced Header */}
      <LinearGradient
        colors={Colors.background.gradient}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Clinical Decision Support</Text>
          <Text style={styles.headerSubtitle}>NSO Guidelines-based Assessment</Text>
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>Step {currentStep} of 3</Text>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {currentStep === 1 && renderPatientInfoStep()}
          {currentStep === 2 && renderVitalSignsStep()}
          {currentStep === 3 && renderRecommendationsStep()}
          {selectedRecord && renderDetailedGuidance()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    ...Shadows.lg,
  },
  backButton: {
    marginBottom: Spacing.lg,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    color: Colors.text.light,
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
  },
  headerContent: {
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: Typography.fontSize['3xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  headerSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
  },
  progressContainer: {
    marginTop: Spacing.base,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.text.light,
    borderRadius: 2,
  },
  progressText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.muted,
    textAlign: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.base,
  },
  stepContainer: {
    padding: Spacing.lg,
  },
  stepCard: {
    padding: Spacing.xl,
    backgroundColor: Colors.background.primary,
    ...Shadows.base,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  stepIcon: {
    fontSize: 32,
    marginRight: Spacing.lg,
  },
  stepHeaderText: {
    flex: 1,
  },
  stepTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  stepDescription: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
  },
  inputSection: {
    marginBottom: Spacing.xl,
  },
  symptomsSection: {
    marginBottom: Spacing.xl,
  },
  continueButton: {
    marginTop: Spacing.lg,
  },
  ageGroupCard: {
    marginVertical: Spacing.lg,
  },
  ageGroupContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageGroupIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  ageGroupText: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.primary.main,
    flex: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.lg,
  },
  sectionIcon: {
    fontSize: 20,
    marginRight: Spacing.sm,
  },
  symptomsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },
  vitalSignsGrid: {
    marginBottom: Spacing.xl,
  },
  vitalSignCard: {
    backgroundColor: Colors.neutral.lightest,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
    ...Shadows.sm,
  },
  vitalSignIcon: {
    fontSize: 24,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  symptomChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.background.secondary,
    borderRadius: BorderRadius.full,
    borderWidth: 2,
    borderColor: Colors.border.light,
    marginBottom: Spacing.sm,
    minHeight: 48, // Better touch target
    ...Shadows.sm,
  },
  symptomChipSelected: {
    backgroundColor: Colors.primary.main,
    borderColor: Colors.primary.main,
    transform: [{ scale: 1.02 }],
  },
  symptomChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    flex: 1,
  },
  symptomChipTextSelected: {
    color: Colors.text.light,
    fontWeight: Typography.fontWeight.medium,
  },
  symptomCheckmark: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.light,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: Spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.base,
    marginTop: Spacing.base,
  },
  halfButton: {
    flex: 1,
  },
  newAssessmentButton: {
    marginTop: Spacing.xl,
  },
  subtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.base,
  },
  recommendationCard: {
    marginBottom: Spacing.base,
    padding: Spacing.lg,
  },
  recommendationHeader: {
    marginBottom: Spacing.sm,
  },
  recommendationTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.xs,
  },
  recommendationTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.light,
  },
  matchScore: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  chiefComplaint: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
    fontStyle: 'italic',
  },
  reasoningContainer: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
  },
  reasoningTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  reasoningItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs / 2,
  },
  viewDetailsButton: {
    backgroundColor: Colors.primary.main,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: Colors.text.light,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
  },
  noResultsText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: Typography.lineHeight.relaxed,
  },
  detailedGuidanceContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.background.primary,
    zIndex: 1000,
  },
  detailedHeader: {
    backgroundColor: Colors.primary.main,
    paddingTop: 50,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.base,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: Spacing.base,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    color: Colors.text.light,
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
  },
  detailedTitle: {
    fontSize: Typography.fontSize['2xl'],
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
    marginRight: 50,
  },
  detailedSubtitle: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.muted,
  },
  detailedContent: {
    flex: 1,
    padding: Spacing.base,
  },
  guidanceSection: {
    marginBottom: Spacing.lg,
  },
  guidanceSectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.main,
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
    paddingBottom: Spacing.xs,
  },
  guidanceItem: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: Typography.lineHeight.relaxed,
    padding:20
  },
  medicationCard: {
    backgroundColor: Colors.background.secondary,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
  },
  medicationName: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  medicationDose: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  medicationTiming: {
    fontSize: Typography.fontSize.sm,
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
    marginBottom: Spacing.xs,
  },
  medicationIndication: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    fontStyle: 'italic',
  },
});

export default ClinicalDecisionSupportScreen;
