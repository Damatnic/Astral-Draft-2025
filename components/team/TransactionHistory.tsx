/**
 * Transaction History
 * Complete history of adds, drops, trades, and waiver claims
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Widget } from '../ui/Widget';
import { Avatar } from '../ui/Avatar';
import { Team, League, Player } from '../../types';
import { ClockIcon } from '../icons/ClockIcon';
import { ArrowRightLeftIcon } from '../icons/ArrowRightLeftIcon';
import { UserPlusIcon } from '../icons/UserPlusIcon';
import { UserRemoveIcon } from '../icons/UserRemoveIcon';
import { DollarSignIcon } from '../icons/DollarSignIcon';

interface TransactionHistoryProps {
    team: Team;
    league: League;
    dispatch: React.Dispatch<any>;
}

interface Transaction {
    id: string;
    type: 'ADD' | 'DROP' | 'TRADE' | 'WAIVER' | 'DRAFT' | 'KEEPER';
    date: string;
    week: number;
    description: string;
    playerIn?: Player;
    playerOut?: Player;
    tradingPartner?: Team;
    cost?: number;
    status: 'COMPLETED' | 'PENDING' | 'CANCELLED';
    details?: string;
}

const TransactionHistory: React.FC<TransactionHistoryProps> = ({ team, league, dispatch }) => {
    const [filterType, setFilterType] = React.useState<'ALL' | Transaction['type']>('ALL');
    const [filterWeek, setFilterWeek] = React.useState<'ALL' | number>('ALL');
    const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);

    // Mock transaction data - in real app this would come from the backend
    const mockTransactions: Transaction[] = [
        {
            id: '1',
            type: 'WAIVER',
            date: '2024-09-15T10:30:00Z',
            week: 2,
            description: 'Claimed Jordan Mason from waivers',
            playerIn: { id: 101, name: 'Jordan Mason', position: 'RB', team: 'SF', rank: 45, adp: 120, bye: 9, tier: 3, age: 25, auctionValue: 8, stats: { projection: 12.5, lastYear: 8.2, vorp: 2.1, weeklyProjections: {} } } as Player,
            cost: 15,
            status: 'COMPLETED',
            details: 'FAAB bid: $15 (3rd highest bid)'
        },
        {
            id: '2',
            type: 'DROP',
            date: '2024-09-15T10:30:00Z',
            week: 2,
            description: 'Dropped Tyler Allgeier',
            playerOut: { id: 102, name: 'Tyler Allgeier', position: 'RB', team: 'ATL', rank: 78, adp: 145, bye: 12, tier: 4, age: 24, auctionValue: 3, stats: { projection: 6.8, lastYear: 9.1, vorp: -1.2, weeklyProjections: {} } } as Player,
            status: 'COMPLETED'
        },
        {
            id: '3',
            type: 'TRADE',
            date: '2024-09-08T14:15:00Z',
            week: 1,
            description: 'Traded with Thunder Bolts',
            playerIn: { id: 103, name: 'Diontae Johnson', position: 'WR', team: 'CAR', rank: 25, adp: 65, bye: 11, tier: 2, age: 28, auctionValue: 18, stats: { projection: 14.8, lastYear: 16.2, vorp: 4.5, weeklyProjections: {} } } as Player,
            playerOut: { id: 104, name: 'Calvin Ridley', position: 'WR', team: 'TEN', rank: 32, adp: 72, bye: 5, tier: 3, age: 29, auctionValue: 16, stats: { projection: 13.2, lastYear: 15.8, vorp: 3.1, weeklyProjections: {} } } as Player,
            tradingPartner: { 
                id: 3, 
                name: 'Thunder Bolts', 
                owner: { id: '3', name: 'Carol Davis', avatar: '👩' }, 
                avatar: '⚡',
                roster: [],
                budget: 0,
                faab: 0,
                record: { wins: 0, losses: 0, ties: 0 },
                futureDraftPicks: []
            } as Team,
            status: 'COMPLETED',
            details: 'Also received 2025 3rd round pick'
        },
        {
            id: '4',
            type: 'ADD',
            date: '2024-09-01T09:00:00Z',
            week: 1,
            description: 'Added Kendre Miller from free agency',
            playerIn: { id: 105, name: 'Kendre Miller', position: 'RB', team: 'NO', rank: 89, adp: 180, bye: 12, tier: 5, age: 22, auctionValue: 1, stats: { projection: 5.2, lastYear: 0, vorp: -2.1, weeklyProjections: {} } } as Player,
            status: 'COMPLETED'
        },
        {
            id: '5',
            type: 'DRAFT',
            date: '2024-08-28T19:45:00Z',
            week: 0,
            description: 'Drafted Christian McCaffrey (1st overall)',
            playerIn: { id: 106, name: 'Christian McCaffrey', position: 'RB', team: 'SF', rank: 1, adp: 1, bye: 9, tier: 1, age: 28, auctionValue: 65, stats: { projection: 22.8, lastYear: 24.2, vorp: 8.9, weeklyProjections: {} } } as Player,
            status: 'COMPLETED',
            details: 'Round 1, Pick 1'
        }
    ];

    const filteredTransactions = mockTransactions.filter((transaction: any) => {
        if (filterType !== 'ALL' && transaction.type !== filterType) return false;
        if (filterWeek !== 'ALL' && transaction.week !== filterWeek) return false;
        return true;
    });

    const getTransactionIcon = (type: Transaction['type']) => {
        switch (type) {
            case 'ADD':
                return <UserPlusIcon className="w-5 h-5 text-green-400" />;
            case 'DROP':
                return <UserRemoveIcon className="w-5 h-5 text-red-400" />;
            case 'TRADE':
                return <ArrowRightLeftIcon className="w-5 h-5 text-blue-400" />;
            case 'WAIVER':
                return <DollarSignIcon className="w-5 h-5 text-yellow-400" />;
            case 'DRAFT':
                return <UserPlusIcon className="w-5 h-5 text-purple-400" />;
            case 'KEEPER':
                return <UserPlusIcon className="w-5 h-5 text-cyan-400" />;
            default:
                return <ClockIcon className="w-5 h-5 text-gray-400" />;
        }
    };

    const getTransactionColor = (type: Transaction['type']) => {
        switch (type) {
            case 'ADD':
            case 'DRAFT':
            case 'KEEPER':
                return 'border-l-green-500 bg-green-500/5';
            case 'DROP':
                return 'border-l-red-500 bg-red-500/5';
            case 'TRADE':
                return 'border-l-blue-500 bg-blue-500/5';
            case 'WAIVER':
                return 'border-l-yellow-500 bg-yellow-500/5';
            default:
                return 'border-l-gray-500 bg-gray-500/5';
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        }).format(date);
    };

    const transactionTypes = ['ALL', 'ADD', 'DROP', 'TRADE', 'WAIVER', 'DRAFT', 'KEEPER'] as const;
    const availableWeeks = Array.from(new Set(mockTransactions.map((t: any) => t.week))).sort((a, b) => b - a);

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <Widget title="Transaction Summary">
                <div className="p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-green-400">
                                {mockTransactions.filter((t: any) => ['ADD', 'WAIVER', 'DRAFT', 'KEEPER'].includes(t.type)).length}
                            </div>
                            <div className="text-xs text-gray-400">Players Acquired</div>
                        </div>
                        <div className="text-center p-3 bg-red-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-red-400">
                                {mockTransactions.filter((t: any) => t.type === 'DROP').length}
                            </div>
                            <div className="text-xs text-gray-400">Players Dropped</div>
                        </div>
                        <div className="text-center p-3 bg-blue-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-blue-400">
                                {mockTransactions.filter((t: any) => t.type === 'TRADE').length}
                            </div>
                            <div className="text-xs text-gray-400">Trades Made</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-500/20 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-400">
                                ${mockTransactions.filter((t: any) => t.type === 'WAIVER').reduce((sum, t) => sum + (t.cost || 0), 0)}
                            </div>
                            <div className="text-xs text-gray-400">FAAB Spent</div>
                        </div>
                    </div>
                </div>
            </Widget>

            {/* Filters */}
            <Widget title="Transaction History">
                <div className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                        <div className="flex-1">
                            <label htmlFor="filter-type" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Filter by Type
                            </label>
                            <select
                                id="filter-type"
                                value={filterType}
                                onChange={(e: any) => setFilterType(e.target.value as any)}
                                className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)]"
                            >
                                {transactionTypes.map((type: any) => (
                                    <option key={type} value={type}>
                                        {type === 'ALL' ? 'All Types' : type.charAt(0) + type.slice(1).toLowerCase()}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex-1">
                            <label htmlFor="filter-week" className="block text-sm font-medium text-[var(--text-secondary)] mb-2">
                                Filter by Week
                            </label>
                            <select
                                id="filter-week"
                                value={filterWeek}
                                onChange={(e: any) => setFilterWeek(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                                className="w-full px-3 py-2 bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg text-[var(--text-primary)]"
                            >
                                <option value="ALL">All Weeks</option>
                                {availableWeeks.map((week: any) => (
                                    <option key={week} value={week}>
                                        {week === 0 ? 'Pre-Season' : `Week ${week}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="space-y-3">
                        {filteredTransactions.length === 0 ? (
                            <div className="text-center py-8">
                                <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)]">No transactions found with current filters</p>
                            </div>
                        ) : (
                            filteredTransactions.map((transaction) => (
                                <motion.div
                                    key={transaction.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`p-4 border-l-4 rounded-lg cursor-pointer transition-all hover:bg-white/5 ${getTransactionColor(transaction.type)}`}
                                    onClick={() => setSelectedTransaction(transaction)}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {getTransactionIcon(transaction.type)}
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium text-[var(--text-primary)]">
                                                        {transaction.description}
                                                    </h4>
                                                    {(() => {
                                                        const getStatusClass = () => {
                                                            if (transaction?.status === 'COMPLETED') return 'bg-green-500/20 text-green-400';
                                                            if (transaction?.status === 'PENDING') return 'bg-yellow-500/20 text-yellow-400';
                                                            return 'bg-red-500/20 text-red-400';
                                                        };
                                                        return (
                                                            <span className={`px-2 py-1 rounded text-xs ${getStatusClass()}`}>
                                                                {transaction?.status}
                                                            </span>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)] mt-1">
                                                    <span>{formatDate(transaction.date)}</span>
                                                    <span>{transaction.week === 0 ? 'Pre-Season' : `Week ${transaction.week}`}</span>
                                                    {Boolean(transaction.cost) && (
                                                        <span className="text-yellow-400">Cost: ${transaction.cost}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {transaction.playerIn && (
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        avatar={transaction.playerIn.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                                        className="w-8 h-8 text-lg rounded-md"
                                                    />
                                                    <span className="text-green-400 text-sm">+{transaction.playerIn.name}</span>
                                                </div>
                                            )}
                                            {transaction.type === 'TRADE' && <ArrowRightLeftIcon className="w-4 h-4 text-gray-400" />}
                                            {transaction.playerOut && (
                                                <div className="flex items-center gap-2">
                                                    <Avatar
                                                        avatar={transaction.playerOut.astralIntelligence?.spiritAnimal?.[0] || '🏈'}
                                                        className="w-8 h-8 text-lg rounded-md"
                                                    />
                                                    <span className="text-red-400 text-sm">-{transaction.playerOut.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </div>
            </Widget>

            {/* Transaction Details Modal */}
            <AnimatePresence>
                {selectedTransaction && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75"
                        onClick={(e: any) => e.target === e.currentTarget && setSelectedTransaction(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-[var(--panel-bg)] border border-[var(--panel-border)] rounded-lg shadow-xl p-6 max-w-2xl w-full"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getTransactionIcon(selectedTransaction.type)}
                                    <h3 className="text-xl font-bold text-[var(--text-primary)]">
                                        Transaction Details
                                    </h3>
                                </div>
                                <button
                                    onClick={() => setSelectedTransaction(null)}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-[var(--text-primary)] mb-2">Summary</h4>
                                    <p className="text-[var(--text-secondary)]">{selectedTransaction.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-1">Date & Time</h5>
                                        <p className="text-sm text-[var(--text-secondary)]">{formatDate(selectedTransaction.date)}</p>
                                    </div>
                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-1">Week</h5>
                                        <p className="text-sm text-[var(--text-secondary)]">
                                            {selectedTransaction.week === 0 ? 'Pre-Season' : `Week ${selectedTransaction.week}`}
                                        </p>
                                    </div>
                                </div>

                                {selectedTransaction.tradingPartner && (
                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-1">Trading Partner</h5>
                                        <div className="flex items-center gap-2">
                                            <Avatar avatar={selectedTransaction.tradingPartner.avatar} className="w-8 h-8 text-lg rounded-md" />
                                            <span className="text-[var(--text-secondary)]">{selectedTransaction.tradingPartner.name}</span>
                                        </div>
                                    </div>
                                )}

                                {selectedTransaction.details && (
                                    <div>
                                        <h5 className="font-medium text-[var(--text-primary)] mb-1">Additional Details</h5>
                                        <p className="text-sm text-[var(--text-secondary)]">{selectedTransaction.details}</p>
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setSelectedTransaction(null)}
                                        className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TransactionHistory;
