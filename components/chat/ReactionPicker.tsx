
import React from 'react';

interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
}

const emojis = ['👍', '😂', '🔥', '🤔', '😢', '🤯'];

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect }) => {
  return (
    <div className="absolute -top-4 right-2 sm:right-auto sm:left-2 flex items-center gap-1 p-1 bg-gray-800/90 border border-white/10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
      {emojis.map((emoji: any) => (
        <button
          key={emoji}
          onClick={() => onSelect(emoji)}
          className="text-lg p-1 rounded-full hover:bg-white/20 transform hover:scale-125 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionPicker;
