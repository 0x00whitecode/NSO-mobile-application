import AsyncStorage from '../utils/storageAdapter';
import { apiService } from './apiService';

// Import NetInfo properly for React Native
let NetInfo: any;
try {
  NetInfo = require('@react-native-community/netinfo');
} catch (error) {
  // Fallback for web compatibility
  NetInfo = {
    fetch: () => Promise.resolve({ isConnected: true, type: 'wifi' }),
    addEventListener: (callback: any) => {
      // Mock network listener
      return () => {};
    }
  };
}

// Storage Keys
const SYNC_STORAGE_KEYS = {
  PENDING_UPLOADS: 'pending_uploads',
  LAST_SYNC_TIME: 'last_sync_time',
  SYNC_QUEUE: 'sync_queue',
  OFFLINE_DATA: 'offline_data',
  SYNC_STATUS: 'sync_status',
};

// Types
export interface SyncItem {
  id: string;
  dataType: string;
  data: any;
  timestamp: string;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
}

export interface SyncStatus {
  isOnline: boolean;
  lastSync: string | null;
  pendingCount: number;
  inProgress: boolean;
  errors: string[];
}

export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

class SyncService {
  private syncInProgress = false;
  private syncQueue: SyncItem[] = [];
  private listeners: ((status: SyncStatus) => void)[] = [];
  private networkListener: (() => void) | null = null;

  constructor() {
    this.initializeSync();
    this.setupNetworkListener();
  }

  /**
   * Initialize sync service
   */
  private async initializeSync() {
    try {
      // Load pending sync queue
      const storedQueue = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.SYNC_QUEUE);
      if (storedQueue) {
        this.syncQueue = JSON.parse(storedQueue);
        console.log(`Loaded ${this.syncQueue.length} pending sync items`);
      }

      // Start auto-sync if online
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && this.syncQueue.length > 0) {
        console.log('Network connected, starting auto-sync...');
        this.startAutoSync();
      }
    } catch (error) {
      console.error('Failed to initialize sync service:', error);
    }
  }

  /**
   * Setup network connectivity listener
   */
  private setupNetworkListener() {
    try {
      this.networkListener = NetInfo.addEventListener((state: any) => {
        console.log('Network state changed:', state.isConnected ? 'Connected' : 'Disconnected');
        
        if (state.isConnected && !this.syncInProgress && this.syncQueue.length > 0) {
          console.log('Network connected, starting sync...');
          this.startSync();
        }
        this.notifyListeners();
      });
    } catch (error) {
      console.error('Failed to setup network listener:', error);
    }
  }

  /**
   * Add data to sync queue
   */
  async addToSyncQueue(
    dataType: string,
    data: any,
    priority: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<string> {
    const syncItem: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      dataType,
      data,
      timestamp: new Date().toISOString(),
      retryCount: 0,
      maxRetries: 3,
      priority,
    };

    // Add to queue
    this.syncQueue.push(syncItem);
    
    // Sort by priority (high -> medium -> low)
    this.syncQueue.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    // Save queue to storage
    await this.saveSyncQueue();

    console.log(`Added ${dataType} to sync queue (priority: ${priority})`);

    // Try immediate sync if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected && !this.syncInProgress) {
      console.log('Network available, starting immediate sync...');
      this.startSync();
    } else {
      console.log('Network unavailable, item queued for later sync');
    }

    this.notifyListeners();
    return syncItem.id;
  }

  /**
   * Add user profile to sync queue with high priority
   */
  async addUserProfileToSync(userProfile: any): Promise<string> {
    return await this.addToSyncQueue('user_profile', userProfile, 'high');
  }

  /**
   * Add user activity to sync queue
   */
  async addActivityToSync(activity: any): Promise<string> {
    return await this.addToSyncQueue('user_activity', activity, 'medium');
  }

  /**
   * Add diagnostic data to sync queue
   */
  async addDiagnosticDataToSync(diagnosticData: any): Promise<string> {
    return await this.addToSyncQueue('diagnostic_data', diagnosticData, 'high');
  }

  /**
   * Start synchronization process
   */
  async startSync(): Promise<SyncResult> {
    if (this.syncInProgress) {
      console.log('Sync already in progress');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['Sync already in progress'] };
    }

    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      console.log('No network connection available for sync');
      return { success: false, syncedCount: 0, failedCount: 0, errors: ['No network connection'] };
    }

    this.syncInProgress = true;
    this.notifyListeners();

    const result: SyncResult = {
      success: true,
      syncedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      console.log(`Starting sync with ${this.syncQueue.length} items in queue`);

      // Process sync queue
      const itemsToProcess = [...this.syncQueue];
      
      for (const item of itemsToProcess) {
        try {
          console.log(`Processing sync item: ${item.dataType} (${item.id})`);
          await this.syncItem(item);
          
          // Remove from queue on success
          this.syncQueue = this.syncQueue.filter(queueItem => queueItem.id !== item.id);
          result.syncedCount++;
          
          console.log(`Successfully synced ${item.dataType} item ${item.id}`);
          
        } catch (error) {
          console.error(`Failed to sync item ${item.id}:`, error);
          
          // Increment retry count
          const queueItem = this.syncQueue.find(q => q.id === item.id);
          if (queueItem) {
            queueItem.retryCount++;
            
            // Remove if max retries exceeded
            if (queueItem.retryCount >= queueItem.maxRetries) {
              this.syncQueue = this.syncQueue.filter(q => q.id !== item.id);
              result.failedCount++;
              result.errors.push(`Max retries exceeded for ${item.dataType}`);
              console.log(`Removed ${item.dataType} item after max retries`);
            } else {
              console.log(`Retry ${queueItem.retryCount}/${queueItem.maxRetries} for ${item.dataType}`);
            }
          }
        }
      }

      // Download latest data from server
      await this.downloadLatestData();

      // Update last sync time
      await AsyncStorage.setItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME, new Date().toISOString());

      // Track sync completion activity for analytics
      try {
        const { activityService } = await import('./activityService');
        await activityService.trackSync(result.success ? 'completed' : 'failed', undefined, undefined, result.syncedCount + result.failedCount);
      } catch {}

      console.log(`Sync completed: ${result.syncedCount} synced, ${result.failedCount} failed`);

    } catch (error) {
      console.error('Sync process failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.syncInProgress = false;
      await this.saveSyncQueue();
      this.notifyListeners();
    }

    return result;
  }

  /**
   * Sync individual item
   */
  private async syncItem(item: SyncItem): Promise<void> {
    console.log(`Syncing ${item.dataType} item ${item.id}`);

    // Prepare data based on type
    let syncData: any;
    let dataTypes: string[];

    switch (item.dataType) {
      case 'user_activity':
        syncData = { activities: item.data };
        dataTypes = ['activities'];
        break;
      case 'diagnosis':
        syncData = { diagnoses: item.data };
        dataTypes = ['diagnoses'];
        break;
      case 'user_profile':
        syncData = { user_profile: item.data };
        dataTypes = ['user_profile'];
        break;
      case 'clinical_records':
        syncData = { clinical_records: item.data };
        dataTypes = ['clinical_records'];
        break;
      default:
        syncData = { [item.dataType]: item.data };
        dataTypes = [item.dataType];
    }

    // Use the public uploadData method with enhanced mode detection
    const syncMode = item.priority === 'high' ? 'manual' : 'automatic';
    const response = await apiService.uploadData(
      item.dataType,
      syncData,
      syncMode
    );

    if (!response.success) {
      throw new Error(response.message || 'Upload failed');
    }

    // Track successful sync for medical activities
    if (item.dataType === 'activities' && syncData.activityType?.includes('diagnosis')) {
      try {
        const { activityService } = await import('./activityService');
        await activityService.trackSync('completed', response.data?.syncId, item.dataType, 1);
      } catch (trackError) {
        console.warn('Failed to track sync completion:', trackError);
      }
    }

    console.log(`Successfully synced ${item.dataType} item ${item.id}`);
  }

  /**
   * Get device information
   */
  private async getDeviceInfo(): Promise<any> {
    try {
      // This should match the device info structure from apiService
      return {
        platform: 'android', // This should be dynamic
        model: 'Unknown Device',
        osVersion: 'Unknown',
        appVersion: '1.0.0'
      };
    } catch (error) {
      console.error('Failed to get device info:', error);
      return {
        platform: 'unknown',
        model: 'Unknown Device',
        osVersion: 'Unknown',
        appVersion: '1.0.0'
      };
    }
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `sync_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Download latest data from server
   */
  private async downloadLatestData(): Promise<void> {
    try {
      const lastSyncTime = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);
      
      const response = await apiService.downloadData(
        'all', // Download all data types
        lastSyncTime || undefined,
        100
      );

      if (response.success && response.data) {
        // Store downloaded data
        await this.storeDownloadedData(response.data.data);
        console.log(`Downloaded ${response.data.recordCount} records from server`);
      }
    } catch (error) {
      console.error('Failed to download latest data:', error);
    }
  }

  /**
   * Store downloaded data locally
   */
  private async storeDownloadedData(data: any): Promise<void> {
    try {
      // Store different data types
      if (data.clinical_records) {
        await AsyncStorage.setItem('clinical_records', JSON.stringify(data.clinical_records));
      }
      
      if (data.diagnoses) {
        await AsyncStorage.setItem('diagnoses', JSON.stringify(data.diagnoses));
      }
      
      if (data.user_profile) {
        await AsyncStorage.setItem('user_profile', JSON.stringify(data.user_profile));
      }
      
      if (data.app_settings) {
        await AsyncStorage.setItem('app_settings', JSON.stringify(data.app_settings));
      }
    } catch (error) {
      console.error('Failed to store downloaded data:', error);
    }
  }

  /**
   * Save sync queue to storage
   */
  private async saveSyncQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue));
    } catch (error) {
      console.error('Failed to save sync queue:', error);
    }
  }

  /**
   * Get current sync status
   */
  async getSyncStatus(): Promise<SyncStatus> {
    const netInfo = await NetInfo.fetch();
    const lastSync = await AsyncStorage.getItem(SYNC_STORAGE_KEYS.LAST_SYNC_TIME);

    return {
      isOnline: netInfo.isConnected || false,
      lastSync,
      pendingCount: this.syncQueue.length,
      inProgress: this.syncInProgress,
      errors: [],
    };
  }

  /**
   * Force sync now
   */
  async forceSyncNow(): Promise<SyncResult> {
    const netInfo = await NetInfo.fetch();
    
    if (!netInfo.isConnected) {
      return {
        success: false,
        syncedCount: 0,
        failedCount: 0,
        errors: ['No internet connection'],
      };
    }

    return this.startSync();
  }

  /**
   * Clear sync queue
   */
  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.saveSyncQueue();
    this.notifyListeners();
  }

  /**
   * Start auto-sync (periodic sync)
   */
  private startAutoSync(): void {
    // Auto-sync every 5 minutes when online
    setInterval(async () => {
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && !this.syncInProgress && this.syncQueue.length > 0) {
        console.log('Auto-sync triggered');
        this.startSync();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  /**
   * Add sync status listener
   */
  addSyncStatusListener(listener: (status: SyncStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all listeners of status change
   */
  private async notifyListeners(): Promise<void> {
    const status = await this.getSyncStatus();
    this.listeners.forEach(listener => listener(status));
  }

  /**
   * Get pending sync items count
   */
  getPendingCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Get sync queue items
   */
  getSyncQueue(): SyncItem[] {
    return [...this.syncQueue];
  }

  /**
   * Remove specific item from sync queue
   */
  async removeSyncItem(itemId: string): Promise<void> {
    this.syncQueue = this.syncQueue.filter(item => item.id !== itemId);
    await this.saveSyncQueue();
    this.notifyListeners();
  }

  /**
   * Retry failed sync item
   */
  async retrySyncItem(itemId: string): Promise<void> {
    const item = this.syncQueue.find(q => q.id === itemId);
    if (item) {
      item.retryCount = 0; // Reset retry count
      const netInfo = await NetInfo.fetch();
      if (netInfo.isConnected && !this.syncInProgress) {
        this.startSync();
      }
    }
  }
}

// Export singleton instance
export const syncService = new SyncService();
export default syncService;
