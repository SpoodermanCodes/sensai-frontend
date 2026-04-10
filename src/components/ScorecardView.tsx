import React, { useState } from 'react';
import { ChevronLeft, ChevronDown, ChevronUp, TrendingUp } from 'lucide-react';
import { ChatMessage, ScorecardItem } from '../types/quiz';
import LearnerScorecard from './LearnerScorecard';
import AnswerComparison from './AnswerComparison';
import ProgressGraph, { AttemptData } from './ProgressGraph';
import AlternateSolutions from './AlternateSolutions';

interface ScorecardViewProps {
    activeScorecard: ScorecardItem[];
    handleBackToChat: () => void;
    handleTryAgain?: () => void;
    lastUserMessage: ChatMessage | null;
    allAttempts?: AttemptData[];
    previousAnswerText?: string;
    currentQuestionId?: string;
    alternateSolutions?: any[];
}

const ScorecardView: React.FC<ScorecardViewProps> = ({
    activeScorecard,
    handleBackToChat,
    handleTryAgain,
    lastUserMessage,
    allAttempts,
    previousAnswerText,
    currentQuestionId,
    alternateSolutions,
}) => {
    const [isTextExpanded, setIsTextExpanded] = useState(false);
    const [showProgressGraph, setShowProgressGraph] = useState(false);

    const toggleTextExpansion = () => {
        setIsTextExpanded(!isTextExpanded);
    };
    
    // Check if we have multiple attempts for comparison (need at least 3 total for graph)
    const hasMultipleAttempts = allAttempts && allAttempts.length >= 3;
    
    // Check if we have at least 2 attempts for comparison (need at least 2 total)
    const hasComparisonAttempts = allAttempts && allAttempts.length >= 2;
    
    // Get previous attempt data (second to last)
    const previousAttempt = hasComparisonAttempts ? allAttempts[allAttempts.length - 2] : null;
    
    // Show comparison when we have 2 or more attempts (1+ previous attempts)
    const showComparison = allAttempts && allAttempts.length > 1;
    

    return (
        <div className="flex flex-col h-full px-6 py-6 overflow-auto relative">
            <button
                onClick={handleBackToChat}
                className="inline-flex cursor-pointer justify-center items-center rounded-full w-10 h-10 focus:outline-none mb-4 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-[#1D1D1D] dark:text-white dark:hover:bg-[#2A2A2A]"
            >
                <ChevronLeft size={24} />
            </button>

            <div className="overflow-y-auto hide-scrollbar h-full pt-2">
                <div className="flex flex-col mb-6">
                    <div className="text-center">
                        {lastUserMessage ? (
                            lastUserMessage.messageType === 'audio' && lastUserMessage.audioData ? (
                                <div className="flex flex-col items-center">
                                    <audio
                                        controls
                                        className="w-full sm:w-3/4 mt-2"
                                        src={`data:audio/wav;base64,${lastUserMessage.audioData}`}
                                    />
                                </div>
                            ) : (
                                <div className="relative">
                                    <div className="max-w-lg mx-auto">
                                        <p className={`text-sm text-left ${!isTextExpanded ? 'line-clamp-2' : ''} text-gray-700 dark:text-gray-300`}>
                                            {lastUserMessage.content}
                                        </p>
                                        {lastUserMessage.content && lastUserMessage.content.length > 80 && (
                                            <button
                                                onClick={toggleTextExpansion}
                                                className="mt-4 px-3 py-1.5 text-sm rounded-full transition-colors flex items-center cursor-pointer mx-auto bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-[#222222] dark:text-white dark:hover:bg-[#333333]"
                                            >
                                                {isTextExpanded ? (
                                                    <>
                                                        <ChevronUp size={14} className="mr-1" />
                                                        View less
                                                    </>
                                                ) : (
                                                    <>
                                                        <ChevronDown size={14} className="mr-1" />
                                                        View more
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        ) : (
                            <h2 className="text-xl font-light text-slate-900 dark:text-white">Detailed Report</h2>
                        )}
                    </div>
                </div>

                {/* Progress Graph Button */}
                {hasMultipleAttempts && (
                    <div className="mb-4 flex justify-center">
                        <button
                            onClick={() => setShowProgressGraph(true)}
                            className="flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                            type="button"
                        >
                            <TrendingUp size={16} />
                            <span>View Progress Graph</span>
                        </button>
                    </div>
                )}

                {/* Always show the regular scorecard */}
                <LearnerScorecard scorecard={activeScorecard} className="mt-0" />
                
                {/* Show comparison below the regular scorecard if we have previous attempt */}
                {showComparison && previousAttempt && (
                    <div className="mt-8">
                        <h3 className="text-lg font-light mb-4 px-1 text-slate-900 dark:text-white">Comparison with Previous Attempt</h3>
                        <AnswerComparison
                            currentScorecard={activeScorecard}
                            previousScorecard={previousAttempt.scorecard}
                            currentAnswer={lastUserMessage?.content || ''}
                            previousAnswer={previousAnswerText || ''}
                        />
                    </div>
                )}
                
                {/* Alternate Solutions Section (for coding questions) */}
                {alternateSolutions && alternateSolutions.length > 0 && (
                    <AlternateSolutions solutions={alternateSolutions} />
                )}
                
                {/* Try Again Button */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleTryAgain || handleBackToChat}
                        className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white dark:bg-purple-700 dark:hover:bg-purple-800 px-6 py-3 rounded-full text-sm font-medium transition-colors cursor-pointer shadow-sm"
                        type="button"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>Try Again</span>
                    </button>
                </div>
            </div>
            
            {/* Progress Graph Modal */}
            {showProgressGraph && hasMultipleAttempts && (
                <ProgressGraph
                    attempts={allAttempts!}
                    onClose={() => setShowProgressGraph(false)}
                />
            )}
        </div>
    );
};

export default ScorecardView; 