
import React from 'react';
import { motion } from 'framer-motion';
import type { IntegrityTask, IntegrityTaskStatus } from '../../types';
import Modal from '../ui/Modal';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

interface ChecklistReportModalProps {
    tasks: IntegrityTask[];
    onClose: () => void;
}

const StatusIcon = ({ status }: { status: IntegrityTaskStatus }) => {
    switch (status) {
        case 'passed': return <CheckCircleIcon className="h-5 w-5 text-green-400 flex-shrink-0" />;
        case 'failed': return <XCircleIcon className="h-5 w-5 text-red-400 flex-shrink-0" />;
        case 'skipped': return <span className="h-5 w-5 text-gray-500 flex-shrink-0">-</span>;
        case 'pending':
        default:
            return <div className="w-4 h-4 border-2 border-gray-500 rounded-full flex-shrink-0 self-center"></div>;
    }
};

const ChecklistReportModal: React.FC<ChecklistReportModalProps> = ({ tasks, onClose }) => {
    
    const groupedTasks = React.useMemo(() => {
        return tasks.reduce<Record<string, IntegrityTask[]>>((acc, task) => {
            if (!acc[task.category]) {
                acc[task.category] = [];
            }
            acc[task.category].push(task);
            return acc;
        }, {});
    }, [tasks]);
    
    const categories = Object.keys(groupedTasks);

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col"
                onClick={e => e.stopPropagation()}
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display">Project Integrity Checklist Status</h2>
                </header>
                <main className="flex-grow p-4 overflow-y-auto">
                    <div className="space-y-4">
                        {categories.map((category: any) => (
                            <div key={category}>
                                <h3 className="font-bold text-cyan-300 mb-2">{category}</h3>
                                <div className="space-y-2">
                                    {groupedTasks[category].map((task: any) => (
                                        <div key={task.id} className="flex items-start gap-3 text-sm p-2 bg-black/10 rounded-md">
                                            <StatusIcon status={task?.status} />
                                            <span className={`${task?.status === 'pending' ? 'text-gray-400' : ''}`}>{task.text}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
                <footer className="p-4 border-t border-[var(--panel-border)] text-center">
                    <button onClick={onClose} className="px-6 py-2 bg-cyan-500 text-black font-bold text-sm rounded-md">
                        Close
                    </button>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default ChecklistReportModal;
