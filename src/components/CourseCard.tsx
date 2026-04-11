import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Trash2, Copy, MoreVertical, BookOpen, Users } from "lucide-react";
import { useState } from "react";
import ConfirmationDialog from "./ConfirmationDialog";
import Tooltip from "./Tooltip";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface CourseCardProps {
    course: {
        id: string | number;
        title: string;
        role?: string;
        org_id: number;
        cohort_id?: number;
        org?: {
            slug: string;
        };
    };
    onDelete?: (courseId: string | number) => void;
}

export default function CourseCard({ course, onDelete }: CourseCardProps) {
    const params = useParams();
    const router = useRouter();
    const schoolId = params?.id;
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [isDuplicating, setIsDuplicating] = useState(false);

    const getAccentColor = () => {
        const colors = [
            'from-indigo-500/20 to-purple-500/20 text-indigo-700 dark:text-indigo-300',
            'from-emerald-500/20 to-teal-500/20 text-emerald-700 dark:text-emerald-300',
            'from-rose-500/20 to-pink-500/20 text-rose-700 dark:text-rose-300',
            'from-amber-500/20 to-orange-500/20 text-amber-700 dark:text-amber-300',
            'from-blue-500/20 to-cyan-500/20 text-blue-700 dark:text-blue-300',
        ];

        let idNumber: number;
        if (typeof course.id === 'string') {
            idNumber = Array.from(course.id).reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0);
            idNumber = Math.abs(idNumber);
        } else {
            idNumber = course.id;
        }

        return colors[idNumber % colors.length];
    };

    const getLinkPath = () => {
        if (course.role && course.role !== 'admin' && course.org?.slug) {
            return `/school/${course.org.slug}?course_id=${course.id}&cohort_id=${course.cohort_id}`;
        }
        else if (course.org_id) {
            return `/school/admin/${course.org_id}/courses/${course.id}`;
        }
        return `/school/admin/${schoolId}/courses/${course.id}`;
    };

    const isAdminView = !!schoolId;

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDeleteConfirmOpen(true);
    };

    const handleDuplicateClick = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (!isDuplicating) {
            setIsDuplicating(true);
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/courses/${course.id}/duplicate`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ org_id: course.org_id }),
                });

                if (!response.ok) throw new Error('Failed to duplicate course');

                const newCourseData = await response.json();
                router.push(`/school/admin/${schoolId}/courses/${newCourseData.id}`);
            } catch (error) {
                console.error('Error duplicating course:', error);
            } finally {
                setIsDuplicating(false);
            }
        }
    };

    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        setDeleteError(null);
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/courses/${course.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok) throw new Error('Failed to delete course');
            setIsDeleteConfirmOpen(false);
            if (onDelete) onDelete(course.id);
        } catch (error) {
            console.error('Error deleting course:', error);
            setDeleteError('An error occurred while deleting the course. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <motion.div
            whileHover={{ y: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group relative"
        >
            <Link href={getLinkPath()} className="block h-full">
                <div className="flex flex-col h-full rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-xl hover:border-border transition-all duration-300 overflow-hidden">
                    {/* Visual header */}
                    <div className={cn("h-24 w-full bg-gradient-to-br transition-opacity group-hover:opacity-90", getAccentColor().split(' ')[0])}>
                        <div className="flex items-center justify-center h-full opacity-30">
                            <BookOpen size={48} className="text-current" />
                        </div>
                    </div>
                    
                    <div className="p-6 flex flex-col flex-1">
                        <div className="flex items-start justify-between mb-4">
                            <h3 className="text-xl font-semibold leading-tight text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                {course.title}
                            </h3>
                        </div>
                        
                        <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={cn("px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider", getAccentColor().split(' ').slice(1).join(' '))}>
                                    {course.role || 'Learner'}
                                </div>
                            </div>
                            
                            <div className="flex items-center text-muted-foreground text-xs gap-1.5">
                                <Users size={14} />
                                <span>Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </Link>

            {isAdminView && (
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                    <Tooltip content="Duplicate">
                        <button
                            className="p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-foreground hover:text-indigo-500 hover:scale-110 transition-all shadow-lg"
                            onClick={handleDuplicateClick}
                            disabled={isDuplicating}
                        >
                            {isDuplicating ? (
                                <div className="w-4 h-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                            ) : (
                                <Copy size={16} />
                            )}
                        </button>
                    </Tooltip>

                    <Tooltip content="Delete">
                        <button
                            className="p-2 rounded-full bg-white/80 dark:bg-black/80 backdrop-blur-sm text-foreground hover:text-destructive hover:scale-110 transition-all shadow-lg"
                            onClick={handleDeleteClick}
                        >
                            <Trash2 size={16} />
                        </button>
                    </Tooltip>
                </div>
            )}

            <ConfirmationDialog
                show={isDeleteConfirmOpen}
                title="Delete Course"
                message={`This action cannot be undone. All modules, tasks, and learner progress associated with "${course.title}" will be permanently deleted.`}
                confirmButtonText="Delete Permanently"
                onConfirm={handleDeleteConfirm}
                onCancel={() => setIsDeleteConfirmOpen(false)}
                type="delete"
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </motion.div>
    );
}
 
