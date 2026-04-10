'use client';

import { useState, useRef, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, Upload, File, Sparkles, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

export interface GeneratedQuestion {
    question_type: 'objective' | 'coding' | 'assignment';
    title: string;
    question_text: string;
    difficulty: 'easy' | 'medium' | 'hard';
    correct_answer?: string;
    common_wrong_answers?: { answer: string; error_type: string; concept_score: number }[];
    reference_solution?: string;
    test_cases?: { input: string; expected_output: string; description: string }[];
    coding_language?: string;
    rubric?: { name: string; description: string; min_score: number; max_score: number; pass_score: number; strong_response: string; weak_response: string }[];
}

export interface AssessmentGenerationResult {
    inferred_question_type: string;
    rationale: string;
    questions: GeneratedQuestion[];
}

interface GenerateAssessmentDialogProps {
    open: boolean;
    onClose: () => void;
    onUseQuestion: (question: GeneratedQuestion) => void;
}

const DIFFICULTY_COLORS = {
    easy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    hard: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

const ERROR_TYPE_LABELS: Record<string, string> = {
    terminology_confusion: '🔤 Terminology confusion',
    adjacent_concept: '🔀 Adjacent concept',
    completely_wrong: '❌ Different concept',
    format_error: '📐 Format error',
};

export default function GenerateAssessmentDialog({ open, onClose, onUseQuestion }: GenerateAssessmentDialogProps) {
    const [step, setStep] = useState<'upload' | 'options' | 'results'>('upload');
    const [materialText, setMaterialText] = useState('');
    const [fileName, setFileName] = useState('');
    const [questionType, setQuestionType] = useState<string>('');
    const [numQuestions, setNumQuestions] = useState(3);
    const [additionalInstructions, setAdditionalInstructions] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [result, setResult] = useState<AssessmentGenerationResult | null>(null);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<number>>(new Set([0]));
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setStep('upload');
        setMaterialText('');
        setFileName('');
        setQuestionType('');
        setNumQuestions(3);
        setAdditionalInstructions('');
        setResult(null);
        setError(null);
        setExpandedQuestions(new Set([0]));
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const text = await file.text();
        setMaterialText(text);
    };

    const handleGenerate = async () => {
        if (!materialText.trim()) return;
        setIsGenerating(true);
        setError(null);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/generate-assessment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference_material: materialText,
                    question_type: questionType || null,
                    num_questions: numQuestions,
                    additional_instructions: additionalInstructions || null,
                }),
            });
            if (!res.ok) throw new Error('Generation failed');
            const data: AssessmentGenerationResult = await res.json();
            setResult(data);
            setStep('results');
        } catch {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const toggleExpand = (i: number) => {
        setExpandedQuestions(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    return (
        <Transition appear show={open} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={() => { reset(); onClose(); }}>
                <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-150" leaveFrom="opacity-100" leaveTo="opacity-0">
                    <div className="fixed inset-0 bg-black/60" />
                </Transition.Child>
                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child as={Fragment} enter="ease-out duration-200" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-150" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                            <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white dark:bg-[#1A1A1A] shadow-xl overflow-hidden">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#2D2D2D]">
                                    <div className="flex items-center gap-2">
                                        <Sparkles size={18} className="text-purple-600 dark:text-purple-400" />
                                        <Dialog.Title className="text-base font-medium text-gray-900 dark:text-white">
                                            Generate Assessment from Material
                                        </Dialog.Title>
                                    </div>
                                    <button onClick={() => { reset(); onClose(); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white cursor-pointer">
                                        <X size={18} />
                                    </button>
                                </div>

                                <div className="p-6 max-h-[70vh] overflow-y-auto">
                                    {step === 'upload' && (
                                        <div className="space-y-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Paste your material or upload a text file. The AI will infer the best question type and generate a complete assessment package.
                                            </p>
                                            <textarea
                                                className="w-full h-40 px-4 py-3 text-sm rounded-lg border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                placeholder="Paste your lecture notes, tutorial, case study, or any reference material here..."
                                                value={materialText}
                                                onChange={e => setMaterialText(e.target.value)}
                                            />
                                            <div className="flex items-center gap-3">
                                                <span className="text-xs text-gray-400">or</span>
                                                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".txt,.md,.py,.js,.ts,.html,.css,.json,.csv" className="hidden" />
                                                <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-2 px-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] cursor-pointer transition-colors">
                                                    <Upload size={14} />
                                                    Upload file
                                                </button>
                                                {fileName && (
                                                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                                        <File size={12} /> {fileName}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {step === 'options' && (
                                        <div className="space-y-5">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Question type</label>
                                                <div className="flex gap-2 flex-wrap">
                                                    {[
                                                        { value: '', label: 'Auto-detect' },
                                                        { value: 'objective', label: 'Short-answer' },
                                                        { value: 'coding', label: 'Coding' },
                                                        { value: 'assignment', label: 'Text assignment' },
                                                    ].map(opt => (
                                                        <button
                                                            key={opt.value}
                                                            onClick={() => setQuestionType(opt.value)}
                                                            className={`px-3 py-1.5 text-sm rounded-full border cursor-pointer transition-colors ${questionType === opt.value ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]'}`}
                                                        >
                                                            {opt.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Number of questions</label>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3, 5].map(n => (
                                                        <button key={n} onClick={() => setNumQuestions(n)} className={`w-10 h-10 text-sm rounded-lg border cursor-pointer transition-colors ${numQuestions === n ? 'bg-purple-600 text-white border-purple-600' : 'border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222]'}`}>{n}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional instructions <span className="text-gray-400 font-normal">(optional)</span></label>
                                                <textarea
                                                    className="w-full h-20 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-[#333] bg-gray-50 dark:bg-[#111] text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                    placeholder="e.g. Focus on practical application, avoid theory-only questions..."
                                                    value={additionalInstructions}
                                                    onChange={e => setAdditionalInstructions(e.target.value)}
                                                />
                                            </div>
                                            {error && (
                                                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                                                    <AlertCircle size={14} /> {error}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {step === 'results' && result && (
                                        <div className="space-y-4">
                                            <div className="flex items-start gap-2 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800/40">
                                                <Sparkles size={14} className="text-purple-600 dark:text-purple-400 mt-0.5 shrink-0" />
                                                <p className="text-xs text-purple-800 dark:text-purple-300">{result.rationale}</p>
                                            </div>
                                            {result.questions.map((q, i) => (
                                                <div key={i} className="rounded-lg border border-gray-200 dark:border-[#2D2D2D] overflow-hidden">
                                                    <button
                                                        onClick={() => toggleExpand(i)}
                                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-[#222] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] cursor-pointer transition-colors"
                                                    >
                                                        <div className="flex items-center gap-2 text-left">
                                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[q.difficulty]}`}>{q.difficulty}</span>
                                                            <span className="text-sm font-medium text-gray-900 dark:text-white">{q.title}</span>
                                                        </div>
                                                        {expandedQuestions.has(i) ? <ChevronUp size={16} className="text-gray-400 shrink-0" /> : <ChevronDown size={16} className="text-gray-400 shrink-0" />}
                                                    </button>

                                                    {expandedQuestions.has(i) && (
                                                        <div className="px-4 py-4 space-y-4 bg-white dark:bg-[#1A1A1A]">
                                                            <p className="text-sm text-gray-800 dark:text-gray-200">{q.question_text}</p>

                                                            {/* Objective: correct answer + wrong answers */}
                                                            {q.question_type === 'objective' && q.correct_answer && (
                                                                <div className="space-y-2">
                                                                    <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                                                                        <span className="font-medium">✓ Correct answer: </span>{q.correct_answer}
                                                                    </div>
                                                                    {q.common_wrong_answers?.map((wa, j) => (
                                                                        <div key={j} className="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 text-xs">
                                                                            <div className="flex items-center justify-between mb-0.5">
                                                                                <span className="text-red-700 dark:text-red-300 font-medium">{wa.answer}</span>
                                                                                <span className="text-gray-500 dark:text-gray-400">{ERROR_TYPE_LABELS[wa.error_type] || wa.error_type} · {wa.concept_score}%</span>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Coding: test cases */}
                                                            {q.question_type === 'coding' && q.test_cases && (
                                                                <div className="space-y-1">
                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Test cases</p>
                                                                    {q.test_cases.map((tc, j) => (
                                                                        <div key={j} className="p-2 rounded bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-xs font-mono">
                                                                            <span className="text-gray-500">in:</span> {tc.input} <span className="text-gray-500 ml-2">→</span> <span className="text-emerald-600 dark:text-emerald-400 ml-1">{tc.expected_output}</span>
                                                                            <span className="text-gray-400 ml-2 font-sans">({tc.description})</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {/* Assignment: rubric */}
                                                            {q.question_type === 'assignment' && q.rubric && (
                                                                <div className="space-y-2">
                                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Scoring rubric</p>
                                                                    {q.rubric.map((r, j) => (
                                                                        <div key={j} className="p-2 rounded bg-gray-50 dark:bg-[#111] border border-gray-200 dark:border-[#333] text-xs">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{r.name}</span>
                                                                                <span className="text-gray-400">{r.min_score}–{r.max_score} (pass: {r.pass_score})</span>
                                                                            </div>
                                                                            <p className="text-gray-500 dark:text-gray-400">{r.description}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            <button
                                                                onClick={() => { onUseQuestion(q); reset(); onClose(); }}
                                                                className="w-full py-2 text-sm font-medium rounded-lg bg-purple-600 hover:bg-purple-700 text-white cursor-pointer transition-colors"
                                                            >
                                                                Use this question
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-[#2D2D2D] bg-gray-50 dark:bg-[#111]">
                                    {step !== 'upload' ? (
                                        <button onClick={() => setStep(step === 'results' ? 'options' : 'upload')} className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white cursor-pointer transition-colors">
                                            ← Back
                                        </button>
                                    ) : <div />}

                                    {step === 'upload' && (
                                        <button
                                            onClick={() => setStep('options')}
                                            disabled={!materialText.trim()}
                                            className="px-5 py-2 text-sm font-medium rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer transition-colors"
                                        >
                                            Continue →
                                        </button>
                                    )}
                                    {step === 'options' && (
                                        <button
                                            onClick={handleGenerate}
                                            disabled={isGenerating}
                                            className="flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-full bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white cursor-pointer transition-colors"
                                        >
                                            {isGenerating ? (
                                                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Generating...</>
                                            ) : (
                                                <><Sparkles size={14} /> Generate</>
                                            )}
                                        </button>
                                    )}
                                    {step === 'results' && (
                                        <button onClick={() => { setStep('options'); setResult(null); }} className="px-5 py-2 text-sm font-medium rounded-full border border-gray-200 dark:border-[#333] text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#222] cursor-pointer transition-colors">
                                            Regenerate
                                        </button>
                                    )}
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
