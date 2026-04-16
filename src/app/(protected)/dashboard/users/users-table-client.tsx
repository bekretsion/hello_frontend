'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { UserPlus, FileEdit, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Badge } from '@/components/ui/badge';

// Define the shape of a user object coming from the API
export interface UserData {
  id: number;
  username: string;
  email: string;
  role: string;
  api_key: string;
  created_at: string;
  password: string;
}

export default function UsersTableClient() {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');
  
  // State for data, loading, and error handling
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for UI interactions
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);
  const [search, setSearch] = useState('');

  // Role display map with translations
  const getRoleDisplay = (role: string) => {
    const roleMap: { [key: string]: { labelKey: string; className: string } } = {
      inbound_basic: {
        labelKey: 'roles.inboundBasic',
        className: 'bg-blue-100 text-blue-800'
      },
      outbound_basic: {
        labelKey: 'roles.outboundBasic',
        className: 'bg-green-100 text-green-800'
      },
      inbound_advanced: {
        labelKey: 'roles.inboundAdvanced',
        className: 'bg-purple-100 text-purple-800'
      },
      outbound_advanced: {
        labelKey: 'roles.outboundAdvanced',
        className: 'bg-yellow-100 text-yellow-800'
      },
      inbound_outbound_basic: {
        labelKey: 'roles.inOutBasic',
        className: 'bg-indigo-100 text-indigo-800'
      },
      inbound_outbound_advanced: {
        labelKey: 'roles.inOutAdvanced',
        className: 'bg-pink-100 text-pink-800'
      }
    };

    const roleConfig = roleMap[role];
    if (roleConfig) {
      return {
        label: t(roleConfig.labelKey),
        className: roleConfig.className
      };
    }
    
    return {
      label: role,
      className: 'bg-gray-100 text-gray-800'
    };
  };

  // Fetch users when the component mounts
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users');
        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || `${t('errors.fetchFailed')} ${response.status}`
          );
        }

        setUsers(data.users || []);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : tCommon('error');
        setError(errorMessage);
        console.error('Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [t, tCommon]);

  // Filter users based on search term
  useEffect(() => {
    const searchTerm = search.toLowerCase();
    if (!searchTerm) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(
      (user) =>
        user.username.toLowerCase().includes(searchTerm) ||
        user.email.toLowerCase().includes(searchTerm) ||
        user.role.toLowerCase().includes(searchTerm)
    );
    setFilteredUsers(filtered);
  }, [search, users]);

  const handleDeleteUser = async (userId: number, username: string) => {
    if (!confirm(t('confirmDelete', { username }))) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || t('errors.deleteFailed'));
      }

      // Remove the user from the local state
      setUsers(users.filter(user => user.id !== userId));
      toast.success(t('userDeleted', { username }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : tCommon('error');
      toast.error(errorMessage);
      console.error('Delete error:', error);
    }
  };

  // Conditional rendering for loading and error states
  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={5} />;
  }

  if (error) {
    return (
      <div className='bg-card flex h-64 items-center justify-center rounded-md border text-center'>
        <div>
          <p className='text-destructive text-xl font-semibold'>
            {t('errors.fetchError')}
          </p>
          <p className='text-muted-foreground'>{error}</p>
        </div>
      </div>
    );
  }

  // Main component render
  return (
    <div className='flex flex-1 flex-col space-y-4'>
      <div className='bg-card flex items-center justify-between space-x-4 rounded-md border p-4'>
        <Input
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className='max-w-md'
        />
        <Button asChild>
          <Link href='/dashboard/users/create'>
            <UserPlus className='mr-2 h-4 w-4' />
            {t('createUser')}
          </Link>
        </Button>
      </div>

      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('table.username')}</TableHead>
              <TableHead>{t('table.email')}</TableHead>
              <TableHead>{t('table.role')}</TableHead>
              <TableHead>{t('table.created')}</TableHead>
              <TableHead className='text-right'>{t('table.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => {
                const roleDisplay = getRoleDisplay(user.role);
                return (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge
                        variant='outline'
                        className={roleDisplay.className}
                      >
                        {roleDisplay.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className='text-right'>
                      <Button
                        variant='outline'
                        size='icon'
                        className='mr-2 h-8 w-8'
                      >
                        <Link href={`/dashboard/users/${user.id}/edit`}>
                          <FileEdit className='h-4 w-4' />
                          <span className='sr-only'>{t('actions.editUser')}</span>
                        </Link>
                      </Button>
                      <Button
                        variant='destructive'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => handleDeleteUser(user.id, user.username)}
                      >
                        <Trash2 className='h-4 w-4' />
                        <span className='sr-only'>{t('actions.deleteUser')}</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className='h-24 text-center'>
                  {t('noUsersFound')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}