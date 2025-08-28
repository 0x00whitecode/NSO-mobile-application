import AsyncStorage from '../utils/storageAdapter';
import { apiService } from './apiService';
import { syncService } from './syncService';

// Types
export interface ActivityData {
  activityType: string;
  screen?: {
    name: string;
    route?: string;
    category?: string;
  };
  action?: {
    name: string;
    target?: string;
    value?: any;
    metadata?: any;
  };
  clinicalContext?: {
    patientId?: string;
    recordId?: string;
    diagnosisId?: string;
    category?: string;
    severity?: string;
  };
  location?: {
    facility?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy?: number;
    timestamp?: number;
  };
  location?: {
    facility?: string;
    state?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    accuracy?: number;
    timestamp?: number;
  };
  performance?: {
    loadTime?: number;
    responseTime?: number;
    memoryUsage?: number;
    batteryLevel?: number;
  };
  error?: {
    code: string;
    message: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    recoverable?: boolean;
  };
  interaction?: {
    inputMethod?: string;
    gestureType?: string;
    duration?: number;
    attempts?: number;
    successful?: boolean;
  };
  featureUsage?: {
    featureName: string;
    usageCount?: number;
    firstUse?: boolean;
    helpAccessed?: boolean;
    completed?: boolean;
  };
  duration?: number;
}

export interface SessionInfo {
  sessionId: string;
  startTime: string;
  currentScreen: string;
  activityCount: number;
}

class ActivityService {
  private sessionInfo: SessionInfo | null = null;
  private screenStartTime: number = 0;
  private activityQueue: ActivityData[] = [];
  private batchSize = 10;
  private batchTimeout = 30000; // 30 seconds
  private batchTimer: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeSession();
    this.setupBatchProcessing();
  }

  /**
   * Get location context for activity tracking
   */
  private async getLocationContext(): Promise<{
    coordinates?: { latitude: number; longitude: number };
    accuracy?: number;
    timestamp?: number;
  }> {
    try {
      // Mock location for web compatibility
      return {
        coordinates: {
          latitude: 6.5244, // Lagos coordinates
          longitude: 3.3792,
        },
        accuracy: 100,
        timestamp: Date.now(),
      };
    } catch (error) {
      console.error('Failed to get location context:', error);
      return {};
    }
  }

  /**
   * Initialize activity tracking session
   */
  private async initializeSession(): Promise<void> {
    try {
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      this.sessionInfo = {
        sessionId,
        startTime: new Date().toISOString(),
        currentScreen: 'app_launch',
        activityCount: 0,
      };

      // Track app launch
      await this.trackActivity({
        activityType: 'app_launch',
        screen: { name: 'app_launch', category: 'system' },
        action: { name: 'app_started', target: 'application' },
      });

    } catch (error) {
      console.error('Failed to initialize activity session:', error);
    }
  }

  /**
   * Setup batch processing for activities
   */
  private setupBatchProcessing(): void {
    // Process batch every 30 seconds or when batch size is reached
    this.batchTimer = setInterval(() => {
      if (this.activityQueue.length > 0) {
        this.processBatch();
      }
    }, this.batchTimeout);
  }

  /**
   * Track user activity
   */
  async trackActivity(activity: ActivityData): Promise<void> {
    try {
      // Get location context if not provided
      const locationContext = activity.location || await this.getLocationContext();

      // Add timestamp, session info, and location
      const enrichedActivity = {
        ...activity,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionInfo?.sessionId,
        location: locationContext,
      };

      // Add to queue for batch processing
      this.activityQueue.push(enrichedActivity);

      // Update session info
      if (this.sessionInfo) {
        this.sessionInfo.activityCount++;
        if (activity.screen?.name) {
          this.sessionInfo.currentScreen = activity.screen.name;
        }
      }

      // Process batch if size limit reached
      if (this.activityQueue.length >= this.batchSize) {
        await this.processBatch();
      }

      // Store locally for offline access
      await this.storeActivityLocally(enrichedActivity);

      // Add to sync queue for backend
      try {
        const { syncService } = await import('./syncService');
        await syncService.addActivityToSync(enrichedActivity);
      } catch (syncError) {
        console.error('Failed to add activity to sync queue:', syncError);
      }

    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  /**
   * Track screen view
   */
  async trackScreenView(
    screenName: string,
    route?: string,
    category?: string,
    loadTime?: number
  ): Promise<void> {
    // Calculate time spent on previous screen
    const now = Date.now();
    const timeSpentOnPreviousScreen = this.screenStartTime > 0 ? now - this.screenStartTime : 0;

    // Track previous screen duration if applicable
    if (timeSpentOnPreviousScreen > 0 && this.sessionInfo?.currentScreen) {
      await this.trackActivity({
        activityType: 'screen_view',
        screen: { name: this.sessionInfo.currentScreen },
        duration: timeSpentOnPreviousScreen,
      });
    }

    // Track new screen view
    await this.trackActivity({
      activityType: 'screen_view',
      screen: { name: screenName, route, category },
      performance: loadTime ? { loadTime } : undefined,
    });

    this.screenStartTime = now;
  }

  /**
   * Track button click
   */
  async trackButtonClick(
    buttonId: string,
    screenName: string,
    value?: any,
    metadata?: any
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'button_click',
      screen: { name: screenName },
      action: {
        name: 'button_click',
        target: buttonId,
        value,
        metadata,
      },
      interaction: {
        inputMethod: 'touch',
        gestureType: 'tap',
        successful: true,
      },
    });
  }

  /**
   * Track form submission
   */
  async trackFormSubmit(
    formName: string,
    screenName: string,
    formData?: any,
    successful = true
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'form_submit',
      screen: { name: screenName },
      action: {
        name: 'form_submit',
        target: formName,
        value: formData,
      },
      interaction: {
        successful,
      },
    });
  }

  /**
   * Track search action
   */
  async trackSearch(
    query: string,
    screenName: string,
    resultsCount?: number,
    category?: string
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'search',
      screen: { name: screenName, category },
      action: {
        name: 'search_performed',
        target: 'search_input',
        value: query,
        metadata: { resultsCount },
      },
    });
  }

  /**
   * Track clinical record interaction
   */
  async trackClinicalRecord(
    action: 'view' | 'create' | 'edit',
    recordId?: string,
    category?: string,
    severity?: string
  ): Promise<void> {
    await this.trackActivity({
      activityType: `clinical_record_${action}`,
      clinicalContext: {
        recordId,
        category,
        severity,
      },
      action: {
        name: `clinical_record_${action}`,
        target: 'clinical_record',
        value: recordId,
      },
    });
  }

  /**
   * Track diagnosis interaction
   */
  async trackDiagnosis(
    action: 'create' | 'view' | 'edit',
    diagnosisId?: string,
    category?: string
  ): Promise<void> {
    await this.trackActivity({
      activityType: `diagnosis_${action}`,
      clinicalContext: {
        diagnosisId,
        category,
      },
      action: {
        name: `diagnosis_${action}`,
        target: 'diagnosis',
        value: diagnosisId,
      },
    });
  }

  /**
   * Track error occurrence
   */
  async trackError(
    code: string,
    message: string,
    severity: 'low' | 'medium' | 'high' | 'critical' = 'medium',
    screenName?: string,
    category?: string,
    recoverable = true
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'error_occurred',
      screen: screenName ? { name: screenName } : undefined,
      error: {
        code,
        message,
        severity,
        category,
        recoverable,
      },
    });
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(
    featureName: string,
    screenName: string,
    firstUse = false,
    completed = true
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'feature_used',
      screen: { name: screenName },
      featureUsage: {
        featureName,
        firstUse,
        completed,
        usageCount: 1,
      },
    });
  }

  /**
   * Track sync events
   */
  async trackSync(
    action: 'initiated' | 'completed' | 'failed',
    syncId?: string,
    dataType?: string,
    recordCount?: number,
    error?: string
  ): Promise<void> {
    await this.trackActivity({
      activityType: `sync_${action}`,
      action: {
        name: `sync_${action}`,
        target: 'sync_system',
        value: syncId,
        metadata: { dataType, recordCount, error },
      },
      syncContext: {
        syncId,
        dataType,
        recordCount,
      },
    });
  }

  /**
   * Track patient diagnosis activity
   */
  async trackDiagnosis(
    patientId: string,
    patientData: {
      age: number;
      gender: string;
      symptoms: string[];
      vitalSigns?: any;
      medicalHistory?: string[];
    },
    diagnosis: {
      primary: string;
      confidence: number;
      severity: 'low' | 'medium' | 'high' | 'critical';
      recommendations: string[];
      followUpRequired: boolean;
      differentialDiagnoses?: string[];
      clinicianNotes?: string;
    },
    decisionSupportData?: {
      rulesTriggered: string[];
      recommendations: string[];
      alerts: string[];
      confidence: number;
      pathTaken: string;
      timeSpent: number;
      clinicianOverride?: boolean;
    }
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'diagnosis_made',
      patient: {
        patientId,
        ...patientData,
      },
      action: {
        name: 'diagnosis_completed',
        target: 'patient_assessment',
        value: diagnosis.primary,
        metadata: {
          confidence: diagnosis.confidence,
          severity: diagnosis.severity,
          followUpRequired: diagnosis.followUpRequired,
        },
      },
      decisionSupport: decisionSupportData,
      medicalData: {
        diagnosis: diagnosis.primary,
        confidence: diagnosis.confidence,
        severity: diagnosis.severity,
        recommendations: diagnosis.recommendations,
        followUpRequired: diagnosis.followUpRequired,
        differentialDiagnoses: diagnosis.differentialDiagnoses || [],
        clinicianNotes: diagnosis.clinicianNotes,
      },
    });
  }

  /**
   * Track clinical decision support usage
   */
  async trackDecisionSupport(
    patientId: string,
    decisionSupportData: {
      rulesTriggered: string[];
      recommendations: string[];
      alerts: string[];
      confidence: number;
      pathTaken: string;
      timeSpent: number;
      clinicianOverride?: boolean;
      systemRecommendation?: string;
      finalDecision?: string;
    },
    context?: {
      symptoms?: string[];
      vitalSigns?: any;
      screenName?: string;
    }
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'decision_support_used',
      patient: patientId ? { patientId } : undefined,
      screen: context?.screenName ? { name: context.screenName } : undefined,
      action: {
        name: 'decision_support_consulted',
        target: 'clinical_decision_system',
        value: decisionSupportData.systemRecommendation,
        metadata: {
          finalDecision: decisionSupportData.finalDecision,
          override: decisionSupportData.clinicianOverride,
          confidence: decisionSupportData.confidence,
        },
      },
      decisionSupport: decisionSupportData,
      medicalData: {
        symptoms: context?.symptoms || [],
        vitalSigns: context?.vitalSigns,
        systemRecommendation: decisionSupportData.systemRecommendation,
        finalDecision: decisionSupportData.finalDecision,
        clinicianOverride: decisionSupportData.clinicianOverride,
      },
    });
  }

  /**
   * Track patient assessment activity
   */
  async trackPatientAssessment(
    patientId: string,
    assessmentData: {
      age: number;
      gender: string;
      symptoms: string[];
      vitalSigns?: {
        temperature?: number;
        bloodPressure?: string;
        heartRate?: number;
        respiratoryRate?: number;
        oxygenSaturation?: number;
      };
      medicalHistory?: string[];
      currentMedications?: string[];
      allergies?: string[];
    },
    screenName?: string,
    assessmentType: 'initial' | 'follow_up' | 'emergency' = 'initial'
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'patient_assessment',
      patient: {
        patientId,
        ...assessmentData,
      },
      screen: screenName ? { name: screenName } : undefined,
      action: {
        name: `${assessmentType}_assessment`,
        target: 'patient_care',
        value: patientId,
        metadata: {
          assessmentType,
          symptomsCount: assessmentData.symptoms.length,
          vitalSignsRecorded: !!assessmentData.vitalSigns,
        },
      },
      medicalData: {
        assessmentType,
        symptoms: assessmentData.symptoms,
        vitalSigns: assessmentData.vitalSigns,
        medicalHistory: assessmentData.medicalHistory || [],
        currentMedications: assessmentData.currentMedications || [],
        allergies: assessmentData.allergies || [],
      },
    });
  }

  /**
   * Track clinical workflow activity
   */
  async trackClinicalWorkflow(
    workflowType: 'triage' | 'consultation' | 'treatment' | 'discharge' | 'referral',
    patientId?: string,
    workflowData?: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      duration?: number;
      outcome?: string;
      nextSteps?: string[];
      complications?: string[];
    },
    screenName?: string
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'clinical_workflow',
      patient: patientId ? { patientId } : undefined,
      screen: screenName ? { name: screenName } : undefined,
      action: {
        name: workflowType,
        target: 'clinical_workflow',
        value: workflowData?.outcome,
        metadata: {
          priority: workflowData?.priority,
          duration: workflowData?.duration,
          complications: workflowData?.complications?.length || 0,
        },
      },
      clinicalWorkflow: {
        type: workflowType,
        priority: workflowData?.priority,
        duration: workflowData?.duration,
        outcome: workflowData?.outcome,
        nextSteps: workflowData?.nextSteps || [],
        complications: workflowData?.complications || [],
      },
    });
  }

  /**
   * Track location-based activity
   */
  async trackLocationActivity(
    activityType: string,
    screenName?: string,
    action?: string,
    metadata?: any
  ): Promise<void> {
    try {
      // Mock location for web compatibility
      const location = {
        latitude: 6.5244, // Lagos coordinates
        longitude: 3.3792,
        accuracy: 100,
        timestamp: Date.now(),
      };

      await this.trackActivity({
        activityType,
        screen: screenName ? { name: screenName } : undefined,
        action: action ? {
          name: action,
          target: 'location_service',
          metadata,
        } : undefined,
        location: {
          coordinates: {
            latitude: location.latitude,
            longitude: location.longitude,
          },
          accuracy: location.accuracy,
          timestamp: location.timestamp,
        },
      });
    } catch (error) {
      console.error('Failed to track location activity:', error);
    }
  }

  /**
   * Track facility visit
   */
  async trackFacilityVisit(
    facilityName: string,
    facilityType: string,
    action: 'enter' | 'exit' | 'visit'
  ): Promise<void> {
    await this.trackLocationActivity(
      'facility_visit',
      'facility',
      `facility_${action}`,
      {
        facilityName,
        facilityType,
        action,
      }
    );
  }

  /**
   * Track location permission request
   */
  async trackLocationPermission(
    granted: boolean,
    canAskAgain: boolean
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'settings_change',
      action: {
        name: 'location_permission',
        target: 'permissions',
        value: granted ? 'granted' : 'denied',
        metadata: { canAskAgain },
      },
    });
  }

  /**
   * Track performance metrics
   */
  async trackPerformance(
    screenName: string,
    loadTime?: number,
    responseTime?: number,
    memoryUsage?: number
  ): Promise<void> {
    await this.trackActivity({
      activityType: 'screen_view',
      screen: { name: screenName },
      performance: {
        loadTime,
        responseTime,
        memoryUsage,
      },
    });
  }

  /**
   * Process activity batch
   */
  private async processBatch(): Promise<void> {
    if (this.activityQueue.length === 0) return;

    try {
      const batch = [...this.activityQueue];
      this.activityQueue = [];

      // Try to send to server
      const response = await apiService.trackActivitiesBatch(batch);

      if (!response.success) {
        // Add to sync queue for later upload
        await syncService.addToSyncQueue('user_activity', batch, 'low');
      }

    } catch (error) {
      console.error('Failed to process activity batch:', error);
      
      // Add to sync queue for later upload
      const batch = [...this.activityQueue];
      this.activityQueue = [];
      await syncService.addToSyncQueue('user_activity', batch, 'low');
    }
  }

  /**
   * Store activity locally for offline access
   */
  private async storeActivityLocally(activity: ActivityData): Promise<void> {
    try {
      const key = `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await AsyncStorage.setItem(key, JSON.stringify(activity));
    } catch (error) {
      console.error('Failed to store activity locally:', error);
    }
  }

  /**
   * End current session
   */
  async endSession(): Promise<void> {
    try {
      // Process any remaining activities
      await this.processBatch();

      // Track session end
      if (this.sessionInfo) {
        const sessionDuration = Date.now() - new Date(this.sessionInfo.startTime).getTime();
        
        await this.trackActivity({
          activityType: 'app_close',
          action: {
            name: 'session_ended',
            target: 'application',
            metadata: {
              sessionDuration,
              activityCount: this.sessionInfo.activityCount,
            },
          },
          duration: sessionDuration,
        });
      }

      // Clear batch timer
      if (this.batchTimer) {
        clearInterval(this.batchTimer);
        this.batchTimer = null;
      }

    } catch (error) {
      console.error('Failed to end session:', error);
    }
  }

  /**
   * Get current session info
   */
  getSessionInfo(): SessionInfo | null {
    return this.sessionInfo;
  }

  /**
   * Get pending activities count
   */
  getPendingActivitiesCount(): number {
    return this.activityQueue.length;
  }
}

// Export singleton instance
export const activityService = new ActivityService();
export default activityService;
