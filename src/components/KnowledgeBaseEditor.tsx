"use client";

import { useRef, useCallback } from "react";
import { useThemePreference } from "@/lib/hooks/useThemePreference";
import { BookOpen } from "lucide-react";
import BlockNoteEditor from "./BlockNoteEditor";
import LearningMaterialLinker from "./LearningMaterialLinker";
import { extractTextFromBlocks } from "@/lib/utils/blockUtils";

interface KnowledgeBaseEditorProps {
    knowledgeBaseBlocks: any[];
    linkedMaterialIds: string[];
    sourceMaterialBlocks?: any[];
    courseId?: string;
    readOnly: boolean;
    onKnowledgeBaseChange: (knowledgeBaseBlocks: any[]) => void;
    onLinkedMaterialsChange: (linkedMaterialIds: string[]) => void;
    onSourceMaterialChange?: (sourceMaterialBlocks: any[]) => void;
    className?: string;
}

const KnowledgeBaseEditor = ({
    knowledgeBaseBlocks,
    linkedMaterialIds,
    sourceMaterialBlocks = [],
    courseId,
    readOnly,
    onKnowledgeBaseChange,
    onLinkedMaterialsChange,
    onSourceMaterialChange,
    className = ""
}: KnowledgeBaseEditorProps) => {
    // Reference to the knowledge base editor
    const knowledgeBaseEditorRef = useRef<any>(null);
    const sourceMaterialEditorRef = useRef<any>(null);

    // Function to set the knowledge base editor reference
    const setKnowledgeBaseEditorInstance = useCallback((editor: any) => {
        knowledgeBaseEditorRef.current = editor;
    }, []);

    const setSourceMaterialEditorInstance = useCallback((editor: any) => {
        sourceMaterialEditorRef.current = editor;
    }, []);

    // Check if there's any knowledge base content
    const hasKnowledgeBaseContent = () => {
        const hasLinkedMaterials = linkedMaterialIds.length > 0;
        const hasNonEmptyBlocks = knowledgeBaseBlocks.length > 0 &&
            extractTextFromBlocks(knowledgeBaseBlocks).trim().length > 0;
        const hasSourceMaterial = sourceMaterialBlocks.length > 0 && 
            extractTextFromBlocks(sourceMaterialBlocks).trim().length > 0;

        return hasLinkedMaterials || hasNonEmptyBlocks || hasSourceMaterial;
    };

    return (
        <div className={`w-full h-full bg-white dark:bg-transparent flex flex-row overflow-y-auto px-16 space-y-6 ${className}`}>
            {/* Left column with callout (20-30% width) */}
            <div className="w-[25%] pr-8">
                <div className="p-3 rounded-md bg-gray-50 text-gray-700 dark:bg-[#1F1F1F] dark:text-gray-200 border border-gray-100 dark:border-[#333]">
                    <BookOpen size={16} className="mb-2 text-amber-500 dark:text-amber-300" />
                    <p className="text-xs leading-tight mb-3">
                        <span className="font-semibold block mb-1">AI training resources</span>
                        These resources are <span className="font-semibold">optional</span> and will <span className="font-semibold">not be shown to learners</span>. They help the AI provide accurate feedback.
                    </p>
                    {onSourceMaterialChange && (
                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-[#333]">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-2 tracking-wider">Auto-Generation Source</p>
                            <p className="text-xs leading-tight text-gray-600 dark:text-gray-400 italic">
                                Use the "Source Material" editor to provide the core content. This will be saved as a separate module task and used to generate your assignment.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Right column with linker and editors (75% width) */}
            <div className="w-[75%] flex flex-col space-y-8 pb-10">
                {readOnly && !hasKnowledgeBaseContent() ? (
                    <div className="w-full flex flex-col items-center justify-center p-8 text-center rounded-lg bg-gray-50 text-gray-800 dark:bg-[#1A1A1A] dark:text-white h-full">
                        <div className="max-w-md">
                            <h3 className="text-xl font-light mb-3">No resources found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                This {className.includes('assignment') ? 'assignment' : 'question'} does not have any training resources attached to it
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Source Material Section (New) */}
                        {onSourceMaterialChange && (
                            <div className="flex flex-col space-y-3">
                                <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 ml-12">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Source Learning Material
                                    <span className="text-[10px] font-normal text-gray-500 bg-gray-100 dark:bg-[#222] px-2 py-0.5 rounded ml-2 italic">Automatically saved to module</span>
                                </div>
                                <div className="w-full bg-white dark:bg-[#1A1A1A] rounded-md overflow-hidden relative z-0 border border-emerald-500/20 shadow-sm"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (sourceMaterialEditorRef.current) {
                                            try { sourceMaterialEditorRef.current.focusEditor(); } catch (err) {}
                                        }
                                    }}
                                >
                                    <BlockNoteEditor
                                        initialContent={sourceMaterialBlocks}
                                        onChange={onSourceMaterialChange}
                                        readOnly={readOnly}
                                        onEditorReady={setSourceMaterialEditorInstance}
                                        className="source-material-editor"
                                        placeholder="Paste or write the core learning material here... Clicking 'Analyze' will save this to the module and generate the task."
                                        allowMedia={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Knowledge Base Section (Existing) */}
                        <div className="flex flex-col space-y-3">
                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 ml-12">
                                <div className="w-2 h-2 rounded-full bg-amber-500" />
                                Extra Context & Linked Materials
                            </div>
                            
                            <div className="mb-2 ml-12">
                                <LearningMaterialLinker
                                    courseId={courseId || ''}
                                    linkedMaterialIds={linkedMaterialIds}
                                    readOnly={readOnly}
                                    onMaterialsChange={onLinkedMaterialsChange}
                                />
                            </div>

                            <div className="w-full bg-white dark:bg-[#1A1A1A] rounded-md overflow-hidden relative z-0 border border-gray-100 dark:border-[#222]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (knowledgeBaseEditorRef.current) {
                                        try { knowledgeBaseEditorRef.current.focusEditor(); } catch (err) {}
                                    }
                                }}
                            >
                                <BlockNoteEditor
                                    initialContent={knowledgeBaseBlocks}
                                    onChange={onKnowledgeBaseChange}
                                    readOnly={readOnly}
                                    onEditorReady={setKnowledgeBaseEditorInstance}
                                    className="knowledge-base-editor"
                                    placeholder="Add any additional context or reference material here..."
                                    allowMedia={false}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default KnowledgeBaseEditor;
