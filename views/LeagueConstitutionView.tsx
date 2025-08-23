
import React from 'react';
import { useAppState } from '../contexts/AppContext';
import { useLeague } from '../hooks/useLeague';
import { Widget } from '../components/ui/Widget';
import ErrorDisplay from '../components/core/ErrorDisplay';
import { FileTextIcon } from '../components/icons/FileTextIcon';
import { generateLeagueConstitution } from '../services/geminiService';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import useCopyToClipboard from '../hooks/useCopyToClipboard';
import { ClipboardIcon } from '../components/icons/ClipboardIcon';
import { CheckIcon } from '../components/icons/CheckIcon';

const LeagueConstitutionView: React.FC = () => {
    const { state, dispatch } = useAppState();
    const { league } = useLeague();
    const [constitution, setConstitution] = React.useState<string | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [isCopied, setIsCopied] = React.useState(false);
    const { copy } = useCopyToClipboard();

    if (!league || state.user.id !== league.commissionerId) {
        return <ErrorDisplay title="Access Denied" message="You are not the commissioner of this league." onRetry={() => dispatch({ type: 'SET_VIEW', payload: 'DASHBOARD' })} />;
    }

    const handleGenerate = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateLeagueConstitution(league);
            if (result) {
                setConstitution(result);
            } else {
                setError("The Oracle could not generate a constitution. Please try again.");
            }
        } catch (e) {
            setError("An error occurred while consulting the Oracle.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleCopy = () => {
        if (!constitution) return;
        copy(constitution);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <div className="w-full h-full flex flex-col p-4 sm:p-6 lg:p-8 overflow-y-auto">
            <header className="flex-shrink-0 flex justify-between items-center mb-6">
                <div>
                    <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-wider uppercase text-[var(--text-primary)]">
                        League Constitution
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] tracking-widest">{league.name}</p>
                </div>
                <button onClick={() => dispatch({ type: 'SET_VIEW', payload: 'COMMISSIONER_TOOLS' })} className="px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20">
                    Back to Tools
                </button>
            </header>
            <main className="flex-grow max-w-4xl mx-auto w-full">
                <Widget title="League Constitution & Bylaws" icon={<FileTextIcon />}>
                    <div className="p-4">
                        {isLoading ? <LoadingSpinner text="The Oracle is drafting your constitution..." /> :
                         error ? <ErrorDisplay message={error} onRetry={handleGenerate} /> :
                         constitution ? (
                            <div>
                                <div className="flex justify-end mb-2">
                                    <button onClick={handleCopy} className="flex items-center gap-1.5 px-3 py-1 text-xs font-bold bg-white/10 rounded-md hover:bg-white/20">
                                        {isCopied ? <CheckIcon /> : <ClipboardIcon />}
                                        {isCopied ? 'Copied!' : 'Copy to Clipboard'}
                                    </button>
                                </div>
                                <div className="prose prose-sm prose-invert bg-black/20 p-4 rounded-lg max-h-[60vh] overflow-y-auto">
                                    <ReactMarkdown>{constitution}</ReactMarkdown>
                                </div>
                            </div>
                         ) : (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">Generate a formal constitution for your league based on its current settings.</p>
                                <button onClick={handleGenerate} className="px-6 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md">
                                    Generate Constitution
                                </button>
                            </div>
                         )
                        }
                    </div>
                </Widget>
            </main>
        </div>
    );
};

export default LeagueConstitutionView;
