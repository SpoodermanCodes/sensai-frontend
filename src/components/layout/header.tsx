"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useSchools } from "@/lib/api";
import CreateCourseDialog from "@/components/CreateCourseDialog";
import SchoolPickerDialog from "@/components/SchoolPickerDialog";
import { ChevronDown, Plus, X, Book, School, LogOut, User, Palette } from "lucide-react";
import { useThemePreference } from "@/lib/hooks/useThemePreference";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HeaderProps {
    showCreateCourseButton?: boolean;
    showTryDemoButton?: boolean;
    centerSlot?: React.ReactNode;
}

export function Header({
    showCreateCourseButton = true,
    showTryDemoButton = false,
    centerSlot,
}: HeaderProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const { themePreference, setThemePreference } = useThemePreference();
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isCreateCourseDialogOpen, setIsCreateCourseDialogOpen] = useState(false);
    const [isSchoolPickerOpen, setIsSchoolPickerOpen] = useState(false);
    const [mobileActionsOpen, setMobileActionsOpen] = useState(false);
    const profileMenuRef = useRef<HTMLDivElement>(null);
    const mobileActionsRef = useRef<HTMLDivElement>(null);
    const { schools } = useSchools();

    const hasOwnedSchool = Boolean(schools && schools.length > 0 &&
        schools.some(school => school.role === 'owner' || school.role === 'admin'));

    const ownedSchool = schools?.find(school => school.role === 'owner' || school.role === 'admin');
    const schoolId = ownedSchool?.id || (schools && schools.length > 0 ? schools[0].id : null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
                setProfileMenuOpen(false);
            }
            if (mobileActionsRef.current && !mobileActionsRef.current.contains(event.target as Node)) {
                setMobileActionsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        signOut({ callbackUrl: "/login" });
        setProfileMenuOpen(false);
    };

    const handleButtonClick = () => {
        if (!schools || schools.length === 0) {
            router.push("/school/admin/create");
            return;
        }
        if (schools.length === 1 && (schools[0].role === 'owner')) {
            router.push(`/school/admin/${schools[0].id}`);
            return;
        }
        setIsSchoolPickerOpen(true);
    };

    const handleCourseCreationSuccess = (courseData: { id: string; name: string }) => {
        if (hasOwnedSchool && schoolId) {
            router.push(`/school/admin/${schoolId}/courses/${courseData.id}`);
        } else {
            router.push("/school/admin/create");
        }
    };

    const getInitials = () => session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "U";

    return (
        <header className="sticky top-0 z-[50] w-full border-b border-border/40 bg-background/60 backdrop-blur-md transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
                        <Image
                            src="/images/sensai-logo-dark.svg"
                            alt="SensAI Logo"
                            width={110}
                            height={32}
                            className="hidden dark:block w-auto h-7 sm:h-8"
                            priority
                        />
                        <Image
                            src="/images/sensai-logo-light.svg"
                            alt="SensAI Logo"
                            width={110}
                            height={32}
                            className="block dark:hidden w-auto h-7 sm:h-8"
                            priority
                        />
                    </Link>

                    {centerSlot && (
                        <div className="hidden lg:flex items-center">
                            {centerSlot}
                        </div>
                    )}
                </div>

                <div className="flex items-center space-x-3">
                    {showTryDemoButton && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden md:flex rounded-full px-5 text-muted-foreground hover:text-foreground"
                            onClick={() => window.open("https://sensai.hyperverge.org/school/first-principles/join?cohortId=89", "_blank")}
                        >
                            Try a demo
                        </Button>
                    )}
                    {showCreateCourseButton && (
                        <Button
                            size="sm"
                            className="hidden md:flex rounded-full px-6 shadow-premium dark:shadow-premium-dark"
                            onClick={handleButtonClick}
                        >
                            {hasOwnedSchool ? "Open School" : "Create Course"}
                        </Button>
                    )}

                    <div className="relative" ref={profileMenuRef}>
                        <button
                            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                            className="group relative flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 hover:bg-primary/20 transition-all duration-300 overflow-hidden border border-border/50"
                        >
                            <span className="text-sm font-semibold text-primary">{getInitials()}</span>
                            <div className="absolute inset-0 ring-2 ring-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <AnimatePresence>
                            {profileMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="absolute right-0 mt-3 w-72 rounded-xl shadow-2xl bg-popover text-popover-foreground border border-border/50 py-2 z-50 overflow-hidden"
                                >
                                    <div className="px-5 py-4 border-b border-border/50 mb-1">
                                        <div className="flex items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold shadow-lg">
                                                {getInitials()}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold truncate leading-tight">
                                                    {session?.user?.name || "Anonymous User"}
                                                </span>
                                                <span className="text-[12px] text-muted-foreground truncate">
                                                    {session?.user?.email || "user@example.com"}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="px-2 py-2 space-y-1">
                                        <div className="p-2">
                                            <div className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                                                <Palette className="w-3 h-3" /> Appearance
                                            </div>
                                            <div className="flex p-1 bg-muted/30 rounded-lg gap-1 mt-1">
                                                {(['light', 'dark', 'device'] as const).map((pref) => (
                                                    <button
                                                        key={pref}
                                                        onClick={() => setThemePreference(pref)}
                                                        className={cn(
                                                            "flex-1 px-2 py-1.5 text-xs rounded-md capitalize transition-all",
                                                            themePreference === pref
                                                                ? "bg-popover text-foreground shadow-sm font-medium"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                                        )}
                                                    >
                                                        {pref}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/5 group-hover:bg-destructive/20 transition-colors">
                                                <LogOut className="w-4 h-4" />
                                            </div>
                                            <span className="font-medium">Sign Out</span>
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* Mobile Actions logic remains but styled better */}
            {showCreateCourseButton && (
                <div className="md:hidden">
                    <AnimatePresence>
                        {mobileActionsOpen && (
                            <>
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                                    onClick={() => setMobileActionsOpen(false)}
                                />
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                                    className="fixed bottom-24 right-6 flex flex-col gap-4 items-end z-50"
                                >
                                    {showTryDemoButton && (
                                        <div className="flex items-center gap-3">
                                            <span className="bg-popover border border-border shadow-xl px-4 py-2 rounded-full text-xs font-medium">Try a demo</span>
                                            <Button
                                                size="icon"
                                                className="h-14 w-14 rounded-full shadow-2xl cursor-pointer"
                                                onClick={() => { window.open("...", "_blank"); setMobileActionsOpen(false); }}
                                            >
                                                <ChevronDown className="rotate-90" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <span className="bg-popover border border-border shadow-xl px-4 py-2 rounded-full text-xs font-medium">
                                            {hasOwnedSchool ? "Open school" : "Create a course"}
                                        </span>
                                        <Button
                                            size="icon"
                                            className="h-14 w-14 rounded-full shadow-2xl cursor-pointer"
                                            onClick={() => { handleButtonClick(); setMobileActionsOpen(false); }}
                                        >
                                            {hasOwnedSchool ? <School className="h-6 w-6" /> : <Plus className="h-6 w-6" />}
                                        </Button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>

                    <button
                        onClick={() => setMobileActionsOpen(!mobileActionsOpen)}
                        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-premium-dark z-50 hover:scale-105 transition-transform"
                    >
                        {mobileActionsOpen ? <X className="h-6 w-6" /> : (hasOwnedSchool ? <School className="h-6 w-6" /> : <Plus className="h-6 w-6" />)}
                    </button>
                </div>
            )}

            <CreateCourseDialog
                open={isCreateCourseDialogOpen}
                onClose={() => setIsCreateCourseDialogOpen(false)}
                onSuccess={handleCourseCreationSuccess}
                schoolId={schoolId || undefined}
            />

            {schools && (
                <SchoolPickerDialog
                    open={isSchoolPickerOpen}
                    onClose={() => setIsSchoolPickerOpen(false)}
                    schools={schools}
                    onSelectSchool={(id) => { router.push(`/school/admin/${id}`); setIsSchoolPickerOpen(false); }}
                    onCreateSchool={() => router.push("/school/admin/create")}
                />
            )}
        </header>
    );
}
 
