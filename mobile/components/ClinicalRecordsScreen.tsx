import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import clinicalRecordsData from '../constant/comprehensive_clinical_records.json';
import { BorderRadius, Colors, Shadows, Spacing, Typography } from '../constants/theme';
import Card from './ui/Card';
import Dropdown from './ui/Dropdown';

interface ClinicalRecordsScreenProps {
  onBack: () => void;
  selectedCategory?: any;
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
  referral_criteria?: string[];
  [key: string]: any;
}

const ageGroups = [
  { label: 'All Ages', value: 'All Ages' },
  { label: 'Neonates (0-28 days)', value: 'NEONATES (0-28 days)' },
  { label: 'Children (1 month - 5 years)', value: 'CHILDREN (1 month - 5 years)' },
  { label: 'Children (6-12 years)', value: 'CHILDREN (6-12 years)' },
  { label: 'Adolescents (12-18 years)', value: 'ADOLESCENTS (12-18 years)' },
  { label: 'Adults (18-65 years)', value: 'ADULTS (18-65 years)' },
  { label: 'Maternal Health', value: 'MATERNAL HEALTH' }
];

const severityLevels = [
  { label: 'All Severities', value: 'All Severities' },
  { label: 'Routine', value: 'Routine' },
  { label: 'Moderate', value: 'Moderate' },
  { label: 'Severe', value: 'Severe' },
  { label: 'Critical', value: 'Critical' }
];

// Helper function to get severity color
const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
    case 'emergency':
      return Colors.error.main;
    case 'urgent':
    case 'high':
      return Colors.warning.main;
    case 'moderate':
      return Colors.secondary.main;
    case 'routine':
    case 'low':
      return Colors.success.main;
    default:
      return Colors.neutral.main;
  }
};

export default function ClinicalRecordsScreen({ onBack, selectedCategory }: ClinicalRecordsScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('All Ages');
  const [selectedSeverity, setSelectedSeverity] = useState('All Severities');
  const [selectedRecord, setSelectedRecord] = useState<ClinicalRecord | null>(null);

  // Debug logging
  React.useEffect(() => {
    if (selectedCategory) {
      console.log('Selected category in ClinicalRecordsScreen:', selectedCategory);
    }
  }, [selectedCategory]);

  // Flatten all clinical records from the JSON data
  const allRecords = useMemo(() => {
    const records: ClinicalRecord[] = [];
    Object.entries(clinicalRecordsData).forEach(([, recordList]) => {
      if (Array.isArray(recordList)) {
        records.push(...recordList);
      }
    });
    return records;
  }, []);

  // Helper function to match category
  const matchesCategoryFilter = (record: ClinicalRecord, selectedCategory: any) => {
    if (!selectedCategory) return true;

    const categoryId = selectedCategory.id;
    const recordAgeGroup = record.age_group.toLowerCase();

    // Map category IDs to age group patterns
    switch (categoryId) {
      case 'neonates':
        return recordAgeGroup.includes('0-28 days') || recordAgeGroup.includes('neonate');
      case 'children':
        return recordAgeGroup.includes('1 month - 5 years') ||
               (recordAgeGroup.includes('month') && recordAgeGroup.includes('year'));
      case 'school_age':
        return recordAgeGroup.includes('6-12 years');
      case 'adolescents':
        return recordAgeGroup.includes('12-18 years') || recordAgeGroup.includes('adolescent');
      case 'adults':
        return recordAgeGroup.includes('18-65 years') || recordAgeGroup.includes('adult');
      case 'maternal':
        return record.medical_system.toLowerCase().includes('maternal') ||
               record.category.toLowerCase().includes('maternal') ||
               record.category.toLowerCase().includes('prenatal');
      case 'elderly':
        return recordAgeGroup.includes('65+') || recordAgeGroup.includes('elderly') ||
               record.medical_system.toLowerCase().includes('geriatric');
      case 'emergency':
        return record.medical_system.toLowerCase().includes('emergency') ||
               record.category.toLowerCase().includes('emergency') ||
               record.severity.toLowerCase().includes('critical') ||
               record.severity.toLowerCase().includes('emergency');
      default:
        return true;
    }
  };

  // Filter records based on search and filters
  const filteredRecords = useMemo(() => {
    return allRecords.filter(record => {
      // Filter by selected category first
      const matchesCategory = matchesCategoryFilter(record, selectedCategory);

      const matchesSearch = searchQuery === '' ||
        record.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.chief_complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.medical_system.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAgeGroup = selectedAgeGroup === 'All Ages' ||
        record.age_group.includes(selectedAgeGroup.replace('NEONATES (0-28 days)', '0-28 days')) ||
        record.age_group.includes(selectedAgeGroup.replace('CHILDREN (1 month - 5 years)', '1 month - 5 years')) ||
        record.age_group.includes(selectedAgeGroup.replace('CHILDREN (6-12 years)', '6-12 years')) ||
        record.age_group.includes(selectedAgeGroup.replace('ADOLESCENTS (12-18 years)', '12-18 years')) ||
        record.age_group.includes(selectedAgeGroup.replace('ADULTS (18-65 years)', '18-65 years')) ||
        record.age_group.includes(selectedAgeGroup.replace('MATERNAL HEALTH', 'Reproductive Age'));

      const matchesSeverity = selectedSeverity === 'All Severities' ||
        record.severity === selectedSeverity;

      return matchesCategory && matchesSearch && matchesAgeGroup && matchesSeverity;
    });
  }, [allRecords, searchQuery, selectedAgeGroup, selectedSeverity, selectedCategory]);

  const getSeverityColor = (severity: string) => {
    const severityLower = severity.toLowerCase();
    if (severityLower.includes('routine')) return Colors.medical.routine;
    if (severityLower.includes('moderate')) return Colors.medical.moderate;
    if (severityLower.includes('severe')) return Colors.medical.severe;
    if (severityLower.includes('critical')) return Colors.medical.critical;
    if (severityLower.includes('emergency')) return Colors.medical.emergency;
    return Colors.neutral.main;
  };

  const renderFilterDropdown = (
    options: { label: string; value: string }[],
    selected: string,
    onSelect: (value: string) => void,
    title: string
  ) => (
    <View style={styles.filterSection}>
      <Dropdown
        label={title}
        options={options}
        value={selected}
        onSelect={(option: any) => onSelect(option.value)}
        placeholder={`Select ${title.toLowerCase()}`}
        containerStyle={styles.dropdownContainer}
      />
    </View>
  );

  const renderRecordCard = ({ item }: { item: ClinicalRecord }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRecord(item);
      }}
    >
      <View style={styles.recordHeader}>
        <Text style={styles.recordCategory}>{item.category}</Text>
        <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(item.severity) }]}>
          <Text style={styles.severityText}>{item.severity}</Text>
        </View>
      </View>
      
      <Text style={styles.recordComplaint}>{item.chief_complaint}</Text>
      
      <View style={styles.recordMeta}>
        <Text style={styles.recordMetaText}>👥 {item.age_group}</Text>
        <Text style={styles.recordMetaText}>🏥 {item.medical_system}</Text>
      </View>
    </TouchableOpacity>
  );

  if (selectedRecord) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <View style={styles.header}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedRecord(null);
            }}
            style={styles.backButton}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>

          <View style={styles.placeholder} />
        </View>

        {/* Record Detail */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header Card with improved layout */}
          <Card style={styles.detailHeaderCard}>
            <View style={styles.detailHeader}>
              <View style={styles.categorySection}>
                <Text style={styles.detailCategory}>{selectedRecord.category}</Text>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(selectedRecord.severity) }]}>
                  <Text style={styles.severityText}>{selectedRecord.severity}</Text>
                </View>
              </View>
            </View>

            <View style={styles.chiefComplaintContainer}>
              <Text style={styles.chiefComplaintLabel}>Chief Complaint:</Text>
              <Text style={styles.detailComplaint}>{selectedRecord.chief_complaint}</Text>
            </View>

            <View style={styles.detailMetaGrid}>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>👥</Text>
                <View style={styles.metaContent}>
                  <Text style={styles.metaLabel}>Age Group</Text>
                  <Text style={styles.metaValue}>{selectedRecord.age_group}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🏥</Text>
                <View style={styles.metaContent}>
                  <Text style={styles.metaLabel}>Medical System</Text>
                  <Text style={styles.metaValue}>{selectedRecord.medical_system}</Text>
                </View>
              </View>
              <View style={styles.metaItem}>
                <Text style={styles.metaIcon}>🆔</Text>
                <View style={styles.metaContent}>
                  <Text style={styles.metaLabel}>Record ID</Text>
                  <Text style={styles.metaValue}>{selectedRecord.record_id}</Text>
                </View>
              </View>
            </View>
          </Card>

          {selectedRecord.clinical_findings && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🔍</Text>
                <Text style={styles.sectionTitle}>Clinical Findings</Text>
                <View style={styles.sectionBadge}>
                  <Text style={styles.sectionBadgeText}>{selectedRecord.clinical_findings.length}</Text>
                </View>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.clinical_findings.map((finding, index) => (
                  <View key={index} style={styles.listItemContainer}>
                    <View style={styles.bulletContainer}>
                      <Text style={styles.bulletPoint}>•</Text>
                    </View>
                    <Text style={styles.listItemText}>{finding}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {selectedRecord.immediate_actions && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>⚡</Text>
                <Text style={styles.sectionTitle}>Immediate Actions</Text>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.immediate_actions.map((action, index) => (
                  <View key={index} style={styles.actionItemContainer}>
                    <View style={styles.actionNumber}>
                      <Text style={styles.actionNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.actionText}>{action}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {selectedRecord.medications && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>💊</Text>
                <Text style={styles.sectionTitle}>Medications</Text>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.medications.map((med, index) => (
                  <View key={index} style={styles.medicationCard}>
                    <View style={styles.medicationHeader}>
                      <Text style={styles.medicationName}>{med.name || med.agent || 'Medication'}</Text>
                      <View style={styles.medicationBadge}>
                        <Text style={styles.medicationBadgeText}>#{index + 1}</Text>
                      </View>
                    </View>
                    <View style={styles.medicationDetails}>
                      {med.dose && (
                        <View style={styles.medicationDetailRow}>
                          <Text style={styles.medicationDetailLabel}>💉 Dose:</Text>
                          <Text style={styles.medicationDetailValue}>{med.dose}</Text>
                        </View>
                      )}
                      {med.duration && (
                        <View style={styles.medicationDetailRow}>
                          <Text style={styles.medicationDetailLabel}>⏱️ Duration:</Text>
                          <Text style={styles.medicationDetailValue}>{med.duration}</Text>
                        </View>
                      )}
                      {med.indication && (
                        <View style={styles.medicationDetailRow}>
                          <Text style={styles.medicationDetailLabel}>🎯 Indication:</Text>
                          <Text style={styles.medicationDetailValue}>{med.indication}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {selectedRecord.differential_diagnosis && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🩺</Text>
                <Text style={styles.sectionTitle}>Differential Diagnosis</Text>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.differential_diagnosis.map((diagnosis, index) => (
                  <View key={index} style={styles.diagnosisItem}>
                    <View style={styles.diagnosisNumber}>
                      <Text style={styles.diagnosisNumberText}>{index + 1}</Text>
                    </View>
                    <Text style={styles.diagnosisText}>{diagnosis}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {selectedRecord.health_education && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>📚</Text>
                <Text style={styles.sectionTitle}>Health Education</Text>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.health_education.map((education, index) => (
                  <View key={index} style={styles.educationItem}>
                    <Text style={styles.educationIcon}>💡</Text>
                    <Text style={styles.educationText}>{education}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}

          {selectedRecord.referral_criteria && (
            <Card style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionIcon}>🏥</Text>
                <Text style={styles.sectionTitle}>Referral Criteria</Text>
              </View>
              <View style={styles.sectionContent}>
                {selectedRecord.referral_criteria.map((criteria, index) => (
                  <View key={index} style={styles.referralItem}>
                    <Text style={styles.referralIcon}>⚠️</Text>
                    <Text style={styles.referralText}>{criteria}</Text>
                  </View>
                ))}
              </View>
            </Card>
          )}
        </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={styles.header}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onBack();
          }}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={styles.placeholder} />
      </View>

      {/* Category Indicator */}
      {selectedCategory && (
        <View style={styles.categoryIndicator}>
          <Text style={styles.categoryIndicatorIcon}>{selectedCategory.icon}</Text>
          <View style={styles.categoryIndicatorText}>
            <Text style={styles.categoryIndicatorTitle}>{selectedCategory.title}</Text>
            <Text style={styles.categoryIndicatorSubtitle}>
              {selectedCategory.subtitle} • {selectedCategory.ageGroup}
            </Text>
          </View>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>
              {filteredRecords.length}
            </Text>
          </View>
        </View>
      )}

      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search conditions, symptoms, or treatments..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={Colors.text.secondary}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        {renderFilterDropdown(ageGroups, selectedAgeGroup, setSelectedAgeGroup, 'Age Group')}
        {renderFilterDropdown(severityLevels, selectedSeverity, setSelectedSeverity, 'Severity')}
      </View>

      {/* Results */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''} found
        </Text>
      </View>

      {/* Records List */}
      {filteredRecords.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateIcon}>📋</Text>
          <Text style={styles.emptyStateTitle}>No Records Found</Text>
          <Text style={styles.emptyStateMessage}>
            {selectedCategory
              ? `No clinical records found for ${selectedCategory.title}. Try adjusting your filters or search terms.`
              : 'No clinical records match your current search and filter criteria.'
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredRecords}
          renderItem={renderRecordCard}
          keyExtractor={(item) => item.record_id}
          style={styles.recordsList}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.recordsListContent}
        />
      )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base, // Reduced since SafeAreaView handles top padding
    paddingBottom: Spacing.base,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  backButton: {
    width: 44, // Larger touch target for mobile
    height: 44,
    borderRadius: 22,
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
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.base,
  },
  searchInput: {
    height: 52, // Larger for better mobile touch
    backgroundColor: Colors.neutral.light,
    borderRadius: BorderRadius.base,
    paddingHorizontal: Spacing.lg,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filtersContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.base,
  },
  filterSection: {
    marginBottom: Spacing.base,
  },
  dropdownContainer: {
    marginBottom: 0,
  },
  resultsHeader: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  resultsCount: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  recordsList: {
    flex: 1,
  },
  recordsListContent: {
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
  },
  recordCard: {
    backgroundColor: Colors.background.primary,
    borderRadius: BorderRadius.base,
    padding: Spacing.lg, // More padding for mobile
    marginBottom: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border.light,
    minHeight: 100, // Ensure adequate touch target
    ...Shadows.sm,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recordCategory: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  severityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  severityText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.background.primary,
    textTransform: 'uppercase',
  },
  recordComplaint: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.sm,
  },
  recordMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordMetaText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  detailCard: {
    marginBottom: Spacing.base,
  },
  detailHeaderCard: {
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.primary,
    ...Shadows.base,
  },
  detailHeader: {
    marginBottom: Spacing.base,
  },
  categorySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  detailCategory: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.primary,
    flex: 1,
    marginRight: Spacing.sm,
  },
  chiefComplaintContainer: {
    marginBottom: Spacing.lg,
  },
  chiefComplaintLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailComplaint: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    lineHeight: 26, // Improved line height for better readability
    paddingVertical: Spacing.md, // Increased vertical padding
    paddingHorizontal: Spacing.lg, // Added horizontal padding
    backgroundColor: Colors.neutral.lightest, // Added background
    borderRadius: BorderRadius.base, // Increased border radius
    borderLeftWidth: 4, // Added accent border
    borderLeftColor: Colors.primary.main,
    fontStyle: 'italic', // Added italic for emphasis
  },
  detailMeta: {
    marginTop: Spacing.sm,
  },
  detailMetaGrid: {
    marginTop: Spacing.base,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.base,
    backgroundColor: Colors.neutral.lightest,
    padding: Spacing.md,
    borderRadius: BorderRadius.base,
  },
  metaIcon: {
    fontSize: 20,
    marginRight: Spacing.md,
  },
  metaContent: {
    flex: 1,
  },
  metaLabel: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaValue: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
    lineHeight: 20, // Improved line height
    paddingVertical: Spacing.xs, // Added vertical padding
  },
  detailMetaText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  sectionCard: {
    marginBottom: Spacing.xl, // Increased margin for better separation
    backgroundColor: Colors.background.primary,
    padding: Spacing.lg, // Added padding
    borderRadius: BorderRadius.lg, // Increased border radius
    ...Shadows.lg, // Enhanced shadow
    borderWidth: 1, // Added border
    borderColor: Colors.border.light, // Light border color
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  sectionBadge: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  sectionBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
  },
  bulletContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    flexShrink: 0,
  },
  sectionIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    flex: 1,
    lineHeight: 28, // Improved line height
    letterSpacing: 0.5, // Added letter spacing for better readability
  },
  sectionContent: {
    paddingTop: Spacing.lg, // Increased top padding
    paddingHorizontal: Spacing.sm, // Added horizontal padding
  },
  listItem: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
    lineHeight: 20,
  },
  listItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg, // Increased margin for better separation
    paddingHorizontal: Spacing.lg, // Increased padding
    paddingVertical: Spacing.md, // Increased vertical padding
    backgroundColor: Colors.neutral.lightest, // Added background
    borderRadius: BorderRadius.base, // Increased border radius
    minHeight: 56, // Increased minimum height for better touch targets
    borderLeftWidth: 3, // Added left border for visual emphasis
    borderLeftColor: Colors.primary.light, // Light primary color for border
    ...Shadows.sm, // Added subtle shadow
  },
  bulletPoint: {
    fontSize: Typography.fontSize.xl, // Even larger bullet point
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.bold,
    textAlign: 'center',
    lineHeight: 24, // Better alignment with text
  },
  listItemText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 26, // Increased line height for better readability
    paddingVertical: Spacing.sm, // Increased vertical padding
    paddingRight: Spacing.md, // Added right padding
    textAlign: 'left', // Ensure left alignment
    fontWeight: Typography.fontWeight.normal, // Ensure normal weight
  },
  actionItemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.warning,
    padding: Spacing.lg, // Increased padding
    borderRadius: BorderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary.main,
    minHeight: 60, // Minimum height for touch targets
    ...Shadows.sm, // Added shadow
  },
  actionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
    marginTop: 2,
  },
  actionNumberText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  actionText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24, // Improved line height
    fontWeight: Typography.fontWeight.medium,
    paddingVertical: Spacing.xs, // Added vertical padding
  },
  medicationItem: {
    marginBottom: Spacing.base,
    paddingBottom: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  medicationCard: {
    backgroundColor: Colors.neutral.lightest,
    borderRadius: BorderRadius.base,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.secondary.main,
  },
  medicationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  medicationName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary.main,
    flex: 1,
  },
  medicationBadge: {
    backgroundColor: Colors.secondary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
  },
  medicationBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
  },
  medicationDetails: {
    marginTop: Spacing.sm,
  },
  medicationDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  medicationDetailLabel: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.secondary,
    minWidth: 80,
    marginRight: Spacing.sm,
  },
  medicationDetailValue: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontWeight: Typography.fontWeight.medium,
  },
  medicationDetail: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  categoryIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
    padding: Spacing.base,
    borderRadius: BorderRadius.base,
    ...Shadows.base,
  },
  categoryIndicatorIcon: {
    fontSize: 24,
    marginRight: Spacing.base,
  },
  categoryIndicatorText: {
    flex: 1,
  },
  categoryIndicatorTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.primary.dark,
    marginBottom: 2,
  },
  categoryIndicatorSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  categoryBadge: {
    backgroundColor: Colors.primary.main,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.text.light,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['3xl'],
  },
  emptyStateIcon: {
    fontSize: 48,
    marginBottom: Spacing.lg,
  },
  emptyStateTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  // Diagnosis styles
  diagnosisItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.medical,
    padding: Spacing.lg, // Increased padding for better spacing
    borderRadius: BorderRadius.base,
    minHeight: 60, // Ensure minimum height for touch targets
  },
  diagnosisNumber: {
    width: 28, // Slightly larger for better visibility
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.secondary.main,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.lg, // Increased margin for better separation
    marginTop: 4, // Better alignment with text
    flexShrink: 0, // Prevent shrinking
  },
  diagnosisNumberText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.background.primary,
    
  },
  diagnosisText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24, // Increased for better readability
    paddingVertical: Spacing.xs, // Added vertical padding
  },
  // Education styles
  educationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg, // Increased margin for better separation
    backgroundColor: Colors.background.success,
    padding: Spacing.lg, // Increased padding for better spacing
    borderRadius: BorderRadius.base,
    minHeight: 60, // Ensure minimum height for touch targets
  },
  educationIcon: {
    fontSize: 22, // Slightly larger for better visibility
    marginRight: Spacing.lg, // Increased margin for better separation
    marginTop: 4, // Better alignment with text
    flexShrink: 0, // Prevent shrinking
    width: 28, // Fixed width for consistent alignment
    textAlign: 'center',
  },
  educationText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24, // Increased for better readability
    paddingVertical: Spacing.xs, // Added vertical padding
  },
  // Referral styles
  referralItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg, // Increased margin for better separation
    backgroundColor: Colors.background.error,
    padding: Spacing.lg, // Increased padding for better spacing
    borderRadius: BorderRadius.base,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error.main,
    minHeight: 60, // Ensure minimum height for touch targets
  },
  referralIcon: {
    fontSize: 22, // Slightly larger for better visibility
    marginRight: Spacing.lg, // Increased margin for better separation
    marginTop: 4, // Better alignment with text
    flexShrink: 0, // Prevent shrinking
    width: 28, // Fixed width for consistent alignment
    textAlign: 'center',
  },
  referralText: {
    flex: 1,
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
    lineHeight: 24, // Increased for better readability
    fontWeight: Typography.fontWeight.medium,
    paddingVertical: Spacing.xs, // Added vertical padding
  },
});
