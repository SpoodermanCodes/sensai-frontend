"use client";

import { forwardRef, useImperativeHandle, useMemo, useState, useRef, useCallback, useEffect } from "react";
import BlockNoteEditor from "./BlockNoteEditor";
import Dropdown, { DropdownOption } from "./Dropdown";
import { answerTypeOptions, copyPasteControlOptions } from "./dropdownOptions";
import NotionIntegration from "./NotionIntegration";
import KnowledgeBaseEditor from "./KnowledgeBaseEditor";
import LearnerAssignmentView from "./LearnerAssignmentView";
import ScorecardManager, { ScorecardManagerHandle } from "./ScorecardManager";
import EvaluationCriteriaEditor from "./EvaluationCriteriaEditor";
import { BookOpen, ClipboardCheck, HelpCircle, Sparkles } from "lucide-react";
import { BlockList, RenderConfig } from "@udus/notion-renderer/components";
import { extractTextFromBlocks, hasBlocksContent } from "@/lib/utils/blockUtils";
import { handleIntegrationPageSelection, handleIntegrationPageRemoval } from "@/lib/utils/integrationUtils";
import { useAuth } from "@/lib/auth";
import { validateScorecardCriteria } from "@/lib/utils/scorecardValidation";
import { ScorecardTemplate } from "./ScorecardPickerDialog";
import "@udus/notion-renderer/styles/globals.css";
import PublishConfirmationDialog from './PublishConfirmationDialog';
import { useThemePreference } from "@/lib/hooks/useThemePreference";

// Submission type options filtered from answerTypeOptions
// Submission type options limited to Text and Code for Assignments
const submissionTypeOptions = answerTypeOptions.filter(opt => opt.value === 'text' || opt.value === 'code');


export interface AssignmentEditorHandle {
    hasChanges: () => boolean;
    hasContent: () => boolean;
    validateBeforePublish: () => boolean;
    validateEvaluationCriteria: () => boolean;
    saveDraft: () => void;
    savePublished: () => void;
    cancel: () => void;
    hasUnsavedScorecardChanges: () => boolean;
    handleScorecardChangesRevert: () => void;
}

interface AssignmentEditorProps {
    taskId?: string;
    readOnly: boolean;
    status?: string;
    scheduledPublishAt: string | null;
    showPublishConfirmation?: boolean;
    onPublishCancel?: () => void;
    onPublishSuccess?: (data?: any) => void;
    onSaveSuccess?: (data?: any) => void;
    courseId?: string;
    schoolId?: string;
    onValidationError?: (title: string, message: string, emoji?: string) => void;
    isPreviewMode?: boolean;
}

const AssignmentEditor = forwardRef<AssignmentEditorHandle, AssignmentEditorProps>(({
    taskId,
    readOnly,
    status,
    scheduledPublishAt,
    onPublishSuccess,
    onSaveSuccess,
    courseId,
    schoolId,
    showPublishConfirmation,
    onPublishCancel,
    onValidationError,
    isPreviewMode = false,
}, ref) => {
    const { isDarkMode } = useThemePreference();

    // Problem statement
    const [problemBlocks, setProblemBlocks] = useState<any[]>([]);
    // Resources
    const [knowledgeBaseBlocks, setKnowledgeBaseBlocks] = useState<any[]>([]);
    // Linked material IDs for knowledge base
    const [linkedMaterialIds, setLinkedMaterialIds] = useState<string[]>([]);
    // Score range triple (min_score, max_score, pass_score)
    const [scoreRange, setScoreRange] = useState<{ min_score: number; max_score: number; pass_score: number }>({ min_score: 1, max_score: 4, pass_score: 3 });
    // Submission type for learner responses
    const [submissionType, setSubmissionType] = useState<DropdownOption>(submissionTypeOptions[0]);

    const [responseType, setResponseType] = useState<'chat' | 'exam'>('chat');
    // Copy/paste control setting
    const [selectedCopyPasteControl, setSelectedCopyPasteControl] = useState<DropdownOption>(copyPasteControlOptions[0]);

    // Active tab: problem | resources | scorecard
    const [activeTab, setActiveTab] = useState<'problem' | 'evaluation' | 'knowledge'>('problem');

    // Highlight management (adapter to copied code)
    const [highlightedField, setHighlightedField] = useState<'problem' | 'evaluation' | 'scorecard' | null>(null);

    // Editor refs
    const editorRef = useRef<any>(null);
    const scorecardManagerRef = useRef<ScorecardManagerHandle>(null);

    // Scorecard ID from API response
    const [scorecardId, setScorecardId] = useState<string | number | undefined>(undefined);
    // Scorecard data state for validation from any tab
    const [scorecardData, setScorecardData] = useState<ScorecardTemplate | undefined>(undefined);

    // Integration state (Notion)
    const [integrationBlocks, setIntegrationBlocks] = useState<any[]>([]);
    const [isLoadingIntegration, setIsLoadingIntegration] = useState(false);
    const [integrationError, setIntegrationError] = useState<string | null>(null);

    // Dirty tracking
    const [dirty, setDirty] = useState(false);

    // AI generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [generatedScorecardKey, setGeneratedScorecardKey] = useState(0);

    const handleGenerateFromMaterial = useCallback(async () => {
        setIsGenerating(true);
        setGenerateError(null);
        try {
            // 1. Fetch current task to get milestone_id
            const taskRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`);
            if (!taskRes.ok) throw new Error('Failed to fetch task details');
            const taskData = await taskRes.json();
            const milestoneId = taskData.milestone_id;

            let moduleMaterialText = "";

            // 2. Fetch milestone to get all learning materials if available
            if (milestoneId) {
                const milestoneRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/milestones/${milestoneId}`);
                if (milestoneRes.ok) {
                    const milestoneData = await milestoneRes.json();
                    
                    // Filter for learning materials in the same module
                    // Robust check for different type name variations
                    const materials = (milestoneData.tasks || []).filter((t: any) => 
                        t.id !== taskId && // Don't analyze self
                        (t.type === 'learning_material' || t.type === 'material' || t.task_type === 'learning_material')
                    );
                    
                    console.log(`Found ${materials.length} sibling learning materials in module ${milestoneId}`);
                    
                    if (materials.length > 0) {
                        const contentPromises = materials.map((m: any) => 
                            fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/learning_materials/${m.id}`)
                                .then(r => r.ok ? r.json() : null)
                                .catch(() => null)
                        );
                        
                        const contents = await Promise.all(contentPromises);
                        moduleMaterialText = contents
                            .filter(c => c && c.blocks && extractTextFromBlocks(c.blocks).trim().length > 0)
                            .map(c => extractTextFromBlocks(c.blocks))
                            .join("\n\n---\n\n");
                    }
                }
            }

            // 3. Aggregate content from module materials, knowledge base, and manual resources
            const manualResources = extractTextFromBlocks([...knowledgeBaseBlocks, ...integrationBlocks]).trim();
            const problemText = extractTextFromBlocks(problemBlocks).trim();
            
            // Prioritize module materials, then manual resources, then problem statement
            const referenceMaterial = moduleMaterialText.trim() || manualResources || problemText;
            
            if (!referenceMaterial) {
                onValidationError?.('No Material Found', 'Please add some learning materials to this module or manual resources first so the AI can analyze them.', '📚');
                setIsGenerating(false);
                return;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/ai/generate-assessment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    reference_material: referenceMaterial,
                    assessment_type: submissionType.value,
                    course_id: courseId,
                    generate_problem_statement: true // Always generate/improve problem statement based on module analysis
                }),
            });
            if (!res.ok) throw new Error('Generation failed');
            const data = await res.json();
            
            // Update problem statement
            if (data.problem_statement) {
                setProblemBlocks(data.problem_statement);
            }

            // Auto-populate scorecard from rubric (mapping from backend format)
            if (data.scorecard && data.scorecard.criteria) {
                const generatedScorecard: ScorecardTemplate = {
                    id: `generated-${Date.now()}`,
                    name: data.scorecard.title || 'AI Generated Rubric',
                    new: true,
                    criteria: data.scorecard.criteria.map((c: any) => ({
                        name: c.name,
                        description: c.description,
                        maxScore: c.max_score || 4,
                        minScore: c.min_score || 1,
                        passScore: c.pass_score || 3,
                    })),
                };
                setScorecardData(generatedScorecard);
                
                // Update score range from first criterion
                if (data.scorecard.criteria.length > 0) {
                    const first = data.scorecard.criteria[0];
                    setScoreRange({ 
                        min_score: first.min_score || 1, 
                        max_score: first.max_score || 4, 
                        pass_score: first.pass_score || 3 
                    });
                }
            } else if (data.questions?.[0]?.rubric) {
                // Fallback for older backend format
                const q = data.questions[0];
                const generatedScorecard: ScorecardTemplate = {
                    id: `generated-${Date.now()}`,
                    name: 'AI Generated Rubric',
                    new: true,
                    criteria: q.rubric.map((r: any) => ({
                        name: r.name,
                        description: `${r.description}\n\nStrong: ${r.strong_response}\nWeak: ${r.weak_response}`,
                        maxScore: r.max_score,
                        minScore: r.min_score,
                        passScore: r.pass_score,
                    })),
                };
                setScorecardData(generatedScorecard);
                const first = q.rubric[0];
                setScoreRange({ min_score: first.min_score, max_score: first.max_score, pass_score: first.pass_score });
            }

            setActiveTab('evaluation');
            setDirty(true);
            setGeneratedScorecardKey(k => k + 1);
        } catch (error) {
            console.error('Generation error:', error);
            setGenerateError('Generation failed. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    }, [taskId, problemBlocks, knowledgeBaseBlocks, integrationBlocks, submissionType, courseId, onValidationError]);


    // Loading state for fetching assignment data
    const [isLoadingAssignment, setIsLoadingAssignment] = useState(true);
    const [hasFetchedData, setHasFetchedData] = useState(false);
    // Track if assignment exists
    const [hasAssignment, setHasAssignment] = useState(false);

    // Auth
    const { user } = useAuth();
    const userId = user?.id;

    // Load assignment data from API when taskId changes
    useEffect(() => {
        const fetchAssignmentData = async () => {
            if (!taskId || hasFetchedData) {
                setIsLoadingAssignment(false);
                return;
            }

            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch assignment details');
                }

                const data = await response.json();

                // Check if assignment exists
                const assignment = data?.assignment;
                const hasAssignment = assignment?.input_type !== null && assignment?.input_type !== undefined;

                if (hasAssignment) {
                    setHasAssignment(true);

                    // Load problem blocks
                    if (assignment.blocks && Array.isArray(assignment.blocks)) {
                        setProblemBlocks(assignment.blocks);
                    }

                    // Load knowledge base data from context
                    if (assignment.context) {
                        // Extract blocks for knowledge base if they exist
                        if (assignment.context.blocks && Array.isArray(assignment.context.blocks)) {
                            setKnowledgeBaseBlocks(assignment.context.blocks);
                        }

                        // Extract linkedMaterialIds if they exist
                        if (assignment.context.linkedMaterialIds && Array.isArray(assignment.context.linkedMaterialIds)) {
                            setLinkedMaterialIds(assignment.context.linkedMaterialIds);
                        }
                    }

                    // Load evaluation criteria
                    if (assignment.evaluation_criteria) {
                        const evalCriteria = assignment.evaluation_criteria;
                        if (evalCriteria.min_score !== undefined) setScoreRange(prev => ({ ...prev, min_score: evalCriteria.min_score }));
                        if (evalCriteria.max_score !== undefined) setScoreRange(prev => ({ ...prev, max_score: evalCriteria.max_score }));
                        if (evalCriteria.pass_score !== undefined) setScoreRange(prev => ({ ...prev, pass_score: evalCriteria.pass_score }));
                    }

                    // Load scorecard ID if available
                    if (assignment.evaluation_criteria?.scorecard_id) {
                        setScorecardId(assignment.evaluation_criteria.scorecard_id);
                    }

                    // Load submission type
                    if (assignment.input_type) {
                        const matchingOption = submissionTypeOptions.find(opt => opt.value === assignment.input_type);
                        if (matchingOption) {
                            setSubmissionType(matchingOption);
                        }
                    }

                    // Load copy/paste control setting
                    if (assignment.settings) {
                        const allowCopyPaste = assignment.settings.allowCopyPaste;
                        if (allowCopyPaste !== undefined) {
                            const copyPasteOption = copyPasteControlOptions.find(opt => opt.value === allowCopyPaste.toString());
                            if (copyPasteOption) {
                                setSelectedCopyPasteControl(copyPasteOption);
                            }
                        }
                    }
                } else {
                    setHasAssignment(false);
                }

                setHasFetchedData(true);
            } catch (error) {
                console.error('Error fetching assignment data:', error);
            } finally {
                setIsLoadingAssignment(false);
            }
        };

        fetchAssignmentData();
    }, [taskId, hasFetchedData]);

    // Reset hasFetchedData and hasAssignment when taskId changes
    useEffect(() => {
        setHasFetchedData(false);
        setHasAssignment(false);
        setScorecardId(undefined);
    }, [taskId]);

    const handleScoreChange = useCallback((key: 'min_score' | 'max_score' | 'pass_score', value: number) => {
        setScoreRange(prev => ({ ...prev, [key]: value }));
        if (highlightedField === 'evaluation') setHighlightedField(null);
        setDirty(true);
    }, [highlightedField]);

    const hasValidProblem = useMemo(() => hasBlocksContent(problemBlocks), [problemBlocks]);

    // Assignment-specific content/config (not quiz-based)
    const problemContent = useMemo(() => problemBlocks, [problemBlocks]);

    // Integration helpers (lightweight)
    const setEditorInstance = useCallback((editor: any) => {
        editorRef.current = editor;
    }, []);


    const handleProblemContentChange = useCallback((content: any[]) => {
        setProblemBlocks(content);
        if (highlightedField === 'problem') setHighlightedField(null);
        setDirty(true);
    }, [highlightedField]);


    const handleIntegrationPageSelect = async (pageId: string, pageTitle: string) => {
        if (!userId) {
            console.error('User ID not provided');
            return;
        }

        setIsLoadingIntegration(true);
        setIntegrationError(null);

        try {
            return await handleIntegrationPageSelection(
                pageId,
                pageTitle,
                userId,
                'notion',
                (content) => {
                    setProblemBlocks(content);
                    setDirty(true);
                },
                setIntegrationBlocks,
                (error) => {
                    setIntegrationError(error);
                }
            );
        } catch (error) {
            console.error('Error handling Integration page selection:', error);
        } finally {
            setIsLoadingIntegration(false);
        }
    };

    const handleIntegrationPageRemove = () => {
        setIntegrationError(null);

        handleIntegrationPageRemoval(
            (content) => {
                setProblemBlocks(content);
                setDirty(true);
            },
            setIntegrationBlocks
        );
    };

    // Notion block adapters
    const currentIntegrationType = 'notion';
    const integrationBlock = problemContent.find((block: any) => block.type === currentIntegrationType);
    const initialContent = integrationBlock ? undefined : problemContent;

    // Handle integration blocks and editor instance clearing
    useEffect(() => {
        if (problemBlocks.length > 0) {
            if (integrationBlock && integrationBlock.content && integrationBlock.content.length > 0) {
                setIntegrationBlocks(integrationBlock.content);
            } else {
                setIntegrationBlocks([]);
            }
        }

        // Ensure editor instance is updated when content is cleared
        if (editorRef.current && problemBlocks.length === 0) {
            try {
                if (editorRef.current.replaceBlocks) {
                    editorRef.current.replaceBlocks(editorRef.current.document, []);
                } else if (editorRef.current.setContent) {
                    editorRef.current.setContent([]);
                }
            } catch (error) {
                console.error('Error clearing editor content:', error);
            }
        }
    }, [problemBlocks, integrationBlock]);

    // Handle scorecard selection changes (store ID and data)
    const handleScorecardChange = useCallback((newScorecardData: any) => {
        setScorecardId(newScorecardData?.id);
        setScorecardData(newScorecardData); // Store the full scorecard data for validation
        if (highlightedField === 'scorecard') setHighlightedField(null);
        setDirty(true);
    }, [highlightedField]);

    /**
     * Highlights a field to draw attention to a validation error
     * @param field The field to highlight
     */
    const highlightField = useCallback((field: 'problem' | 'evaluation' | 'scorecard') => {
        // Set the highlighted field
        setHighlightedField(field);

        // Clear the highlight after 4 seconds
        setTimeout(() => {
            setHighlightedField(null);
        }, 4000);
    }, []);

    // Validation for evaluation criteria
    const validateEvaluationCriteria = useCallback(() => {
        if (activeTab !== 'evaluation') {
            setActiveTab('evaluation');
        }

        if (scoreRange.min_score <= 0) {
            highlightField('evaluation');
            setActiveTab('evaluation');
            onValidationError?.(
                'Invalid minimum score',
                'Minimum score must be greater than 0',
                '🚫'
            );
            return false;
        }

        if (scoreRange.max_score <= scoreRange.min_score) {
            highlightField('evaluation');
            onValidationError?.(
                'Invalid maximum score',
                'Maximum score must be greater than minimum score',
                '🚫'
            );
            return false;
        }

        if (scoreRange.pass_score < scoreRange.min_score || scoreRange.pass_score > scoreRange.max_score) {
            highlightField('evaluation');
            onValidationError?.(
                'Invalid pass mark',
                'Pass mark must be within the minimum and maximum scores',
                '🚫'
            );
            return false;
        }

        return true;
    }, [onValidationError, scoreRange.min_score, scoreRange.max_score, scoreRange.pass_score, highlightField, activeTab]);

    // Local validation similar to QuizEditor.validateBeforePublish
    const validateBeforePublish = useCallback(() => {
        // Problem statement validation
        if (!hasValidProblem) {
            // Switch tab and show error via parent
            setActiveTab('problem');
            highlightField('problem');
            onValidationError?.(
                'Empty problem statement',
                'Please add a problem statement before proceeding',
                '🚫'
            );
            return false;
        }

        // Evaluation criteria (scorecard) validation
        const hasEval = !!(scorecardId || scorecardData);
        if (!hasEval) {
            setActiveTab('evaluation');
            highlightField('scorecard');
            onValidationError?.(
                'Missing scorecard',
                'Please add a scorecard before proceeding',
                '🚫'
            );
            return false;
        }

        // Validate scorecard criteria if scorecard exists
        if (scorecardData) {
            const isValidScorecard = validateScorecardCriteria(
                scorecardData,
                {
                    showErrorMessage: onValidationError
                }
            );
            if (!isValidScorecard) {
                setActiveTab('evaluation');
                return false;
            }
        }

        // Validate score ranges
        if (!validateEvaluationCriteria()) {
            return false;
        }

        return true;
    }, [hasValidProblem, scorecardId, scorecardData, onValidationError, validateEvaluationCriteria]);

    const getDialogTitle = () => {
        try {
            const titleEl = document.querySelector('.dialog-content-editor')?.parentElement?.querySelector('h2');
            return titleEl?.textContent?.trim() || '';
        } catch {
            return '';
        }
    };

    const updateDraftAssignment = async (status: 'draft' | 'published', scheduledAt?: string | null) => {
        if (!taskId) {
            console.error('Cannot save assignment: taskId is missing');
            return;
        }

        try {
            const title = getDialogTitle();

            // Build context only if present
            const context = (Array.isArray(knowledgeBaseBlocks) && knowledgeBaseBlocks.length > 0) || (Array.isArray(linkedMaterialIds) && linkedMaterialIds.length > 0)
                ? {
                    blocks: knowledgeBaseBlocks || [],
                    linkedMaterialIds: linkedMaterialIds || []
                }
                : null;

            const payload = {
                assignment: {
                    title,
                    blocks: problemBlocks || [],
                    context,
                    evaluation_criteria: {
                        scorecard_id: scorecardId ?? null,
                        min_score: scoreRange.min_score,
                        max_score: scoreRange.max_score,
                        pass_score: scoreRange.pass_score,
                    },
                    input_type: submissionType.value,
                    response_type: responseType,
                    max_attempts: null,
                    settings: {
                        allowCopyPaste: selectedCopyPasteControl.value === 'true'
                    }
                }
            };

            const method = hasAssignment ? 'PUT' : 'POST';

            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/tasks/${taskId}/assignment`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title,
                    ...payload,
                    scheduled_publish_at: scheduledAt ?? scheduledPublishAt,
                    status,
                }),
            });

            if (!response.ok) {
                throw new Error(`Failed to ${status === 'published' ? 'publish' : 'save'} assignment: ${response.status}`);
            }

            const updatedTaskData = await response.json();
            const updatedData = {
                ...updatedTaskData,
                status,
                title,
                scheduled_publish_at: scheduledAt ?? scheduledPublishAt,
                id: taskId,
            };

            if (status === 'published') {
                if (showPublishConfirmation) {
                    onPublishSuccess?.(updatedData);
                } else {
                    onSaveSuccess?.(updatedData);
                }
            } else {
                onSaveSuccess?.(updatedData);
            }

            setHasAssignment(true);

            setDirty(false);
        } catch (error) {
            console.error('Error saving assignment:', error);
        }
    };


    useImperativeHandle(ref, () => ({
        hasChanges: () => dirty,
        hasContent: () => hasValidProblem && (!!scorecardId || (scorecardManagerRef.current?.hasScorecard() ?? false)),
        validateBeforePublish,
        validateEvaluationCriteria,
        saveDraft: () => {
            void updateDraftAssignment('draft', scheduledPublishAt);
        },
        savePublished: () => {
            void updateDraftAssignment('published', scheduledPublishAt);
        },
        cancel: () => {
            setDirty(false);
        },
        hasUnsavedScorecardChanges: () => scorecardManagerRef.current?.hasUnsavedScorecardChanges() ?? false,
        handleScorecardChangesRevert: () => scorecardManagerRef.current?.handleScorecardChangesRevert()
    }));

    // In preview mode, ensure we have a draft assignment saved before rendering the learner view
    if (isPreviewMode && (!hasAssignment || dirty)) {
        void updateDraftAssignment('draft', null);
    }

    if (isLoadingAssignment) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-black dark:border-white"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
            <PublishConfirmationDialog
                show={!!showPublishConfirmation}
                title="Ready to publish?"
                message="After publishing, you won't be able to add or remove sections, but you can still edit existing ones"
                onConfirm={(scheduledPublishAt) => updateDraftAssignment('published', scheduledPublishAt)}
                onCancel={onPublishCancel || (() => { })}
                isLoading={false}
            />

            {isPreviewMode ? (
                <div className="w-full h-full ">
                    <LearnerAssignmentView
                        problemBlocks={problemBlocks}
                        title={getDialogTitle()}
                        submissionType={submissionType.value}
                        userId={user?.id}
                        taskId={taskId}
                        isTestMode={true}
                        settings={{ allowCopyPaste: selectedCopyPasteControl.value === 'true' }}
                        viewOnly={false}
                        className="w-full h-full"
                    />
                </div>
            ) : (
                <div className="flex-1 flex flex-col space-y-6 h-full bg-white dark:bg-transparent">
                    {/* Settings: Submission Type and Copy/Paste Control */}
                    <div className="space-y-4 px-6 py-4 bg-gray-100 dark:bg-[#111111]">
                        <div className="flex items-center">
                            <Dropdown
                                icon={<ClipboardCheck size={16} />}
                                title="Submission type"
                                options={submissionTypeOptions}
                                selectedOption={submissionType}
                                onChange={(e) => {
                                    if (!Array.isArray(e)) {
                                        setSubmissionType(e);
                                        setDirty(true);
                                    }
                                }}
                                disabled={readOnly}
                            />
                        </div>
                        <div className="flex items-center">
                            <Dropdown
                                icon={<ClipboardCheck size={16} />}
                                title="Allow copy/paste?"
                                options={copyPasteControlOptions}
                                selectedOption={selectedCopyPasteControl}
                                onChange={(e) => {
                                    if (!Array.isArray(e)) {
                                        setSelectedCopyPasteControl(e);
                                        setDirty(true);
                                    }
                                }}
                                disabled={readOnly}
                            />
                        </div>
                    </div>

                    {/* Tab navigation & Global Actions */}
                    <div className="flex justify-between items-center px-6">
                        <div className="inline-flex rounded-lg p-1 bg-gray-200 dark:bg-[#222222]">
                            <button
                                className={`flex items-center px-4 py-2 rounded-md text-sm cursor-pointer ${activeTab === 'problem' 
                                    ? 'bg-white text-black dark:bg-[#333333] dark:text-white' 
                                    : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}
                                onClick={() => setActiveTab('problem')}
                            >
                                <HelpCircle size={16} className="mr-2" />
                                Task brief
                            </button>
                            <button
                                className={`flex items-center px-4 py-2 rounded-md text-sm cursor-pointer ${activeTab === 'evaluation' 
                                    ? 'bg-white text-black dark:bg-[#333333] dark:text-white' 
                                    : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}
                                onClick={() => setActiveTab('evaluation')}
                            >
                                <ClipboardCheck size={16} className="mr-2" />
                                Evaluation criteria
                            </button>
                            <button
                                className={`flex items-center px-4 py-2 rounded-md text-sm cursor-pointer ${activeTab === 'knowledge' 
                                    ? 'bg-white text-black dark:bg-[#333333] dark:text-white' 
                                    : 'text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white'}`}
                                onClick={() => setActiveTab('knowledge')}
                            >
                                <BookOpen size={16} className="mr-2" />
                                AI training resources
                            </button>
                        </div>

                        {/* Global AI Action Area */}
                        {!readOnly && (
                            <div className="flex items-center">
                                <button
                                    onClick={handleGenerateFromMaterial}
                                    disabled={isGenerating}
                                    className="flex items-center gap-2 px-4 py-2 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md font-medium"
                                >
                                    {isGenerating ? (
                                        <><div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Analyzing module...</>
                                    ) : (
                                        <><Sparkles size={13} /> Analyze module & generate</>
                                    )}
                                </button>
                                {generateError && (
                                    <div className="ml-2 px-2 py-1 rounded bg-red-100 text-[10px] text-red-600 animate-pulse">
                                        Error!
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tab content */}
                    <div className="flex-1">
                        {activeTab === 'problem' && (
                            <div className="h-full flex flex-col">
                                {/* Integration */}
                                {!readOnly && !isLoadingAssignment && (
                                    <div className="py-2 bg-white dark:bg-transparent">
                                        <NotionIntegration
                                            onPageSelect={handleIntegrationPageSelect}
                                            onPageRemove={handleIntegrationPageRemove}
                                            isEditMode={!readOnly}
                                            editorContent={problemContent}
                                            loading={isLoadingIntegration}
                                            status={status}
                                            storedBlocks={integrationBlocks}
                                            onContentUpdate={(updatedContent) => {
                                                handleProblemContentChange(updatedContent);
                                                setIntegrationBlocks(updatedContent.find(block => block.type === 'notion')?.content || []);
                                            }}
                                            onLoadingChange={setIsLoadingIntegration}
                                        />
                                    </div>
                                )}
                                <div className={`editor-container h-full overflow-y-auto overflow-hidden relative z-0 ${highlightedField === 'problem' ? 'm-2 outline-2 outline-red-400 shadow-md shadow-red-900/50 animate-pulse bg-red-50 dark:bg-[#2D1E1E]' : ''}`}>
                                    {isLoadingIntegration ? (
                                        <div className="flex items-center justify-center h-32">
                                            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-black dark:border-white"></div>
                                        </div>
                                    ) : integrationError ? (
                                        <div className="flex flex-col items-center justify-center h-32 text-center">
                                            <div className="text-red-400 text-sm mb-4">
                                                {integrationError}
                                            </div>
                                            <div className="text-xs text-gray-600 dark:text-gray-400">
                                                The Notion integration may have been disconnected. Please reconnect it.
                                            </div>
                                        </div>
                                    ) : integrationBlocks.length > 0 ? (
                                        <div className="px-16 pb-6 rounded-lg bg-white text-black dark:bg-[#191919] dark:text-white">
                                            <h1 className="text-4xl font-bold mb-4 pl-0.5 text-black dark:text-white">{integrationBlock?.props?.resource_name}</h1>
                                            <RenderConfig theme={isDarkMode ? "dark" : "light"}>
                                                <BlockList blocks={integrationBlocks} />
                                            </RenderConfig>
                                        </div>
                                    ) : integrationBlock ? (
                                        <div className="flex flex-col items-center justify-center h-64 text-center">
                                            <div className="text-lg mb-2 text-black dark:text-white">Notion page is empty</div>
                                            <div className="text-sm text-gray-600 dark:text-white">Please add content to your Notion page and refresh to see changes</div>
                                        </div>
                                    ) : (
                                        <BlockNoteEditor
                                            initialContent={initialContent}
                                            onChange={handleProblemContentChange}
                                            readOnly={readOnly}
                                            onEditorReady={setEditorInstance}
                                            className="assignment-editor"
                                        />
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'evaluation' && (
                            <div className="h-full flex flex-col space-y-6">
                                {/* Evaluation Criteria Section */}
                                <EvaluationCriteriaEditor
                                    scoreRange={scoreRange}
                                    onScoreChange={handleScoreChange}
                                    readOnly={readOnly || isLoadingAssignment}
                                    isLoading={isLoadingAssignment}
                                    highlightedField={highlightedField === 'evaluation' ? 'evaluation' : null}
                                />

                                {/* Scorecard Section */}
                                <div className={`h-full m-1 ${highlightedField === 'scorecard' ? 'outline-2 outline-red-400 shadow-md shadow-red-900/50 animate-pulse rounded-lg p-2 bg-red-50 dark:bg-[#2D1E1E]' : ''}`}>
                                    <ScorecardManager
                                        key={`scorecard-manager-${generatedScorecardKey}`}
                                        ref={scorecardManagerRef}
                                        schoolId={schoolId}
                                        readOnly={readOnly || isLoadingAssignment}
                                        onScorecardChange={handleScorecardChange}
                                        scorecardId={scorecardId}
                                        initialScorecardData={scorecardData}
                                        className="scorecard-section"
                                        type="assignment"
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'knowledge' && (
                            <KnowledgeBaseEditor
                                knowledgeBaseBlocks={knowledgeBaseBlocks}
                                linkedMaterialIds={linkedMaterialIds}
                                courseId={courseId}
                                readOnly={readOnly || isLoadingAssignment}
                                onKnowledgeBaseChange={(blocks) => {
                                    setKnowledgeBaseBlocks(blocks);
                                    setDirty(true);
                                }}
                                onLinkedMaterialsChange={(ids) => {
                                    setLinkedMaterialIds(ids);
                                    setDirty(true);
                                }}
                                className="assignment"
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
});

AssignmentEditor.displayName = "AssignmentEditor";

export default AssignmentEditor;
