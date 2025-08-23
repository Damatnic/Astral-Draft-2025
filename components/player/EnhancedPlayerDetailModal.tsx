/**
 * Enhanced Player Detail Modal
 * Updated modal to use the new PlayerProfileView for comprehensive player information
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import type { Player, League } from '../../types';
import Modal from '../ui/Modal';
import PlayerProfileView from './PlayerProfileView';

interface EnhancedPlayerDetailModalProps {
    player: Player;
    onClose: () => void;
    league?: League | null;
    dispatch: React.Dispatch<any>;
}

const EnhancedPlayerDetailModal: React.FC<EnhancedPlayerDetailModalProps> = ({ 
    player, 
    onClose, 
    league,
    dispatch 
}) => {
    // Fallback league if none provided
    const defaultLeague: League = {
        id: '1',
        name: 'Demo League',
        settings: {
            draftFormat: 'SNAKE',
            teamCount: 12,
            rosterSize: 16,
            scoring: 'PPR',
            tradeDeadline: 12,
            playoffFormat: '4_TEAM',
            waiverRule: 'FAAB',
            aiAssistanceLevel: 'FULL'
        },
        members: [],
        status: 'IN_SEASON',
        commissionerId: '1',
        draftPicks: [],
        teams: [],
        draftLog: [],
        chatMessages: [],
        tradeOffers: [],
        waiverClaims: [],
        schedule: [],
        currentWeek: 4,
        draftCommentary: []
    };

    const activeLeague = league || defaultLeague;

    return (
        <AnimatePresence>
            <Modal onClose={onClose}>
                <PlayerProfileView 
                    player={player}
                    league={activeLeague}
                    dispatch={dispatch}
                    onClose={onClose}
                />
            </Modal>
        </AnimatePresence>
    );
};

export default EnhancedPlayerDetailModal;
