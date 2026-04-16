'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
    Shield,
    Lock,
    Eye,
    Database,
    Globe,
    Mail,
    Phone,
    CreditCard,
    FileText,
    Users,
    Clock,
    AlertTriangle,
    ExternalLink,
    ChevronDown,
    ChevronUp,
    ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
                            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
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

// Data table component
function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
    return (
        <div className="overflow-x-auto my-4">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800">
                        {headers.map((header, i) => (
                            <th key={i} className="text-left p-3 font-semibold border border-slate-200 dark:border-slate-700">
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            {row.map((cell, j) => (
                                <td key={j} className="p-3 border border-slate-200 dark:border-slate-700">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default function PrivacyPolicyPage() {
    return (
        <div className="h-screen overflow-y-auto bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
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
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 via-purple-600/5 to-emerald-600/5" />
                <div className="max-w-4xl mx-auto px-4 py-16 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center"
                    >
                        <div className="inline-flex items-center justify-center p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 mb-6 shadow-lg shadow-blue-500/25">
                            <Shield className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white mb-4">
                            Privacy Policy
                        </h1>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                            Your privacy is important to us. This policy explains how Hello collects, uses, and protects your personal information.
                        </p>
                        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Effective: {EFFECTIVE_DATE}
                            </span>
                            <span className="flex items-center gap-1">
                                <Globe className="w-4 h-4" />
                                GDPR Compliant
                            </span>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-4xl mx-auto px-4 py-8 pb-20">
                {/* Quick Navigation */}
                <Card className="mb-8 border-blue-200 dark:border-blue-900 bg-blue-50/50 dark:bg-blue-950/30">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            Quick Navigation
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                            {[
                                { href: '#data-collected', label: 'Data We Collect' },
                                { href: '#how-we-use', label: 'How We Use Data' },
                                { href: '#call-recording', label: 'Call Recording' },
                                { href: '#third-parties', label: 'Third Parties' },
                                { href: '#data-retention', label: 'Data Retention' },
                                { href: '#contact', label: 'Contact Us' },
                            ].map((item) => (
                                <a
                                    key={item.href}
                                    href={item.href}
                                    className="text-blue-600 dark:text-blue-400 hover:underline"
                                >
                                    → {item.label}
                                </a>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Introduction */}
                <Section id="introduction" title="1. Introduction" icon={Shield} defaultOpen={true}>
                    <p>
                        Hello AI (&quot;Hello,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the Hello AI voice assistant platform
                        (the &quot;Service&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your
                        information when you use our Service.
                    </p>
                    <p className="mt-4">
                        By using Hello, you consent to the data practices described in this policy. If you do not
                        agree with the terms of this Privacy Policy, please do not access or use the Service.
                    </p>
                    <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-medium text-amber-800 dark:text-amber-200">Important Notice</p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    Our AI voice assistants record all phone calls for quality assurance and service delivery.
                                    By using our Service, you acknowledge and consent to this recording.
                                </p>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* Data We Collect */}
                <Section id="data-collected" title="2. Information We Collect" icon={Database}>
                    <h4 className="font-semibold text-slate-900 dark:text-white mt-4 mb-2">2.1 Account Information</h4>
                    <p>When you register for an account, we collect:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Email address</li>
                        <li>Full name</li>
                        <li>Phone number</li>
                        <li>Company name</li>
                        <li>Organization number (for Norwegian businesses)</li>
                        <li>Password (stored securely using bcrypt hashing)</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">2.2 Business Information</h4>
                    <p>During onboarding, we collect:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Business name and industry</li>
                        <li>Website URLs and social media links</li>
                        <li>Assistant configuration (name, voice preferences, scripts)</li>
                        <li>FAQ documents and knowledge base content</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">2.3 Call Data</h4>
                    <p>For phone calls handled by our AI assistants:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Caller phone numbers</li>
                        <li>Call duration and timestamps</li>
                        <li>Call recordings (stored by our voice AI provider)</li>
                        <li>Call transcripts and metadata</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">2.4 Payment Information</h4>
                    <p>
                        Payment processing is handled by Stripe. We never store credit card numbers or CVV codes on our
                        servers. We only store:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Stripe customer ID</li>
                        <li>Transaction records and payment history</li>
                        <li>Subscription status</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">2.5 Technical Data</h4>
                    <p>We automatically collect:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>IP address (for security and error monitoring)</li>
                        <li>Browser type and version</li>
                        <li>Device information</li>
                        <li>Error logs and performance data</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">2.6 Document Data</h4>
                    <p>For document signing features:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Uploaded documents and files</li>
                        <li>Signer information (name, email, IP address)</li>
                        <li>Signature timestamps and verification codes</li>
                        <li>Device information at time of signing</li>
                    </ul>
                </Section>

                {/* Call Recording Notice */}
                <Section id="call-recording" title="3. Call Recording Disclosure" icon={Phone}>
                    <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg mb-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                            <div>
                                <p className="font-semibold text-red-800 dark:text-red-200">All Calls Are Recorded</p>
                                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                                    All phone calls handled by Hello AI assistants are recorded for quality assurance,
                                    service improvement, and legal compliance purposes.
                                </p>
                            </div>
                        </div>
                    </div>

                    <p>Our AI voice assistants are configured with call recording enabled. This means:</p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Every inbound and outbound call is recorded</li>
                        <li>Recordings are stored securely by our voice AI provider (VAPI)</li>
                        <li>Recordings may be used to improve AI performance and quality</li>
                        <li>Recording retention is governed by our provider&apos;s data retention policies</li>
                    </ul>

                    <p className="mt-4">
                        <strong>Caller Notification:</strong> It is your responsibility to ensure that callers are
                        informed about call recording in accordance with applicable laws. We recommend configuring
                        your assistant&apos;s greeting to include a recording disclosure.
                    </p>
                </Section>

                {/* How We Use Data */}
                <Section id="how-we-use" title="4. How We Use Your Information" icon={Eye}>
                    <p>We use the collected information for:</p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-4 mb-2">Service Delivery</h4>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Providing and maintaining the AI voice assistant service</li>
                        <li>Processing your transactions and managing your account</li>
                        <li>Customizing your assistant based on your preferences</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-4 mb-2">Communication</h4>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Sending transactional emails (receipts, password resets, notifications)</li>
                        <li>Responding to your inquiries and support requests</li>
                        <li>Sending service updates and important announcements</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-4 mb-2">Improvement & Analytics</h4>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Analyzing usage patterns to improve our services</li>
                        <li>Monitoring and fixing technical issues</li>
                        <li>Developing new features based on user needs</li>
                    </ul>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-4 mb-2">Legal & Security</h4>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>Complying with legal obligations</li>
                        <li>Enforcing our terms of service</li>
                        <li>Protecting against fraud and unauthorized access</li>
                    </ul>
                </Section>

                {/* Third Party Services */}
                <Section id="third-parties" title="5. Third-Party Service Providers" icon={ExternalLink}>
                    <p>
                        We share your information with the following third-party service providers who assist us in
                        operating our Service:
                    </p>

                    <DataTable
                        headers={['Provider', 'Purpose', 'Data Shared']}
                        rows={[
                            ['Stripe', 'Payment processing', 'Email, name, payment details'],
                            ['VAPI', 'Voice AI platform', 'Assistant config, call recordings, phone numbers'],
                            ['Sentry', 'Error monitoring', 'IP address, browser info, error logs'],
                            ['Cloudinary', 'File storage', 'Uploaded documents and files'],
                            ['Zoho Mail', 'Email delivery', 'Email addresses, email content'],
                            ['Render', 'Backend hosting', 'All server-side data'],
                            ['Dropbox Sign', 'E-signatures', 'Documents, signer details'],
                        ]}
                    />

                    <p className="mt-4">
                        Each provider is contractually obligated to protect your data and use it only for the
                        purposes specified. We encourage you to review their privacy policies:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li><a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Stripe Privacy Policy</a></li>
                        <li><a href="https://vapi.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">VAPI Privacy Policy</a></li>
                        <li><a href="https://sentry.io/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Sentry Privacy Policy</a></li>
                        <li><a href="https://cloudinary.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Cloudinary Privacy Policy</a></li>
                        <li><a href="https://www.zoho.com/privacy.html" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Zoho Mail Privacy Policy</a></li>
                        <li><a href="https://render.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Render Privacy Policy</a></li>
                        <li><a href="https://www.hellosign.com/privacy" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">Dropbox Sign Privacy Policy</a></li>
                    </ul>
                </Section>

                {/* Cookies */}
                <Section id="cookies" title="6. Cookies and Tracking" icon={Lock}>
                    <p>We use the following cookies:</p>

                    <DataTable
                        headers={['Cookie', 'Type', 'Purpose', 'Duration']}
                        rows={[
                            ['session', 'Essential', 'Authentication', 'Session'],
                            ['refreshToken', 'Essential', 'Token renewal', '7 days'],
                            ['active_theme', 'Functional', 'Theme preference', '1 year'],
                            ['NEXT_LOCALE', 'Functional', 'Language preference', 'Session'],
                        ]}
                    />

                    <p className="mt-4">
                        <strong>Essential cookies</strong> are required for the Service to function and cannot be disabled.
                        <strong> Functional cookies</strong> enhance your experience but are not strictly necessary.
                    </p>

                    <h4 className="font-semibold text-slate-900 dark:text-white mt-6 mb-2">Session Replay</h4>
                    <p>
                        We use Sentry Session Replay to record user interactions for debugging purposes. This feature
                        samples approximately 10% of sessions. Session replays help us identify and fix usability issues.
                    </p>
                </Section>

                {/* Data Retention */}
                <Section id="data-retention" title="7. Data Retention" icon={Clock}>
                    <p>We retain your data for the following periods:</p>

                    <DataTable
                        headers={['Data Type', 'Retention Period', 'Reason']}
                        rows={[
                            ['Account data', 'Until account deletion', 'Service delivery'],
                            ['Authentication tokens', '7 days (refresh)', 'Security'],
                            ['Call session data', '90 days', 'Analytics'],
                            ['Financial/billing records', '7 years', 'Legal requirement'],
                            ['Signature records', '7 years', 'Legal requirement'],
                            ['Invoice records', '7 years', 'Accounting laws'],
                            ['Contact lists', 'Until user deletes', 'User control'],
                            ['Documents', 'Until user deletes', 'User control'],
                        ]}
                    />

                    <p className="mt-4">
                        When you delete your account, we will delete or anonymize your personal data within 30 days,
                        except for data we are legally required to retain.
                    </p>
                </Section>

                {/* International Transfers */}
                <Section id="international" title="8. International Data Transfers" icon={Globe}>
                    <p>
                        Your information may be transferred to and processed in countries outside the European Economic
                        Area (EEA). Our third-party providers operate globally, which means your data may be stored
                        and processed in:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>United States (Stripe, VAPI, Sentry, Cloudinary, Render)</li>
                        <li>Other countries where our providers maintain infrastructure</li>
                    </ul>

                    <p className="mt-4">
                        We ensure appropriate safeguards are in place for international transfers, including:
                    </p>
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                        <li>Standard Contractual Clauses (SCCs) approved by the European Commission</li>
                        <li>Providers certified under recognized frameworks</li>
                        <li>Contractual obligations for data protection</li>
                    </ul>
                </Section>

                {/* Contact */}
                <Section id="contact" title="9. Contact Us" icon={Mail}>
                    <p>If you have questions about this Privacy Policy or our data practices, please contact us:</p>

                    <div className="mt-4 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                        <h4 className="font-semibold text-slate-900 dark:text-white mb-4">Hello AI</h4>
                        <div className="space-y-2 text-slate-600 dark:text-slate-400">
                            <p className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:privacy@hello.ai" className="text-blue-600 dark:text-blue-400 hover:underline">privacy@hello.ai</a>
                            </p>
                            <p className="flex items-center gap-2">
                                <Globe className="w-4 h-4" />
                                <a href="https://hello.ai" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">www.hello.ai</a>
                            </p>
                        </div>
                    </div>

                    <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                        For data protection inquiries in the European Union, you also have the right to lodge a
                        complaint with your local supervisory authority. In Norway, this is the Datatilsynet
                        (Norwegian Data Protection Authority).
                    </p>
                </Section>

                {/* Footer */}
                <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 dark:text-slate-400">
                    <p>© {new Date().getFullYear()} Hello AI. All rights reserved.</p>
                    <p className="mt-2">
                        This Privacy Policy is effective as of {EFFECTIVE_DATE}.
                    </p>
                </div>
            </main>
        </div>
    );
}
