'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, Bell, AlertTriangle, Clock, CreditCard } from 'lucide-react';

interface AlertSettings {
  low_minutes_warning_enabled: boolean;
  low_minutes_threshold: number;
  expiry_warning_enabled: boolean;
  expiry_warning_hours: number;
  failed_payment_warning_enabled: boolean;
  notification_email: string;
}

export default function AlertsNotifications() {
  const [settings, setSettings] = useState<AlertSettings>({
    low_minutes_warning_enabled: true,
    low_minutes_threshold: 20,
    expiry_warning_enabled: true,
    expiry_warning_hours: 24,
    failed_payment_warning_enabled: true,
    notification_email: ''
  });
  const [notificationEmails, setNotificationEmails] = useState<string[]>([]);
  const [editingEmails, setEditingEmails] = useState<{ [key: number]: string }>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/minutes/settings');
      if (response.ok) {
        const data = await response.json();
        const notificationEmail = data.notification_email || '';
        const emails = notificationEmail 
          ? notificationEmail.split(',').map(e => e.trim()).filter(e => e !== '')
          : [];
        setNotificationEmails(emails);
        
        setSettings({
          low_minutes_warning_enabled: data.low_minutes_warning_enabled !== false,
          low_minutes_threshold: data.low_minutes_threshold || 20,
          expiry_warning_enabled: data.expiry_warning_enabled !== false,
          expiry_warning_hours: data.expiry_warning_hours || 24,
          failed_payment_warning_enabled: data.failed_payment_warning_enabled !== false,
          notification_email: notificationEmail
        });
      }
    } catch (error) {
      toast.error('Failed to load alert settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/minutes/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lowMinutesWarningEnabled: settings.low_minutes_warning_enabled,
          lowMinutesThreshold: settings.low_minutes_threshold,
          expiryWarningEnabled: settings.expiry_warning_enabled,
          expiryWarningHours: settings.expiry_warning_hours,
          failedPaymentWarningEnabled: settings.failed_payment_warning_enabled,
          notificationEmail: notificationEmails.join(',')
        })
      });

      if (response.ok) {
        toast.success('Alert settings updated successfully');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update settings');
      }
    } catch (error) {
      toast.error('Failed to update alert settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggle = (key: keyof AlertSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleInputChange = (key: keyof AlertSettings, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Cards - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Low Minutes Warning */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-orange-500" />
              <span>Low Minutes Warning</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Get notified when your minutes are running low
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="low-minutes-warning" className="text-xs">Enable</Label>
              <Switch
                id="low-minutes-warning"
                checked={settings.low_minutes_warning_enabled}
                onCheckedChange={() => handleToggle('low_minutes_warning_enabled')}
              />
            </div>

            {settings.low_minutes_warning_enabled && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="minutes-threshold" className="text-[10px]">Threshold</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="minutes-threshold"
                    type="number"
                    min="1"
                    max="1000"
                    value={settings.low_minutes_threshold}
                    onChange={(e) => handleInputChange('low_minutes_threshold', parseInt(e.target.value) || 20)}
                    className="h-7 text-xs w-16"
                  />
                  <span className="text-[10px] text-muted-foreground">minutes</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Notified when minutes fall below this amount
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Expiry Warning */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <Clock className="h-4 w-4 text-blue-500" />
              <span>Expiry Warning</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Get notified before your minute packages expire
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="expiry-warning" className="text-xs">Enable</Label>
              <Switch
                id="expiry-warning"
                checked={settings.expiry_warning_enabled}
                onCheckedChange={() => handleToggle('expiry_warning_enabled')}
              />
            </div>

            {settings.expiry_warning_enabled && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="expiry-hours" className="text-[10px]">Warning Time</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="expiry-hours"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.expiry_warning_hours}
                    onChange={(e) => handleInputChange('expiry_warning_hours', parseInt(e.target.value) || 24)}
                    className="h-7 text-xs w-16"
                  />
                  <span className="text-[10px] text-muted-foreground">hours</span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Notified this many hours before expiry
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Failed Payment Warning */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-sm">
              <CreditCard className="h-4 w-4 text-red-500" />
              <span>Payment Failures</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Get notified when payments fail or need attention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="payment-warning" className="text-xs">Enable</Label>
              <Switch
                id="payment-warning"
                checked={settings.failed_payment_warning_enabled}
                onCheckedChange={() => handleToggle('failed_payment_warning_enabled')}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Notification Email</span>
          </CardTitle>
          <CardDescription>
            Email addresses for receiving all notifications (up to 3)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {notificationEmails.map((email, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  type="email"
                  value={editingEmails[index] !== undefined ? editingEmails[index] : email}
                  onChange={(e) => {
                    setEditingEmails(prev => ({
                      ...prev,
                      [index]: e.target.value
                    }));
                  }}
                  placeholder="your-email@example.com"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const updatedEmail = editingEmails[index] !== undefined 
                      ? editingEmails[index] 
                      : email;
                    
                    if (!updatedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedEmail)) {
                      toast.error('Invalid email format');
                      return;
                    }
                    
                    const updatedEmails = [...notificationEmails];
                    updatedEmails[index] = updatedEmail;
                    
                    try {
                      const response = await fetch('/api/minutes/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lowMinutesWarningEnabled: settings.low_minutes_warning_enabled,
                          lowMinutesThreshold: settings.low_minutes_threshold,
                          expiryWarningEnabled: settings.expiry_warning_enabled,
                          expiryWarningHours: settings.expiry_warning_hours,
                          failedPaymentWarningEnabled: settings.failed_payment_warning_enabled,
                          notificationEmail: updatedEmails.join(',')
                        })
                      });
                      
                      if (response.ok) {
                        setNotificationEmails(updatedEmails);
                        setEditingEmails(prev => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                        toast.success('Email saved successfully');
                      } else {
                        throw new Error('Failed to save');
                      }
                    } catch (error) {
                      toast.error('Failed to save email');
                    }
                  }}
                >
                  Save
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={async () => {
                    const updatedEmails = notificationEmails.filter((_, i) => i !== index);
                    
                    try {
                      const response = await fetch('/api/minutes/settings', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          lowMinutesWarningEnabled: settings.low_minutes_warning_enabled,
                          lowMinutesThreshold: settings.low_minutes_threshold,
                          expiryWarningEnabled: settings.expiry_warning_enabled,
                          expiryWarningHours: settings.expiry_warning_hours,
                          failedPaymentWarningEnabled: settings.failed_payment_warning_enabled,
                          notificationEmail: updatedEmails.join(',')
                        })
                      });
                      
                      if (response.ok) {
                        setNotificationEmails(updatedEmails);
                        setEditingEmails(prev => {
                          const newState = { ...prev };
                          delete newState[index];
                          return newState;
                        });
                        toast.success('Email removed successfully');
                      } else {
                        throw new Error('Failed to remove');
                      }
                    } catch (error) {
                      toast.error('Failed to remove email');
                    }
                  }}
                  className="text-destructive hover:text-destructive"
                >
                  ×
                </Button>
              </div>
            ))}
            {notificationEmails.length < 3 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNotificationEmails([...notificationEmails, '']);
                  setEditingEmails(prev => ({
                    ...prev,
                    [notificationEmails.length]: ''
                  }));
                }}
                className="w-full"
              >
                + Add Email
              </Button>
            )}
            {notificationEmails.length === 0 && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNotificationEmails(['']);
                  setEditingEmails({ 0: '' });
                }}
                className="w-full"
              >
                + Add Email
              </Button>
            )}
            <p className="text-xs text-muted-foreground">
              These emails will receive all enabled notifications above
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Alert Settings
        </Button>
      </div>
    </div>
  );
}
