import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Code } from 'lucide-react';
import { AlternateSolution } from '../types/quiz';

interface AlternateSolutionsProps {
    solutions: AlternateSolution[];
}

const AlternateSolutions: React.FC<AlternateSolutionsProps> = ({ solutions }) => {
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    if (!solutions || solutions.length === 0) {
        return null;
    }

    return (
        <div className="mt-8">
            <h3 className="text-lg font-light mb-4 px-1 text-slate-900 dark:text-white flex items-center">
                <Code size={20} className="mr-2" />
                Alternate Solutions
            </h3>
            <div className="space-y-4">
                {solutions.map((solution, index) => (
                    <div
                        key={index}
                        className="border rounded-lg overflow-hidden bg-white dark:bg-[#1A1A1A] border-gray-200 dark:border-[#222222]"
                    >
                        <button
                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                            className="w-full px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-[#222222] transition-colors"
                        >
                            <div className="flex items-center">
                                <span className="font-medium text-slate-900 dark:text-white">
                                    {solution.approach}
                                </span>
                            </div>
                            {expandedIndex === index ? (
                                <ChevronUp size={20} className="text-gray-500 dark:text-gray-400" />
                            ) : (
                                <ChevronDown size={20} className="text-gray-500 dark:text-gray-400" />
                            )}
                        </button>
                        
                        {expandedIndex === index && (
                            <div className="px-4 pb-4 border-t border-gray-200 dark:border-[#222222]">
                                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 mt-3">
                                    {solution.explanation}
                                </p>
                                <pre className="bg-gray-50 dark:bg-[#111111] p-4 rounded-lg overflow-x-auto text-sm">
                                    <code className="text-gray-900 dark:text-gray-100">{solution.code}</code>
                                </pre>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AlternateSolutions;
