'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function NewUsersPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New User Management</h1>
        <p className="text-muted-foreground">
          Manage meeting slots and customer appointments for new user onboarding
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <CardTitle>Meeting Slots</CardTitle>
                <CardDescription>
                  Create and manage available meeting slots
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Define time slots for new customer meetings. Control availability, timezone, and meeting types.
            </p>
            <Link href="/dashboard/admin/meeting-slots">
              <Button className="w-full">
                Manage Slots
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader>
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                <Clock className="w-6 h-6 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <CardTitle>Appointments</CardTitle>
                <CardDescription>
                  View and manage customer bookings
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Review all scheduled appointments. Mark meetings as attended or no-show to progress user journey.
            </p>
            <Link href="/dashboard/admin/appointments">
              <Button variant="secondary" className="w-full">
                View Appointments
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Journey Overview</CardTitle>
          <CardDescription>How the new user onboarding flow works</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div>
                <p className="font-medium">User Completes Onboarding</p>
                <p className="text-sm text-muted-foreground">User fills out company and assistant requirements</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div>
                <p className="font-medium">User Books Meeting</p>
                <p className="text-sm text-muted-foreground">User selects an available time slot from your calendar</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-semibold text-blue-600 dark:text-blue-300">
                3
              </div>
              <div>
                <p className="font-medium">Admin Marks Attendance</p>
                <p className="text-sm text-muted-foreground">After meeting, mark as "attended" to unlock next steps for user</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold">
                4
              </div>
              <div>
                <p className="font-medium">Assign Custom Receipt</p>
                <p className="text-sm text-muted-foreground">Create and assign a custom receipt for payment (coming soon)</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold">
                5
              </div>
              <div>
                <p className="font-medium">Assistant Activation</p>
                <p className="text-sm text-muted-foreground">After payment, assistant is activated within 2 business days</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

