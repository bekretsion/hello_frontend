'use client';

import { useAuth } from '@/hooks/use-auth';

export const useDocumentPermissions = () => {
    const { user } = useAuth();
    const userRole = user?.role || '';

    // Admin, sales and finance are privileged roles for document management
    const isAdmin = userRole === 'admin';
    const isSales = userRole === 'sales';
    const isFinance = userRole === 'finance';
    const isPrivileged = isAdmin || isSales || isFinance;

    return {
        // Only privileged staff can manage documents; all other roles are treated as end-users
        canEdit: () => isPrivileged,
        canDelete: () => isAdmin,
        canSendForSignature: () => isAdmin || isSales,
        canSendAsOffer: () => isAdmin || isSales,
        canDownload: () => true,
        canCreate: () => isPrivileged,
        canViewTemplates: () => isPrivileged
    };
};
