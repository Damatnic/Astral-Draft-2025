import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileTextIcon, 
    DownloadIcon, 
    PlusIcon, 
    SettingsIcon,
    BarChart3Icon,
    TrendingUpIcon,
    FilterIcon,
    CalendarIcon,
    EyeIcon,
    AlertTriangleIcon,
    CheckCircleIcon,
    RefreshCwIcon
} from 'lucide-react';
import { Widget } from '../ui/Widget';
import { useAuth } from '../../contexts/AuthContext';
import { 
    advancedReportingService,
    type ReportTemplate,
    type GeneratedReport,
    type ReportCategory,
    type ExportFormat,
    type AutomatedInsight,
    type CustomDashboard
} from '../../services/advancedReportingService';

interface Props {
    className?: string;
}

type ReportingTab = 'templates' | 'reports' | 'insights' | 'dashboards' | 'custom';

const AdvancedReportingInterface: React.FC<Props> = ({ 
    className = '' 
}) => {
    const { user, isAuthenticated } = useAuth();
    const [activeTab, setActiveTab] = useState<ReportingTab>('templates');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Data state
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
    const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate | null>(null);
    const [selectedReport, setSelectedReport] = useState<GeneratedReport | null>(null);
    const [dashboards, setDashboards] = useState<CustomDashboard[]>([]);

    // UI state
    const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
    const [showTemplateModal, setShowTemplateModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportParameters, setReportParameters] = useState<Record<string, any>>({});
    const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');

    useEffect(() => {
        if (isAuthenticated) {
            loadReportingData();
        }
    }, [isAuthenticated, activeTab, selectedCategory]);

    const loadReportingData = async () => {
        setLoading(true);
        setError(null);

        try {
            switch (activeTab) {
                case 'templates': {
                    const templateList = await advancedReportingService.getReportTemplates(
                        selectedCategory === 'all' ? undefined : selectedCategory
                    );
                    setTemplates(templateList);
                    break;
                }
                case 'reports': {
                    if (user) {
                        const reportHistory = await advancedReportingService.getReportHistory(user.id.toString());
                        setGeneratedReports(reportHistory);
                    }
                    break;
                }
                case 'dashboards': {
                    if (user) {
                        const userDashboards = await advancedReportingService.getUserDashboards(user.id.toString());
                        setDashboards(userDashboards);
                    }
                    break;
                }
            }
        } catch (err) {
            console.error('Failed to load reporting data:', err);
            setError('Failed to load reporting data');
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateReport = async (templateId: string, parameters: Record<string, any> = {}) => {
        if (!user) return;

        setLoading(true);
        try {
            const report = await advancedReportingService.generateReport(
                templateId,
                user.id.toString(),
                parameters
            );
            
            setSelectedReport(report);
            setShowReportModal(true);
            
            // Refresh reports list
            if (activeTab === 'reports') {
                await loadReportingData();
            }
        } catch (err) {
            console.error('Failed to generate report:', err);
            setError('Failed to generate report');
        } finally {
            setLoading(false);
        }
    };

    const handleExportReport = async (reportId: string, format: ExportFormat) => {
        try {
            const blob = await advancedReportingService.exportReport(reportId, format);
            
            // Create download link
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `report_${reportId}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (err) {
            console.error('Failed to export report:', err);
            setError('Failed to export report');
        }
    };

    const handleExportFromDropdown = (reportId: string, format: ExportFormat) => {
        handleExportReport(reportId, format);
    };

    const getInsightSeverityColor = (severity: AutomatedInsight['severity']): string => {
        switch (severity) {
            case 'critical': return 'bg-red-500/20 text-red-400 border-red-500';
            case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500';
            case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
            case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500';
            default: return 'bg-gray-500/20 text-gray-400 border-gray-500';
        }
    };

    if (!isAuthenticated) {
        return (
            <Widget title="📊 Advanced Reporting" className={className}>
                <div className="text-center py-8">
                    <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Please log in to access advanced reporting features</p>
                </div>
            </Widget>
        );
    }

    const tabs = [
        { id: 'templates', label: 'Report Templates', icon: FileTextIcon },
        { id: 'reports', label: 'Generated Reports', icon: BarChart3Icon },
        { id: 'insights', label: 'Insights', icon: TrendingUpIcon },
        { id: 'dashboards', label: 'Dashboards', icon: SettingsIcon },
        { id: 'custom', label: 'Custom Builder', icon: PlusIcon }
    ];

    const categories = [
        { id: 'all', label: 'All Categories' },
        { id: 'league_analytics', label: 'League Analytics' },
        { id: 'player_performance', label: 'Player Performance' },
        { id: 'team_comparison', label: 'Team Comparison' },
        { id: 'trade_analysis', label: 'Trade Analysis' },
        { id: 'draft_recap', label: 'Draft Analysis' },
        { id: 'season_summary', label: 'Season Summary' }
    ];

    const renderTemplates = () => (
        <div className="space-y-4">
            {/* Category Filter */}
            <div className="flex items-center space-x-2">
                <FilterIcon className="w-4 h-4 text-gray-400" />
                <select
                    value={selectedCategory}
                    onChange={(e: any) => setSelectedCategory(e.target.value as ReportCategory | 'all')}
                    className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
                >
                    {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                    ))}
                </select>
            </div>

            {/* Templates Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template: any) => (
                    <motion.div
                        key={template.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <h3 className="font-medium text-white text-sm">{template.name}</h3>
                            <div className="flex items-center space-x-2">
                                {!template.isCustom && (
                                    <span className="px-2 py-1 rounded text-xs bg-blue-500/20 text-blue-400">
                                        System
                                    </span>
                                )}
                                <span className="text-xs text-gray-400">
                                    {template.popularity}% popular
                                </span>
                            </div>
                        </div>
                        
                        <p className="text-gray-400 text-xs mb-3 line-clamp-2">
                            {template.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                            <div className="flex space-x-1">
                                {template.tags.slice(0, 2).map((tag: any) => (
                                    <span key={tag} className="px-2 py-1 rounded-full text-xs bg-gray-700 text-gray-300">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={() => {
                                    setSelectedTemplate(template);
                                    setShowTemplateModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs transition-colors"
                            >
                                Generate
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );

    const renderReports = () => (
        <div className="space-y-4">
            {generatedReports.length === 0 ? (
                <div className="text-center py-8">
                    <FileTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No reports generated yet</p>
                    <button
                        onClick={() => setActiveTab('templates')}
                        className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                        Browse Templates
                    </button>
                </div>
            ) : (
                <div className="space-y-3">
                    {generatedReports.map((report: any) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-medium text-white mb-1">{report.title}</h3>
                                    <p className="text-gray-400 text-sm mb-2">{report.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                                        <span className="flex items-center space-x-1">
                                            <CalendarIcon className="w-3 h-3" />
                                            <span>{report.generatedAt.toLocaleDateString()}</span>
                                        </span>
                                        <span>{report.data.metadata.totalRows} rows</span>
                                        <span>{report.insights.length} insights</span>
                                    </div>
                                </div>
                                <div className="flex space-x-2">
                                    <button
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setShowReportModal(true);
                                        }}
                                        className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors"
                                        title="View Report"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                    </button>
                                    <div className="relative group">
                                        <button className="bg-gray-700 hover:bg-gray-600 text-white p-2 rounded transition-colors">
                                            <DownloadIcon className="w-4 h-4" />
                                        </button>
                                        <div className="absolute right-0 top-full mt-1 bg-gray-800 border border-gray-700 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                            {report.exportFormats.map((format: any) => (
                                                <button
                                                    key={format}
                                                    onClick={() => handleExportFromDropdown(report.id, format)}
                                                    className="block w-full text-left px-3 py-2 text-white hover:bg-gray-700 first:rounded-t-lg last:rounded-b-lg"
                                                >
                                                    Export as {format.toUpperCase()}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderInsights = () => {
        const allInsights = generatedReports.flatMap(report => 
            report.insights.map((insight: any) => ({ ...insight, reportTitle: report.title }))
        );

        return (
            <div className="space-y-4">
                {allInsights.length === 0 ? (
                    <div className="text-center py-8">
                        <TrendingUpIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No insights available yet</p>
                        <p className="text-gray-500 text-sm">Generate reports to see automated insights</p>
                    </div>
                ) : (
                    allInsights.map((insight: any) => (
                        <motion.div
                            key={insight.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`rounded-lg p-4 border ${getInsightSeverityColor(insight.severity)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    {insight.severity === 'critical' && <AlertTriangleIcon className="w-4 h-4" />}
                                    {insight.actionable && <CheckCircleIcon className="w-4 h-4" />}
                                    <h3 className="font-medium">{insight.title}</h3>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <span className="text-xs opacity-75">
                                        {(insight.confidence * 100).toFixed(0)}% confidence
                                    </span>
                                    <span className="text-xs opacity-75 capitalize">
                                        {insight.severity}
                                    </span>
                                </div>
                            </div>
                            
                            <p className="text-sm mb-2">{insight.description}</p>
                            
                            {insight.recommendations && (
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium opacity-90">Recommendations:</h4>
                                    <ul className="text-xs space-y-1">
                                        {insight.recommendations.map((rec, index) => (
                                            <li key={`rec-${insight.id}-${index}`} className="flex items-start space-x-2">
                                                <span className="text-blue-400">•</span>
                                                <span>{rec}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            
                            <div className="text-xs opacity-75 mt-2">
                                From: {insight.reportTitle}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        );
    };

    const renderDashboards = () => (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Custom Dashboards</h3>
                <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
                    <PlusIcon className="w-4 h-4" />
                    <span>Create Dashboard</span>
                </button>
            </div>

            {dashboards.length === 0 ? (
                <div className="text-center py-8">
                    <SettingsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No custom dashboards created yet</p>
                    <p className="text-gray-500 text-sm">Create personalized dashboards with your favorite metrics</p>
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-4">
                    {dashboards.map((dashboard: any) => (
                        <motion.div
                            key={dashboard.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-all"
                        >
                            <h3 className="font-medium text-white mb-2">{dashboard.name}</h3>
                            <p className="text-gray-400 text-sm mb-3">{dashboard.description}</p>
                            <div className="flex items-center justify-between">
                                <div className="text-xs text-gray-500">
                                    {dashboard.widgets.length} widgets • 
                                    {dashboard.isPublic ? ' Public' : ' Private'}
                                </div>
                                <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">
                                    View
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className={`space-y-6 ${className}`}>
            <Widget title="📊 Advanced Reporting" className="overflow-visible">
                {/* Tab Navigation */}
                <div className="flex space-x-1 mb-6 bg-gray-800 p-1 rounded-lg">
                    {tabs.map((tab: any) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ReportingTab)}
                                className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                                    activeTab === tab.id
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-400 hover:text-white hover:bg-gray-700'
                                }`}
                            >
                                <Icon className="w-4 h-4" />
                                <span className="text-sm font-medium">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
                        <p className="text-red-400">{error}</p>
                    </div>
                )}

                {/* Tab Content */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <RefreshCwIcon className="w-6 h-6 text-blue-400 animate-spin mr-2" />
                                <span className="text-gray-400">Loading...</span>
                            </div>
                        ) : (
                            <>
                                {activeTab === 'templates' && renderTemplates()}
                                {activeTab === 'reports' && renderReports()}
                                {activeTab === 'insights' && renderInsights()}
                                {activeTab === 'dashboards' && renderDashboards()}
                                {activeTab === 'custom' && (
                                    <div className="text-center py-8">
                                        <PlusIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-400">Custom Report Builder</p>
                                        <p className="text-gray-500 text-sm">Coming soon - Build your own reports</p>
                                    </div>
                                )}
                            </>
                        )}
                    </motion.div>
                </AnimatePresence>
            </Widget>

            {/* Template Generation Modal */}
            {showTemplateModal && selectedTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 rounded-lg p-6 w-full max-w-md border border-gray-700"
                    >
                        <h3 className="text-lg font-bold text-white mb-4">Generate Report</h3>
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-white font-medium">{selectedTemplate.name}</h4>
                                <p className="text-gray-400 text-sm">{selectedTemplate.description}</p>
                            </div>
                            
                            <div className="space-y-3">
                                <label className="block">
                                    <span className="text-sm text-gray-400">Week (optional)</span>
                                    <input
                                        type="number"
                                        min="1"
                                        max="18"
                                        value={reportParameters.week || ''}
                                        onChange={(e: any) => setReportParameters(prev => ({ 
                                            ...prev, 
                                            week: e.target.value ? parseInt(e.target.value) : undefined 
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        placeholder="Current week"
                                    />
                                </label>
                                
                                <label className="block">
                                    <span className="text-sm text-gray-400">Team (optional)</span>
                                    <input
                                        type="text"
                                        value={reportParameters.team || ''}
                                        onChange={(e: any) => setReportParameters(prev => ({ 
                                            ...prev, 
                                            team: e.target.value 
                                        }))}
                                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white"
                                        placeholder="All teams"
                                    />
                                </label>
                            </div>
                            
                            <div className="flex justify-end space-x-3">
                                <button
                                    onClick={() => setShowTemplateModal(false)}
                                    className="px-4 py-2 text-gray-400 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        handleGenerateReport(selectedTemplate.id, reportParameters);
                                        setShowTemplateModal(false);
                                        setReportParameters({});
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                                >
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Report View Modal */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto border border-gray-700"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">{selectedReport.title}</h3>
                            <div className="flex space-x-2">
                                <select
                                    value={exportFormat}
                                    onChange={(e: any) => setExportFormat(e.target.value as ExportFormat)}
                                    className="bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                >
                                    {selectedReport.exportFormats.map((format: any) => (
                                        <option key={format} value={format}>{format.toUpperCase()}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={() => handleExportReport(selectedReport.id, exportFormat)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm flex items-center space-x-1"
                                >
                                    <DownloadIcon className="w-3 h-3" />
                                    <span>Export</span>
                                </button>
                                <button
                                    onClick={() => setShowReportModal(false)}
                                    className="text-gray-400 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Report Data Table */}
                        <div className="bg-gray-900 rounded-lg p-4 mb-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-700">
                                            {selectedReport.data.headers.map((header: any) => (
                                                <th key={header} className="text-left p-2 text-gray-300 font-medium">
                                                    {header}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedReport.data.rows.slice(0, 10).map((row, index) => (
                                            <tr key={`row-${selectedReport.id}-${index}`} className="border-b border-gray-800 hover:bg-gray-800/50">
                                                {row.map((cell, cellIndex) => (
                                                    <td key={`cell-${index}-${cellIndex}`} className="p-2 text-gray-300">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {selectedReport.data.rows.length > 10 && (
                                <div className="text-center mt-4 text-gray-400 text-sm">
                                    Showing first 10 of {selectedReport.data.rows.length} rows
                                </div>
                            )}
                        </div>

                        {/* Insights */}
                        {selectedReport.insights.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="font-medium text-white">Key Insights</h4>
                                {selectedReport.insights.map((insight: any) => (
                                    <div
                                        key={insight.id}
                                        className={`rounded-lg p-3 text-sm ${getInsightSeverityColor(insight.severity)}`}
                                    >
                                        <div className="font-medium mb-1">{insight.title}</div>
                                        <div className="mb-2">{insight.description}</div>
                                        {insight.recommendations && (
                                            <ul className="text-xs space-y-1">
                                                {insight.recommendations.map((rec, index) => (
                                                    <li key={`modal-rec-${insight.id}-${index}`}>• {rec}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default AdvancedReportingInterface;
