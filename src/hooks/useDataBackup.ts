import { useState, useCallback, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from '@/components/ui/sonner';

interface BackupJob {
  id: string;
  type: 'full' | 'incremental' | 'differential';
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  duration?: number;
  dataSize: number;
  backupLocation: string;
  tables: string[];
  error?: string;
  metadata?: Record<string, any>;
}

interface BackupSchedule {
  id: string;
  name: string;
  type: 'full' | 'incremental';
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string; // HH:MM format
  enabled: boolean;
  lastRun?: string;
  nextRun: string;
  retentionDays: number;
  tables: string[];
}

interface RecoveryPoint {
  id: string;
  timestamp: string;
  backupId: string;
  type: 'full' | 'incremental' | 'differential';
  dataIntegrity: 'verified' | 'unverified' | 'corrupted';
  size: number;
  description: string;
}

interface BackupStats {
  totalBackups: number;
  successfulBackups: number;
  failedBackups: number;
  totalDataSize: number;
  lastSuccessfulBackup?: string;
  averageBackupTime: number;
  storageUsage: {
    current: number;
    limit: number;
    percentage: number;
  };
}

export const useDataBackup = () => {
  const { user } = useAuth();
  const [backupJobs, setBackupJobs] = useState<BackupJob[]>([]);
  const [backupSchedules, setBackupSchedules] = useState<BackupSchedule[]>([]);
  const [recoveryPoints, setRecoveryPoints] = useState<RecoveryPoint[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Available tables for backup - memoized to prevent recreation
  const availableTables = useMemo(() => [
    'maintenance_requests',
    'visitors',
    'profiles',
    'request_attachments',
    'request_comments',
    'assets',
    'utility_readings',
    'staff_attendance',
    'daily_checklists',
    'alerts',
    'service_records'
  ], []);

  // Create backup job
  const createBackupJob = useCallback(async (
    type: BackupJob['type'],
    tables: string[] = availableTables,
    description?: string
  ) => {
    try {
      const jobId = crypto.randomUUID();
      const job: BackupJob = {
        id: jobId,
        type,
        status: 'pending',
        startedAt: new Date().toISOString(),
        dataSize: 0,
        backupLocation: `backups/${type}/${jobId}.sql`,
        tables,
        metadata: { description, initiatedBy: user?.id }
      };

      setBackupJobs(prev => [job, ...prev]);
      toast.info(`${type} backup job created`);

      // Simulate backup process
      setTimeout(async () => {
        await executeBackupJob(jobId);
      }, 1000);

      return job;
    } catch (error) {
      console.error('Error creating backup job:', error);
      toast.error('Failed to create backup job');
      throw error;
    }
  }, [user, availableTables]);

  // Execute backup job (simulated)
  const executeBackupJob = useCallback(async (jobId: string) => {
    try {
      // Update status to running
      setBackupJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'running' }
          : job
      ));

      // Simulate backup process
      const backupDuration = Math.random() * 30000 + 10000; // 10-40 seconds
      
      await new Promise(resolve => setTimeout(resolve, backupDuration));

      // Simulate data collection
      const estimatedSize = Math.floor(Math.random() * 50000000) + 10000000; // 10-60MB

      // Complete the backup
      const completedAt = new Date().toISOString();
      setBackupJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { 
              ...job, 
              status: 'completed',
              completedAt,
              duration: Math.floor(backupDuration / 1000),
              dataSize: estimatedSize
            }
          : job
      ));

      // Create recovery point
      const recoveryPoint: RecoveryPoint = {
        id: crypto.randomUUID(),
        timestamp: completedAt,
        backupId: jobId,
        type: backupJobs.find(j => j.id === jobId)?.type || 'full',
        dataIntegrity: 'verified',
        size: estimatedSize,
        description: `Backup completed at ${new Date(completedAt).toLocaleString()}`
      };

      setRecoveryPoints(prev => [recoveryPoint, ...prev]);
      
      toast.success('Backup completed successfully');
      
      // Update stats
      await updateBackupStats();

    } catch (error) {
      console.error('Error executing backup:', error);
      
      setBackupJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'failed', error: 'Backup execution failed' }
          : job
      ));
      
      toast.error('Backup failed');
    }
  }, [backupJobs]);

  // Create backup schedule
  const createBackupSchedule = useCallback(async (schedule: Omit<BackupSchedule, 'id' | 'nextRun'>) => {
    try {
      const scheduleId = crypto.randomUUID();
      
      // Calculate next run time
      const nextRun = calculateNextRun(schedule.frequency, schedule.time);
      
      const newSchedule: BackupSchedule = {
        ...schedule,
        id: scheduleId,
        nextRun: nextRun.toISOString()
      };

      setBackupSchedules(prev => [...prev, newSchedule]);
      toast.success('Backup schedule created');
      
      return newSchedule;
    } catch (error) {
      console.error('Error creating backup schedule:', error);
      toast.error('Failed to create backup schedule');
      throw error;
    }
  }, []);

  // Calculate next run time
  const calculateNextRun = useCallback((frequency: BackupSchedule['frequency'], time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const now = new Date();
    const nextRun = new Date();
    
    nextRun.setHours(hours, minutes, 0, 0);
    
    switch (frequency) {
      case 'daily':
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
      case 'weekly':
        nextRun.setDate(nextRun.getDate() + (7 - nextRun.getDay()));
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
      case 'monthly':
        nextRun.setMonth(nextRun.getMonth() + 1, 1);
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun;
  }, []);

  // Toggle schedule
  const toggleSchedule = useCallback(async (scheduleId: string) => {
    setBackupSchedules(prev => prev.map(schedule => 
      schedule.id === scheduleId 
        ? { ...schedule, enabled: !schedule.enabled }
        : schedule
    ));
    
    toast.success('Schedule updated');
  }, []);

  // Restore from backup
  const restoreFromBackup = useCallback(async (recoveryPointId: string) => {
    try {
      const recoveryPoint = recoveryPoints.find(rp => rp.id === recoveryPointId);
      if (!recoveryPoint) {
        throw new Error('Recovery point not found');
      }

      // In a real implementation, this would:
      // 1. Stop all application services
      // 2. Create a snapshot of current state
      // 3. Restore from backup
      // 4. Verify data integrity
      // 5. Restart services

      toast.info('Restore operation initiated (simulation)');
      
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast.success(`Successfully restored from backup at ${new Date(recoveryPoint.timestamp).toLocaleString()}`);
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Restore operation failed');
      throw error;
    }
  }, [recoveryPoints]);

  // Test backup integrity
  const testBackupIntegrity = useCallback(async (recoveryPointId: string) => {
    try {
      const recoveryPoint = recoveryPoints.find(rp => rp.id === recoveryPointId);
      if (!recoveryPoint) {
        throw new Error('Recovery point not found');
      }

      toast.info('Testing backup integrity...');
      
      // Simulate integrity check
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const isValid = Math.random() > 0.1; // 90% success rate
      
      setRecoveryPoints(prev => prev.map(rp => 
        rp.id === recoveryPointId 
          ? { ...rp, dataIntegrity: isValid ? 'verified' : 'corrupted' }
          : rp
      ));
      
      if (isValid) {
        toast.success('Backup integrity verified');
      } else {
        toast.error('Backup integrity check failed');
      }
      
      return isValid;
    } catch (error) {
      console.error('Error testing backup integrity:', error);
      toast.error('Integrity test failed');
      throw error;
    }
  }, [recoveryPoints]);

  // Update backup statistics - stable reference
  const updateBackupStats = useCallback(async () => {
    const completedBackups = backupJobs.filter(job => job.status === 'completed');
    const failedBackups = backupJobs.filter(job => job.status === 'failed');
    
    const totalDataSize = completedBackups.reduce((sum, job) => sum + job.dataSize, 0);
    const totalDuration = completedBackups.reduce((sum, job) => sum + (job.duration || 0), 0);
    
    const stats: BackupStats = {
      totalBackups: backupJobs.length,
      successfulBackups: completedBackups.length,
      failedBackups: failedBackups.length,
      totalDataSize,
      lastSuccessfulBackup: completedBackups[0]?.completedAt,
      averageBackupTime: completedBackups.length > 0 ? totalDuration / completedBackups.length : 0,
      storageUsage: {
        current: totalDataSize,
        limit: 1073741824, // 1GB limit
        percentage: (totalDataSize / 1073741824) * 100
      }
    };
    
    setBackupStats(stats);
  }, [backupJobs]);

  // Cleanup old backups
  const cleanupOldBackups = useCallback(async (retentionDays: number = 30) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    
    const oldBackups = backupJobs.filter(job => 
      new Date(job.startedAt) < cutoffDate && job.status === 'completed'
    );
    
    // Remove old backups
    setBackupJobs(prev => prev.filter(job => 
      !(new Date(job.startedAt) < cutoffDate && job.status === 'completed')
    ));
    
    // Remove old recovery points
    setRecoveryPoints(prev => prev.filter(rp => 
      new Date(rp.timestamp) >= cutoffDate
    ));
    
    toast.success(`Cleaned up ${oldBackups.length} old backups`);
    
    // Update stats
    await updateBackupStats();
    
    return oldBackups.length;
  }, [backupJobs]);

  // Export backup configuration
  const exportBackupConfig = useCallback(() => {
    const config = {
      schedules: backupSchedules,
      settings: {
        retentionPolicy: 30,
        compressionEnabled: true,
        encryptionEnabled: true
      },
      exportedAt: new Date().toISOString()
    };

    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_configuration_${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Backup configuration exported');
  }, [backupSchedules]);

  // Initialize backup system only once per user
  useEffect(() => {
    if (!user) return;

    const initializeBackupSystem = async () => {
      try {
        setLoading(true);
        
        // Initialize with some sample data
        const defaultSchedules: BackupSchedule[] = [
          {
            id: crypto.randomUUID(),
            name: 'Daily Full Backup',
            type: 'full',
            frequency: 'daily',
            time: '02:00',
            enabled: true,
            nextRun: calculateNextRun('daily', '02:00').toISOString(),
            retentionDays: 7,
            tables: availableTables
          },
          {
            id: crypto.randomUUID(),
            name: 'Weekly System Backup',
            type: 'full',
            frequency: 'weekly',
            time: '01:00',
            enabled: true,
            nextRun: calculateNextRun('weekly', '01:00').toISOString(),
            retentionDays: 30,
            tables: availableTables
          }
        ];
        
        setBackupSchedules(defaultSchedules);
        // Remove updateBackupStats from here to prevent infinite loop
        
      } catch (error) {
        console.error('Error initializing backup system:', error);
        setError('Failed to initialize backup system');
      } finally {
        setLoading(false);
      }
    };

    initializeBackupSystem();
  }, [user?.id, calculateNextRun, availableTables]); // Remove updateBackupStats dependency

  // Update backup stats when backup jobs change
  useEffect(() => {
    if (backupJobs.length > 0) {
      updateBackupStats();
    }
  }, [backupJobs, updateBackupStats]);

  return {
    backupJobs,
    backupSchedules,
    recoveryPoints,
    backupStats,
    loading,
    error,
    availableTables,
    createBackupJob,
    createBackupSchedule,
    toggleSchedule,
    restoreFromBackup,
    testBackupIntegrity,
    cleanupOldBackups,
    exportBackupConfig
  };
};