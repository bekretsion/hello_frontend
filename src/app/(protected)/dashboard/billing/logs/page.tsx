'use client';

import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import BillingLogs from '@/components/billing/billing-logs';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function BillingLogsPage() {

  return (
    <PageContainer>
      <div className='flex w-full flex-col space-y-8 p-4 sm:p-6 lg:p-8'>
        {/* Header */}
        <div className='flex flex-col space-y-4'>
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/billing">
              <Button variant="outline" size="sm" className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Billing</span>
              </Button>
            </Link>
          </div>
          
          <Heading
            title="Complete Billing History"
            description="Detailed log of all your billing activities, transactions, and account events"
          />
        </div>

        {/* Billing Logs Component */}
        <div className='w-full'>
          <BillingLogs />
        </div>
      </div>
    </PageContainer>
  );
}
