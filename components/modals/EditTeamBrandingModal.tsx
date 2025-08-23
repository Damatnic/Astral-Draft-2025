import React from 'react';
import { motion } from 'framer-motion';

interface EditTeamBrandingModalProps {
    team: any;
    leagueId: string;
    dispatch: (action: any) => void;
    onClose: () => void;
}

const EditTeamBrandingModal: React.FC<EditTeamBrandingModalProps> = ({
    team,
    leagueId,
    dispatch,
    onClose
}) => {
    const [teamName, setTeamName] = React.useState(team.name || '');
    const [teamLogo, setTeamLogo] = React.useState(team.logo || '');
    const [primaryColor, setPrimaryColor] = React.useState(team.primaryColor || '#3B82F6');
    const [secondaryColor, setSecondaryColor] = React.useState(team.secondaryColor || '#1E40AF');
    const [motto, setMotto] = React.useState(team.motto || '');
    const [loading, setLoading] = React.useState(false);

    const predefinedColors = [
        '#EF4444', '#F97316', '#F59E0B', '#EAB308',
        '#84CC16', '#22C55E', '#10B981', '#14B8A6',
        '#06B6D4', '#0EA5E9', '#3B82F6', '#6366F1',
        '#8B5CF6', '#A855F7', '#D946EF', '#EC4899'
    ];

    const logoOptions = [
        '🦅', '🦁', '🐻', '🐺', '🦈', '🐅', '🦏', '🐎',
        '⚡', '🔥', '❄️', '🌟', '💎', '👑', '⚔️', '🛡️'
    ];

    const handleSave = async () => {
        setLoading(true);
        
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            dispatch({
                type: 'UPDATE_TEAM_BRANDING',
                payload: {
                    teamId: team.id,
                    leagueId,
                    branding: {
                        name: teamName,
                        logo: teamLogo,
                        primaryColor,
                        secondaryColor,
                        motto
                    }
                }
            });
            
            onClose();
        } catch (error) {
            console.error('Failed to update team branding:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-800 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-700">
                    <h2 className="text-xl font-bold text-white">Edit Team Branding</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Team Name */}
                    <div>
                        <label htmlFor="team-name" className="block text-sm font-medium text-gray-300 mb-2">
                            Team Name
                        </label>
                        <input
                            id="team-name"
                            type="text"
                            value={teamName}
                            onChange={(e: any) => setTeamName(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter team name"
                        />
                    </div>

                    {/* Team Logo */}
                    <div>
                        <label htmlFor="team-logo" className="block text-sm font-medium text-gray-300 mb-2">
                            Team Logo
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-3">
                            {logoOptions.map((emoji) => (
                                <button
                                    key={emoji}
                                    onClick={() => setTeamLogo(emoji)}
                                    className={`p-3 text-2xl rounded-lg border-2 transition-all ${
                                        teamLogo === emoji
                                            ? 'border-blue-500 bg-blue-500/20'
                                            : 'border-gray-600 hover:border-gray-500'
                                    }`}
                                    aria-label={`Select ${emoji} as team logo`}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                        <input
                            id="team-logo"
                            type="text"
                            value={teamLogo}
                            onChange={(e: any) => setTeamLogo(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Or enter custom emoji/text"
                        />
                    </div>

                    {/* Color Scheme */}
                    <div>
                        <label htmlFor="primary-color" className="block text-sm font-medium text-gray-300 mb-2">
                            Primary Color
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-3">
                            {predefinedColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setPrimaryColor(color)}
                                    className={`w-8 h-8 rounded-lg border-2 ${
                                        primaryColor === color
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select ${color} as primary color`}
                                />
                            ))}
                        </div>
                        <input
                            id="primary-color"
                            type="color"
                            value={primaryColor}
                            onChange={(e: any) => setPrimaryColor(e.target.value)}
                            className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    <div>
                        <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-300 mb-2">
                            Secondary Color
                        </label>
                        <div className="grid grid-cols-8 gap-2 mb-3">
                            {predefinedColors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSecondaryColor(color)}
                                    className={`w-8 h-8 rounded-lg border-2 ${
                                        secondaryColor === color
                                            ? 'border-white scale-110'
                                            : 'border-gray-600 hover:scale-105'
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`Select ${color} as secondary color`}
                                />
                            ))}
                        </div>
                        <input
                            id="secondary-color"
                            type="color"
                            value={secondaryColor}
                            onChange={(e: any) => setSecondaryColor(e.target.value)}
                            className="w-full h-10 bg-gray-700 border border-gray-600 rounded-lg"
                        />
                    </div>

                    {/* Team Motto */}
                    <div>
                        <label htmlFor="team-motto" className="block text-sm font-medium text-gray-300 mb-2">
                            Team Motto
                        </label>
                        <input
                            id="team-motto"
                            type="text"
                            value={motto}
                            onChange={(e: any) => setMotto(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter team motto"
                            maxLength={50}
                        />
                        <div className="text-xs text-gray-400 mt-1">
                            {motto.length}/50 characters
                        </div>
                    </div>

                    {/* Preview */}
                    <div>
                        <div className="block text-sm font-medium text-gray-300 mb-2">
                            Preview
                        </div>
                        <div 
                            className="p-4 rounded-lg border border-gray-600"
                            style={{ 
                                background: `linear-gradient(135deg, ${primaryColor}20, ${secondaryColor}20)`,
                                borderColor: primaryColor
                            }}
                        >
                            <div className="flex items-center space-x-3">
                                <div 
                                    className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: primaryColor + '40' }}
                                >
                                    {teamLogo}
                                </div>
                                <div>
                                    <div className="font-bold text-white">
                                        {teamName || 'Team Name'}
                                    </div>
                                    <div className="text-sm text-gray-300">
                                        {motto || 'Team motto'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end space-x-3 p-6 border-t border-gray-700">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !teamName.trim()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center space-x-2"
                    >
                        {loading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                        <span>Save Changes</span>
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

export default EditTeamBrandingModal;
