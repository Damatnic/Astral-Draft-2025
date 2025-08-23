
import React from 'react';
import type { GroundingChunk } from '../../types';
import { LinkIcon } from '../icons/LinkIcon';

interface GroundingCitationsProps {
    chunks: GroundingChunk[];
}

const GroundingCitations: React.FC<GroundingCitationsProps> = ({ chunks }) => {
    const webChunks = chunks.filter((c: any) => c.web && c.web.uri && c.web.title);

    if (webChunks.length === 0) {
        return null;
    }

    return (
        <div className="mt-3 pt-3 border-t border-white/10">
            <h4 className="text-xs font-bold text-gray-400 mb-2">Sources:</h4>
            <div className="flex flex-wrap gap-2">
                {webChunks.map((chunk, index) => (
                    <a
                        key={index}
                        href={chunk.web!.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-black/20 hover:bg-black/40 text-cyan-300 px-2 py-1 rounded-full text-xs transition-colors"
                    >
                        <LinkIcon className="h-3 w-3" />
                        <span className="truncate max-w-xs">{chunk.web!.title}</span>
                    </a>
                ))}
            </div>
        </div>
    );
};

export default GroundingCitations;
