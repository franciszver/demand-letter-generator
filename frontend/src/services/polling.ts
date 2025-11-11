import { api } from './api';

export interface ActiveUser {
  id: string;
  name: string;
  email: string;
  role: string;
  lastActivity: string;
}

export interface DraftActivity {
  activeUsers: ActiveUser[];
  currentVersion: number;
  lastModifiedBy?: {
    id: string;
    name: string;
    email: string;
  };
  lastModifiedAt?: string;
}

export type ActivityCallback = (activity: DraftActivity) => void;
export type VersionChangeCallback = (newVersion: number, lastModifiedBy?: { name: string; email: string }) => void;

export class PollingService {
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private callbacks: Map<string, ActivityCallback[]> = new Map();
  private versionCallbacks: Map<string, VersionChangeCallback[]> = new Map();
  private lastVersions: Map<string, number> = new Map();
  private readonly POLL_INTERVAL = 5000; // 5 seconds

  /**
   * Start polling for draft activity
   */
  startPolling(draftId: string, onActivity: ActivityCallback, onVersionChange?: VersionChangeCallback): void {
    // Stop existing polling for this draft
    this.stopPolling(draftId);

    // Store callbacks
    if (!this.callbacks.has(draftId)) {
      this.callbacks.set(draftId, []);
    }
    this.callbacks.get(draftId)!.push(onActivity);

    if (onVersionChange) {
      if (!this.versionCallbacks.has(draftId)) {
        this.versionCallbacks.set(draftId, []);
      }
      this.versionCallbacks.get(draftId)!.push(onVersionChange);
    }

    // Initial poll
    this.poll(draftId);

    // Set up interval
    const interval = setInterval(() => {
      this.poll(draftId);
    }, this.POLL_INTERVAL);

    this.intervals.set(draftId, interval);
  }

  /**
   * Stop polling for a draft
   */
  stopPolling(draftId: string): void {
    const interval = this.intervals.get(draftId);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(draftId);
    }
    this.callbacks.delete(draftId);
    this.versionCallbacks.delete(draftId);
    this.lastVersions.delete(draftId);
  }

  /**
   * Poll for activity
   */
  private async poll(draftId: string): Promise<void> {
    try {
      const response = await api.get<{ success: boolean; data: DraftActivity }>(`/drafts/${draftId}/activity`);
      
      if (response.data.success && response.data.data) {
        const activity = response.data.data;

        // Check for version change
        const lastVersion = this.lastVersions.get(draftId);
        if (lastVersion !== undefined && activity.currentVersion > lastVersion) {
          // Version changed - notify callbacks
          const callbacks = this.versionCallbacks.get(draftId) || [];
          callbacks.forEach(callback => {
            callback(activity.currentVersion, activity.lastModifiedBy);
          });
        }
        this.lastVersions.set(draftId, activity.currentVersion);

        // Notify activity callbacks
        const callbacks = this.callbacks.get(draftId) || [];
        callbacks.forEach(callback => {
          callback(activity);
        });
      }
    } catch (error) {
      console.error('Polling error:', error);
      // Don't stop polling on error - just log it
    }
  }

  /**
   * Get current version for a draft (without starting polling)
   */
  async getCurrentVersion(draftId: string): Promise<number | null> {
    try {
      const response = await api.get<{ success: boolean; data: DraftActivity }>(`/drafts/${draftId}/activity`);
      if (response.data.success && response.data.data) {
        return response.data.data.currentVersion;
      }
    } catch (error) {
      console.error('Failed to get current version:', error);
    }
    return null;
  }
}

export const pollingService = new PollingService();

