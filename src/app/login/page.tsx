"use client";

import { signIn, useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

function LoginContent() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") || "/";

    useEffect(() => {
        if (session) {
            router.push(callbackUrl);
        }
    }, [session, callbackUrl, router]);

    const handleGoogleLogin = () => {
        signIn("google", { callbackUrl });
    };

    if (status === "loading") {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col justify-center items-center px-4 py-12">
            {/* Background Aurora Effect */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-md relative z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12">
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Image
                            src="/images/sensai-logo-dark.svg"
                            alt="SensAI Logo"
                            width={180}
                            height={60}
                            className="dark:invert h-auto w-[160px] md:w-[180px]"
                            priority
                        />
                    </motion.div>
                </div>

                {/* Login Card */}
                <div className="glass p-8 md:p-10 rounded-[2.5rem] shadow-premium dark:shadow-premium-dark border border-border/50">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
                            Welcome back
                        </h1>
                        <p className="text-muted-foreground">
                            Sign in to continue your learning journey
                        </p>
                    </div>

                    <div className="space-y-6">
                        <Button
                            onClick={handleGoogleLogin}
                            variant="secondary"
                            size="lg"
                            className="w-full h-14 rounded-full gap-3 text-base font-semibold shadow-sm hover:shadow-md"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path
                                    fill="#4285F4"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                />
                                <path
                                    fill="#34A853"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#FBBC05"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                />
                                <path
                                    fill="#EA4335"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Continue with Google
                        </Button>

                        <div className="pt-4 border-t border-border/30">
                            <p className="text-xs text-center text-muted-foreground leading-relaxed px-4">
                                By continuing, you agree to our{" "}
                                <Link href="https://hyperverge.notion.site/SensAI-Terms-of-Use-1627e7c237cb80dc9bd2dac685d42f31?pvs=73" className="text-primary hover:underline font-medium">
                                    Terms of Use
                                </Link>{" "}
                                and{" "}
                                <Link href="https://hyperverge.notion.site/SensAI-Privacy-Policy-1627e7c237cb80e5babae67e64642f27" className="text-primary hover:underline font-medium">
                                    Privacy Policy
                                </Link>
                            </p>
                        </div>
                    </div>
                </div>

                {/* Tagline footer */}
                <div className="mt-12 text-center text-muted-foreground/60 font-medium text-sm">
                    Teach Smarter. Reach Further.
                </div>
            </motion.div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-background px-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
 