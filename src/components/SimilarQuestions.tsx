import React, { useState, useEffect } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface SimilarQuestion {
    question_text: string;
    hint?: string;
}

interface SimilarQuestionsProps {
    questionId: string;
    onClose?: () => void;
}

const SimilarQuestions: React.FC<SimilarQuestionsProps> = ({ questionId, onClose }) => {
    const [questions, setQuestions] = useState<SimilarQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    useEffect(() => {
        const fetchSimilarQuestions = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/similar-questions`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ question_id: questionId }),
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch similar questions');
                }

                const data = await response.json();
                setQuestions(data.questions || []);
            } catch (err) {
                setError('Unable to generate similar questions');
                console.error('Error fetching similar questions:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSimilarQuestions();
    }, [questionId]);

    if (loading) {
        return (
            <div className="mt-6 p-6 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/40">
                <div className="flex items-center justify-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin text-purple-600 dark:text-purple-400" />
                    <span className="text-sm text-purple-800 dark:text-purple-300">Generating similar questions...</span>
                </div>
            </div>
        );
    }

    if (error || questions.length === 0) {
        return null;
    }

    return (
        <div className="mt-6 p-6 rounded-lg bg-purple-50 border border-purple-200 dark:bg-purple-900/20 dark:border-purple-800/40">
            <div className="flex items-start gap-3 mb-4">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                    <h3 className="text-base font-medium text-purple-900 dark:text-purple-200 mb-1">
                        Practice Similar Questions
                    </h3>
                    <p className="text-sm text-purple-700 dark:text-purple-300">
                        Reinforce your understanding with these related questions
                    </p>
                </div>
            </div>

            <div className="space-y-3">
                {questions.map((question, index) => (
                    <div
                        key={index}
                        className="p-4 rounded-lg bg-white border border-purple-200 dark:bg-purple-950/30 dark:border-purple-800/30"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                                <div className="flex items-start gap-2">
                                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300 text-xs font-medium flex-shrink-0">
                                        {index + 1}
                                    </span>
                                    <p className="text-sm text-gray-800 dark:text-gray-200 flex-1">
                                        {question.question_text}
                                    </p>
                                </div>

                                {question.hint && (
                                    <div className="mt-3 ml-8">
                                        <button
                                            onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                                            className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                                        >
                                            {expandedIndex === index ? (
                                                <>
                                                    <ChevronUp className="w-3 h-3" />
                                                    Hide hint
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="w-3 h-3" />
                                                    Show hint
                                                </>
                                            )}
                                        </button>

                                        {expandedIndex === index && (
                                            <div className="mt-2 p-3 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800/20">
                                                <p className="text-xs text-purple-800 dark:text-purple-300">
                                                    💡 {question.hint}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-xs text-purple-600 dark:text-purple-400 text-center">
                Think through these questions to deepen your understanding
            </div>
        </div>
    );
};

export default SimilarQuestions;
