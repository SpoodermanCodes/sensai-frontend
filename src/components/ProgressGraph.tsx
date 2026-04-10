import React from 'react';
import { ScorecardItem } from '../types/quiz';
import { TrendingUp, Award, Target } from 'lucide-react';

export interface AttemptData {
    attemptNumber: number;
    timestamp: Date;
    scorecard: ScorecardItem[];
    overallScore: number;
    overallPercentage: number;
}

export interface ProgressGraphProps {
    attempts: AttemptData[];
    onClose: () => void;
}

const ProgressGraph: React.FC<ProgressGraphProps> = ({ attempts, onClose }) => {
    if (!attempts || attempts.length === 0) {
        return null;
    }

    // Calculate dimensions for the graph
    const graphWidth = 600;
    const graphHeight = 300;
    const padding = { top: 40, right: 40, bottom: 60, left: 60 };
    const innerWidth = graphWidth - padding.left - padding.right;
    const innerHeight = graphHeight - padding.top - padding.bottom;

    // Get min and max percentages for scaling
    const percentages = attempts.map(a => a.overallPercentage);
    const minPercentage = Math.max(0, Math.min(...percentages) - 10);
    const maxPercentage = Math.min(100, Math.max(...percentages) + 10);

    // Scale functions
    const xScale = (index: number) => padding.left + (index / (attempts.length - 1)) * innerWidth;
    const yScale = (percentage: number) => 
        padding.top + innerHeight - ((percentage - minPercentage) / (maxPercentage - minPercentage)) * innerHeight;

    // Generate path for the line
    const linePath = attempts
        .map((attempt, index) => {
            const x = xScale(index);
            const y = yScale(attempt.overallPercentage);
            return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
        })
        .join(' ');

    // Generate area path (for gradient fill)
    const areaPath = `${linePath} L ${xScale(attempts.length - 1)} ${padding.top + innerHeight} L ${padding.left} ${padding.top + innerHeight} Z`;

    // Calculate improvement metrics
    const firstAttempt = attempts[0];
    const lastAttempt = attempts[attempts.length - 1];
    const totalImprovement = lastAttempt.overallPercentage - firstAttempt.overallPercentage;
    const bestScore = Math.max(...percentages);
    const averageScore = percentages.reduce((sum, p) => sum + p, 0) / percentages.length;

    // Get criterion-wise progress for the last attempt
    const criterionProgress = lastAttempt.scorecard.map((criterion, index) => {
        const firstScore = firstAttempt.scorecard[index]?.score || 0;
        const lastScore = criterion.score;
        const improvement = lastScore - firstScore;
        return {
            category: criterion.category,
            improvement,
            currentScore: lastScore,
            maxScore: criterion.max_score,
        };
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
                {/* Header */}
                <div className="sticky top-0 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-6 flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-light text-slate-900 dark:text-white">Progress Timeline</h2>
                        <p className="text-sm text-gray-600 dark:text-zinc-400 mt-1">
                            Tracking your learning journey across {attempts.length} attempt{attempts.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6 text-gray-600 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="rounded-xl p-4 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-900/10 border border-emerald-200 dark:border-emerald-900/30">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-emerald-500/20">
                                    <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-emerald-700 dark:text-emerald-300">Total Improvement</div>
                                    <div className="text-xl font-semibold text-emerald-900 dark:text-emerald-100">
                                        {totalImprovement > 0 ? '+' : ''}{totalImprovement.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-blue-500/20">
                                    <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-blue-700 dark:text-blue-300">Best Score</div>
                                    <div className="text-xl font-semibold text-blue-900 dark:text-blue-100">
                                        {bestScore.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="rounded-xl p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/10 border border-purple-200 dark:border-purple-900/30">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 rounded-lg bg-purple-500/20">
                                    <Target className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <div className="text-xs text-purple-700 dark:text-purple-300">Average Score</div>
                                    <div className="text-xl font-semibold text-purple-900 dark:text-purple-100">
                                        {averageScore.toFixed(1)}%
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Graph */}
                    <div className="rounded-xl p-6 bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-light mb-4 text-slate-900 dark:text-white">Score Progression</h3>
                        <div className="flex justify-center">
                            <svg width={graphWidth} height={graphHeight} className="overflow-visible">
                                {/* Grid lines */}
                                {[0, 25, 50, 75, 100].map(percentage => {
                                    if (percentage < minPercentage || percentage > maxPercentage) return null;
                                    const y = yScale(percentage);
                                    return (
                                        <g key={percentage}>
                                            <line
                                                x1={padding.left}
                                                y1={y}
                                                x2={padding.left + innerWidth}
                                                y2={y}
                                                stroke="currentColor"
                                                strokeWidth="1"
                                                strokeDasharray="4 4"
                                                className="text-gray-200 dark:text-zinc-700"
                                            />
                                            <text
                                                x={padding.left - 10}
                                                y={y + 4}
                                                textAnchor="end"
                                                className="text-xs fill-gray-600 dark:fill-zinc-400"
                                            >
                                                {percentage}%
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Area gradient */}
                                <defs>
                                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="rgb(147, 51, 234)" stopOpacity="0.3" />
                                        <stop offset="100%" stopColor="rgb(147, 51, 234)" stopOpacity="0.05" />
                                    </linearGradient>
                                </defs>

                                {/* Area fill */}
                                <path
                                    d={areaPath}
                                    fill="url(#areaGradient)"
                                />

                                {/* Line */}
                                <path
                                    d={linePath}
                                    fill="none"
                                    stroke="rgb(147, 51, 234)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />

                                {/* Data points */}
                                {attempts.map((attempt, index) => {
                                    const x = xScale(index);
                                    const y = yScale(attempt.overallPercentage);
                                    return (
                                        <g key={index}>
                                            <circle
                                                cx={x}
                                                cy={y}
                                                r="6"
                                                fill="white"
                                                stroke="rgb(147, 51, 234)"
                                                strokeWidth="3"
                                                className="cursor-pointer hover:r-8 transition-all"
                                            />
                                            <text
                                                x={x}
                                                y={padding.top + innerHeight + 20}
                                                textAnchor="middle"
                                                className="text-xs fill-gray-600 dark:fill-zinc-400"
                                            >
                                                #{index + 1}
                                            </text>
                                            <text
                                                x={x}
                                                y={y - 15}
                                                textAnchor="middle"
                                                className="text-xs font-semibold fill-purple-600 dark:fill-purple-400"
                                            >
                                                {attempt.overallPercentage.toFixed(0)}%
                                            </text>
                                        </g>
                                    );
                                })}

                                {/* Axes */}
                                <line
                                    x1={padding.left}
                                    y1={padding.top + innerHeight}
                                    x2={padding.left + innerWidth}
                                    y2={padding.top + innerHeight}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-gray-300 dark:text-zinc-700"
                                />
                                <line
                                    x1={padding.left}
                                    y1={padding.top}
                                    x2={padding.left}
                                    y2={padding.top + innerHeight}
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    className="text-gray-300 dark:text-zinc-700"
                                />

                                {/* Axis labels */}
                                <text
                                    x={padding.left + innerWidth / 2}
                                    y={graphHeight - 10}
                                    textAnchor="middle"
                                    className="text-sm fill-gray-600 dark:fill-zinc-400"
                                >
                                    Attempt Number
                                </text>
                                <text
                                    x={20}
                                    y={padding.top + innerHeight / 2}
                                    textAnchor="middle"
                                    transform={`rotate(-90, 20, ${padding.top + innerHeight / 2})`}
                                    className="text-sm fill-gray-600 dark:fill-zinc-400"
                                >
                                    Score (%)
                                </text>
                            </svg>
                        </div>
                    </div>

                    {/* Criterion-wise Progress */}
                    <div className="rounded-xl p-6 bg-white dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700">
                        <h3 className="text-lg font-light mb-4 text-slate-900 dark:text-white">Criterion Progress</h3>
                        <div className="space-y-3">
                            {criterionProgress.map((criterion, index) => {
                                const percentage = (criterion.currentScore / criterion.maxScore) * 100;
                                return (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3 flex-1">
                                            <span className="text-sm text-slate-900 dark:text-white">
                                                {criterion.category}
                                            </span>
                                            {criterion.improvement !== 0 && (
                                                <span className={`text-xs font-medium ${
                                                    criterion.improvement > 0 
                                                        ? 'text-emerald-600 dark:text-emerald-400' 
                                                        : 'text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {criterion.improvement > 0 ? '+' : ''}{criterion.improvement}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-32 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-zinc-700">
                                                <div
                                                    className={`h-full rounded-full ${
                                                        percentage >= 80 ? 'bg-emerald-500' :
                                                        percentage >= 60 ? 'bg-blue-500' :
                                                        percentage >= 40 ? 'bg-amber-500' : 'bg-rose-500'
                                                    }`}
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                            <span className="text-xs w-12 text-right text-slate-900 dark:text-white">
                                                {criterion.currentScore}/{criterion.maxScore}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProgressGraph;
