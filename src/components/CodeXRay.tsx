import React, { useState } from 'react';
import { CodeAnnotation } from '../types/quiz';

interface CodeXRayProps {
    code: string;
    annotations: CodeAnnotation[];
    language?: string;
}

const TYPE_STYLES: Record<string, { bg: string; border: string; dot: string; label: string }> = {
    issue: {
        bg: 'bg-red-50 dark:bg-red-950/30',
        border: 'border-red-300 dark:border-red-800',
        dot: 'bg-red-500',
        label: 'Issue',
    },
    suggestion: {
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        border: 'border-blue-300 dark:border-blue-800',
        dot: 'bg-blue-500',
        label: 'Suggestion',
    },
    explanation: {
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        border: 'border-emerald-300 dark:border-emerald-800',
        dot: 'bg-emerald-500',
        label: 'Note',
    },
};

const LINE_HIGHLIGHT: Record<string, string> = {
    issue: 'bg-red-100/60 dark:bg-red-900/20',
    suggestion: 'bg-blue-100/60 dark:bg-blue-900/20',
    explanation: 'bg-emerald-100/60 dark:bg-emerald-900/20',
};

const CodeXRay: React.FC<CodeXRayProps> = ({ code, annotations, language }) => {
    const [expandedLines, setExpandedLines] = useState<Set<number>>(new Set());

    const lines = code.split('\n');
    const annotationsByLine = annotations.reduce<Record<number, CodeAnnotation>>((acc, a) => {
        acc[a.line] = a;
        return acc;
    }, {});

    const toggleLine = (lineNum: number) => {
        setExpandedLines(prev => {
            const next = new Set(prev);
            next.has(lineNum) ? next.delete(lineNum) : next.add(lineNum);
            return next;
        });
    };

    return (
        <div className="w-full rounded-lg overflow-hidden border border-gray-200 dark:border-[#35363a] text-xs font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2D] text-gray-600 dark:text-gray-300">
                <span>{language || 'code'}</span>
                <span className="text-[10px] font-sans text-gray-400 dark:text-gray-500">
                    🔬 Code X-Ray · {annotations.length} annotation{annotations.length !== 1 ? 's' : ''}
                </span>
            </div>

            {/* Code lines */}
            <div className="bg-gray-50 dark:bg-[#1D1D1D]">
                {lines.map((line, idx) => {
                    const lineNum = idx + 1;
                    const annotation = annotationsByLine[lineNum];
                    const isExpanded = expandedLines.has(lineNum);
                    const styles = annotation ? TYPE_STYLES[annotation.type] ?? TYPE_STYLES.explanation : null;

                    return (
                        <div key={lineNum}>
                            {/* Code line row */}
                            <div
                                className={`flex items-start group ${annotation ? `${LINE_HIGHLIGHT[annotation.type]} cursor-pointer` : ''}`}
                                onClick={annotation ? () => toggleLine(lineNum) : undefined}
                            >
                                {/* Line number */}
                                <span className="select-none w-8 shrink-0 text-right pr-3 py-1 text-gray-400 dark:text-gray-600">
                                    {lineNum}
                                </span>

                                {/* Code content */}
                                <pre className="flex-1 py-1 pr-3 overflow-x-auto text-gray-800 dark:text-gray-200 whitespace-pre">
                                    {line || ' '}
                                </pre>

                                {/* Annotation indicator */}
                                {annotation && styles && (
                                    <div className="shrink-0 flex items-center gap-1 py-1 pr-2">
                                        <span className={`w-2 h-2 rounded-full ${styles.dot}`} />
                                        <span className={`text-[10px] font-sans ${isExpanded ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'} text-gray-500 dark:text-gray-400`}>
                                            {styles.label}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Expanded annotation panel */}
                            {annotation && styles && isExpanded && (
                                <div className={`mx-2 mb-1 rounded border ${styles.bg} ${styles.border} px-3 py-2 font-sans`}>
                                    <p className="text-gray-800 dark:text-gray-200 leading-snug">{annotation.comment}</p>
                                    {annotation.hint && (
                                        <p className="mt-1.5 text-gray-500 dark:text-gray-400 italic">
                                            💭 {annotation.hint}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 px-3 py-1.5 bg-gray-100 dark:bg-[#2D2D2D] font-sans">
                {Object.entries(TYPE_STYLES).map(([type, s]) => (
                    <span key={type} className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
                        <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                        {s.label}
                    </span>
                ))}
                <span className="text-[10px] text-gray-400 dark:text-gray-500 ml-auto">Click a highlighted line to expand</span>
            </div>
        </div>
    );
};

export default CodeXRay;
