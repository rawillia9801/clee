
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toInputDate } from '@/lib/utils';

export function PaymentForm({ buyer, puppies, onSave, onCancel }) {
    const [formData, setFormData] = useState({ amount: '', payment_type: 'Cash', notes: '', puppy_id: '', payment_date: toInputDate(new Date()) });

    useEffect(() => {
        if (puppies.length === 1) {
            setFormData(prev => ({ ...prev, puppy_id: puppies[0].id }));
        }
    }, [puppies]);
    
    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, amount: parseFloat(formData.amount) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="amount">Amount *</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="payment_date">Payment Date *</Label><Input id="payment_date" type="date" value={formData.payment_date} onChange={e => setFormData({...formData, payment_date: e.target.value})} required /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="payment_type">Payment Type *</Label>
                <Select value={formData.payment_type} onValueChange={value => setFormData({...formData, payment_type: value})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Good Dog">Good Dog</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="puppy_id">Link to Puppy (Optional)</Label>
                <Select onValueChange={value => setFormData({...formData, puppy_id: value})} value={formData.puppy_id}>
                    <SelectTrigger><SelectValue placeholder="Select a puppy" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {puppies.map(p => <SelectItem key={p.id} value={p.id}>{p.name || 'Unnamed Puppy'}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">Add Payment</Button></div>
        </form>
    );
}
