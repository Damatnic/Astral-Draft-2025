
import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Player, PlayerNote, League } from '../../types';
import Modal from '../ui/Modal';
import Tabs from '../ui/Tabs';
import OverviewTab from './tabs/OverviewTab';
import ScoutingTab from './tabs/ScoutingTab';
import FantasyTab from './tabs/FantasyTab';
import IntelligenceTab from './tabs/IntelligenceTab';
import { generatePlayerInsight, generatePlayerAvatar } from '../../services/geminiService';
import { SparklesIcon } from '../icons/SparklesIcon';
import { ShieldCheckIcon } from '../icons/ShieldCheckIcon';
import SimilarPlayersPopup from './SimilarPlayersPopup';
import StoryTab from './tabs/StoryTab';
import ContractTab from './tabs/ContractTab';
import GameLogTab from './tabs/GameLogTab';
import { MicrophoneIcon } from '../icons/MicrophoneIcon';
import { StopIcon } from '../icons/StopIcon';
import { Trash2Icon } from '../icons/Trash2Icon';
import { Avatar } from '../ui/Avatar';

interface PlayerDetailModalProps {
  player: Player;
  onClose: () => void;
  playerNotes: { [playerId: number]: PlayerNote };
  dispatch: React.Dispatch<any>;
  initialTab?: string;
  league?: League | null;
  playerAvatars: { [playerId: number]: string };
}

const positionColor: Record<string, string> = {
    QB: 'from-red-500/30',
    RB: 'from-green-500/30',
    WR: 'from-blue-500/30',
    TE: 'from-orange-500/30',
    DST: 'from-purple-500/30',
    K: 'from-yellow-500/30'
};


interface MyNotesTabProps {
    player: Player;
    note: PlayerNote | undefined;
    dispatch: React.Dispatch<any>;
}

const MyNotesTab: React.FC<MyNotesTabProps> = ({player, note, dispatch}) => {
    const [noteText, setNoteText] = React.useState(note?.text || '');
    const [isGenerating, setIsGenerating] = React.useState(false);
    const [isRecording, setIsRecording] = React.useState(false);
    const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
    const audioChunksRef = React.useRef<Blob[]>([]);

     React.useEffect(() => {
        setNoteText(note?.text || '');
    }, [note?.text]);

    const handleSaveText = () => {
        dispatch({
            type: 'ADD_PLAYER_NOTE',
            payload: { playerId: player.id, note: noteText }
        });
        dispatch({
            type: 'ADD_NOTIFICATION',
            payload: { message: `Note for ${player.name} saved!`, type: 'SYSTEM' }
        });
    };

    const handleGenerateInsight = async () => {
        setIsGenerating(true);
        const insight = await generatePlayerInsight(player);
        if (insight) {
            const newNote = noteText ? `${noteText}\n\n---\n🔮 Oracle's Insight:\n${insight}` : `🔮 Oracle's Insight:\n${insight}`;
            setNoteText(newNote);
        } else {
             dispatch({
                type: 'ADD_NOTIFICATION',
                payload: { message: `Could not generate insight for ${player.name}.`, type: 'SYSTEM' }
            });
        }
        setIsGenerating(false);
    };
    
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];
            
            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;
                    dispatch({ type: 'ADD_PLAYER_AUDIO_NOTE', payload: { playerId: player.id, audioDataUrl: base64data } });
                     dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Audio note for ${player.name} saved.`, type: 'SYSTEM' } });
                };
                 stream.getTracks().forEach((track: any) => track.stop());
            };
            
            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (err) {
            console.error("Error starting recording:", err);
            dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Microphone access denied.', type: 'SYSTEM' } });
        }
    };
    
    const handleStopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
        }
        setIsRecording(false);
    };
    
    const handleDeleteAudio = () => {
        dispatch({ type: 'DELETE_PLAYER_AUDIO_NOTE', payload: { playerId: player.id }});
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Audio note for ${player.name} deleted.`, type: 'SYSTEM' } });
    };

    return (
        <div>
            <h3 className="font-bold text-lg text-cyan-300 mb-2">My Private Notes</h3>
            <textarea 
                className="w-full h-32 p-2 bg-black/20 rounded-md border border-[var(--panel-border)] focus:outline-none focus:ring-2 focus:ring-cyan-400 text-sm"
                placeholder={`Jot down your thoughts on ${player.name}...`}
                value={noteText}
                onChange={(e: any) => setNoteText(e.target.value)}
                autoFocus
            />
            <div className="mt-2 flex items-center justify-between">
                 <button 
                    onClick={handleGenerateInsight}
                    disabled={isGenerating}
                    className="flex items-center gap-2 px-3 py-1.5 bg-transparent border border-cyan-400/50 text-cyan-300 font-bold text-xs rounded-md hover:bg-cyan-400/20 disabled:opacity-50 disabled:cursor-wait"
                    aria-label="Generate AI insight for player note"
                >
                    {isGenerating ? 'Generating...' : <><SparklesIcon /> AI Insight</>}
                </button>
                <button 
                    onClick={handleSaveText}
                    disabled={isGenerating}
                    className="px-4 py-1.5 bg-cyan-500 text-black font-bold text-sm rounded-md hover:bg-cyan-400 disabled:opacity-50"
                    aria-label="Save player note"
                >
                    Save Note
                </button>
            </div>
             <div className="mt-4 pt-4 border-t border-[var(--panel-border)]">
                <h3 className="font-bold text-lg text-cyan-300 mb-2">Voice Memo</h3>
                {note?.audio ? (
                    <div className="flex items-center gap-2">
                        <audio src={note.audio} controls className="w-full h-10" />
                        <button onClick={handleDeleteAudio} className="p-2 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30">
                            <Trash2Icon />
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={isRecording ? handleStopRecording : handleStartRecording}
                            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-colors ${isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'}`}
                        >
                            {isRecording ? <><StopIcon /> Stop</> : <><MicrophoneIcon className="h-4 w-4" /> Record</>}
                        </button>
                         {isRecording && <p className="text-sm text-red-400 animate-pulse">Recording...</p>}
                    </div>
                )}
            </div>
        </div>
    )
}

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ player, onClose, playerNotes, dispatch, initialTab = 'overview', league, playerAvatars }) => {
  const [isSimilarPlayersOpen, setIsSimilarPlayersOpen] = React.useState(false);
  
  const tabItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'scouting', label: 'Scouting' },
    { id: 'fantasy', label: 'Fantasy' },
    { id: 'game_log', label: 'Game Log' },
    { id: 'contract', label: 'Contract' },
    { id: 'intel', label: 'Astral Intel' },
    { id: 'story', label: 'Story' },
    { id: 'notes', label: 'My Notes' },
  ];

  const [activeTab, setActiveTab] = React.useState(initialTab);
  
  const playerNote = playerNotes[player.id];
  const generatedAvatar = playerAvatars[player.id];

  const rosteredTeam = React.useMemo(() => {
    if (!league) return null;
    return league.teams.find((team: any) => team.roster.some((p: any) => p.id === player.id));
  }, [league, player.id]);
  
  React.useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  React.useEffect(() => {
    // Generate an AI avatar for the player if one doesn't exist
    if (!generatedAvatar) {
        generatePlayerAvatar(player).then(avatarUrl => {
            if(avatarUrl) {
                dispatch({ type: 'SET_PLAYER_AVATAR', payload: { playerId: player.id, avatarUrl } });
            }
        });
    }
  }, [player, generatedAvatar, dispatch]);

  return (
    <>
      <Modal onClose={onClose}>
          <div className={`glass-pane bg-[var(--panel-bg)] backdrop-blur-xl border-[var(--panel-border)] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col`}>
              {/* Header */}
              <div className={`p-4 sm:p-6 border-b border-[var(--panel-border)] bg-gradient-to-br ${positionColor[player.position]} to-transparent flex items-start justify-between`}>
                  <div className="flex items-start gap-4">
                        <Avatar 
                           avatar={player.astralIntelligence?.spiritAnimal?.split(',')[0] || '🏈'}
                           generatedAvatarUrl={generatedAvatar}
                           className="w-24 h-24 text-6xl rounded-lg flex-shrink-0"
                           alt={player.name}
                        />
                        <div>
                            <p className="font-bold text-sm text-cyan-300">{player.position} / {player.team}</p>
                            <h2 className="text-3xl sm:text-4xl font-bold font-display text-white tracking-wider">{player.name}</h2>
                        </div>
                  </div>
                  <div>
                      {rosteredTeam && (
                          <div className="flex items-center gap-2 px-3 py-1 bg-green-900/50 border border-green-400/30 rounded-full text-xs text-green-300">
                              <ShieldCheckIcon className="h-4 w-4" />
                              <span>Rostered by <strong>{rosteredTeam.name}</strong></span>
                          </div>
                      )}
                  </div>
              </div>

              {/* Tabs */}
              <div className="flex-shrink-0 px-4 sm:px-6 border-b border-[var(--panel-border)] overflow-x-auto">
                  <Tabs items={tabItems} activeTab={activeTab} onTabChange={setActiveTab} />
              </div>

              {/* Content */}
              <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                  <AnimatePresence mode="wait">
                      <div key={activeTab}>
                          {activeTab === 'overview' && <OverviewTab player={player} onFindSimilar={() => setIsSimilarPlayersOpen(true)} />}
                          {activeTab === 'scouting' && <ScoutingTab player={player} />}
                          {activeTab === 'fantasy' && <FantasyTab player={player} />}
                          {activeTab === 'game_log' && <GameLogTab player={player} />}
                          {activeTab === 'contract' && <ContractTab player={player} />}
                          {activeTab === 'intel' && <IntelligenceTab player={player} />}
                          {activeTab === 'story' && league && <StoryTab player={player} league={league} />}
                          {activeTab === 'notes' && <MyNotesTab player={player} note={playerNote} dispatch={dispatch} />}
                      </div>
                  </AnimatePresence>
              </div>
          </div>
      </Modal>
      <AnimatePresence>
        {isSimilarPlayersOpen && (
            <SimilarPlayersPopup
                playerToCompare={player}
                onClose={() => setIsSimilarPlayersOpen(false)}
            />
        )}
      </AnimatePresence>
    </>
  );
};

export default PlayerDetailModal;
