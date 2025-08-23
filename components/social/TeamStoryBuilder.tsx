/**
 * Team Story Builder Component
 * Rich narrative creation tools for team stories and experiences
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Player, Team, User } from '../../types';
import { 
    PenToolIcon, 
    ImageIcon, 
    VideoIcon, 
    MicIcon,
    SaveIcon,
    ShareIcon,
    EyeIcon,
    BookIcon,
    StarIcon,
    TrophyIcon,
    CalendarIcon,
    UsersIcon,
    PlayIcon,
    PauseIcon,
    UploadIcon,
    TypeIcon,
    LayoutIcon,
    PaletteIcon
} from 'lucide-react';

export interface TeamStory {
    id: string;
    teamId: number;
    authorId: string;
    authorName: string;
    title: string;
    content: StoryContent;
    coverImage?: string;
    status: 'draft' | 'published' | 'archived';
    category: StoryCategory;
    tags: string[];
    createdAt: Date;
    updatedAt: Date;
    publishedAt?: Date;
    views: number;
    likes: number;
    comments: StoryComment[];
    isPublic: boolean;
    featuredPlayers: Player[];
    relatedWeek?: number;
    season: number;
}

export type StoryCategory = 
    | 'draft_recap' 
    | 'trade_story' 
    | 'weekly_recap' 
    | 'season_journey' 
    | 'player_spotlight' 
    | 'rivalry' 
    | 'championship' 
    | 'heartbreak' 
    | 'comeback' 
    | 'analysis';

export interface StoryContent {
    sections: StorySection[];
    theme: StoryTheme;
    layout: 'article' | 'timeline' | 'gallery' | 'mixed';
}

export interface StorySection {
    id: string;
    type: 'text' | 'image' | 'video' | 'audio' | 'stats' | 'player_card' | 'quote' | 'poll';
    content: any;
    order: number;
    styling?: SectionStyling;
}

export interface SectionStyling {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: 'small' | 'medium' | 'large' | 'xlarge';
    alignment?: 'left' | 'center' | 'right';
    padding?: 'none' | 'small' | 'medium' | 'large';
    animation?: 'none' | 'fade-in' | 'slide-up' | 'bounce';
}

export interface StoryTheme {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
    fontFamily: string;
    headerStyle: 'bold' | 'elegant' | 'playful' | 'modern';
}

export interface StoryComment {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatar?: string;
    content: string;
    timestamp: Date;
    likes: number;
    replies?: StoryComment[];
}

export interface StoryTemplate {
    id: string;
    name: string;
    description: string;
    category: StoryCategory;
    thumbnail: string;
    sections: Omit<StorySection, 'id' | 'content'>[];
    theme: StoryTheme;
    popularityScore: number;
}

interface TeamStoryBuilderProps {
    team: Team;
    story?: TeamStory;
    templates: StoryTemplate[];
    availablePlayers: Player[];
    onSave: (story: Partial<TeamStory>) => void;
    onPublish: (storyId: string) => void;
    onPreview: (content: StoryContent) => void;
    isLoading?: boolean;
    className?: string;
}

const TeamStoryBuilder: React.FC<TeamStoryBuilderProps> = ({
    team,
    story,
    templates,
    availablePlayers,
    onSave,
    onPublish,
    onPreview,
    isLoading = false,
    className = ''
}) => {
    const [currentStory, setCurrentStory] = React.useState<Partial<TeamStory>>(
        story || {
            teamId: team.id,
            title: '',
            content: {
                sections: [],
                theme: getDefaultTheme(),
                layout: 'article'
            },
            category: 'weekly_recap',
            tags: [],
            status: 'draft',
            isPublic: false,
            featuredPlayers: [],
            season: new Date().getFullYear()
        }
    );

    const [selectedTemplate, setSelectedTemplate] = React.useState<StoryTemplate | null>(null);
    const [activeSection, setActiveSection] = React.useState<string | null>(null);
    const [showTemplates, setShowTemplates] = React.useState(!story);
    const [showPreview, setShowPreview] = React.useState(false);
    const [editorMode, setEditorMode] = React.useState<'write' | 'design' | 'media'>('write');

    const predefinedThemes: StoryTheme[] = [
        {
            name: 'Classic',
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            backgroundColor: '#ffffff',
            fontFamily: 'Inter',
            headerStyle: 'bold'
        },
        {
            name: 'Championship',
            primaryColor: '#fbbf24',
            secondaryColor: '#92400e',
            backgroundColor: '#fef3c7',
            fontFamily: 'Georgia',
            headerStyle: 'elegant'
        },
        {
            name: 'Dark Mode',
            primaryColor: '#8b5cf6',
            secondaryColor: '#a78bfa',
            backgroundColor: '#1f2937',
            fontFamily: 'Inter',
            headerStyle: 'modern'
        },
        {
            name: 'Playful',
            primaryColor: '#ef4444',
            secondaryColor: '#f97316',
            backgroundColor: '#fef2f2',
            fontFamily: 'Comic Sans MS',
            headerStyle: 'playful'
        }
    ];

    function getDefaultTheme(): StoryTheme {
        return predefinedThemes[0];
    }

    const addSection = (type: StorySection['type']) => {
        const newSection: StorySection = {
            id: `section-${Date.now()}`,
            type,
            content: getDefaultContent(type),
            order: currentStory.content?.sections.length || 0,
            styling: {
                fontSize: 'medium',
                alignment: 'left',
                padding: 'medium',
                animation: 'none'
            }
        };

        setCurrentStory(prev => ({
            ...prev,
            content: {
                ...prev.content!,
                sections: [...(prev.content?.sections || []), newSection]
            }
        }));

        setActiveSection(newSection.id);
    };

    const getDefaultContent = (type: StorySection['type']) => {
        switch (type) {
            case 'text':
                return { text: 'Start writing your story...' };
            case 'image':
                return { url: '', caption: '', alt: '' };
            case 'video':
                return { url: '', caption: '', autoplay: false };
            case 'audio':
                return { url: '', title: '', duration: 0 };
            case 'quote':
                return { text: 'Your inspiring quote here...', author: 'Author Name' };
            case 'stats':
                return { playerId: null, statType: 'fantasy_points', week: null };
            case 'player_card':
                return { playerId: null, highlight: 'performance' };
            case 'poll':
                return { question: 'What do you think?', options: ['Option 1', 'Option 2'] };
            default:
                return {};
        }
    };

    const updateSection = (sectionId: string, updates: Partial<StorySection>) => {
        setCurrentStory(prev => ({
            ...prev,
            content: {
                ...prev.content!,
                sections: prev.content!.sections.map((section: any) =>
                    section.id === sectionId ? { ...section, ...updates } : section
                )
            }
        }));
    };

    const removeSection = (sectionId: string) => {
        setCurrentStory(prev => ({
            ...prev,
            content: {
                ...prev.content!,
                sections: prev.content!.sections.filter((section: any) => section.id !== sectionId)
            }
        }));
        if (activeSection === sectionId) {
            setActiveSection(null);
        }
    };

    const applyTemplate = (template: StoryTemplate) => {
        const templatedSections: StorySection[] = template.sections.map((sectionTemplate, index) => ({
            id: `section-${Date.now()}-${index}`,
            ...sectionTemplate,
            content: getDefaultContent(sectionTemplate.type),
            order: index
        }));

        setCurrentStory(prev => ({
            ...prev,
            content: {
                sections: templatedSections,
                theme: template.theme,
                layout: 'article'
            },
            category: template.category,
            title: `${template.name} Story`
        }));

        setSelectedTemplate(template);
        setShowTemplates(false);
    };

    const handleSave = () => {
        onSave(currentStory);
    };

    const handlePublish = () => {
        if (currentStory.id) {
            onPublish(currentStory.id);
        }
    };

    const handlePreview = () => {
        if (currentStory.content) {
            onPreview(currentStory.content);
            setShowPreview(true);
        }
    };

    const renderSectionEditor = (section: StorySection) => {
        const isActive = activeSection === section.id;

        return (
            <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isActive 
                        ? 'border-blue-400 bg-blue-500/10' 
                        : 'border-[var(--panel-border)] bg-[var(--panel-bg)] hover:border-blue-400/50'
                }`}
                onClick={() => setActiveSection(section.id)}
            >
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        {getSectionIcon(section.type)}
                        <span className="font-medium capitalize">{section.type.replace('_', ' ')}</span>
                    </div>
                    <button
                        onClick={(e: any) => {
                            e.stopPropagation();
                            removeSection(section.id);
                        }}
                        className="text-red-400 hover:text-red-300 p-1"
                    >
                        ×
                    </button>
                </div>

                {isActive && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3"
                    >
                        {renderSectionContent(section)}
                        {renderSectionStyling(section)}
                    </motion.div>
                )}
            </motion.div>
        );
    };

    const getSectionIcon = (type: StorySection['type']) => {
        switch (type) {
            case 'text':
                return <TypeIcon className="w-5 h-5 text-blue-400" />;
            case 'image':
                return <ImageIcon className="w-5 h-5 text-green-400" />;
            case 'video':
                return <VideoIcon className="w-5 h-5 text-red-400" />;
            case 'audio':
                return <MicIcon className="w-5 h-5 text-purple-400" />;
            case 'quote':
                return <BookIcon className="w-5 h-5 text-yellow-400" />;
            case 'stats':
                return <TrophyIcon className="w-5 h-5 text-orange-400" />;
            case 'player_card':
                return <UsersIcon className="w-5 h-5 text-pink-400" />;
            case 'poll':
                return <StarIcon className="w-5 h-5 text-indigo-400" />;
            default:
                return <PenToolIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const renderSectionContent = (section: StorySection) => {
        switch (section.type) {
            case 'text':
                return (
                    <textarea
                        value={section.content.text || ''}
                        onChange={(e: any) => updateSection(section.id, {
                            content: { ...section.content, text: e.target.value }
                        })}
                        placeholder="Write your story content..."
                        className="w-full h-32 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)] resize-none"
                    />
                );
            case 'image':
                return (
                    <div className="space-y-2">
                        <input
                            type="url"
                            value={section.content.url || ''}
                            onChange={(e: any) => updateSection(section.id, {
                                content: { ...section.content, url: e.target.value }
                            })}
                            placeholder="Image URL"
                            className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                        />
                        <input
                            type="text"
                            value={section.content.caption || ''}
                            onChange={(e: any) => updateSection(section.id, {
                                content: { ...section.content, caption: e.target.value }
                            })}
                            placeholder="Caption"
                            className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                        />
                    </div>
                );
            case 'quote':
                return (
                    <div className="space-y-2">
                        <textarea
                            value={section.content.text || ''}
                            onChange={(e: any) => updateSection(section.id, {
                                content: { ...section.content, text: e.target.value }
                            })}
                            placeholder="Quote text"
                            className="w-full h-20 p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)] resize-none"
                        />
                        <input
                            type="text"
                            value={section.content.author || ''}
                            onChange={(e: any) => updateSection(section.id, {
                                content: { ...section.content, author: e.target.value }
                            })}
                            placeholder="Quote author"
                            className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                        />
                    </div>
                );
            case 'player_card':
                return (
                    <select
                        value={section.content.playerId || ''}
                        onChange={(e: any) => updateSection(section.id, {
                            content: { ...section.content, playerId: parseInt(e.target.value) }
                        })}
                        className="w-full p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                    >
                        <option value="">Select a player</option>
                        {availablePlayers.map((player: any) => (
                            <option key={player.id} value={player.id}>
                                {player.name} ({player.position})
                            </option>
                        ))}
                    </select>
                );
            default:
                return (
                    <div className="text-sm text-[var(--text-secondary)] p-4 bg-gray-500/10 rounded">
                        Content editor for {section.type} coming soon...
                    </div>
                );
        }
    };

    const renderSectionStyling = (section: StorySection) => (
        <div className="pt-3 border-t border-[var(--panel-border)]">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2">Styling</h4>
            <div className="grid grid-cols-2 gap-2">
                <select
                    value={section.styling?.fontSize || 'medium'}
                    onChange={(e: any) => updateSection(section.id, {
                        styling: { ...section.styling, fontSize: e.target.value as any }
                    })}
                    className="p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm"
                >
                    <option value="small">Small</option>
                    <option value="medium">Medium</option>
                    <option value="large">Large</option>
                    <option value="xlarge">X-Large</option>
                </select>
                <select
                    value={section.styling?.alignment || 'left'}
                    onChange={(e: any) => updateSection(section.id, {
                        styling: { ...section.styling, alignment: e.target.value as any }
                    })}
                    className="p-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-sm"
                >
                    <option value="left">Left</option>
                    <option value="center">Center</option>
                    <option value="right">Right</option>
                </select>
            </div>
        </div>
    );

    return (
        <div className={`h-full flex flex-col bg-[var(--panel-bg)] ${className}`}>
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b border-[var(--panel-border)]">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Story Builder</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setShowTemplates(true)}
                            className="px-3 py-2 bg-gray-500/20 text-[var(--text-secondary)] rounded-lg hover:bg-gray-500/30 transition-colors text-sm"
                        >
                            Templates
                        </button>
                        <button
                            onClick={handlePreview}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
                        >
                            <EyeIcon className="w-4 h-4" />
                            Preview
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-sm"
                        >
                            <SaveIcon className="w-4 h-4" />
                            Save
                        </button>
                        {currentStory?.status === 'draft' && (
                            <button
                                onClick={handlePublish}
                                disabled={isLoading}
                                className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                            >
                                <ShareIcon className="w-4 h-4" />
                                Publish
                            </button>
                        )}
                    </div>
                </div>

                {/* Story Meta */}
                <div className="space-y-3">
                    <input
                        type="text"
                        value={currentStory.title || ''}
                        onChange={(e: any) => setCurrentStory(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Story title..."
                        className="w-full p-3 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-xl font-bold text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                    />
                    
                    <div className="flex gap-3">
                        <select
                            value={currentStory.category || 'weekly_recap'}
                            onChange={(e: any) => setCurrentStory(prev => ({ ...prev, category: e.target.value as StoryCategory }))}
                            className="px-3 py-2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded text-[var(--text-primary)]"
                        >
                            <option value="draft_recap">Draft Recap</option>
                            <option value="trade_story">Trade Story</option>
                            <option value="weekly_recap">Weekly Recap</option>
                            <option value="season_journey">Season Journey</option>
                            <option value="player_spotlight">Player Spotlight</option>
                            <option value="rivalry">Rivalry</option>
                            <option value="championship">Championship</option>
                            <option value="heartbreak">Heartbreak</option>
                            <option value="comeback">Comeback</option>
                            <option value="analysis">Analysis</option>
                        </select>
                        
                        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                            <input
                                type="checkbox"
                                checked={currentStory.isPublic || false}
                                onChange={(e: any) => setCurrentStory(prev => ({ ...prev, isPublic: e.target.checked }))}
                                className="rounded"
                            />
                            Public story
                        </label>
                    </div>
                </div>
            </div>

            {/* Editor Mode Tabs */}
            <div className="flex-shrink-0 border-b border-[var(--panel-border)]">
                <div className="flex">
                    {[
                        { id: 'write', label: 'Write', icon: <PenToolIcon className="w-4 h-4" /> },
                        { id: 'design', label: 'Design', icon: <PaletteIcon className="w-4 h-4" /> },
                        { id: 'media', label: 'Media', icon: <ImageIcon className="w-4 h-4" /> }
                    ].map((mode: any) => (
                        <button
                            key={mode.id}
                            onClick={() => setEditorMode(mode.id as any)}
                            className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                                editorMode === mode.id
                                    ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/10'
                                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5'
                            }`}
                        >
                            {mode.icon}
                            {mode.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-hidden flex">
                {/* Left Panel - Content/Design/Media */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {editorMode === 'write' && (
                        <div className="space-y-4">
                            {/* Add Section Buttons */}
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-500/10 rounded-lg">
                                <span className="text-sm font-medium text-[var(--text-secondary)] mr-2">Add:</span>
                                {[
                                    { type: 'text', label: 'Text', icon: <TypeIcon className="w-4 h-4" /> },
                                    { type: 'image', label: 'Image', icon: <ImageIcon className="w-4 h-4" /> },
                                    { type: 'video', label: 'Video', icon: <VideoIcon className="w-4 h-4" /> },
                                    { type: 'quote', label: 'Quote', icon: <BookIcon className="w-4 h-4" /> },
                                    { type: 'player_card', label: 'Player', icon: <UsersIcon className="w-4 h-4" /> },
                                    { type: 'stats', label: 'Stats', icon: <TrophyIcon className="w-4 h-4" /> }
                                ].map((button: any) => (
                                    <button
                                        key={button.type}
                                        onClick={() => addSection(button.type as StorySection['type'])}
                                        className="flex items-center gap-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors text-sm"
                                    >
                                        {button.icon}
                                        {button.label}
                                    </button>
                                ))}
                            </div>

                            {/* Sections */}
                            <div className="space-y-4">
                                <AnimatePresence>
                                    {currentStory.content?.sections.map((section: any) => renderSectionEditor(section))}
                                </AnimatePresence>
                            </div>

                            {currentStory.content?.sections.length === 0 && (
                                <div className="text-center py-12 text-[var(--text-secondary)]">
                                    <BookIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                    <p className="text-lg font-medium mb-2">Start your story</p>
                                    <p>Add sections above to begin creating your team story</p>
                                </div>
                            )}
                        </div>
                    )}

                    {editorMode === 'design' && (
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Theme</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {predefinedThemes.map((theme: any) => (
                                        <button
                                            key={theme.name}
                                            onClick={() => setCurrentStory(prev => ({
                                                ...prev,
                                                content: { ...prev.content!, theme }
                                            }))}
                                            className={`p-4 rounded-lg border transition-all ${
                                                currentStory.content?.theme.name === theme.name
                                                    ? 'border-blue-400 bg-blue-500/10'
                                                    : 'border-[var(--panel-border)] hover:border-blue-400/50'
                                            }`}
                                        >
                                            <div className="font-medium text-[var(--text-primary)]">{theme.name}</div>
                                            <div className="flex gap-2 mt-2">
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: theme.primaryColor }}
                                                />
                                                <div
                                                    className="w-4 h-4 rounded"
                                                    style={{ backgroundColor: theme.secondaryColor }}
                                                />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-medium text-[var(--text-primary)] mb-4">Layout</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'article', label: 'Article', icon: <LayoutIcon className="w-6 h-6" /> },
                                        { id: 'timeline', label: 'Timeline', icon: <CalendarIcon className="w-6 h-6" /> },
                                        { id: 'gallery', label: 'Gallery', icon: <ImageIcon className="w-6 h-6" /> },
                                        { id: 'mixed', label: 'Mixed', icon: <StarIcon className="w-6 h-6" /> }
                                    ].map((layout: any) => (
                                        <button
                                            key={layout.id}
                                            onClick={() => setCurrentStory(prev => ({
                                                ...prev,
                                                content: { ...prev.content!, layout: layout.id as any }
                                            }))}
                                            className={`flex items-center gap-3 p-4 rounded-lg border transition-all ${
                                                currentStory.content?.layout === layout.id
                                                    ? 'border-blue-400 bg-blue-500/10'
                                                    : 'border-[var(--panel-border)] hover:border-blue-400/50'
                                            }`}
                                        >
                                            {layout.icon}
                                            <span className="font-medium">{layout.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {editorMode === 'media' && (
                        <div className="space-y-6">
                            <div className="text-center py-12 text-[var(--text-secondary)]">
                                <UploadIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-lg font-medium mb-2">Media Library</p>
                                <p>Upload and manage images, videos, and audio for your story</p>
                                <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                                    Upload Media
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Templates Modal */}
            <AnimatePresence>
                {showTemplates && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                        onClick={() => setShowTemplates(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--panel-bg)] rounded-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto"
                            onClick={(e: any) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">Story Templates</h3>
                                    <button
                                        onClick={() => setShowTemplates(false)}
                                        className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                    >
                                        ×
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {templates.map((template: any) => (
                                        <motion.button
                                            key={template.id}
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={() => applyTemplate(template)}
                                            className="p-4 border border-[var(--panel-border)] rounded-lg hover:border-blue-400/50 transition-all text-left"
                                        >
                                            <div className="aspect-video bg-gray-500/20 rounded mb-3 flex items-center justify-center">
                                                <span className="text-4xl">{template.thumbnail}</span>
                                            </div>
                                            <h4 className="font-medium text-[var(--text-primary)] mb-1">{template.name}</h4>
                                            <p className="text-sm text-[var(--text-secondary)] mb-2">{template.description}</p>
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                                                    {template.category.replace('_', ' ')}
                                                </span>
                                                <div className="flex items-center gap-1 text-xs text-[var(--text-secondary)]">
                                                    <StarIcon className="w-3 h-3" />
                                                    {template.popularityScore}
                                                </div>
                                            </div>
                                        </motion.button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TeamStoryBuilder;
