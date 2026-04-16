'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Scale,
    FileText,
    AlertTriangle,
    Users,
    CreditCard,
    Ban,
    Shield,
    Globe,
    Clock,
    Mail,
    ChevronDown,
    ChevronUp,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Last updated date
const LAST_UPDATED = 'January 18, 2026';
const EFFECTIVE_DATE = 'January 18, 2026';

// Collapsible section component
function Section({
    id,
    title,
    icon: Icon,
    children,
    defaultOpen = false
}: {
    id: string;
    title: string;
    icon: React.ElementType;
    children: React.ReactNode;
    defaultOpen?: boolean;
}) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
        >
            <Card className="mb-4 overflow-hidden border-slate-200 dark:border-slate-800">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full text-left"
                    id={id}
                >
                    <CardHeader className="flex flex-row items-center justify-between py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <Icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <CardTitle className="text-lg font-semibold">{title}</CardTitle>
                        </div>
                        {isOpen ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                        ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                        )}
                    </CardHeader>
                </button>
                {isOpen && (
                    <CardContent className="pt-0 pb-6 px-6">
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            {children}
                        </div>
                    </CardContent>
                )}
            </Card>
        </motion.div>
    );
}

export default function TermsOfServicePage() {
    return (
        <div className="h-screen overflow-y-auto bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-sm font-medium">Back to Hello</span>
                    </Link>
                    <Badge variant="outline" className="text-xs">
                        Last updated: {LAST_UPDATED}
                    </Badge>
                </div>
            </header>

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/5 via-teal-600/5 to-cyan-600/5" />
                <div className="max-w-4xl mx-auto px-4 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 mb-6 shadow-lg shadow-emerald-500/25">
                            <Scale className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Terms of Service
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Please read these terms carefully before using the Hello AI voice assistant platform.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Effective: {EFFECTIVE_DATE}
                            </span>
                            <Link href="/privacy" className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline">
                                <Shield className="w-4 h-4" />
                                Privacy Policy
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
                {/* Acceptance */}
                <Section id="acceptance" title="1. Acceptance of Terms" icon={FileText} defaultOpen={true}>
                    <p>
                        By accessing or using Hello (&quot;Service&quot;), you agree to be bound by these Terms of Service
                        (&quot;Terms&quot;). If you disagree with any part of these terms, you do not have permission to access
                        the Service.
                    </p>
                    <p className="mt-4">
                        These Terms apply to all users of the Service, including without limitation users who are
                        browsers, customers, merchants, and/or contributors of content.
                    </p>
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <p className="text-amber-700 dark:text-amber-300">
                                <strong>Important:</strong> Our AI assistants record all phone calls. By using our Service,
                                you consent to this recording and agree to inform callers as required by applicable law.
                            </p>
                        </div>
                    </div>
                </Section>

                {/* Description of Service */}
                <Section id="service" title="2. Description of Service" icon={Globe}>
                    <p>Hello provides an AI-powered voice assistant platform that enables businesses to:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Create and customize AI voice assistants for phone calls</li>
                        <li>Handle inbound and outbound calls automatically</li>
                        <li>Manage call scripts and knowledge bases</li>
                        <li>Track call analytics and performance metrics</li>
                        <li>Process payments and manage minute-based billing</li>
                        <li>Send and sign documents electronically</li>
                    </ul>
                    <p className="mt-4">
                        The Service is provided &quot;as is&quot; and we reserve the right to modify, suspend, or discontinue
                        any part of the Service at any time without prior notice.
                    </p>
                </Section>

                {/* Billing */}
                <Section id="billing" title="3. Billing and Payment" icon={CreditCard}>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Minute-Based Billing</h4>
                    <p>
                        Our Service operates on a minute-based billing system. You purchase minute packages that
                        are consumed as your AI assistant handles calls. Minutes are deducted based on actual
                        call duration.
                    </p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Pricing</h4>
                    <p>
                        Current pricing is displayed on our billing page. We reserve the right to modify pricing
                        at any time. Price changes will be communicated in advance and will not affect already
                        purchased minute packages.
                    </p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Automatic Top-Up</h4>
                    <p>
                        If you enable automatic top-up, we will charge your saved payment method when your
                        minute balance falls below your configured threshold. You can disable this feature
                        at any time.
                    </p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Minute Expiration</h4>
                    <p>
                        Purchased minute packages may have expiration dates as specified at the time of purchase.
                        Unused minutes are forfeited upon expiration unless otherwise stated. Top-up minutes
                        do not expire.
                    </p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Refunds</h4>
                    <p>
                        Refunds are handled on a case-by-case basis. Generally, unused minutes may be refunded
                        within 14 days of purchase if no calls have been made. Please contact support for
                        refund requests.
                    </p>
                </Section>

                {/* Call Recording */}
                <Section id="recording" title="4. Call Recording" icon={AlertTriangle}>
                    <p>
                        <strong>All calls made through our AI assistants are recorded.</strong> By using our
                        Service, you acknowledge and agree that:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>All inbound and outbound calls will be recorded</li>
                        <li>Recordings may be stored by our voice AI provider</li>
                        <li>Recordings may be used for quality assurance and AI improvement</li>
                        <li>You are responsible for complying with call recording laws in your jurisdiction</li>
                        <li>You must inform callers about recording as required by applicable law</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Your Responsibilities</h4>
                    <p>
                        Different jurisdictions have different laws regarding call recording. Some require
                        all-party consent, while others only require one-party consent. It is YOUR responsibility
                        to understand and comply with the laws applicable to your business and your callers.
                    </p>
                    <p className="mt-4">
                        We recommend configuring your assistant&apos;s greeting to include a disclosure such as:
                        &quot;This call may be recorded for quality assurance purposes.&quot;
                    </p>
                </Section>

                {/* Contact */}
                <Section id="contact" title="5. Contact Us" icon={Mail}>
                    <p>If you have questions about these Terms, please contact us:</p>

                    <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Hello AI</h4>
                        <div className="space-y-2 text-slate-600 dark:text-slate-400">
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:legal@hello.ai" className="text-emerald-600 dark:text-emerald-400 hover:underline">legal@hello.ai</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <a href="https://hello.ai" target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 hover:underline">www.hello.ai</a>
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex gap-4">
                        <Link href="/privacy" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                            View Privacy Policy →
                        </Link>
                    </div>
                </Section>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} Hello AI. All rights reserved.</p>
                    <p className="mt-2">
                        These Terms of Service are effective as of {EFFECTIVE_DATE}.
                    </p>
                </div>
            </main>
        </div>
    );
}
