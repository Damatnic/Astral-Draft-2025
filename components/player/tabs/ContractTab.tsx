
import React from 'react';
import { motion } from 'framer-motion';
import type { Player } from '../../../types';
import { ContractIcon } from '../../icons/ContractIcon';

interface ContractTabProps {
    player: Player;
}

const StatCard: React.FC<{ label: string; value: string | number }> = ({ label, value }) => (
    <div className="bg-white/5 p-4 rounded-lg text-center flex-1">
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
    </div>
);

const ContractTab: React.FC<ContractTabProps> = ({ player }) => {
    const { contract } = player;

    if (!contract) {
        return <p className="text-gray-500 text-center py-8">No contract information available for this player.</p>
    }

    return (
        <motion.div
            className="space-y-6"
            {...{
                initial: { opacity: 0, x: -10 },
                animate: { opacity: 1, x: 0 },
                transition: { duration: 0.3 },
            }}
        >
            <div>
                <h3 className="font-bold text-lg text-cyan-300 mb-2 flex items-center gap-2">
                    <ContractIcon /> Contract Details
                </h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <StatCard label="Years" value={contract.years} />
                    <StatCard label="Total Value" value={contract.amount} />
                    <StatCard label="Guaranteed" value={contract.guaranteed} />
                </div>
            </div>
            <p className="text-xs text-gray-500 text-center">
                Contract data is for informational purposes and may not reflect the most recent signings or restructures.
            </p>
        </motion.div>
    );
};

export default ContractTab;