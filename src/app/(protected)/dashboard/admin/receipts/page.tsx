'use client';

import { useState, useEffect } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Save, Send } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ReceiptItem {
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Receipt {
  id: number;
  receipt_number: string;
  status: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_type: string;
  discount_value: number;
  discount_amount: number;
  total: number;
  currency: string;
  created_at: string;
}

export default function ReceiptsAdminPage() {
  const [loading, setLoading] = useState(true);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewReceipt, setViewReceipt] = useState<any | null>(null);
  
  // Receipt form state
  const [formData, setFormData] = useState({
    tax_rate: '0',
    discount_type: 'none',
    discount_value: '0',
    currency: 'USD',
    notes: '',
    terms: '',
    due_date: ''
  });
  
  const [items, setItems] = useState<ReceiptItem[]>([]);
  const [editingItem, setEditingItem] = useState<ReceiptItem | null>(null);

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/receipts');
      if (!response.ok) throw new Error('Failed to fetch receipts');
      const data = await response.json();
      // Ensure numeric fields are numbers
      const normalizedReceipts = (data.data || []).map((receipt: any) => ({
        ...receipt,
        subtotal: typeof receipt.subtotal === 'string' ? parseFloat(receipt.subtotal) : receipt.subtotal,
        tax_rate: typeof receipt.tax_rate === 'string' ? parseFloat(receipt.tax_rate) : receipt.tax_rate,
        tax_amount: typeof receipt.tax_amount === 'string' ? parseFloat(receipt.tax_amount) : receipt.tax_amount,
        discount_value: typeof receipt.discount_value === 'string' ? parseFloat(receipt.discount_value) : receipt.discount_value,
        discount_amount: typeof receipt.discount_amount === 'string' ? parseFloat(receipt.discount_amount) : receipt.discount_amount,
        total: typeof receipt.total === 'string' ? parseFloat(receipt.total) : receipt.total,
      }));
      setReceipts(normalizedReceipts);
    } catch (error: any) {
      toast.error('Failed to load receipts', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id: number) => {
    try {
      setViewLoading(true);
      setViewOpen(true);
      const response = await fetch(`/api/admin/receipts/${id}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Failed to load receipt');
      setViewReceipt(data.data);
    } catch (e: any) {
      setViewReceipt(null);
      toast.error('Failed to load receipt', { description: e.message });
    } finally {
      setViewLoading(false);
    }
  };

  const addItem = () => {
    setEditingItem({ description: '', quantity: 1, unit_price: 0, total: 0 });
  };

  const saveItem = () => {
    if (!editingItem || !editingItem.description || editingItem.unit_price <= 0) {
      toast.error('Please fill in description and unit price');
      return;
    }
    
    const total = editingItem.quantity * editingItem.unit_price;
    const newItem = { ...editingItem, total };
    
    setItems([...items, newItem]);
    setEditingItem(null);
    toast.success('Item added');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const taxRate = parseFloat(formData.tax_rate || '0');
    const taxAmount = subtotal * (taxRate / 100);
    
    let discountAmount = 0;
    if (formData.discount_type === 'percentage') {
      discountAmount = subtotal * (parseFloat(formData.discount_value || '0') / 100);
    } else if (formData.discount_type === 'fixed') {
      discountAmount = parseFloat(formData.discount_value || '0');
    }
    
    const total = subtotal + taxAmount - discountAmount;
    
    return { subtotal, taxAmount, discountAmount, total };
  };

  const handleSaveDraft = async () => {
    if (items.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    try {
      setSaving(true);
      const totals = calculateTotals();
      
      const response = await fetch('/api/admin/receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: 'draft',
          subtotal: totals.subtotal,
          tax_amount: totals.taxAmount,
          discount_amount: totals.discountAmount,
          total: totals.total,
          items
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create receipt');

      toast.success('Receipt saved as draft');
      setIsDialogOpen(false);
      resetForm();
      fetchReceipts();
    } catch (error: any) {
      toast.error('Failed to save receipt', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      tax_rate: '0',
      discount_type: 'none',
      discount_value: '0',
      currency: 'USD',
      notes: '',
      terms: '',
      due_date: ''
    });
    setItems([]);
    setEditingItem(null);
  };

  const totals = calculateTotals();

  if (loading) {
    return (
      <PageContainer>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom Receipts</h1>
            <p className="text-muted-foreground">Create and manage custom receipts for customers</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                Create Receipt
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Custom Receipt</DialogTitle>
                <DialogDescription>
                  Add line items, taxes, and discounts to create a custom receipt
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Line Items */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-lg font-semibold">Line Items</Label>
                    <Button size="sm" onClick={addItem}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                  
                  {items.length === 0 ? (
                    <Card className="p-8 text-center border-dashed">
                      <p className="text-muted-foreground">No items added yet</p>
                      <Button className="mt-4" variant="outline" onClick={addItem}>
                        Add First Item
                      </Button>
                    </Card>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Description</TableHead>
                          <TableHead>Quantity</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unit_price.toFixed(2)}</TableCell>
                            <TableCell>${item.total.toFixed(2)}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeItem(index)}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>

                {/* Add/Edit Item Dialog */}
                {editingItem && (
                  <Card className="p-4">
                    <div className="space-y-4">
                      <div>
                        <Label>Description *</Label>
                        <Input
                          value={editingItem.description}
                          onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                          placeholder="e.g., AI Assistant Setup"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Quantity</Label>
                          <Input
                            type="number"
                            value={editingItem.quantity}
                            onChange={(e) => {
                              const qty = parseInt(e.target.value) || 1;
                              setEditingItem({
                                ...editingItem,
                                quantity: qty,
                                total: qty * editingItem.unit_price
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label>Unit Price ($) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={editingItem.unit_price}
                            onChange={(e) => {
                              const price = parseFloat(e.target.value) || 0;
                              setEditingItem({
                                ...editingItem,
                                unit_price: price,
                                total: editingItem.quantity * price
                              });
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveItem}>Add Item</Button>
                        <Button variant="outline" onClick={() => setEditingItem(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Tax & Discount */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Tax Rate (%)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Discount Type</Label>
                    <Select
                      value={formData.discount_type}
                      onValueChange={(value) => setFormData({ ...formData, discount_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="percentage">Percentage</SelectItem>
                        <SelectItem value="fixed">Fixed Amount</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {formData.discount_type !== 'none' && (
                  <div>
                    <Label>
                      Discount Value {formData.discount_type === 'percentage' ? '(%)' : '($)'}
                    </Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.discount_value}
                      onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                    />
                  </div>
                )}

                {/* Totals Preview */}
                <Card className="p-4 bg-muted">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>${totals.subtotal.toFixed(2)}</span>
                    </div>
                    {totals.taxAmount > 0 && (
                      <div className="flex justify-between">
                        <span>Tax:</span>
                        <span>${totals.taxAmount.toFixed(2)}</span>
                      </div>
                    )}
                    {totals.discountAmount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${totals.discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2 border-t">
                      <span>Total:</span>
                      <span>${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </Card>

                {/* Notes & Terms */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Terms</Label>
                    <Textarea
                      value={formData.terms}
                      onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                      rows={3}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveDraft} disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save as Draft
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Receipts List */}
        <Card>
          <CardHeader>
            <CardTitle>All Receipts</CardTitle>
            <CardDescription>{receipts.length} receipt(s) total</CardDescription>
          </CardHeader>
          <CardContent>
            {receipts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No receipts created yet
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Receipt #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {receipts.map((receipt) => (
                    <TableRow key={receipt.id}>
                      <TableCell className="font-medium">{receipt.receipt_number}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded text-xs ${
                          receipt.status === 'draft' ? 'bg-gray-100' :
                          receipt.status === 'assigned' ? 'bg-blue-100' :
                          receipt.status === 'paid' ? 'bg-green-100' :
                          'bg-red-100'
                        }`}>
                          {receipt.status}
                        </span>
                      </TableCell>
                      <TableCell>${typeof receipt.total === 'number' ? receipt.total.toFixed(2) : parseFloat(receipt.total || 0).toFixed(2)}</TableCell>
                      <TableCell>{new Date(receipt.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleView(receipt.id)}>
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

      {/* View Receipt Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Receipt Details</DialogTitle>
            <DialogDescription>
              {viewReceipt ? `Receipt #${viewReceipt.receipt_number} — ${viewReceipt.status}` : 'Loading receipt details'}
            </DialogDescription>
          </DialogHeader>
          {viewLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : viewReceipt ? (
            <div className="space-y-4">
              {/* Payer & timestamps */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Customer</span>
                  <div className="font-medium">{viewReceipt.customer_full_name || viewReceipt.customer_name || '—'}</div>
                  <div className="text-xs text-muted-foreground">{viewReceipt.customer_email || '—'}</div>
                </div>
                <div className="text-right">
                  {viewReceipt.assigned_at && (
                    <div><span className="text-muted-foreground">Assigned:</span> {new Date(viewReceipt.assigned_at).toLocaleString()}</div>
                  )}
                  {viewReceipt.paid_at && (
                    <div><span className="text-muted-foreground">Paid:</span> {new Date(viewReceipt.paid_at).toLocaleString()}</div>
                  )}
                </div>
              </div>
              {Array.isArray(viewReceipt.items) && viewReceipt.items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Unit</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {viewReceipt.items.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.description}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.unit_price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">${parseFloat(item.total).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>${parseFloat(viewReceipt.subtotal).toFixed(2)}</span></div>
                {viewReceipt.tax_amount > 0 && (
                  <div className="flex justify-between"><span>Tax ({viewReceipt.tax_rate}%)</span><span>${parseFloat(viewReceipt.tax_amount).toFixed(2)}</span></div>
                )}
                {viewReceipt.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600"><span>Discount</span><span>- ${parseFloat(viewReceipt.discount_amount).toFixed(2)}</span></div>
                )}
                <div className="flex justify-between font-semibold pt-2"><span>Total</span><span>${parseFloat(viewReceipt.total).toFixed(2)}</span></div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">No data</div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PageContainer>
  );
}

