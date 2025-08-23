
import React from 'react';
import { motion } from 'framer-motion';
import useSound from '../../hooks/useSound';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  items: TabItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ items, activeTab, onTabChange }) => {
  const playTabSound = useSound('tab', 0.1);

  const handleTabChange = (id: string) => {
    playTabSound();
    onTabChange(id);
  }

  return (
    <div className="flex space-x-1 sm:space-x-2 border-b border-transparent">
      {items.map((item: any) => (
        <button
          key={item.id}
          onClick={() => handleTabChange(item.id)}
          className={`${
            activeTab === item.id ? 'text-white' : 'text-gray-400 hover:text-white'
          } relative py-3 px-2 sm:px-4 text-sm sm:text-base font-medium transition-colors focus:outline-none`}
        >
          {item.label}
          {activeTab === item.id && (
            <motion.div
              className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-cyan-400"
              {...{
                layoutId: "underline",
                transition: { type: 'spring', stiffness: 380, damping: 30 },
              }}
            />
          )}
        </button>
      ))}
    </div>
  );
};

export default Tabs;
