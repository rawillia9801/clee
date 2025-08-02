
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toInputDate } from '@/lib/utils';

export function BillDialog({ isOpen, onOpenChange, editingBill, onSave, defaultType }) {
  const [formData, setFormData] = useState({
    description: '', vendor: '', amount: '', due_date: '', category: '', notes: '', type: 'Personal', recurring: false, status: 'Unpaid'
  });

  useEffect(() => {
    if (isOpen) {
      if (editingBill) {
        setFormData({
          description: editingBill.description || '', 
          vendor: editingBill.vendor,
          amount: editingBill.amount.toString(), 
          due_date: toInputDate(editingBill.due_date),
          category: editingBill.category || '', 
          notes: editingBill.notes || '',
          type: editingBill.type, 
          recurring: editingBill.recurring || false, 
          status: editingBill.status,
        });
      } else {
        setFormData({
          description: '', vendor: '', amount: '', due_date: '', category: '', notes: '',
          type: defaultType, recurring: false, status: 'Unpaid'
        });
      }
    }
  }, [isOpen, editingBill, defaultType]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-black max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editingBill ? 'Edit' : 'Add New'} Bill</DialogTitle>
          <DialogDescription>Enter bill details and payment information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="description">Description *</Label><Input id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="vendor">Vendor/Payee *</Label><Input id="vendor" value={formData.vendor} onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Bill Type *</Label><Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}><SelectTrigger><SelectValue placeholder="Select bill type" /></SelectTrigger><SelectContent><SelectItem value="Business">Business</SelectItem><SelectItem value="Personal">Personal</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label htmlFor="amount">Total Amount *</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor="dueDate">Due Date *</Label><Input id="due_date" type="date" value={formData.due_date} onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))} required /></div>
            <div className="space-y-2"><Label htmlFor="category">Category</Label><Input id="category" value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} placeholder="e.g., Utilities, Office Supplies" /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
          <div className="flex items-center space-x-2"><Checkbox id="recurring" checked={formData.recurring} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: !!checked }))} /><Label htmlFor="recurring">Recurring Bill</Label></div>
          <DialogFooter><Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button><Button type="submit">{editingBill ? 'Update' : 'Add'} Bill</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
