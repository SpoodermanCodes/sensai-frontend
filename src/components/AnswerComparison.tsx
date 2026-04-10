import React from 'react';
import { ScorecardItem } from '../types/quiz';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export interface AnswerComparisonProps {
    currentScorecard: ScorecardItem[];
    previousScorecard: ScorecardItem[];
    currentAnswer: string;
    previousAnswer: string;
}

const AnswerComparison: React.FC<AnswerComparisonProps> = ({
    currentScorecard,
    previousScorecard,
    currentAnswer,
    previousAnswer,
}) => {
    // Calculate overall scores
    const currentTotal = currentScorecard.reduce((sum, item) => sum + item.score, 0);
    const currentMax = currentScorecard.reduce((sum, item) => sum + item.max_score, 0);
    const previousTotal = previousScorecard.reduce((sum, item) => sum + item.score, 0);
    const previousMax = previousScorecard.reduce((sum, item) => sum + item.max_score, 0);

    const currentPercentage = Math.round((currentTotal / currentMax) * 100);
    const previousPercentage = Math.round((previousTotal / previousMax) * 100);
    const percentageChange = currentPercentage - previousPercentage;

    // Get trend icon
    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-5 h-5 text-emerald-500" />;
        if (change < 0) return <TrendingDown className="w-5 h-5 text-rose-500" />;
        return <Minus className="w-5 h-5 text-gray-400" />;
    };

    // Get trend color
    const getTrendColor = (change: number) => {
        if (change > 0) return 'text-emerald-600 dark:text-emerald-400';
        if (change < 0) return 'text-rose-600 dark:text-rose-400';
        return 'text-gray-600 dark:text-gray-400';
    };

    return (
        <div className="space-y-6">
            {/* Overall Progress Card */}
            <div className="rounded-xl p-5 shadow-sm bg-white border border-gray-200 dark:bg-zinc-900 dark:border-transparent">
                <h3 className="text-lg font-light mb-4 text-slate-900 dark:text-white">Progress Overview</h3>
                
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div>
                            <div className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Previous</div>
                            <div className="text-2xl font-light text-gray-500 dark:text-zinc-500">{previousPercentage}%</div>
                        </div>
                        <div className="flex items-center space-x-2">
                            {getTrendIcon(percentageChange)}
                            <span className={`text-sm font-medium ${getTrendColor(percentageChange)}`}>
                                {percentageChange > 0 ? '+' : ''}{percentageChange}%
                            </span>
                        </div>
                        <div>
                            <div className="text-xs text-gray-600 dark:text-zinc-400 mb-1">Current</div>
                            <div className="text-2xl font-light text-slate-900 dark:text-white">{currentPercentage}%</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Criterion-wise Comparison */}
            <div className="rounded-xl p-5 shadow-sm bg-white border border-gray-200 dark:bg-zinc-900 dark:border-transparent">
                <h3 className="text-lg font-light mb-4 text-slate-900 dark:text-white">Criterion-wise Changes</h3>
                
                <div className="space-y-3">
                    {currentScorecard.map((currentItem, index) => {
                        const previousItem = previousScorecard[index];
                        if (!previousItem) return null;

                        const scoreChange = currentItem.score - previousItem.score;
                        const currentPercent = Math.round((currentItem.score / currentItem.max_score) * 100);
                        const previousPercent = Math.round((previousItem.score / previousItem.max_score) * 100);

                        return (
                            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                                <div className="flex items-center space-x-3 flex-1">
                                    <span className="text-sm font-medium text-slate-900 dark:text-white">
                                        {currentItem.category}
                                    </span>
                                </div>
                                
                                <div className="flex items-center space-x-4">
                                    <div className="text-xs text-gray-500 dark:text-zinc-400">
                                        {previousItem.score}/{previousItem.max_score}
                                    </div>
                                    
                                    <div className="flex items-center space-x-1">
                                        {scoreChange > 0 ? (
                                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                                        ) : scoreChange < 0 ? (
                                            <TrendingDown className="w-4 h-4 text-rose-500" />
                                        ) : (
                                            <Minus className="w-4 h-4 text-gray-400" />
                                        )}
                                        <span className={`text-xs font-medium ${getTrendColor(scoreChange)}`}>
                                            {scoreChange > 0 ? '+' : ''}{scoreChange}
                                        </span>
                                    </div>
                                    
                                    <div className="text-xs font-medium text-slate-900 dark:text-white">
                                        {currentItem.score}/{currentItem.max_score}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Answer Comparison */}
            <div className="rounded-xl p-5 shadow-sm bg-white border border-gray-200 dark:bg-zinc-900 dark:border-transparent">
                <h3 className="text-lg font-light mb-4 text-slate-900 dark:text-white">Answer Comparison</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Previous Answer */}
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-zinc-400">Previous Answer</div>
                        <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 dark:bg-zinc-800/50 dark:border-zinc-700">
                            <pre className="text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-zinc-300 font-sans">
                                {previousAnswer}
                            </pre>
                        </div>
                    </div>
                    
                    {/* Current Answer */}
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-zinc-400">Current Answer</div>
                        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/30">
                            <pre className="text-xs whitespace-pre-wrap break-words text-gray-700 dark:text-zinc-300 font-sans">
                                {currentAnswer}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnswerComparison;
