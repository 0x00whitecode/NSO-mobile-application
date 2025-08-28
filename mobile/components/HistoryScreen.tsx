import React, { useState } from 'react';
import {
    FlatList,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { BorderRadius, Colors, Spacing, Typography } from '../constants/theme';
import Button from './ui/Button';
import Card, { StatusCard } from './ui/Card';
import Input from './ui/Input';

interface HistoryScreenProps {
  onBack: () => void;
  onViewDiagnosis: (id: string) => void;
}

interface DiagnosisRecord {
  id: string;
  complaint: string;
  patient: string;
  diagnosis: string;
  date: string;
  time: string;
  location: string;
  distance: string;
  status: 'synced' | 'pending' | 'failed' | 'draft';
}

const mockDiagnoses: DiagnosisRecord[] = [
  {
    id: '1',
    complaint: 'Fever & Cough',
    patient: 'Child, 5y',
    diagnosis: 'Upper Respiratory Tract Infection',
    date: 'Mar 15, 2024',
    time: '2:30 PM',
    location: 'Lagos, Nigeria',
    distance: '2.3km',
    status: 'synced',
  },
  {
    id: '2',
    complaint: 'Headache & Nausea',
    patient: 'Adult, 32y',
    diagnosis: 'Migraine',
    date: 'Mar 14, 2024',
    time: '9:15 AM',
    location: 'Lagos, Nigeria',
    distance: '1.8km',
    status: 'pending',
  },
  {
    id: '3',
    complaint: 'Stomach Pain',
    patient: 'Teen, 16y',
    diagnosis: 'Gastritis',
    date: 'Mar 13, 2024',
    time: '4:45 PM',
    location: 'Lagos, Nigeria',
    distance: '0.5km',
    status: 'synced',
  },
  {
    id: '4',
    complaint: 'Chest Pain',
    patient: 'Adult, 45y',
    diagnosis: 'Anxiety-related chest pain',
    date: 'Mar 12, 2024',
    time: '11:20 AM',
    location: 'Lagos, Nigeria',
    distance: '3.1km',
    status: 'failed',
  },
  {
    id: '5',
    complaint: 'Skin Rash',
    patient: 'Child, 8y',
    diagnosis: 'Allergic dermatitis',
    date: 'Mar 11, 2024',
    time: '3:15 PM',
    location: 'Lagos, Nigeria',
    distance: '1.2km',
    status: 'draft',
  },
];

export default function HistoryScreen({ onBack, onViewDiagnosis }: HistoryScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(['synced', 'pending', 'failed', 'draft']);
  const [selectedDateRange, setSelectedDateRange] = useState('all');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'synced': return '✅';
      case 'pending': return '⏳';
      case 'failed': return '❌';
      case 'draft': return '📝';
      default: return '❓';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'synced': return Colors.status.success;
      case 'pending': return Colors.status.warning;
      case 'failed': return Colors.status.error;
      case 'draft': return Colors.neutral.medium;
      default: return Colors.neutral.medium;
    }
  };

  const filteredDiagnoses = mockDiagnoses.filter(diagnosis => {
    const matchesSearch = diagnosis.complaint.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         diagnosis.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         diagnosis.diagnosis.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus.includes(diagnosis.status);
    return matchesSearch && matchesStatus;
  });

  const getSyncStats = () => {
    const total = mockDiagnoses.length;
    const synced = mockDiagnoses.filter(d => d.status === 'synced').length;
    const pending = mockDiagnoses.filter(d => d.status === 'pending').length;
    return { total, synced, pending };
  };

  const stats = getSyncStats();

  const renderDiagnosisCard = ({ item }: { item: DiagnosisRecord }) => (
    <Card style={styles.diagnosisCard} onPress={() => onViewDiagnosis(item.id)}>
      <View style={styles.cardHeader}>
        <View style={styles.cardMain}>
          <Text style={styles.diagnosisIcon}>🩺</Text>
          <View style={styles.diagnosisInfo}>
            <Text style={styles.complaint}>{item.complaint}</Text>
            <Text style={styles.patientInfo}>{item.patient} • {item.date}, {item.time}</Text>
            <Text style={styles.locationInfo}>📍 {item.distance} from clinic</Text>
            <Text style={styles.diagnosisText}>{item.diagnosis}</Text>
          </View>
        </View>
        <View style={styles.statusContainer}>
          <Text style={[styles.statusIcon, { color: getStatusColor(item.status) }]}>
            {getStatusIcon(item.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>👁️</Text>
          <Text style={styles.actionText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>✏️</Text>
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionIcon}>🗑️</Text>
          <Text style={styles.actionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderFilterPanel = () => (
    <Card style={styles.filterPanel}>
      <Text style={styles.filterTitle}>Filter & Sort</Text>
      
      <Text style={styles.filterSectionTitle}>Date Range</Text>
      <View style={styles.filterOptions}>
        {['today', 'week', 'month', 'all'].map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.filterOption,
              selectedDateRange === range && styles.filterOptionSelected
            ]}
            onPress={() => setSelectedDateRange(range)}
          >
            <Text style={[
              styles.filterOptionText,
              selectedDateRange === range && styles.filterOptionTextSelected
            ]}>
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.filterSectionTitle}>Sync Status</Text>
      <View style={styles.filterOptions}>
        {[
          { key: 'synced', label: 'Synced', icon: '✅' },
          { key: 'pending', label: 'Pending', icon: '⏳' },
          { key: 'failed', label: 'Failed', icon: '❌' },
          { key: 'draft', label: 'Draft', icon: '📝' },
        ].map((status) => (
          <TouchableOpacity
            key={status.key}
            style={[
              styles.filterOption,
              selectedStatus.includes(status.key) && styles.filterOptionSelected
            ]}
            onPress={() => {
              if (selectedStatus.includes(status.key)) {
                setSelectedStatus(selectedStatus.filter(s => s !== status.key));
              } else {
                setSelectedStatus([...selectedStatus, status.key]);
              }
            }}
          >
            <Text style={styles.filterOptionIcon}>{status.icon}</Text>
            <Text style={[
              styles.filterOptionText,
              selectedStatus.includes(status.key) && styles.filterOptionTextSelected
            ]}>
              {status.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Button
        variant="primary"
        size="small"
        onPress={() => setShowFilters(false)}
        style={styles.applyButton}
      >
        Apply Filters
      </Button>
    </Card>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.searchButton}>
          <Text style={styles.searchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Stats */}
      <StatusCard status="info" style={styles.summaryCard}>
        <View style={styles.summaryContent}>
          <Text style={styles.summaryIcon}>📊</Text>
          <View style={styles.summaryText}>
            <Text style={styles.summaryTitle}>Total: {stats.total} diagnoses</Text>
            <Text style={styles.summarySubtitle}>
              ✅ Synced: {stats.synced} • ⏳ Pending: {stats.pending}
            </Text>
          </View>
        </View>
      </StatusCard>

      {/* Search */}
      <Input
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="Search diagnoses..."
        containerStyle={styles.searchInput}
      />

      {/* Filter Toggle */}
      <TouchableOpacity
        style={styles.filterToggle}
        onPress={() => setShowFilters(!showFilters)}
      >
        <Text style={styles.filterToggleText}>🔽 Filter & Sort</Text>
        <Text style={styles.filterToggleIcon}>{showFilters ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Filter Panel */}
      {showFilters && renderFilterPanel()}

      {/* Diagnosis List */}
      <FlatList
        data={filteredDiagnoses}
        renderItem={renderDiagnosisCard}
        keyExtractor={(item) => item.id}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Card style={styles.emptyCard}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>No diagnoses found</Text>
            <Text style={styles.emptyText}>
              Try adjusting your search or filter criteria
            </Text>
          </Card>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.medical,
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
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: Typography.fontSize.base,
  },
  summaryCard: {
    margin: Spacing.base,
  },
  summaryContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIcon: {
    fontSize: Typography.fontSize['2xl'],
    marginRight: Spacing.base,
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  summarySubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  searchInput: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  filterToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background.primary,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.light,
  },
  filterToggleText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.primary,
  },
  filterToggleIcon: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  filterPanel: {
    margin: Spacing.base,
    marginTop: 0,
  },
  filterTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.base,
  },
  filterSectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
    marginTop: Spacing.base,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.base,
    backgroundColor: Colors.neutral.light,
    borderWidth: 1,
    borderColor: Colors.border.light,
  },
  filterOptionSelected: {
    backgroundColor: Colors.primary.lightest,
    borderColor: Colors.primary.main,
  },
  filterOptionIcon: {
    fontSize: Typography.fontSize.sm,
    marginRight: Spacing.xs,
  },
  filterOptionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
  },
  filterOptionTextSelected: {
    color: Colors.primary.main,
    fontWeight: Typography.fontWeight.medium,
  },
  applyButton: {
    marginTop: Spacing.base,
  },
  list: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  diagnosisCard: {
    marginBottom: Spacing.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  cardMain: {
    flex: 1,
    flexDirection: 'row',
  },
  diagnosisIcon: {
    fontSize: Typography.fontSize['2xl'],
    marginRight: Spacing.base,
  },
  diagnosisInfo: {
    flex: 1,
  },
  complaint: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.xs,
  },
  patientInfo: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  locationInfo: {
    fontSize: Typography.fontSize.xs,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  diagnosisText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.primary,
    fontStyle: 'italic',
  },
  statusContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusIcon: {
    fontSize: Typography.fontSize.lg,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border.light,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  actionIcon: {
    fontSize: Typography.fontSize.base,
    marginRight: Spacing.xs,
  },
  actionText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.text.secondary,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  emptyIcon: {
    fontSize: Typography.fontSize['4xl'],
    marginBottom: Spacing.base,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  emptyText: {
    fontSize: Typography.fontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
});
