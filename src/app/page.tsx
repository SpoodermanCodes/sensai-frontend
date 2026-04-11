"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Header } from "@/components/layout/header";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCourses, useSchools } from "@/lib/api";
import CourseCard from "@/components/CourseCard";
import CreateCourseDialog from "@/components/CreateCourseDialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Plus, BookOpen, GraduationCap, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();
  const { courses, isLoading } = useCourses();
  const { schools } = useSchools();
  const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);

  useEffect(() => {
    document.title = 'Home · SensAI';
  }, []);

  const {
    teachingCourses,
    mentoringCourses,
    learningCourses,
    hasTeachingCourses,
    hasMentoringCourses,
    hasLearningCourses,
    hasAnyCourses,
    showSegmentedTabs,
    tabsToShow
  } = useMemo(() => {
    const teachingCourses = courses.filter(course => course.role === 'admin');
    const mentoringCourses = courses.filter(course => course.role === 'mentor');
    const learningCourses = courses.filter(course => course.role !== 'admin' && course.role !== 'mentor');
    const hasTeachingCourses = teachingCourses.length > 0;
    const hasMentoringCourses = mentoringCourses.length > 0;
    const hasLearningCourses = learningCourses.length > 0;

    const roleCount = [hasTeachingCourses, hasMentoringCourses, hasLearningCourses].filter(Boolean).length;
    const showSegmentedTabs = roleCount > 1;

    const tabsToShow: Array<'teaching' | 'mentoring' | 'learning'> = [];
    if (hasTeachingCourses) tabsToShow.push('teaching');
    if (hasMentoringCourses) tabsToShow.push('mentoring');
    if (hasLearningCourses) tabsToShow.push('learning');

    return {
      teachingCourses,
      mentoringCourses,
      learningCourses,
      hasTeachingCourses,
      hasMentoringCourses,
      hasLearningCourses,
      hasAnyCourses: hasTeachingCourses || hasMentoringCourses || hasLearningCourses,
      showSegmentedTabs,
      tabsToShow
    };
  }, [courses]);

  const initialActiveTab = useMemo(() => {
    if (hasLearningCourses && !hasTeachingCourses && !hasMentoringCourses) return 'learning';
    if (hasMentoringCourses && !hasTeachingCourses && !hasLearningCourses) return 'mentoring';
    if (hasTeachingCourses) return 'teaching';
    return tabsToShow[0] || 'learning';
  }, [hasLearningCourses, hasTeachingCourses, hasMentoringCourses, tabsToShow]);

  const [activeTab, setActiveTab] = useState<'teaching' | 'mentoring' | 'learning'>(initialActiveTab);
  const [hasSchool, setHasSchool] = useState<boolean | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  useEffect(() => {
    if (schools && schools.length > 0) {
      setHasSchool(true);
      setSchoolId(schools[0].id);
    } else {
      setHasSchool(false);
    }
  }, [schools]);

  useEffect(() => {
    if (!tabsToShow.includes(activeTab) && tabsToShow.length > 0) {
      setActiveTab(tabsToShow[0]);
    }
  }, [tabsToShow, activeTab]);

  const handleCreateCourseButtonClick = useCallback(() => {
    if (hasSchool && schoolId) {
      setIsCreateCourseDialogOpen(true);
    } else {
      router.push("/school/admin/create");
    }
  }, [hasSchool, schoolId, router]);

  const handleCourseCreationSuccess = useCallback((courseData: { id: string; name: string }) => {
    if (hasSchool && schoolId) {
      router.push(`/school/admin/${schoolId}/courses/${courseData.id}`);
    } else {
      router.push("/school/admin/create");
    }
  }, [hasSchool, schoolId, router]);

  const getCurrentTabCourses = () => {
    switch (activeTab) {
      case 'teaching': return teachingCourses;
      case 'mentoring': return mentoringCourses;
      case 'learning': return learningCourses;
      default: return [];
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <>
      <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
        <Header
          showCreateCourseButton={hasAnyCourses || (hasSchool ?? false)}
          showTryDemoButton={!hasLearningCourses}
        />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {!isLoading && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12"
            >
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
                    Welcome back, {session?.user?.name?.split(' ')[0] || 'Explorer'}
                  </h1>
                  <p className="text-muted-foreground text-lg max-w-2xl">
                    Pick up where you left off or explore new learning horizons.
                  </p>
                </div>
                {hasAnyCourses && (
                  <Button onClick={handleCreateCourseButtonClick} className="rounded-full gap-2 shadow-premium dark:shadow-premium-dark">
                    <Plus size={18} />
                    New Course
                  </Button>
                )}
              </div>
            </motion.div>
          )}

          {isLoading ? (
            <div className="flex flex-col justify-center items-center py-20 gap-4">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground animate-pulse">Loading your universe...</p>
            </div>
          ) : (
            <>
              {showSegmentedTabs && (
                <div className="flex justify-start mb-10 overflow-x-auto pb-2 scrollbar-none">
                  <div className="inline-flex p-1.5 bg-muted/30 rounded-2xl border border-border/50 backdrop-blur-sm">
                    {tabsToShow.map((tab) => {
                      const Icon = tab === 'teaching' ? LayoutDashboard : tab === 'mentoring' ? GraduationCap : BookOpen;
                      const label = tab === 'teaching' ? 'Teaching' : tab === 'mentoring' ? 'Mentoring' : 'Learning';
                      
                      return (
                        <button
                          key={tab}
                          className={cn(
                            "flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300",
                            activeTab === tab 
                              ? "bg-popover text-primary shadow-premium dark:shadow-premium-dark active:scale-95" 
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                          onClick={() => setActiveTab(tab)}
                        >
                          <Icon size={18} />
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                {hasAnyCourses ? (
                  <motion.div
                    key={activeTab}
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                  >
                    {getCurrentTabCourses().map((course) => (
                      <motion.div key={course.id} variants={itemVariants}>
                        <CourseCard
                          course={{
                            ...course,
                            title: course.org?.slug ? `@${course.org.slug}/${course.title}` : course.title,
                          }}
                        />
                      </motion.div>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-20 px-4 bg-muted/20 rounded-[2.5rem] border-2 border-dashed border-border/50"
                  >
                    <div className="w-20 h-20 bg-primary/5 rounded-3xl flex items-center justify-center mb-8 text-primary shadow-inner">
                      <Sparkles size={40} />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 tracking-tight">Your curriculum is waiting</h2>
                    <p className="text-muted-foreground text-lg mb-10 max-w-md mx-auto">
                      SensAI helps you build professional courses in minutes. Start by creating your first module.
                    </p>
                    <Button
                      size="lg"
                      onClick={handleCreateCourseButtonClick}
                      className="px-10 rounded-full text-lg shadow-premium dark:shadow-premium-dark"
                    >
                      Launch your first course
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </main>
      </div>

      <CreateCourseDialog
        open={isCreateCourseDialogOpen}
        onClose={() => setIsCreateCourseDialogOpen(false)}
        onSuccess={handleCourseCreationSuccess}
        schoolId={schoolId || undefined}
      />
    </>
  );
}

