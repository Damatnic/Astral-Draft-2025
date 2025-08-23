
import React from 'react';

interface StorySectionProps {
    title: string;
    children: React.ReactNode;
}

const StorySection: React.FC<StorySectionProps> = ({ title, children }) => {
    return (
        <section>
            <h2 className="font-display text-2xl font-bold mb-4 border-b-2 border-cyan-400/30 pb-2">
                {title}
            </h2>
            {children}
        </section>
    );
};

export default StorySection;
