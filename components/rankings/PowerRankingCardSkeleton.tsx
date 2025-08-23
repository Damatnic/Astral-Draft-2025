
import React from 'react';
import SkeletonLoader from '../SkeletonLoader';

const PowerRankingCardSkeleton: React.FC = () => {
    return (
        <div className="p-4 bg-white/5 rounded-lg flex gap-4">
            <div className="flex flex-col items-center flex-shrink-0">
                <SkeletonLoader className="w-10 h-10 mb-2" />
                <SkeletonLoader className="w-6 h-4" />
            </div>
            <div className="flex-grow">
                <div className="flex items-center gap-2">
                    <SkeletonLoader className="w-10 h-10 rounded-lg" />
                    <div className="w-full">
                        <SkeletonLoader className="h-4 w-3/4 mb-2" />
                        <SkeletonLoader className="h-3 w-1/2" />
                    </div>
                </div>
                <div className="mt-3 space-y-1">
                    <SkeletonLoader className="h-3 w-full" />
                    <SkeletonLoader className="h-3 w-5/6" />
                </div>
            </div>
        </div>
    );
};

export default PowerRankingCardSkeleton;
