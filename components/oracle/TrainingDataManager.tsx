/**
 * Training Data Manager Component
 * Comprehensive interface for managing ML training data, datasets, model training, and performance monitoring
 */

import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { motion } from 'framer-motion';
import { 
    Database, 
    Brain, 
    TrendingUp, 
    Settings, 
    BarChart3, 
    Download,
    Upload,
    Play,
    Pause,
    Target,
    CheckCircle,
    AlertTriangle,
    Save,
    RefreshCw,
    Activity
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import oracleEnsembleMLService, { 
    TrainingConfiguration, 
    TrainingProgress, 
    TrainingSession,
    ValidationReport,
    DataValidationRule,
    EnsembleModel
} from '../../services/oracleEnsembleMachineLearningService';

type TabType = 'overview' | 'datasets' | 'validation' | 'training' | 'performance' | 'config';

interface TrainingMetrics {
    accuracy: number;
    loss: number;
    epoch: number;
    learningRate: number;
    validationAccuracy: number;
}

const TrainingDataManager = memo(() => {
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [isTraining, setIsTraining] = useState(false);
    const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
    const [trainingProgress, setTrainingProgress] = useState<TrainingProgress>({
        currentStep: 0,
        totalSteps: 100,
        currentModel: 'Idle',
        phase: 'preparation',
        percentage: 0,
        message: 'Initializing training session',
        accuracy: 0.85,
        loss: 0.23,
        epoch: 45
    });
    const [trainingConfig, setTrainingConfig] = useState<TrainingConfiguration>({
        algorithm: 'ENSEMBLE',
        modelType: 'ensemble',
        hyperparameters: { learningRate: 0.001 }, // Move learningRate to hyperparameters
        trainingSplit: 0.8,
        validationSplit: 0.2,
        maxEpochs: 100,
        batchSize: 64,
        earlyStoppingEnabled: true,
        crossValidationEnabled: true,
        hyperparameterTuningEnabled: false
    });
    const [trainingHistory, setTrainingHistory] = useState<TrainingSession[]>([]);
    const [datasetStats, setDatasetStats] = useState({
        totalRecords: 0,
        trainingRecords: 0,
        validationRecords: 0,
        dataQuality: 0,
        featureCount: 0,
        missingValues: 0,
        duplicates: 0
    });
    const [modelMetrics, setModelMetrics] = useState<{
        models: EnsembleModel[];
        overallAccuracy: number;
        lastTraining: string;
    }>({
        models: [],
        overallAccuracy: 0.85,
        lastTraining: new Date().toISOString()
    });
    const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
    const [validationRules, setValidationRules] = useState<DataValidationRule[]>([]);
    const [isValidating, setIsValidating] = useState(false);
    const [systemConfig, setSystemConfig] = useState({
        ensembleStrategy: 'weighted_average',
        predictionThreshold: 0.75,
        retrainFrequency: 'weekly',
        realTimeLearning: true,
        apiRateLimit: 1000,
        cacheTtl: '15_minutes',
        logLevel: 'INFO',
        enableMonitoring: true,
        autoBackupModels: true,
        alertOnAnomalies: true
    });
    const [configurationChanged, setConfigurationChanged] = useState(false);
    const [savingConfiguration, setSavingConfiguration] = useState(false);
    
    // Enhanced loading and error states
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dataLoading, setDataLoading] = useState(false);
    const [realtimeConnected, setRealtimeConnected] = useState(false);
    
    // Specific loading states for different operations
    const [loadingStates, setLoadingStates] = useState({
        initialLoad: true,
        trainingData: false,
        validation: false,
        configuration: false,
        export: false,
        modelMetrics: false,
        datasetStats: false,
        realtimeUpdate: false
    });
    
    // Enhanced error tracking with categorization
    const [errors, setErrors] = useState<{
        general: string | null;
        training: string | null;
        validation: string | null;
        configuration: string | null;
        connection: string | null;
        dataLoad: string | null;
    }>({
        general: null,
        training: null,
        validation: null,
        configuration: null,
        connection: null,
        dataLoad: null
    });
    
    // Operation retry counts for resilience
    const [retryAttempts, setRetryAttempts] = useState<{
        dataLoad: number;
        training: number;
        validation: number;
        configuration: number;
    }>({
        dataLoad: 0,
        training: 0,
        validation: 0,
        configuration: 0
    });
    
    // Real-time update intervals
    const [updateIntervals, setUpdateIntervals] = useState<NodeJS.Timeout[]>([]);

    // Enhanced error handling utilities
    const setSpecificError = useCallback((category: keyof typeof errors, message: string | null) => {
        setErrors(prev => ({ ...prev, [category]: message }));
        if (message) {
            console.error(`${category} error:`, message);
        }
    }, [errors]);

    const clearAllErrors = useCallback(() => {
        setErrors({
            general: null,
            training: null,
            validation: null,
            configuration: null,
            connection: null,
            dataLoad: null
        });
        setError(null);
    }, []);

    const setSpecificLoading = useCallback((operation: keyof typeof loadingStates, loading: boolean) => {
        setLoadingStates(prev => ({ ...prev, [operation]: loading }));
    }, [loadingStates]);

    const incrementRetryAttempt = useCallback((operation: keyof typeof retryAttempts) => {
        setRetryAttempts(prev => ({ ...prev, [operation]: prev[operation] + 1 }));
    }, [retryAttempts]);

    const resetRetryAttempts = useCallback((operation: keyof typeof retryAttempts) => {
        setRetryAttempts(prev => ({ ...prev, [operation]: 0 }));
    }, [retryAttempts]);

    // Enhanced async operation wrapper with retry logic
    const executeWithRetry = useCallback(async <T,>(
        operation: () => Promise<T>,
        operationType: keyof typeof retryAttempts,
        maxRetries: number = 3,
        retryDelay: number = 1000
    ): Promise<T | null> => {
        const currentAttempts = retryAttempts[operationType];
        
        try {
            const result = await operation();
            resetRetryAttempts(operationType);
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            
            if (currentAttempts < maxRetries) {
                console.warn(`${operationType} failed (attempt ${currentAttempts + 1}/${maxRetries}): ${errorMessage}. Retrying in ${retryDelay}ms...`);
                incrementRetryAttempt(operationType);
                
                await new Promise(resolve => setTimeout(resolve, retryDelay));
                return executeWithRetry(operation, operationType, maxRetries, retryDelay * 1.5); // Exponential backoff
            } else {
                console.error(`${operationType} failed after ${maxRetries} attempts: ${errorMessage}`);
                setSpecificError(operationType === 'dataLoad' ? 'dataLoad' : 'general', errorMessage);
                resetRetryAttempts(operationType);
                return null;
            }
        }
    }, [retryAttempts, incrementRetryAttempt, resetRetryAttempts, setSpecificError]);

    // Load configuration function (moved up to avoid forward reference)
    const loadConfiguration = useCallback(async () => {
        return await withLoadingState(async () => {
            // FUTURE: Replace with actual service call when configuration API is available
            // const config = await oracleEnsembleMLService.getConfiguration();
            
            // Simulate potential loading failures
            if (Math.random() < 0.05) {
                throw new Error('Configuration service temporarily unavailable');
            }
            
            const config = {
                ensembleStrategy: 'weighted_average',
                predictionThreshold: 0.75,
                retrainFrequency: 'weekly',
                realTimeLearning: true,
                apiRateLimit: 1000,
                cacheTtl: '15_minutes',
                logLevel: 'INFO',
                enableMonitoring: true,
                autoBackupModels: true,
                alertOnAnomalies: true
            };
            
            setSystemConfig(config);
            setConfigurationChanged(false);
            return config;
        }, 'configuration', 'configuration');
    }, []);

    // Enhanced loading state management
    const withLoadingState = useCallback(async <T,>(
        operation: () => Promise<T>,
        loadingType: keyof typeof loadingStates,
        errorCategory?: keyof typeof errors
    ): Promise<T | null> => {
        try {
            setSpecificLoading(loadingType, true);
            if (errorCategory) {
                setSpecificError(errorCategory, null);
            }
            
            const result = await operation();
            return result;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Operation failed';
            console.error(`${loadingType} operation failed:`, error);
            
            if (errorCategory) {
                setSpecificError(errorCategory, errorMessage);
            } else {
                setError(errorMessage);
            }
            return null;
        } finally {
            setSpecificLoading(loadingType, false);
        }
    }, [setSpecificLoading, setSpecificError]);

    // Connection health monitoring
    const checkConnectionHealth = useCallback(async (): Promise<boolean> => {
        try {
            // Test connection with a lightweight operation
            const testResult = await Promise.race([
                Promise.resolve(oracleEnsembleMLService.getCurrentModelMetrics()),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
            ]);
            
            if (testResult) {
                setRealtimeConnected(true);
                setSpecificError('connection', null);
                return true;
            }
            return false;
        } catch (error) {
            setRealtimeConnected(false);
            setSpecificError('connection', 'Connection lost - attempting to reconnect...');
            return false;
        }
    }, [setSpecificError]);

    // Load initial data
    useEffect(() => {
        loadInitialData();
        const interval = setInterval(loadTrainingStatus, 1000);
        setUpdateIntervals(prev => [...prev, interval]);
        
        return () => {
            // Cleanup all intervals
            updateIntervals.forEach(clearInterval);
            clearInterval(interval);
        };
    }, []); // Remove dependencies to avoid forward reference issues

    // Initialize real-time monitoring
    const initializeRealtimeMonitoring = useCallback(async () => {
        try {
            // Set up periodic data refresh for live metrics
            const metricsInterval = setInterval(async () => {
                if (!isTraining) return;
                
                try {
                    const metrics = oracleEnsembleMLService.getCurrentModelMetrics();
                    setModelMetrics(metrics);
                    
                    const stats = await oracleEnsembleMLService.getDatasetStatistics();
                    setDatasetStats(stats);
                } catch (error) {
                    console.error('Failed to refresh real-time metrics:', error);
                }
            }, 5000); // Refresh every 5 seconds
            
            // Set up training session monitoring
            const sessionInterval = setInterval(() => {
                loadTrainingStatus();
            }, 1000); // Check training status every second
            
            setUpdateIntervals(prev => [...prev, metricsInterval, sessionInterval]);
            
        } catch (error) {
            console.error('Failed to initialize real-time monitoring:', error);
            throw error;
        }
    }, [isTraining]);

    // Enhanced data refresh for specific widgets
    const refreshDataSources = useCallback(async () => {
        return await withLoadingState(async () => {
            clearAllErrors();
            
            // Refresh all data sources with individual error handling
            const [stats, metrics, history, report] = await Promise.allSettled([
                oracleEnsembleMLService.getDatasetStatistics(),
                Promise.resolve(oracleEnsembleMLService.getCurrentModelMetrics()),
                Promise.resolve(oracleEnsembleMLService.getTrainingHistory()),
                Promise.resolve(oracleEnsembleMLService.getLastValidationReport())
            ]);
            
            // Process results and handle partial failures
            let hasErrors = false;
            
            if (stats?.status === 'fulfilled') {
                setDatasetStats(stats.value);
            } else {
                setSpecificError('dataLoad', 'Failed to load dataset statistics');
                hasErrors = true;
            }
            
            if (metrics?.status === 'fulfilled') {
                setModelMetrics(metrics.value);
            } else {
                setSpecificError('general', 'Failed to load model metrics');
                hasErrors = true;
            }
            
            if (history?.status === 'fulfilled') {
                setTrainingHistory(history.value);
            } else {
                console.warn('Failed to load training history:', history.reason);
            }
            
            if (report?.status === 'fulfilled') {
                setValidationReport(report.value);
            } else {
                console.warn('Failed to load validation report:', report.reason);
            }
            
            if (hasErrors) {
                throw new Error('Some data sources failed to refresh');
            }
            
            return true;
        }, 'datasetStats', 'dataLoad');
    }, [withLoadingState, clearAllErrors, setSpecificError]);

    const loadInitialData = useCallback(async () => {
        return await executeWithRetry(async () => {
            setIsLoading(true);
            setSpecificLoading('initialLoad', true);
            clearAllErrors();
            
            // Initialize real-time monitoring with error handling
            try {
                await initializeRealtimeMonitoring();
            } catch (error) {
                console.warn('Real-time monitoring initialization failed, continuing with basic mode:', error);
                setSpecificError('connection', 'Real-time features limited - some data may not auto-refresh');
            }

            // Load dataset statistics with enhanced error handling
            await withLoadingState(async () => {
                const stats = await oracleEnsembleMLService.getDatasetStatistics();
                setDatasetStats(stats);
                return stats;
            }, 'datasetStats', 'dataLoad');

            // Load model metrics with fallback
            try {
                setSpecificLoading('modelMetrics', true);
                const metrics = oracleEnsembleMLService.getCurrentModelMetrics();
                setModelMetrics(metrics);
            } catch (error) {
                console.warn('Failed to load model metrics, using defaults:', error);
                setSpecificError('general', 'Model metrics temporarily unavailable');
            } finally {
                setSpecificLoading('modelMetrics', false);
            }

            // Load training history (non-critical)
            try {
                const history = oracleEnsembleMLService.getTrainingHistory();
                setTrainingHistory(history);
            } catch (error) {
                console.warn('Failed to load training history:', error);
                // Don't set error for non-critical data
            }

            // Load validation rules (non-critical)
            try {
                const rules = oracleEnsembleMLService.getValidationRules();
                setValidationRules(rules);
            } catch (error) {
                console.warn('Failed to load validation rules:', error);
            }

            // Load system configuration with enhanced handling
            await withLoadingState(async () => {
                await loadConfiguration();
                return true;
            }, 'configuration', 'configuration');

            // Load last validation report (non-critical)
            try {
                const lastReport = oracleEnsembleMLService.getLastValidationReport();
                setValidationReport(lastReport);
            } catch (error) {
                console.warn('Failed to load last validation report:', error);
            }
            
            // Test connection health
            const connectionHealthy = await checkConnectionHealth();
            if (connectionHealthy) {
                setRealtimeConnected(true);
            } else {
                setSpecificError('connection', 'Connection unstable - some features may be limited');
            }
            
            return true;
        }, 'dataLoad', 3, 2000).finally(() => {
            setIsLoading(false);
            setSpecificLoading('initialLoad', false);
            setDataLoading(false);
        });
    }, [
        executeWithRetry, 
        setSpecificLoading, 
        clearAllErrors, 
        initializeRealtimeMonitoring, 
        withLoadingState, 
        setSpecificError, 
        loadConfiguration, 
        checkConnectionHealth
    ]);

    const loadTrainingStatus = useCallback(async () => {
        return await withLoadingState(async () => {
            // Check for active training sessions with timeout
            const activeSessions = await Promise.race([
                Promise.resolve(oracleEnsembleMLService.getActiveTrainingSessions()),
                new Promise<TrainingSession[]>((_, reject) => 
                    setTimeout(() => reject(new Error('Training status check timeout')), 3000)
                )
            ]);
            
            if (Array.isArray(activeSessions) && activeSessions.length > 0) {
                const session = activeSessions[0];
                setCurrentSession(session);
                setIsTraining(session?.status === 'running');
                setTrainingProgress(session.progress);
                
                // Auto-refresh model metrics during training with error handling
                if (session?.status === 'running') {
                    try {
                        const metrics = oracleEnsembleMLService.getCurrentModelMetrics();
                        setModelMetrics(metrics);
                    } catch (error) {
                        console.warn('Failed to refresh metrics during training:', error);
                        // Don't fail the entire operation for metrics refresh
                    }
                }
            } else if (isTraining) {
                setIsTraining(false);
                setCurrentSession(null);
                // Reload data after training completion with error handling
                try {
                    await refreshDataSources();
                } catch (error) {
                    console.warn('Failed to refresh data after training completion:', error);
                    setSpecificError('dataLoad', 'Failed to refresh data after training completion');
                }
            }
            
            return true;
        }, 'realtimeUpdate', 'general');
    }, [isTraining, refreshDataSources, withLoadingState, setSpecificError]);

    const handleTrainModels = useCallback(async () => {
        return await withLoadingState(async () => {
            setIsTraining(true);
            clearAllErrors();
            
            // Validate training prerequisites
            if (!realtimeConnected) {
                throw new Error('Cannot start training: Connection to ML service is not available');
            }
            
            if (datasetStats.totalRecords === 0) {
                throw new Error('Cannot start training: No training data available');
            }
            
            if (!trainingConfig.maxEpochs || trainingConfig.maxEpochs <= 0 || !trainingConfig.batchSize || trainingConfig.batchSize <= 0) {
                throw new Error('Cannot start training: Invalid training configuration');
            }
            
            // Get real training data from service with retry
            const trainingData = await executeWithRetry(async () => {
                return await oracleEnsembleMLService.getStoredTrainingData();
            }, 'training', 2, 1000);
            
            if (!trainingData) {
                throw new Error('Failed to retrieve training data after multiple attempts');
            }
            
            // Start training session with current configuration
            const sessionId = await oracleEnsembleMLService.startTrainingSession(
                trainingData,
                trainingConfig,
                `Training Session ${new Date().toLocaleString()}`,
                (progress: TrainingProgress) => {
                    setTrainingProgress(progress);
                }
            );

            console.log(`Training session started successfully: ${sessionId}`);
            
            // Trigger immediate data refresh
            try {
                await refreshDataSources();
            } catch (error) {
                console.warn('Failed to refresh data after starting training:', error);
                // Don't fail training start for this
            }
            
            resetRetryAttempts('training');
            return sessionId;
        }, 'trainingData', 'training').catch((error) => {
            console.error('Failed to start training:', error);
            setIsTraining(false);
            return null;
        });
    }, [
        trainingConfig, 
        refreshDataSources, 
        withLoadingState, 
        clearAllErrors, 
        realtimeConnected, 
        datasetStats.totalRecords, 
        executeWithRetry, 
        resetRetryAttempts
    ]);

    const handleStopTraining = useCallback(async () => {
        return await withLoadingState(async () => {
            if (!currentSession) {
                throw new Error('No active training session to stop');
            }
            
            // Attempt to cancel training session
            try {
                oracleEnsembleMLService.cancelTrainingSession(currentSession.id);
                console.log(`Training session ${currentSession.id} cancelled successfully`);
            } catch (error) {
                console.warn('Failed to gracefully cancel training session:', error);
                // Force stop the training state even if cancellation fails
            }
            
            setIsTraining(false);
            setCurrentSession(null);
            clearAllErrors();
            
            // Refresh data after stopping training
            try {
                await refreshDataSources();
            } catch (error) {
                console.warn('Failed to refresh data after stopping training:', error);
                setSpecificError('dataLoad', 'Training stopped but failed to refresh data');
            }
            
            return true;
        }, 'trainingData', 'training');
    }, [currentSession, refreshDataSources, withLoadingState, clearAllErrors, setSpecificError]);

    const exportTrainingData = async () => {
        return await withLoadingState(async () => {
            clearAllErrors();
            
            // Validate prerequisites for export
            if (!realtimeConnected) {
                throw new Error('Cannot export data: Connection to ML service is not available');
            }
            
            // Get real-time data for export with individual error handling
            const [currentMetrics, currentStats, recentHistory] = await Promise.allSettled([
                Promise.resolve(oracleEnsembleMLService.getCurrentModelMetrics()),
                oracleEnsembleMLService.getDatasetStatistics(),
                Promise.resolve(oracleEnsembleMLService.getTrainingHistory().slice(0, 10))
            ]);
            
            // Process results and handle partial failures
            const exportData: any = {
                systemConfiguration: systemConfig,
                validationReport,
                realtimeStatus: {
                    connected: realtimeConnected,
                    lastUpdate: new Date().toISOString(),
                    activeTraining: isTraining
                },
                exportDate: new Date().toISOString(),
                version: '1.0.0',
                errors: []
            };
            
            if (currentMetrics?.status === 'fulfilled') {
                exportData.modelMetrics = currentMetrics.value;
            } else {
                exportData.errors.push('Failed to export model metrics');
                console.warn('Failed to get model metrics for export:', currentMetrics.reason);
            }
            
            if (currentStats?.status === 'fulfilled') {
                exportData.datasetStats = currentStats.value;
            } else {
                exportData.errors.push('Failed to export dataset statistics');
                console.warn('Failed to get dataset stats for export:', currentStats.reason);
            }
            
            if (recentHistory?.status === 'fulfilled') {
                exportData.trainingHistory = recentHistory.value;
            } else {
                exportData.errors.push('Failed to export training history');
                console.warn('Failed to get training history for export:', recentHistory.reason);
            }
            
            // Create and download the export file
            try {
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `oracle_training_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
                
                console.log('Training data exported successfully');
                return true;
            } catch (error) {
                throw new Error('Failed to create or download export file');
            }
        }, 'export', 'general');
    };

    // Update configuration handlers with enhanced error handling
    const updateTrainingConfig = useCallback((updates: Partial<TrainingConfiguration>) => {
        try {
            // Validate configuration updates
            if (updates.maxEpochs !== undefined && updates.maxEpochs <= 0) {
                throw new Error('Max epochs must be greater than 0');
            }
            if (updates.batchSize !== undefined && updates.batchSize <= 0) {
                throw new Error('Batch size must be greater than 0');
            }
            if (updates.hyperparameters?.learningRate !== undefined && (updates.hyperparameters.learningRate <= 0 || updates.hyperparameters.learningRate >= 1)) {
                throw new Error('Learning rate must be between 0 and 1');
            }
            if (updates.trainingSplit !== undefined && (updates.trainingSplit <= 0 || updates.trainingSplit >= 1)) {
                throw new Error('Training split must be between 0 and 1');
            }
            if (updates.validationSplit !== undefined && (updates.validationSplit <= 0 || updates.validationSplit >= 1)) {
                throw new Error('Validation split must be between 0 and 1');
            }
            
            setTrainingConfig(prev => ({ ...prev, ...updates }));
            clearAllErrors();
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid configuration update';
            setSpecificError('configuration', errorMessage);
            console.error('Configuration validation failed:', error);
        }
    }, [clearAllErrors, setSpecificError]);

    // Memoized computed values for performance optimization
    const trainingProgressPercentage = useMemo(() => {
        return Math.round((trainingProgress.currentStep / trainingProgress.totalSteps) * 100);
    }, [trainingProgress.currentStep, trainingProgress.totalSteps]);

    const trainingSplitPercentages = useMemo(() => ({
        training: Math.round((trainingConfig.trainingSplit || 0.8) * 100),
        validation: Math.round((trainingConfig.validationSplit || 0.2) * 100)
    }), [trainingConfig.trainingSplit, trainingConfig.validationSplit]);

    const formattedTrainingMetrics = useMemo(() => ({
        accuracy: (trainingProgress.accuracy || 0).toFixed(3),
        loss: (trainingProgress.loss || 0).toFixed(3),
        overallAccuracy: modelMetrics.overallAccuracy.toFixed(3)
    }), [trainingProgress.accuracy, trainingProgress.loss, modelMetrics.overallAccuracy]);

    const recentTrainingSessions = useMemo(() => {
        return trainingHistory.slice(0, 4);
    }, [trainingHistory]);

    // Enhanced event handlers for better performance
    const handleErrorDismiss = useCallback((errorType?: keyof typeof errors) => {
        if (errorType) {
            setSpecificError(errorType, null);
        } else {
            clearAllErrors();
        }
    }, [setSpecificError, clearAllErrors]);

    // Enhanced validation handlers
    const handleValidateData = useCallback(async () => {
        return await executeWithRetry(async () => {
            setSpecificError('validation', null);
            
            // Validate prerequisites
            if (!realtimeConnected) {
                throw new Error('Cannot validate data: Connection to ML service is not available');
            }
            
            if (datasetStats.totalRecords === 0) {
                throw new Error('Cannot validate data: No dataset available for validation');
            }
            
            // Get real training data and run validation
            const trainingData = await oracleEnsembleMLService.getStoredTrainingData();
            
            if (!trainingData || (Array.isArray(trainingData) && trainingData.length === 0)) {
                throw new Error('No training data available for validation');
            }
            
            const report = await oracleEnsembleMLService.validateDataset(trainingData);
            
            if (!report) {
                throw new Error('Validation completed but no report was generated');
            }
            
            setValidationReport(report);
            
            // Refresh related data with error handling
            try {
                const rules = oracleEnsembleMLService.getValidationRules();
                setValidationRules(rules);
            } catch (error) {
                console.warn('Failed to refresh validation rules after validation:', error);
                // Don't fail the entire validation for this
            }
            
            console.log('Data validation completed successfully');
            resetRetryAttempts('validation');
            return report;
        }, 'validation', 3, 1500);
    }, [
        executeWithRetry, 
        setSpecificError, 
        realtimeConnected, 
        datasetStats.totalRecords, 
        resetRetryAttempts
    ]);

    // Helper functions for styling
    const getSessionStatusClass = (status: string): string => {
        switch (status) {
            case 'completed':
                return 'bg-green-600 text-green-100';
            case 'running':
                return 'bg-blue-600 text-blue-100';
            case 'failed':
                return 'bg-red-600 text-red-100';
            default:
                return 'bg-gray-600 text-gray-100';
        }
    };

    const getQualityScoreClass = (score: number): string => {
        if (score >= 90) return 'text-green-400';
        if (score >= 75) return 'text-yellow-400';
        return 'text-red-400';
    };

    const getDatasetQualityClass = (quality: number): string => {
        if (quality >= 95) return 'bg-green-600 text-green-100';
        if (quality >= 90) return 'bg-yellow-600 text-yellow-100';
        return 'bg-red-600 text-red-100';
    };

    const getValidationResultClass = (passed: boolean, severity?: string): string => {
        if (passed) return 'bg-green-600 text-green-100';
        return severity === 'error' ? 'bg-red-600 text-red-100' : 'bg-yellow-600 text-yellow-100';
    };

    const getValidationResultText = (passed: boolean, severity?: string): string => {
        if (passed) return 'Pass';
        return severity === 'error' ? 'Error' : 'Warning';
    };

    const getTestStatusClass = (status: string): string => {
        switch (status) {
            case 'active':
                return 'bg-blue-500/20 text-blue-400';
            case 'completed':
                return 'bg-green-500/20 text-green-400';
            case 'paused':
                return 'bg-yellow-500/20 text-yellow-400';
            default:
                return 'bg-gray-500/20 text-gray-400';
        }
    };

    const getModelStatusClass = (isActive: boolean, type?: string): string => {
        if (isActive && type === 'STACKED_ENSEMBLE') return 'bg-green-600 text-green-100';
        return isActive ? 'bg-blue-600 text-blue-100' : 'bg-gray-600 text-gray-100';
    };

    const getModelStatusText = (isActive: boolean, type?: string): string => {
        if (isActive && type === 'STACKED_ENSEMBLE') return 'Active Ensemble';
        return isActive ? 'Active' : 'Inactive';
    };

    // Helper function to get loading state message
    const getLoadingStateMessage = useCallback(() => {
        if (loadingStates.trainingData) return 'Processing training data...';
        if (loadingStates.validation) return 'Running validation...';
        return 'Refreshing data...';
    }, [loadingStates]);

    // Helper function to get button text based on connection
    const getConnectionDependentText = useCallback((connectedText: string, disconnectedText: string = 'Connection Required') => {
        return realtimeConnected ? connectedText : disconnectedText;
    }, [realtimeConnected]);

    // Enhanced configuration management functions
    const handleConfigurationChange = useCallback((field: string, value: any) => {
        try {
            // Validate specific configuration fields
            if (field === 'predictionThreshold' && (value < 0 || value > 1)) {
                throw new Error('Prediction threshold must be between 0 and 1');
            }
            if (field === 'apiRateLimit' && value <= 0) {
                throw new Error('API rate limit must be greater than 0');
            }
            
            setSystemConfig(prev => ({ ...prev, [field]: value }));
            setConfigurationChanged(true);
            setSpecificError('configuration', null);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Invalid configuration value';
            setSpecificError('configuration', errorMessage);
            console.error('Configuration change validation failed:', error);
        }
    }, [setSpecificError]);

    const saveConfiguration = useCallback(async () => {
        return await withLoadingState(async () => {
            if (!configurationChanged) {
                throw new Error('No configuration changes to save');
            }
            
            // Validate entire configuration before saving
            if (systemConfig.predictionThreshold < 0 || systemConfig.predictionThreshold > 1) {
                throw new Error('Invalid prediction threshold value');
            }
            if (systemConfig.apiRateLimit <= 0) {
                throw new Error('Invalid API rate limit value');
            }
            
            // FUTURE: Implement actual service call when configuration API is available
            // const success = await oracleEnsembleMLService.updateConfiguration(systemConfig);
            
            // Simulate API call delay for now with potential failure
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Simulate occasional failures for testing
            if (Math.random() < 0.1) {
                throw new Error('Configuration service temporarily unavailable');
            }
            
            const success = true; 
            
            if (success) {
                setConfigurationChanged(false);
                console.log('Configuration saved successfully');
                
                // Refresh data to reflect configuration changes
                try {
                    await refreshDataSources();
                } catch (error) {
                    console.warn('Configuration saved but failed to refresh data:', error);
                    // Don't fail the save operation for this
                }
                
                return true;
            } else {
                throw new Error('Configuration save operation failed');
            }
        }, 'configuration', 'configuration');
    }, [systemConfig, refreshDataSources, withLoadingState, configurationChanged]);

    const resetConfiguration = useCallback(async () => {
        return await withLoadingState(async () => {
            // FUTURE: Replace with actual service call when configuration API is available
            // const defaultConfig = await oracleEnsembleMLService.getDefaultConfiguration();
            
            const defaultConfig = {
                ensembleStrategy: 'weighted_average',
                predictionThreshold: 0.75,
                retrainFrequency: 'weekly',
                realTimeLearning: true,
                apiRateLimit: 1000,
                cacheTtl: '15_minutes',
                logLevel: 'INFO',
                enableMonitoring: true,
                autoBackupModels: true,
                alertOnAnomalies: true
            };
            
            setSystemConfig(defaultConfig);
            setConfigurationChanged(true);
            console.log('Configuration reset to defaults');
            return defaultConfig;
        }, 'configuration', 'configuration');
    }, [withLoadingState]);

    const getAPIStatusClass = (status: string): string => {
        switch (status) {
            case 'connected':
                return 'bg-green-400';
            case 'warning':
                return 'bg-yellow-400';
            case 'error':
                return 'bg-red-400';
            default:
                return 'bg-gray-400';
        }
    };

    const getAPIStatusTextClass = (status: string): string => {
        switch (status) {
            case 'connected':
                return 'text-green-400';
            case 'warning':
                return 'text-yellow-400';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    const renderOverviewTab = () => (
        <div className="space-y-4 sm:space-y-6">
            {/* Enhanced Error Display with Mobile Optimization */}
            {(error || Object.values(errors).some((e: any) => e !== null)) && (
                <div className="space-y-2">
                    {/* General Error */}
                    {(error || errors.general) && (
                        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                                <span className="text-red-200 font-medium text-sm sm:text-base">Error</span>
                            </div>
                            <p className="text-red-300 text-sm sm:text-base mb-3">{error || errors.general}</p>
                            <button 
                                onClick={() => handleErrorDismiss('general')}
                                className="w-full sm:w-auto px-4 py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors mobile-touch-target"
                            >
                                Dismiss
                            </button>
                        </div>
                    )}
                    
                    {/* Connection Error */}
                    {errors.connection && (
                        <div className="bg-yellow-900/50 border border-yellow-500 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                                <span className="text-yellow-200 font-medium text-sm sm:text-base">Connection Issue</span>
                            </div>
                            <p className="text-yellow-300 text-sm sm:text-base mb-3">{errors.connection}</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button 
                                    onClick={() => handleErrorDismiss('connection')}
                                    className="w-full sm:w-auto px-4 py-3 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors mobile-touch-target"
                                >
                                    Dismiss
                                </button>
                                <button 
                                    onClick={checkConnectionHealth}
                                    className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mobile-touch-target"
                                >
                                    Retry Connection
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Training Error */}
                    {errors.training && (
                        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 sm:p-4">
                            <div className="flex items-center space-x-2 mb-2">
                                <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-red-400 flex-shrink-0" />
                                <span className="text-red-200 font-medium text-sm sm:text-base">Training Error</span>
                            </div>
                            <p className="text-red-300 text-sm sm:text-base mb-3">{errors.training}</p>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <button 
                                    onClick={() => handleErrorDismiss('training')}
                                    className="w-full sm:w-auto px-4 py-3 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors mobile-touch-target"
                                >
                                    Dismiss
                                </button>
                                {retryAttempts.training < 3 && (
                                    <button 
                                        onClick={handleTrainModels}
                                        className="w-full sm:w-auto px-4 py-3 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors mobile-touch-target"
                                    >
                                        Retry Training
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Enhanced Loading Indicators with Mobile Optimization */}
            {(isLoading || loadingStates.initialLoad) && (
                <div className="bg-blue-900/50 border border-blue-500 rounded-lg p-3 sm:p-4 mb-4">
                    <div className="flex items-center space-x-2">
                        <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 animate-spin flex-shrink-0" />
                        <span className="text-blue-200 text-sm sm:text-base">
                            {loadingStates.initialLoad ? 'Initializing training system...' : 'Loading training data...'}
                        </span>
                    </div>
                    {Object.entries(loadingStates).some(([_, loading]) => loading) && (
                        <div className="mt-3 space-y-1">
                            {loadingStates.datasetStats && (
                                <div className="text-xs sm:text-sm text-blue-300">• Loading dataset statistics...</div>
                            )}
                            {loadingStates.modelMetrics && (
                                <div className="text-xs sm:text-sm text-blue-300">• Loading model metrics...</div>
                            )}
                            {loadingStates.configuration && (
                                <div className="text-xs sm:text-sm text-blue-300">• Loading configuration...</div>
                            )}
                            {loadingStates.realtimeUpdate && (
                                <div className="text-xs sm:text-sm text-blue-300">• Updating real-time data...</div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Mobile-Optimized Metrics Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                {/* Training Status Widget - Mobile Enhanced */}
                <Widget title="Training Status" className="bg-gray-900/50 widget-mobile-responsive">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Current State</span>
                            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                isTraining ? 'bg-blue-600 text-blue-100' : 'bg-green-600 text-green-100'
                            }`}>
                                {isTraining ? 'Training' : 'Ready'}
                            </span>
                        </div>
                        
                        {/* Real-time Connection Status with Enhanced Mobile Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Connection</span>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${getAPIStatusClass(realtimeConnected ? 'connected' : 'error')}`}></div>
                                <span className={`text-xs sm:text-sm ${getAPIStatusTextClass(realtimeConnected ? 'connected' : 'error')}`}>
                                    {realtimeConnected ? 'Connected' : 'Disconnected'}
                                </span>
                                {errors.connection && (
                                    <AlertTriangle className="w-3 h-3 text-yellow-400" />
                                )}
                            </div>
                        </div>
                        
                        {/* Enhanced Data Loading Indicators */}
                        {(dataLoading || Object.values(loadingStates).some((loading: any) => loading)) && (
                            <div className="space-y-1">
                                <div className="flex items-center space-x-2">
                                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                                    <span className="text-blue-300 text-sm">
                                        {loadingStates.export ? 'Exporting data...' : getLoadingStateMessage()}
                                    </span>
                                </div>
                                {retryAttempts.dataLoad > 0 && (
                                    <div className="text-xs text-yellow-300">
                                        Retry attempt {retryAttempts.dataLoad}/3
                                    </div>
                                )}
                            </div>
                        )}
                        
                        {/* Training Progress with Error Handling */}
                        {isTraining && (
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                    <span className="text-gray-400 text-sm">Progress</span>
                                    <span className="text-blue-400 font-semibold text-sm">{trainingProgressPercentage}%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                    <div 
                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 sm:h-3 rounded-full transition-all duration-300"
                                        style={{ width: `${trainingProgressPercentage}%` }}
                                    ></div>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-400">
                                    {trainingProgress.currentModel} - {trainingProgress.phase}
                                    {errors.training && (
                                        <span className="text-red-400 ml-2">(Error occurred)</span>
                                    )}
                                </div>
                            </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-4 border-t border-gray-700">
                            <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-green-400">{formattedTrainingMetrics.accuracy}</div>
                                <div className="text-xs sm:text-sm text-gray-400">Accuracy</div>
                            </div>
                            <div className="text-center">
                                <div className="text-base sm:text-lg font-bold text-blue-400">{formattedTrainingMetrics.loss}</div>
                                <div className="text-xs sm:text-sm text-gray-400">Loss</div>
                            </div>
                        </div>
                    </div>
                </Widget>

                {/* Dataset Summary Widget - Mobile Enhanced */}
                <Widget title="Dataset Summary" className="bg-gray-900/50 widget-mobile-responsive">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Total Records</span>
                            <span className="text-lg sm:text-2xl font-bold text-white">{datasetStats.totalRecords.toLocaleString()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Training Set</span>
                            <span className="text-white text-sm sm:text-base">{datasetStats.trainingRecords.toLocaleString()} ({trainingSplitPercentages.training}%)</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Validation Set</span>
                            <span className="text-white text-sm sm:text-base">{datasetStats.validationRecords.toLocaleString()} ({trainingSplitPercentages.validation}%)</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Data Quality</span>
                            <span className="text-green-400 font-semibold text-sm sm:text-base">{datasetStats.dataQuality.toFixed(1)}%</span>
                        </div>
                    </div>
                </Widget>

                {/* Model Performance Widget - Mobile Enhanced */}
                <Widget title="Model Performance" className="bg-gray-900/50 widget-mobile-responsive">
                    <div className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Validation Accuracy</span>
                            <span className="text-lg sm:text-xl font-bold text-green-400">{formattedTrainingMetrics.overallAccuracy}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Current Epoch</span>
                            <span className="text-white text-sm sm:text-base">{trainingProgress.epoch || 0}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Learning Rate</span>
                            <span className="text-white text-sm sm:text-base">{trainingConfig.hyperparameters?.learningRate || 0.001}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-gray-300 text-sm sm:text-base">Active Models</span>
                            <span className="text-blue-400 text-sm sm:text-base">{modelMetrics.models.length}</span>
                        </div>
                    </div>
                </Widget>
            </div>

            {/* Mobile-Optimized Secondary Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Recent Training Sessions Widget - Mobile Enhanced */}
                <Widget title="Recent Training Sessions" className="bg-gray-900/50 widget-mobile-responsive">
                    <div className="space-y-3">
                        {recentTrainingSessions.map((session: any) => (
                            <div key={session.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg gap-3 sm:gap-0 min-h-[80px] sm:min-h-[60px]">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm sm:text-base truncate">{session.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-400">{new Date(session.startTime).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center justify-between sm:justify-end space-x-3 flex-shrink-0">
                                    {Boolean(session.metrics.finalAccuracy) && (
                                        <span className="text-green-400 font-semibold text-sm">{session.metrics.finalAccuracy.toFixed(3)}</span>
                                    )}
                                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                        getSessionStatusClass(session?.status)
                                    }`}>
                                        {session?.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                        {recentTrainingSessions.length === 0 && (
                            <div className="text-center text-gray-400 py-6 sm:py-4">
                                <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No training sessions yet.</p>
                                <p className="text-xs">Start your first training session!</p>
                            </div>
                        )}
                    </div>
                </Widget>

                {/* System Resources Widget - Mobile Enhanced */}
                <Widget title="System Resources" className="bg-gray-900/50 widget-mobile-responsive">
                    <div className="space-y-4">
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm mb-2 gap-1">
                                <span className="text-gray-300">GPU Usage</span>
                                <span className="text-white font-semibold">73%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                <div className="bg-red-500 h-2 sm:h-3 rounded-full transition-all duration-300" style={{ width: '73%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm mb-2 gap-1">
                                <span className="text-gray-300">Memory Usage</span>
                                <span className="text-white font-semibold">45%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                <div className="bg-yellow-500 h-2 sm:h-3 rounded-full transition-all duration-300" style={{ width: '45%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-sm mb-2 gap-1">
                                <span className="text-gray-300">CPU Usage</span>
                                <span className="text-white font-semibold">28%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                <div className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-300" style={{ width: '28%' }}></div>
                            </div>
                        </div>
                        
                        {/* Additional System Info */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-4 pt-3 border-t border-gray-700">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-gray-300 text-xs sm:text-sm">Active Workers</span>
                                <span className="text-white font-semibold text-xs sm:text-sm">8/12</span>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <span className="text-gray-300 text-xs sm:text-sm">Queue Size</span>
                                <span className="text-white font-semibold text-xs sm:text-sm">3 jobs</span>
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );

    const renderDatasetsTab = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Widget title="Data Sources" className="bg-gray-900/50">
                    <div className="space-y-3">
                        {[
                            { name: 'Fantasy API', status: 'active', records: '1.2M', lastUpdate: '2 min ago' },
                            { name: 'Historical Stats', status: 'active', records: '890K', lastUpdate: '5 min ago' },
                            { name: 'Weather Data', status: 'warning', records: '145K', lastUpdate: '1 hour ago' },
                            { name: 'Injury Reports', status: 'active', records: '23K', lastUpdate: '30 sec ago' }
                        ].map((source) => (
                            <div key={source.name} className="flex items-center justify-between p-3 sm:p-4 bg-gray-800/50 rounded-lg min-h-[60px]">
                                <div className="flex-1 min-w-0">
                                    <div className="font-medium text-white text-sm sm:text-base truncate">{source.name}</div>
                                    <div className="text-xs sm:text-sm text-gray-400">{source.records} records</div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-3">
                                    <div className="flex items-center justify-end mb-1">
                                        <div className={`w-2 h-2 rounded-full ${
                                            source?.status === 'active' ? 'bg-green-400' : 'bg-yellow-400'
                                        }`}></div>
                                        <span className="ml-2 text-xs text-gray-400 capitalize">{source?.status}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 whitespace-nowrap">{source.lastUpdate}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </Widget>

                <Widget title="Data Quality Metrics" className="bg-gray-900/50">
                    <div className="space-y-4">
                        {validationReport ? (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-lg font-semibold text-white">Overall Score</span>
                                    <span className={`text-2xl font-bold ${getQualityScoreClass(validationReport.score)}`}>
                                        {validationReport.score.toFixed(1)}%
                                    </span>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Completeness</span>
                                            <span className="text-white">{validationReport.qualityMetrics.completeness.score.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-green-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.completeness.score}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Accuracy</span>
                                            <span className="text-white">{validationReport.qualityMetrics.accuracy.score.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.accuracy.score}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Consistency</span>
                                            <span className="text-white">{validationReport.qualityMetrics.consistency.score.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.consistency.score}%` }}></div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-gray-400">Validity</span>
                                            <span className="text-white">{validationReport.qualityMetrics.validity.score.toFixed(1)}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.validity.score}%` }}></div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <div className="text-gray-400 mb-2">No validation report available</div>
                                <button 
                                    onClick={handleValidateData}
                                    disabled={isValidating}
                                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {isValidating ? 'Validating...' : 'Run Validation'}
                                </button>
                            </div>
                        )}
                    </div>
                </Widget>

                <Widget title="Dataset Actions" className="bg-gray-900/50">
                    <div className="space-y-3">
                        {/* Error display for dataset actions */}
                        {errors.dataLoad && (
                            <div className="bg-red-900/50 border border-red-500 rounded p-2 mb-3">
                                <div className="text-red-300 text-sm">{errors.dataLoad}</div>
                                <button 
                                    onClick={() => handleErrorDismiss('dataLoad')}
                                    className="text-red-400 hover:text-red-300 text-xs mt-1"
                                >
                                    Dismiss
                                </button>
                            </div>
                        )}
                        
                        <button 
                            disabled={!realtimeConnected}
                            className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px] touch-target"
                        >
                            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Upload Dataset</span>
                        </button>
                        
                        <button 
                            onClick={refreshDataSources}
                            disabled={loadingStates.datasetStats || !realtimeConnected}
                            className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[48px] touch-target"
                        >
                            <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 ${loadingStates.datasetStats ? 'animate-spin' : ''}`} />
                            <span className="truncate">
                                {loadingStates.datasetStats ? 'Refreshing...' : getConnectionDependentText('Refresh Data')}
                            </span>
                        </button>
                        
                        <button 
                            onClick={handleValidateData}
                            disabled={loadingStates.validation || loadingStates.datasetStats || !realtimeConnected}
                            className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[48px] touch-target"
                        >
                            <Target className={`w-4 h-4 sm:w-5 sm:h-5 ${loadingStates.validation ? 'animate-spin' : ''}`} />
                            <span className="truncate">
                                {loadingStates.validation ? 'Validating...' : getConnectionDependentText('Validate Quality')}
                            </span>
                        </button>
                        
                        <button 
                            onClick={exportTrainingData}
                            disabled={loadingStates.export || !realtimeConnected}
                            className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm sm:text-base min-h-[48px] touch-target"
                        >
                            <Download className={`w-4 h-4 sm:w-5 sm:h-5 ${loadingStates.export ? 'animate-spin' : ''}`} />
                            <span className="truncate">
                                {loadingStates.export ? 'Exporting...' : getConnectionDependentText('Export Dataset')}
                            </span>
                        </button>
                        
                        {/* Retry attempts indicator */}
                        {(retryAttempts.dataLoad > 0 || retryAttempts.validation > 0) && (
                            <div className="text-xs text-yellow-300 text-center pt-2 border-t border-gray-700">
                                {retryAttempts.dataLoad > 0 && `Data load retries: ${retryAttempts.dataLoad}/3`}
                                {retryAttempts.validation > 0 && `Validation retries: ${retryAttempts.validation}/3`}
                            </div>
                        )}
                    </div>
                </Widget>
            </div>

            <Widget title="Dataset Management" className="bg-gray-900/50">
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-white">Available Datasets</h3>
                        <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base min-h-[44px] touch-target">
                                Add Dataset
                            </button>
                            <button className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm sm:text-base min-h-[44px] touch-target">
                                Import
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
                        {[
                            { name: 'Player Statistics 2024', size: '245 MB', records: '1.2M', format: 'CSV', lastModified: '2 hours ago', quality: 96.8 },
                            { name: 'Historical Matchups', size: '156 MB', records: '890K', format: 'JSON', lastModified: '5 hours ago', quality: 94.2 },
                            { name: 'Weather Conditions', size: '89 MB', records: '145K', format: 'CSV', lastModified: '1 day ago', quality: 87.5 },
                            { name: 'Injury Reports', size: '12 MB', records: '23K', format: 'JSON', lastModified: '3 hours ago', quality: 98.1 },
                            { name: 'Team Analytics', size: '198 MB', records: '567K', format: 'Parquet', lastModified: '6 hours ago', quality: 95.7 },
                            { name: 'Draft Results', size: '34 MB', records: '78K', format: 'CSV', lastModified: '12 hours ago', quality: 93.4 }
                        ].map((dataset) => (
                            <div key={dataset.name} className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700 min-h-[200px] flex flex-col">
                                <div className="flex items-start justify-between mb-2 flex-wrap gap-2">
                                    <h4 className="font-medium text-white text-sm sm:text-base truncate flex-1 min-w-0">{dataset.name}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap flex-shrink-0 ${getDatasetQualityClass(dataset.quality)}`}>
                                        {dataset.quality}%
                                    </span>
                                </div>
                                <div className="space-y-1 text-xs sm:text-sm text-gray-400 flex-1">
                                    <div className="flex justify-between items-center">
                                        <span>Size:</span>
                                        <span className="text-white font-medium">{dataset.size}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Records:</span>
                                        <span className="text-white font-medium">{dataset.records}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Format:</span>
                                        <span className="text-white font-medium">{dataset.format}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span>Modified:</span>
                                        <span className="text-white font-medium">{dataset.lastModified}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-2 border-t border-gray-700">
                                    <button className="flex-1 px-2 py-2 bg-blue-600 text-white text-xs sm:text-sm rounded hover:bg-blue-700 transition-colors min-h-[36px] touch-target">
                                        View
                                    </button>
                                    <button className="flex-1 px-2 py-2 bg-gray-600 text-white text-xs sm:text-sm rounded hover:bg-gray-700 transition-colors min-h-[36px] touch-target">
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Widget>
        </div>
    );

    const renderValidationTab = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Widget title="Validation Overview" className="bg-gray-900/50">
                    <div className="space-y-3 sm:space-y-4">
                        {validationReport ? (
                            <>
                                <div className="text-center">
                                    <div className={`text-3xl sm:text-4xl font-bold mb-2 ${getQualityScoreClass(validationReport.score)}`}>
                                        {validationReport.score.toFixed(1)}%
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-400">Overall Quality Score</div>
                                </div>
                                
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-gray-300 text-sm sm:text-base">Status</span>
                                    <span className={`px-2 py-1 rounded-full text-xs ${
                                        validationReport.passed ? 'bg-green-600 text-green-100' : 'bg-red-600 text-red-100'
                                    }`}>
                                        {validationReport.passed ? 'Passed' : 'Failed'}
                                    </span>
                                </div>
                                
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-gray-300 text-sm sm:text-base">Records</span>
                                    <span className="text-white text-sm sm:text-base">{validationReport.datasetProfile.recordCount.toLocaleString()}</span>
                                </div>
                                
                                <div className="flex items-center justify-between py-1">
                                    <span className="text-gray-300 text-sm sm:text-base">Fields</span>
                                    <span className="text-white text-sm sm:text-base">{validationReport.datasetProfile.fieldCount}</span>
                                </div>
                                
                                <div className="text-xs text-gray-400 text-center">
                                    Last validated: {new Date(validationReport.timestamp).toLocaleString()}
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-yellow-400 opacity-50" />
                                <p className="text-gray-400 mb-3 sm:mb-4 text-sm sm:text-base">No validation report available</p>
                                <button 
                                    onClick={handleValidateData}
                                    disabled={isValidating}
                                    className="px-4 py-2 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 min-h-[44px] touch-target text-sm sm:text-base"
                                >
                                    {isValidating ? 'Validating...' : 'Run Validation'}
                                </button>
                            </div>
                        )}
                    </div>
                </Widget>

                <Widget title="Quality Dimensions" className="bg-gray-900/50">
                    <div className="space-y-3">
                        {validationReport ? (
                            <>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Completeness</span>
                                        <span className="text-white">{validationReport.qualityMetrics.completeness.score.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-green-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.completeness.score}%` }}></div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {validationReport.qualityMetrics.completeness.missingValues} missing values
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Consistency</span>
                                        <span className="text-white">{validationReport.qualityMetrics.consistency.score.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.consistency.score}%` }}></div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {validationReport.qualityMetrics.consistency.duplicates} duplicates
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Accuracy</span>
                                        <span className="text-white">{validationReport.qualityMetrics.accuracy.score.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.accuracy.score}%` }}></div>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {validationReport.qualityMetrics.accuracy.outliers} outliers detected
                                    </div>
                                </div>
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-400">Validity</span>
                                        <span className="text-white">{validationReport.qualityMetrics.validity.score.toFixed(1)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${validationReport.qualityMetrics.validity.score}%` }}></div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-gray-400 py-8">
                                Run validation to see quality metrics
                            </div>
                        )}
                    </div>
                </Widget>

                <Widget title="Validation Actions" className="bg-gray-900/50">
                    <div className="space-y-3">
                        <button 
                            onClick={handleValidateData}
                            disabled={isValidating}
                            className="w-full flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <CheckCircle className="w-4 h-4" />
                            <span>{isValidating ? 'Running Validation...' : 'Run Full Validation'}</span>
                        </button>
                        
                        <button className="w-full flex items-center justify-center space-x-2 p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                            <Save className="w-4 h-4" />
                            <span>Save Report</span>
                        </button>
                        
                        <button className="w-full flex items-center justify-center space-x-2 p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            <Download className="w-4 h-4" />
                            <span>Export Report</span>
                        </button>
                        
                        <div className="pt-3 border-t border-gray-700">
                            <h4 className="text-sm font-medium text-gray-300 mb-2">Quick Actions</h4>
                            <div className="space-y-2">
                                <button className="w-full text-left text-sm p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                    Fix Missing Values
                                </button>
                                <button className="w-full text-left text-sm p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                    Remove Duplicates
                                </button>
                                <button className="w-full text-left text-sm p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded">
                                    Handle Outliers
                                </button>
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>

            {validationReport && (
                <>
                    <Widget title="Validation Results" className="bg-gray-900/50">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-white">Rule Results ({validationReport.validationResults.length})</h3>
                                <div className="flex space-x-2">
                                    <span className="text-sm text-gray-400">
                                        {validationReport.validationResults.filter((r: any) => r.passed).length} passed
                                    </span>
                                    <span className="text-sm text-gray-400">•</span>
                                    <span className="text-sm text-gray-400">
                                        {validationReport.validationResults.filter((r: any) => !r.passed).length} failed
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {validationReport.validationResults.map((result) => {
                                    const rule = validationRules.find((r: any) => r.id === result.ruleId);
                                    return (
                                        <div key={result.ruleId} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                            <div className="flex items-center justify-between mb-2">
                                                <h4 className="font-medium text-white">{rule?.name || result.ruleId}</h4>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm text-gray-400">{result.score.toFixed(1)}%</span>
                                                    <span className={`px-2 py-1 rounded-full text-xs ${getValidationResultClass(result.passed, rule?.severity)}`}>
                                                        {getValidationResultText(result.passed, rule?.severity)}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-400 mb-2">{result.message}</div>
                                            {result.affectedRecords > 0 && (
                                                <div className="text-xs text-gray-500">
                                                    Affected records: {result.affectedRecords.toLocaleString()}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Widget>

                    <Widget title="Recommendations" className="bg-gray-900/50">
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">Data Quality Recommendations</h3>
                            <div className="space-y-3">
                                {validationReport.recommendations.map((recommendation) => (
                                    <div key={`rec-${recommendation}`} className="flex items-start space-x-3 p-3 bg-gray-800/50 rounded-lg">
                                        <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                                        <div className="flex-1">
                                            <div className="text-white text-sm">{recommendation}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </Widget>
                </>
            )}
        </div>
    );

    const renderTrainingTab = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Widget title="Training Configuration" className="bg-gray-900/50">
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label htmlFor="model-type" className="block text-sm font-medium text-gray-300 mb-2">Model Type</label>
                            <select 
                                id="model-type"
                                value={trainingConfig.modelType}
                                onChange={(e: any) => updateTrainingConfig({ modelType: e.target.value as TrainingConfiguration['modelType'] })}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] touch-target text-sm sm:text-base"
                            >
                                <option value="ensemble">Ensemble (Recommended)</option>
                                <option value="random_forest">Random Forest</option>
                                <option value="gradient_boosting">Gradient Boosting</option>
                                <option value="neural_network">Neural Network</option>
                                <option value="linear_regression">Linear Regression</option>
                                <option value="svm">Support Vector Machine</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="training-split" className="block text-sm font-medium text-gray-300 mb-2">Training Split</label>
                            <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                                <input 
                                    id="training-split"
                                    type="number" 
                                    value={Math.round((trainingConfig.trainingSplit || 0.8) * 100)}
                                    onChange={(e: any) => updateTrainingConfig({ 
                                        trainingSplit: parseInt(e.target.value) / 100,
                                        validationSplit: 1 - (parseInt(e.target.value) / 100)
                                    })}
                                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] text-sm sm:text-base"
                                    placeholder="Training %"
                                    min="60" max="90"
                                />
                                <input 
                                    type="number" 
                                    value={Math.round(trainingConfig.validationSplit * 100)}
                                    readOnly
                                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] text-sm sm:text-base"
                                    placeholder="Validation %"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="learning-rate" className="block text-sm font-medium text-gray-300 mb-2">Learning Rate</label>
                            <input 
                                id="learning-rate"
                                type="range" 
                                min="0.0001" 
                                max="0.1" 
                                step="0.0001" 
                                value={trainingConfig.hyperparameters?.learningRate || 0.001}
                                onChange={(e: any) => updateTrainingConfig({ 
                                    hyperparameters: { 
                                        ...trainingConfig.hyperparameters, 
                                        learningRate: parseFloat(e.target.value) 
                                    } 
                                })}
                                className="w-full min-h-[40px] touch-target"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>0.0001</span>
                                <span className="font-medium text-white">{trainingConfig.hyperparameters?.learningRate || 0.001}</span>
                                <span>0.1</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="batch-size" className="block text-sm font-medium text-gray-300 mb-2">Batch Size</label>
                            <select 
                                id="batch-size"
                                value={trainingConfig.batchSize}
                                onChange={(e: any) => updateTrainingConfig({ batchSize: parseInt(e.target.value) })}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] touch-target text-sm sm:text-base"
                            >
                                <option value={16}>16</option>
                                <option value={32}>32</option>
                                <option value={64}>64</option>
                                <option value={128}>128</option>
                                <option value={256}>256</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="max-epochs" className="block text-sm font-medium text-gray-300 mb-2">Max Epochs</label>
                            <input 
                                id="max-epochs"
                                type="number" 
                                value={trainingConfig.maxEpochs}
                                onChange={(e: any) => updateTrainingConfig({ maxEpochs: parseInt(e.target.value) })}
                                min="10" 
                                max="1000"
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] touch-target text-sm sm:text-base"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-300 text-sm sm:text-base">Early Stopping</span>
                                <input 
                                    type="checkbox" 
                                    checked={trainingConfig.earlyStoppingEnabled}
                                    onChange={(e: any) => updateTrainingConfig({ earlyStoppingEnabled: e.target.checked })}
                                    className="rounded bg-gray-700 border-gray-600 min-w-[20px] min-h-[20px] touch-target" 
                                />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-300 text-sm sm:text-base">Cross Validation</span>
                                <input 
                                    type="checkbox" 
                                    checked={trainingConfig.crossValidationEnabled}
                                    onChange={(e: any) => updateTrainingConfig({ crossValidationEnabled: e.target.checked })}
                                    className="rounded bg-gray-700 border-gray-600 min-w-[20px] min-h-[20px] touch-target" 
                                />
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-gray-300 text-sm sm:text-base">Hyperparameter Tuning</span>
                                <input 
                                    type="checkbox" 
                                    checked={trainingConfig.hyperparameterTuningEnabled}
                                    onChange={(e: any) => updateTrainingConfig({ hyperparameterTuningEnabled: e.target.checked })}
                                    className="rounded bg-gray-700 border-gray-600 min-w-[20px] min-h-[20px] touch-target" 
                                />
                            </div>
                        </div>
                    </div>
                </Widget>

                <Widget title="Training Progress" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Current Session</h3>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                                isTraining ? 'bg-blue-600 text-blue-100' : 'bg-green-600 text-green-100'
                            }`}>
                                {isTraining ? 'Training' : 'Idle'}
                            </span>
                        </div>

                        {isTraining && (
                            <div className="space-y-3 sm:space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs sm:text-sm mb-2">
                                        <span className="text-gray-400">Overall Progress</span>
                                        <span className="text-white font-medium">{Math.round((trainingProgress.currentStep / trainingProgress.totalSteps) * 100)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-3 sm:h-4">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 sm:h-4 rounded-full transition-all duration-300"
                                            style={{ width: `${(trainingProgress.currentStep / trainingProgress.totalSteps) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1 truncate">
                                        {trainingProgress.currentModel} - {trainingProgress.phase}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                    <div className="p-3 bg-gray-800/50 rounded-lg">
                                        <div className="text-xs sm:text-sm text-gray-400">Current Epoch</div>
                                        <div className="text-lg sm:text-xl font-bold text-white">{trainingProgress.epoch || 0}</div>
                                    </div>
                                    <div className="p-3 bg-gray-800/50 rounded-lg">
                                        <div className="text-xs sm:text-sm text-gray-400">Learning Rate</div>
                                        <div className="text-lg sm:text-xl font-bold text-white">{trainingConfig.hyperparameters?.learningRate || 0.001}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-400">Accuracy</div>
                                <div className="text-xl sm:text-2xl font-bold text-green-400">{(trainingProgress.accuracy || 0).toFixed(3)}</div>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-xs sm:text-sm text-gray-400">Loss</div>
                                <div className="text-xl sm:text-2xl font-bold text-red-400">{(trainingProgress.loss || 0).toFixed(3)}</div>
                            </div>
                        </div>

                        <div className="p-3 bg-gray-800/50 rounded-lg">
                            <div className="text-xs sm:text-sm text-gray-400 mb-2">Validation Accuracy</div>
                            <div className="text-xl sm:text-2xl font-bold text-blue-400">{modelMetrics.overallAccuracy.toFixed(3)}</div>
                        </div>

                        {!isTraining && (
                            <button 
                                onClick={handleTrainModels}
                                className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-200 min-h-[48px] touch-target text-sm sm:text-base font-medium"
                            >
                                <Play className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Start Training</span>
                            </button>
                        )}

                        {isTraining && (
                            <button 
                                onClick={handleStopTraining}
                                className="w-full flex items-center justify-center space-x-2 p-3 sm:p-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors min-h-[48px] touch-target text-sm sm:text-base font-medium"
                            >
                                <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>Stop Training</span>
                            </button>
                        )}
                    </div>
                </Widget>
            </div>

            <Widget title="Training History" className="bg-gray-900/50">
                <div className="space-y-3 sm:space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <h3 className="text-base sm:text-lg font-semibold text-white">Recent Training Sessions</h3>
                        <button className="px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors min-h-[40px] touch-target text-sm sm:text-base self-start sm:self-auto">
                            View All
                        </button>
                    </div>

                    <div className="space-y-3">
                        {trainingHistory.slice(0, 4).map((session: any) => (
                            <div key={session.id} className="p-3 sm:p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                                    <h4 className="font-medium text-white text-sm sm:text-base truncate">{session.name}</h4>
                                    <span className={`px-2 py-1 rounded-full text-xs self-start ${getSessionStatusClass(session?.status)}`}>
                                        {session?.status}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <div className="text-gray-400">Duration</div>
                                        <div className="text-white font-medium">
                                            {session.metrics.trainingDuration ? 
                                                `${Math.round(session.metrics.trainingDuration / 60000)}m` : 
                                                'N/A'
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Accuracy</div>
                                        <div className="text-white font-medium">
                                            {session.metrics.finalAccuracy?.toFixed(3) || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Loss</div>
                                        <div className="text-white font-medium">
                                            {session.metrics.finalLoss?.toFixed(3) || 'N/A'}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-gray-400">Epochs</div>
                                        <div className="text-white font-medium">{session.metrics.epochs || 'N/A'}</div>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 mt-2">
                                    {new Date(session.startTime).toLocaleString()}
                                </div>
                            </div>
                        ))}
                        {trainingHistory.length === 0 && (
                            <div className="text-center text-gray-400 py-8">
                                <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                <p>No training sessions yet.</p>
                                <p className="text-sm">Start your first training to see history here.</p>
                            </div>
                        )}
                    </div>
                </div>
            </Widget>
        </div>
    );

    const renderPerformanceTab = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                <Widget title="Model Metrics" className="bg-gray-900/50">
                    <div className="space-y-3 sm:space-y-4">
                        <div className="text-center">
                            <div className="text-2xl sm:text-3xl font-bold text-green-400">{(modelMetrics.overallAccuracy * 100).toFixed(1)}%</div>
                            <div className="text-xs sm:text-sm text-gray-400">Overall Accuracy</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            <div className="text-center">
                                <div className="text-lg sm:text-xl font-bold text-blue-400">0.847</div>
                                <div className="text-xs text-gray-400">Precision</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg sm:text-xl font-bold text-purple-400">0.823</div>
                                <div className="text-xs text-gray-400">Recall</div>
                            </div>
                        </div>
                        
                        <div className="text-center">
                            <div className="text-lg sm:text-xl font-bold text-yellow-400">0.834</div>
                            <div className="text-xs text-gray-400">F1-Score</div>
                        </div>
                    </div>
                </Widget>

                <Widget title="Performance Trends" className="bg-gray-900/50">
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-2">
                                <span className="text-gray-400">7-Day Trend</span>
                                <span className="text-green-400 font-medium">+2.3%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                <div className="bg-green-500 h-2 sm:h-3 rounded-full transition-all duration-300" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-2">
                                <span className="text-gray-400">30-Day Trend</span>
                                <span className="text-green-400 font-medium">+5.7%</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2 sm:h-3">
                                <div className="bg-blue-500 h-2 sm:h-3 rounded-full transition-all duration-300" style={{ width: '78%' }}></div>
                            </div>
                        </div>
                        
                        <div>
                            <div className="flex justify-between text-xs sm:text-sm mb-2">
                                <span className="text-gray-400">Model Stability</span>
                                <span className="text-white">High</span>
                            </div>
                            <div className="w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                        
                        <div className="pt-2 border-t border-gray-700">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-400">Prediction Confidence</span>
                                <span className="text-white font-semibold">87.3%</span>
                            </div>
                        </div>
                    </div>
                </Widget>

                <Widget title="Model Comparison" className="bg-gray-900/50">
                    <div className="space-y-3">
                        {modelMetrics.models.slice(0, 4).map((model, idx) => (
                            <div key={model.id} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                                <div>
                                    <div className="text-white text-sm font-medium">{model.name}</div>
                                    <div className="text-xs text-gray-400">{model.accuracy.toFixed(3)}</div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs ${getModelStatusClass(model.isActive, model.type)}`}>
                                    {getModelStatusText(model.isActive, model.type)}
                                </span>
                            </div>
                        ))}
                        {modelMetrics.models.length === 0 && (
                            <div className="text-center text-gray-400 py-4">
                                No trained models yet. Start training to see model comparison.
                            </div>
                        )}
                    </div>
                </Widget>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Widget title="Accuracy Distribution" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold text-white mb-4">Prediction Accuracy by Category</h3>
                        </div>
                        
                        <div className="space-y-3">
                            {[
                                { category: 'Quarterback', accuracy: 92.4, predictions: 1245 },
                                { category: 'Running Back', accuracy: 88.7, predictions: 2156 },
                                { category: 'Wide Receiver', accuracy: 85.3, predictions: 3421 },
                                { category: 'Tight End', accuracy: 89.1, predictions: 876 },
                                { category: 'Kicker', accuracy: 94.8, predictions: 543 },
                                { category: 'Defense', accuracy: 87.2, predictions: 987 }
                            ].map((item) => (
                                <div key={item.category} className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-300">{item.category}</span>
                                        <span className="text-white">{item.accuracy}% ({item.predictions})</span>
                                    </div>
                                    <div className="w-full bg-gray-700 rounded-full h-2">
                                        <div 
                                            className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                                            style={{ width: `${item.accuracy}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </Widget>

                <Widget title="Real-time Performance" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Live Metrics</h3>
                            <div className="flex items-center space-x-2 text-green-400">
                                <Activity className="w-4 h-4" />
                                <span className="text-sm">Live</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-blue-400">847</div>
                                <div className="text-xs text-gray-400">Predictions/min</div>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-lg text-center">
                                <div className="text-2xl font-bold text-green-400">23ms</div>
                                <div className="text-xs text-gray-400">Avg Response</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Success Rate</span>
                                    <span className="text-white">98.7%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '98.7%' }}></div>
                                </div>
                            </div>
                            
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Error Rate</span>
                                    <span className="text-white">1.3%</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-red-500 h-2 rounded-full" style={{ width: '1.3%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <h4 className="text-white font-medium mb-2">Recent Alerts</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-300">Model health check passed</span>
                                    <span className="text-gray-500">2m ago</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                    <span className="text-gray-300">High memory usage detected</span>
                                    <span className="text-gray-500">15m ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Widget>

                <Widget title="A/B Testing & Model Comparison" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Model Performance Comparison</h3>
                            <button className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                                New A/B Test
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Active A/B Tests</div>
                                <div className="text-2xl font-bold text-blue-400">3</div>
                            </div>
                            <div className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="text-sm text-gray-400 mb-1">Completed Tests</div>
                                <div className="text-2xl font-bold text-green-400">12</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {[
                                {
                                    id: 'test-1',
                                    name: 'Enhanced Ensemble vs Standard',
                                    status: 'active',
                                    modelA: 'Standard Model v2.1',
                                    modelB: 'Enhanced Ensemble v3.0',
                                    improvement: '+2.3%',
                                    significance: 0.023,
                                    progress: 67,
                                    sampleSize: 1547
                                },
                                {
                                    id: 'test-2',
                                    name: 'Real-time vs Batch Prediction',
                                    status: 'active',
                                    modelA: 'Batch Predictor v1.5',
                                    modelB: 'Real-time Engine v2.0',
                                    improvement: '+1.8%',
                                    significance: 0.045,
                                    progress: 89,
                                    sampleSize: 2103
                                },
                                {
                                    id: 'test-3',
                                    name: 'Feature Selection Optimization',
                                    status: 'completed',
                                    modelA: 'Full Features v1.0',
                                    modelB: 'Optimized Features v1.0',
                                    improvement: '+4.1%',
                                    significance: 0.001,
                                    progress: 100,
                                    sampleSize: 3250
                                }
                            ].map((test) => (
                                <div key={test.id} className="p-4 bg-gray-800/30 rounded-lg border border-gray-700">
                                    <div className="flex items-center justify-between mb-2">
                                        <h4 className="font-medium text-white">{test.name}</h4>
                                        <span className={`px-2 py-1 rounded-full text-xs ${getTestStatusClass(test?.status)}`}>
                                            {test?.status}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                                        <div>
                                            <div className="text-gray-400">Model A</div>
                                            <div className="text-white">{test.modelA}</div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Model B</div>
                                            <div className="text-white">{test.modelB}</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                                        <div>
                                            <div className="text-gray-400">Improvement</div>
                                            <div className={`font-medium ${
                                                test.improvement.startsWith('+') ? 'text-green-400' : 'text-red-400'
                                            }`}>
                                                {test.improvement}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Significance</div>
                                            <div className={`font-medium ${
                                                test.significance < 0.05 ? 'text-green-400' : 'text-yellow-400'
                                            }`}>
                                                p = {test.significance.toFixed(3)}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-gray-400">Sample Size</div>
                                            <div className="text-white font-medium">{test.sampleSize.toLocaleString()}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs">
                                            <span className="text-gray-400">Progress</span>
                                            <span className="text-white">{test.progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-700 rounded-full h-2">
                                            <div 
                                                className={`h-2 rounded-full ${
                                                    test?.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                                }`}
                                                style={{ width: `${test.progress}%` }}
                                            ></div>
                                        </div>
                                    </div>

                                    {test?.status === 'active' && (
                                        <div className="flex justify-end space-x-2 mt-3">
                                            <button className="px-3 py-1 bg-gray-600 text-white rounded text-xs hover:bg-gray-500 transition-colors">
                                                Pause
                                            </button>
                                            <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                                                Details
                                            </button>
                                        </div>
                                    )}

                                    {test?.status === 'completed' && (
                                        <div className="flex justify-end space-x-2 mt-3">
                                            <button className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors">
                                                View Results
                                            </button>
                                            <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors">
                                                Deploy Winner
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-400">Statistical Power Analysis</span>
                                <span className="text-sm text-white">Power: 0.85 (Adequate)</span>
                            </div>
                            <div className="mt-2 w-full bg-gray-700 rounded-full h-2">
                                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                    </div>
                </Widget>

                <Widget title="Model Performance Trends" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Historical Performance</h3>
                            <select className="bg-gray-700 text-white rounded-lg px-3 py-1 text-sm border border-gray-600">
                                <option>Last 7 days</option>
                                <option>Last 30 days</option>
                                <option>Last 90 days</option>
                                <option>All time</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center">
                                <div className="text-lg font-bold text-green-400">↗ +2.3%</div>
                                <div className="text-xs text-gray-400">Accuracy Trend</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">↗ +1.8%</div>
                                <div className="text-xs text-gray-400">Precision Trend</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-yellow-400">→ +0.1%</div>
                                <div className="text-xs text-gray-400">Recall Trend</div>
                            </div>
                            <div className="text-center">
                                <div className="text-lg font-bold text-red-400">↘ -0.5%</div>
                                <div className="text-xs text-gray-400">Response Time</div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Model Stability Index</span>
                                    <span className="text-white">0.94 (Excellent)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '94%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Performance Consistency</span>
                                    <span className="text-white">0.89 (Good)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: '89%' }}></div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-400">Drift Detection Score</span>
                                    <span className="text-white">0.12 (Low Risk)</span>
                                </div>
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-700">
                            <h4 className="text-white font-medium mb-2">Performance Alerts</h4>
                            <div className="space-y-2">
                                <div className="flex items-center space-x-2 text-sm">
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                    <span className="text-gray-300">All models performing within expected ranges</span>
                                    <span className="text-gray-500">1h ago</span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                    <span className="text-gray-300">Minor accuracy degradation in QB predictions</span>
                                    <span className="text-gray-500">3h ago</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>
        </div>
    );

    const renderConfigTab = () => (
        <div className="space-y-4 sm:space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                <Widget title="Model Configuration" className="bg-gray-900/50">
                    <div className="space-y-3 sm:space-y-4">
                        <div>
                            <label htmlFor="ensemble-strategy" className="block text-sm font-medium text-gray-300 mb-2">Ensemble Strategy</label>
                            <select 
                                id="ensemble-strategy" 
                                value={systemConfig.ensembleStrategy}
                                onChange={(e: any) => handleConfigurationChange('ensembleStrategy', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] touch-target text-sm sm:text-base"
                            >
                                <option value="weighted_average">Weighted Average</option>
                                <option value="majority_voting">Majority Voting</option>
                                <option value="stacked_ensemble">Stacked Ensemble</option>
                                <option value="bayesian_model_averaging">Bayesian Model Averaging</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="prediction-threshold" className="block text-sm font-medium text-gray-300 mb-2">
                                Prediction Threshold: {systemConfig.predictionThreshold}
                            </label>
                            <input 
                                id="prediction-threshold"
                                type="range" 
                                min="0.5" 
                                max="0.95" 
                                step="0.05" 
                                value={systemConfig.predictionThreshold}
                                onChange={(e: any) => handleConfigurationChange('predictionThreshold', parseFloat(e.target.value))}
                                className="w-full min-h-[40px] touch-target"
                            />
                            <div className="flex justify-between text-xs text-gray-400 mt-1">
                                <span>0.5</span>
                                <span className="font-medium text-white">{systemConfig.predictionThreshold}</span>
                                <span>0.95</span>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="retrain-frequency" className="block text-sm font-medium text-gray-300 mb-2">Auto-Retrain Frequency</label>
                            <select 
                                id="retrain-frequency" 
                                value={systemConfig.retrainFrequency}
                                onChange={(e: any) => handleConfigurationChange('retrainFrequency', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 sm:py-3 border border-gray-600 min-h-[48px] touch-target text-sm sm:text-base"
                            >
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                                <option value="monthly">Monthly</option>
                                <option value="manual">Manual Only</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between py-2">
                            <span className="text-gray-300 text-sm sm:text-base">Enable Real-time Learning</span>
                            <input 
                                type="checkbox" 
                                checked={systemConfig.realTimeLearning}
                                onChange={(e: any) => handleConfigurationChange('realTimeLearning', e.target.checked)}
                                className="rounded bg-gray-700 border-gray-600 min-w-[20px] min-h-[20px] touch-target" 
                            />
                        </div>
                    </div>
                </Widget>

                <Widget title="System Settings" className="bg-gray-900/50">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="api-rate-limit" className="block text-sm font-medium text-gray-300 mb-2">API Rate Limit</label>
                            <input 
                                id="api-rate-limit"
                                type="number" 
                                value={systemConfig.apiRateLimit}
                                onChange={(e: any) => handleConfigurationChange('apiRateLimit', parseInt(e.target.value) || 1000)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
                            />
                            <div className="text-xs text-gray-400 mt-1">Requests per hour</div>
                        </div>

                        <div>
                            <label htmlFor="cache-ttl" className="block text-sm font-medium text-gray-300 mb-2">Cache TTL</label>
                            <select 
                                id="cache-ttl" 
                                value={systemConfig.cacheTtl}
                                onChange={(e: any) => handleConfigurationChange('cacheTtl', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
                            >
                                <option value="5_minutes">5 minutes</option>
                                <option value="15_minutes">15 minutes</option>
                                <option value="1_hour">1 hour</option>
                                <option value="24_hours">24 hours</option>
                            </select>
                        </div>

                        <div>
                            <label htmlFor="log-level" className="block text-sm font-medium text-gray-300 mb-2">Log Level</label>
                            <select 
                                id="log-level" 
                                value={systemConfig.logLevel}
                                onChange={(e: any) => handleConfigurationChange('logLevel', e.target.value)}
                                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600"
                            >
                                <option value="ERROR">ERROR</option>
                                <option value="WARN">WARN</option>
                                <option value="INFO">INFO</option>
                                <option value="DEBUG">DEBUG</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Enable Monitoring</span>
                                <input 
                                    type="checkbox" 
                                    checked={systemConfig.enableMonitoring}
                                    onChange={(e: any) => handleConfigurationChange('enableMonitoring', e.target.checked)}
                                    className="rounded bg-gray-700 border-gray-600" 
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Auto-backup Models</span>
                                <input 
                                    type="checkbox" 
                                    checked={systemConfig.autoBackupModels}
                                    onChange={(e: any) => handleConfigurationChange('autoBackupModels', e.target.checked)}
                                    className="rounded bg-gray-700 border-gray-600" 
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-300">Alert on Anomalies</span>
                                <input 
                                    type="checkbox" 
                                    checked={systemConfig.alertOnAnomalies}
                                    onChange={(e: any) => handleConfigurationChange('alertOnAnomalies', e.target.checked)}
                                    className="rounded bg-gray-700 border-gray-600" 
                                />
                            </div>
                        </div>
                    </div>
                </Widget>
            </div>

            <Widget title="Data Sources & APIs" className="bg-gray-900/50">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">API Connections</h3>
                        <button className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                            <Target className="w-4 h-4" />
                            <span>Test All</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[
                            { name: 'ESPN Fantasy API', status: 'connected', latency: '145ms', lastSync: '2 min ago' },
                            { name: 'Yahoo Sports API', status: 'connected', latency: '203ms', lastSync: '5 min ago' },
                            { name: 'Weather Service', status: 'warning', latency: '1.2s', lastSync: '1 hour ago' },
                            { name: 'Injury Reports API', status: 'connected', latency: '89ms', lastSync: '30 sec ago' }
                        ].map((api) => (
                            <div key={api.name} className="p-4 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-white">{api.name}</h4>
                                    <div className="flex items-center space-x-2">
                                        <div className={`w-2 h-2 rounded-full ${getAPIStatusClass(api?.status)}`}></div>
                                        <span className={`text-xs ${getAPIStatusTextClass(api?.status)}`}>{api?.status}</span>
                                    </div>
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                    <div>Latency: {api.latency}</div>
                                    <div>Last sync: {api.lastSync}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Widget>

            <Widget title="Backup & Recovery" className="bg-gray-900/50">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Model Backups</h3>
                        <div className="flex space-x-2">
                            <button className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                                <Save className="w-4 h-4" />
                                <span>Create Backup</span>
                            </button>
                            <button className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                                <Download className="w-4 h-4" />
                                <span>Download</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {[
                            { name: 'Daily Auto-backup', date: '2025-08-04 03:00', size: '125 MB', status: 'success' },
                            { name: 'Pre-training Checkpoint', date: '2025-08-03 14:30', size: '118 MB', status: 'success' },
                            { name: 'Weekly Archive', date: '2025-08-01 00:00', size: '134 MB', status: 'success' },
                            { name: 'Manual Backup', date: '2025-07-28 16:45', size: '112 MB', status: 'success' }
                        ].map((backup) => (
                            <div key={`${backup.name}-${backup.date}`} className="p-3 bg-gray-800/50 rounded-lg">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-white">{backup.name}</span>
                                    <CheckCircle className="w-4 h-4 text-green-400" />
                                </div>
                                <div className="space-y-1 text-sm text-gray-400">
                                    <div>{backup.date}</div>
                                    <div>{backup.size}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </Widget>

            {/* Configuration Action Buttons */}
            <Widget title="Configuration Management" className="bg-gray-900/50">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="text-white">
                            <h3 className="font-semibold">Configuration Status</h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {configurationChanged ? 'You have unsaved changes' : 'All changes saved'}
                            </p>
                        </div>
                        <div className={`w-3 h-3 rounded-full ${configurationChanged ? 'bg-yellow-400' : 'bg-green-400'}`}></div>
                    </div>
                    
                    <div className="flex space-x-3">
                        <button
                            onClick={saveConfiguration}
                            disabled={!configurationChanged || savingConfiguration}
                            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {savingConfiguration ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    <span>Save Configuration</span>
                                </>
                            )}
                        </button>
                        
                        <button
                            onClick={resetConfiguration}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            <RefreshCw className="w-4 h-4" />
                            <span>Reset to Defaults</span>
                        </button>

                        <button
                            onClick={() => {
                                if (configurationChanged) {
                                    saveConfiguration().then(() => {
                                        // Apply configuration immediately after saving
                                        console.log('Configuration applied');
                                    });
                                }
                            }}
                            disabled={!configurationChanged}
                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Target className="w-4 h-4" />
                            <span>Apply Changes</span>
                        </button>
                    </div>

                    {configurationChanged && (
                        <div className="p-3 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                            <div className="flex items-center space-x-2">
                                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                <span className="text-yellow-200 text-sm">
                                    Configuration changes will take effect after saving and applying.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </Widget>
        </div>
    );

    return (
        <div className="space-y-6 p-4 sm:p-6">
            {/* Mobile-responsive header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 flex items-center gap-2">
                        <Database className="text-blue-400 w-5 h-5 sm:w-6 sm:h-6" />
                        Training Data Manager
                    </h2>
                    <p className="text-sm sm:text-base text-gray-400">Manage datasets, training sessions, and model performance</p>
                </div>
                
                {/* Mobile-responsive action buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <button
                        onClick={exportTrainingData}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors mobile-touch-target"
                    >
                        <Download className="w-4 h-4" />
                        <span>Export Data</span>
                    </button>
                    
                    <button
                        onClick={handleTrainModels}
                        disabled={isTraining}
                        className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 mobile-touch-target"
                    >
                        {isTraining ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Training...</span>
                            </>
                        ) : (
                            <>
                                <Brain className="w-4 h-4" />
                                <span>Train Models</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
            
            {/* Mobile-responsive tab navigation */}
            <div className="flex space-x-1 bg-gray-800/50 p-1 rounded-lg overflow-x-auto scrollbar-hide">
                {[
                    { id: 'overview', label: 'Overview', icon: BarChart3 },
                    { id: 'datasets', label: 'Datasets', icon: Database },
                    { id: 'validation', label: 'Validation', icon: CheckCircle },
                    { id: 'training', label: 'Training', icon: Brain },
                    { id: 'performance', label: 'Performance', icon: TrendingUp },
                    { id: 'config', label: 'Config', icon: Settings }
                ].map((tab: any) => {
                    const IconComponent = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-2 rounded-md transition-colors whitespace-nowrap min-width-fit mobile-touch-target ${
                                activeTab === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            <IconComponent className="w-4 h-4 flex-shrink-0" />
                            <span className="text-sm sm:text-base">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
            
            <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                {activeTab === 'overview' && renderOverviewTab()}
                {activeTab === 'datasets' && renderDatasetsTab()}
                {activeTab === 'validation' && renderValidationTab()}
                {activeTab === 'training' && renderTrainingTab()}
                {activeTab === 'performance' && renderPerformanceTab()}
                {activeTab === 'config' && renderConfigTab()}
            </motion.div>
        </div>
    );
});

TrainingDataManager.displayName = 'TrainingDataManager';

export { TrainingDataManager };
export default TrainingDataManager;
