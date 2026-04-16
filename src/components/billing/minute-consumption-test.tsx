'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { Loader2, TestTube, Clock, Package, ArrowRight, CheckCircle2, AlertCircle, Zap, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConsumeResult {
  message: string;
  consumed: number;
  transactions: Array<{
    bundleId: number;
    packageName: string;
    minutesConsumed: number;
    remainingMinutes: number;
    isTopup: boolean;
    expiresAt: string;
  }>;
  remainingMinutes: number;
}

interface Bundle {
  id: number;
  package_name: string;
  minutes_remaining: number;
  minutes_purchased: number;
  expires_at: string;
  is_topup: number;
  purchase_price?: number;
  created_at: string;
}

interface UserMinutes {
  totalMinutes: number;
  bundles: Bundle[];
  callsBlocked: boolean;
}

interface MinuteConsumptionTestProps {
  userId?: number;
  onConsumptionComplete?: () => void;
}

export default function MinuteConsumptionTest({ userId, onConsumptionComplete }: MinuteConsumptionTestProps) {
  const [minutesToConsume, setMinutesToConsume] = useState<string>('5');
  const [isConsuming, setIsConsuming] = useState(false);
  const [lastResult, setLastResult] = useState<ConsumeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userMinutes, setUserMinutes] = useState<UserMinutes | null>(null);
  const [isLoadingBundles, setIsLoadingBundles] = useState(true);

  useEffect(() => {
    fetchUserBundles();
  }, []);

  const fetchUserBundles = async () => {
    try {
      setIsLoadingBundles(true);
      const response = await fetch('/api/minutes/my-minutes');
      if (response.ok) {
        const data = await response.json();
        setUserMinutes(data);
      } else {
        console.error('Failed to fetch user bundles');
      }
    } catch (error) {
      console.error('Error fetching user bundles:', error);
    } finally {
      setIsLoadingBundles(false);
    }
  };

  const handleConsume = async () => {
    if (!minutesToConsume || parseFloat(minutesToConsume) <= 0) {
      toast.error('Please enter a valid number of minutes to consume');
      return;
    }

    // Note: userId is optional since backend can extract it from token

    setIsConsuming(true);
    setError(null);
    setLastResult(null);

    try {
      const response = await fetch('/api/minutes/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(userId && { userId }),
          minutesToConsume: parseFloat(minutesToConsume),
          callId: `test-${Date.now()}`,
          description: `Test consumption of ${minutesToConsume} minutes from frontend`
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to consume minutes');
      }

      setLastResult(data);
      toast.success(`Successfully consumed ${data.consumed} minutes!`);
      
      // Refresh bundles to show updated state
      await fetchUserBundles();
      
      // Call the callback to refresh parent component data
      if (onConsumptionComplete) {
        onConsumptionComplete();
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error('Consumption failed', {
        description: errorMessage
      });
    } finally {
      setIsConsuming(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getBundleConsumptionStatus = (bundle: Bundle) => {
    if (!lastResult) return 'available';
    
    const transaction = lastResult.transactions.find(t => t.bundleId === bundle.id);
    if (transaction) {
      return transaction.remainingMinutes === 0 ? 'fully-consumed' : 'partially-consumed';
    }
    return 'available';
  };

  const getBundleConsumptionAmount = (bundle: Bundle) => {
    if (!lastResult) return 0;
    
    const transaction = lastResult.transactions.find(t => t.bundleId === bundle.id);
    return transaction ? transaction.minutesConsumed : 0;
  };

  const getSortedBundles = () => {
    if (!userMinutes?.bundles) return [];
    
    return [...userMinutes.bundles].sort((a, b) => {
      // Sort by: 1) Regular bundles first (topups last), 2) Expiry date (soonest first)
      const aIsTopup = a.is_topup === 1;
      const bIsTopup = b.is_topup === 1;
      
      if (aIsTopup && !bIsTopup) return 1;
      if (!aIsTopup && bIsTopup) return -1;
      
      // For regular bundles, sort by expiry date
      if (!aIsTopup && !bIsTopup) {
        return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
      }
      
      // For topups, sort by creation date (oldest first)
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
  };

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          <span>Minute Consumption Test</span>
          <Badge variant="outline" className="bg-blue-100 text-blue-800">
            FIFO Testing
          </Badge>
        </CardTitle>
        <CardDescription>
          Test minute consumption and verify FIFO (First In, First Out) bundle usage order
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Test Controls */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minutes-to-consume">Minutes to Consume</Label>
              <Input
                id="minutes-to-consume"
                type="number"
                value={minutesToConsume}
                onChange={(e) => setMinutesToConsume(e.target.value)}
                min="0.1"
                max="1000"
                step="0.1"
                placeholder="5.0"
                disabled={isConsuming}
              />
              <p className="text-xs text-muted-foreground">
                Enter the number of minutes to consume for testing
              </p>
            </div>

            <div className="space-y-2">
              <Label>User ID</Label>
              <div className="p-2 bg-background border rounded-md">
                <span className="text-sm font-mono">
                  {userId ? userId : 'From Token'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {userId ? 'Explicit user ID' : 'Extracted from authentication token'}
              </p>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={handleConsume}
                disabled={isConsuming}
                className="w-full"
                size="lg"
              >
                {isConsuming ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Consuming...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Test Consumption
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Current Bundles Display */}
        <div className="space-y-4">
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Package className="w-5 h-5 text-blue-600" />
              <span className="font-semibold">Your Current Bundles (FIFO Order)</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchUserBundles}
              disabled={isLoadingBundles}
            >
              {isLoadingBundles ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
          </div>

          {isLoadingBundles ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2 text-muted-foreground">Loading bundles...</span>
            </div>
          ) : userMinutes?.bundles.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground border border-dashed rounded-lg">
              <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No bundles available</p>
              <p className="text-sm">Purchase minute packages to see them here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {getSortedBundles().map((bundle, index) => {
                const status = getBundleConsumptionStatus(bundle);
                const consumedAmount = getBundleConsumptionAmount(bundle);
                const isTopup = bundle.is_topup === 1;
                const expiryDate = new Date(bundle.expires_at);
                const now = new Date();
                const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
                const isExpired = daysUntilExpiry <= 0;

                return (
                  <div 
                    key={bundle.id}
                    className={cn(
                      "p-4 rounded-lg border-2 transition-all",
                      status === 'fully-consumed' && "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800",
                      status === 'partially-consumed' && "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800",
                      status === 'available' && "bg-background border-border hover:border-blue-300"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        {/* FIFO Order Number */}
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold",
                          status === 'fully-consumed' && "bg-red-100 text-red-800",
                          status === 'partially-consumed' && "bg-orange-100 text-orange-800",
                          status === 'available' && "bg-blue-100 text-blue-800"
                        )}>
                          {index + 1}
                        </div>

                        <div className="flex-1 space-y-2">
                          {/* Bundle Header */}
                          <div className="flex items-center space-x-2">
                            <span className="font-semibold">
                              {bundle.package_name || `Bundle #${bundle.id}`}
                            </span>
                            
                            {isTopup && (
                              <Badge variant="outline" className="text-xs">
                                <Zap className="w-3 h-3 mr-1" />
                                Top-up
                              </Badge>
                            )}
                            
                            {status === 'fully-consumed' && (
                              <Badge variant="destructive" className="text-xs">
                                Fully Consumed
                              </Badge>
                            )}
                            
                            {status === 'partially-consumed' && (
                              <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                Partially Used
                              </Badge>
                            )}
                            
                            {isExpiringSoon && status === 'available' && (
                              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                <Clock className="w-3 h-3 mr-1" />
                                Expires Soon
                              </Badge>
                            )}
                          </div>

                          {/* Bundle Details */}
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <div className="text-muted-foreground">Minutes Remaining:</div>
                              <div className="font-semibold">
                                {bundle.minutes_remaining.toLocaleString()} / {bundle.minutes_purchased.toLocaleString()}
                              </div>
                            </div>
                            
                            <div>
                              <div className="text-muted-foreground">
                                {isTopup ? "No Expiry" : "Expires:"}
                              </div>
                              <div className={cn(
                                "font-semibold",
                                isExpired && "text-red-600",
                                isExpiringSoon && "text-orange-600"
                              )}>
                                {isTopup ? "Never" : 
                                 isExpired ? "Expired" :
                                 daysUntilExpiry === 0 ? "Today" :
                                 daysUntilExpiry === 1 ? "Tomorrow" :
                                 daysUntilExpiry <= 7 ? `${daysUntilExpiry} days` :
                                 formatDate(bundle.expires_at)
                                }
                              </div>
                            </div>
                          </div>

                          {/* Consumption Details */}
                          {consumedAmount > 0 && (
                            <div className="p-2 rounded bg-background/50 border">
                              <div className="text-xs text-muted-foreground mb-1">Last Test Consumption:</div>
                              <div className="flex items-center space-x-2">
                                <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                <span className="text-sm font-semibold text-orange-600">
                                  -{consumedAmount} minutes
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Bundle Status Indicator */}
                      <div className={cn(
                        "w-3 h-3 rounded-full",
                        status === 'fully-consumed' && "bg-red-500",
                        status === 'partially-consumed' && "bg-orange-500",
                        status === 'available' && "bg-green-500"
                      )} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200 dark:bg-red-950 dark:border-red-800">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <div className="font-semibold text-red-800 dark:text-red-200">
                  Consumption Failed
                </div>
                <div className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Result */}
        {lastResult && (
          <div className="space-y-4">
            <Separator />
            
            <div className="p-4 rounded-lg bg-green-50 border border-green-200 dark:bg-green-950 dark:border-green-800">
              <div className="flex items-start space-x-2 mb-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <div className="font-semibold text-green-800 dark:text-green-200">
                    {lastResult.message}
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Consumed {lastResult.consumed} minutes • {lastResult.remainingMinutes} minutes remaining
                  </div>
                </div>
              </div>

              {/* FIFO Transaction Details */}
              <div className="space-y-3">
                <div className="text-sm font-semibold text-green-800 dark:text-green-200">
                  FIFO Bundle Consumption Order:
                </div>
                
                <div className="space-y-2">
                  {lastResult.transactions.map((transaction, index) => (
                    <div 
                      key={transaction.bundleId}
                      className="flex items-center space-x-3 p-3 rounded-lg bg-background/50 border"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-800 text-sm font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{transaction.packageName}</span>
                          {transaction.isTopup && (
                            <Badge variant="outline" className="text-xs">
                              Top-up
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <span>Consumed:</span>
                            <span className="font-semibold text-green-600">
                              {transaction.minutesConsumed} min
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-1">
                            <span>Remaining:</span>
                            <span className="font-semibold">
                              {transaction.remainingMinutes} min
                            </span>
                          </div>
                          
                          {!transaction.isTopup && (
                            <div className="flex items-center space-x-1">
                              <Clock className="w-3 h-3" />
                              <span>Expires: {formatDate(transaction.expiresAt)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-950 dark:to-blue-950 border">
                  <div className="text-sm">
                    <div className="font-semibold mb-2">FIFO Verification Summary:</div>
                    <div className="space-y-1 text-xs">
                      <div>✅ Consumed from {lastResult.transactions.length} bundle{lastResult.transactions.length !== 1 ? 's' : ''}</div>
                      <div>✅ Followed FIFO order (oldest bundles first)</div>
                      <div>✅ {lastResult.transactions.filter(t => !t.isTopup).length} regular bundle{lastResult.transactions.filter(t => !t.isTopup).length !== 1 ? 's' : ''} + {lastResult.transactions.filter(t => t.isTopup).length} top-up{lastResult.transactions.filter(t => t.isTopup).length !== 1 ? 's' : ''}</div>
                      <div>✅ Total minutes remaining: {lastResult.remainingMinutes}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 rounded-lg bg-background/50 border-dashed border">
          <div className="text-sm">
            <div className="font-semibold mb-2">How FIFO Testing Works:</div>
            <div className="space-y-1 text-muted-foreground">
              <div>1. Enter the number of minutes you want to consume</div>
              <div>2. Click &quot;Test Consumption&quot; to simulate minute usage</div>
              <div>3. The system will consume minutes from your oldest bundles first</div>
              <div>4. View the detailed breakdown to verify FIFO order</div>
              <div>5. Regular bundles are consumed before top-up bundles</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
