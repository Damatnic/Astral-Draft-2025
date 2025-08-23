




import React from 'react';
import { motion, Reorder } from 'framer-motion';
import Modal from '../ui/Modal';
import { useAppState } from '../../contexts/AppContext';
import { LayoutIcon } from '../icons/LayoutIcon';
import { DragHandleIcon } from '../icons/DragHandleIcon';

interface CustomizeDashboardModalProps {
    onClose: () => void;
}

const widgetLabels: { [key: string]: string } = {
    whatsNext: "What's Next",
    leagues: 'My Leagues',
    mockDrafts: 'Mock Drafts',
    watchlist: 'My Watchlist',
    power: 'Power Balance',
    news: 'News Ticker',
    assistant: 'AI Assistant',
};

const CustomizeDashboardModal: React.FC<CustomizeDashboardModalProps> = ({ onClose }) => {
    const { state, dispatch } = useAppState();
    const [layout, setLayout] = React.useState(state.dashboardLayout);

    const handleSave = () => {
        dispatch({ type: 'UPDATE_DASHBOARD_LAYOUT', payload: layout });
        dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Dashboard layout updated!', type: 'SYSTEM' } });
        onClose();
    };

    return (
        <Modal onClose={onClose}>
            <motion.div
                className="glass-pane rounded-xl shadow-2xl w-full max-w-md"
                {...{
                    initial: { opacity: 0, scale: 0.95 },
                    animate: { opacity: 1, scale: 1 },
                }}
            >
                <header className="p-4 border-b border-[var(--panel-border)]">
                    <h2 className="text-xl font-bold font-display flex items-center gap-2">
                        <LayoutIcon />
                        Customize Dashboard
                    </h2>
                </header>
                <main className="p-4">
                    <p className="text-xs text-gray-400 mb-2">Drag and drop to reorder your dashboard widgets.</p>
                    <Reorder.Group axis="y" values={layout} onReorder={setLayout} className="space-y-2">
                        {layout.map((widgetId: any) => (
                            <Reorder.Item 
                                key={widgetId} 
                                value={widgetId}
                                className="p-3 bg-black/20 rounded-lg flex items-center gap-3 cursor-grab active:cursor-grabbing"
                            >
                                <DragHandleIcon className="text-gray-500" />
                                <span className="font-semibold">{widgetLabels[widgetId] || widgetId}</span>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </main>
                <footer className="p-4 flex justify-end gap-2 border-t border-[var(--panel-border)]">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-bold bg-transparent border border-transparent hover:border-[var(--panel-border)] rounded-md">Cancel</button>
                    <button onClick={handleSave} className="px-4 py-2 text-sm font-bold bg-cyan-500 text-black rounded-md">Save Layout</button>
                </footer>
            </motion.div>
        </Modal>
    );
};

export default CustomizeDashboardModal;