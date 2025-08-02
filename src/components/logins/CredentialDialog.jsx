import React, { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export function CredentialDialog({ isOpen, onOpenChange, editingCredential, onSave }) {
  const [formData, setFormData] = useState({ website_name: '', username: '', password: '', card_info: '', account_number: '', notes: '', category: 'Dog Information' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editingCredential) {
        setFormData({
          website_name: editingCredential.website_name || '', username: editingCredential.username || '',
          password: editingCredential.password || '', card_info: editingCredential.card_info || '',
          account_number: editingCredential.account_number || '', notes: editingCredential.notes || '',
          category: editingCredential.category || 'Dog Information'
        });
      } else {
        setFormData({ website_name: '', username: '', password: '', card_info: '', account_number: '', notes: '', category: 'Dog Information' });
      }
    }
  }, [isOpen, editingCredential]);

  const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };
  const handleCancel = () => onOpenChange(false);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white text-black">
        <DialogHeader>
          <DialogTitle>{editingCredential ? 'Edit' : 'Add'} Credential</DialogTitle>
          <DialogDescription>All fields are optional except for Website Name.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="website_name">Website Name *</Label><Input id="website_name" value={formData.website_name} onChange={(e) => setFormData(prev => ({ ...prev, website_name: e.target.value }))} required /></div>
          <div className="space-y-2"><Label>Category *</Label><Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="Dog Information">Dog Information</SelectItem><SelectItem value="E-Commerce">E-Commerce</SelectItem><SelectItem value="Personal">Personal</SelectItem></SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="username">Username</Label><Input id="username" value={formData.username} onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))} /></div>
          <div className="space-y-2 relative"><Label htmlFor="password">Password</Label><Input id="password" type={showPassword ? 'text' : 'password'} value={formData.password} onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))} className="pr-10" /><Button type="button" variant="ghost" size="sm" className="absolute right-1 top-7" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</Button></div>
          <div className="space-y-2"><Label htmlFor="card_info">Card Info</Label><Textarea id="card_info" value={formData.card_info} onChange={(e) => setFormData(prev => ({ ...prev, card_info: e.target.value }))} placeholder="e.g., Visa **** 1234, Exp 12/25, CVV 123" /></div>
          <div className="space-y-2"><Label htmlFor="account_number">Account Number</Label><Input id="account_number" value={formData.account_number} onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))} /></div>
          <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
          <DialogFooter><Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button><Button type="submit">{editingCredential ? 'Update' : 'Add'}</Button></DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}