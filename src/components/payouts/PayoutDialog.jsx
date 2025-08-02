
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const toLocalISOString = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        return new Date(date.getTime() - timezoneOffset).toISOString().split('T')[0];
    } catch (e) { return ''; }
};

export function PayoutDialog({ isOpen, onOpenChange, editingEntry, onSave, defaultType }) {
    const [formData, setFormData] = useState({ payout_date: '', marketplace: '', payout_amount: '', notes: '', type: defaultType || 'eCommerce' });

    useEffect(() => {
        if (isOpen) {
            if (editingEntry) {
                setFormData({
                    payout_date: toLocalISOString(editingEntry.payout_date),
                    marketplace: editingEntry.marketplace,
                    payout_amount: editingEntry.payout_amount.toString(),
                    notes: editingEntry.notes || '',
                    type: editingEntry.type || defaultType || 'eCommerce'
                });
            } else {
                setFormData({ payout_date: new Date().toISOString().split('T')[0], marketplace: '', payout_amount: '', notes: '', type: defaultType || 'eCommerce' });
            }
        }
    }, [isOpen, editingEntry, defaultType]);

    const handleSubmit = (e) => { e.preventDefault(); onSave(formData); };

    const eCommerceMarketplaces = ["Walmart", "Walmart WFS", "eBay", "Amazon", "Facebook Marketplace", "Other"];

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>{editingEntry ? 'Edit' : 'Add'} Payout</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value, marketplace: '' }))}>
                        <SelectTrigger><SelectValue placeholder="Select Type" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="eCommerce">eCommerce</SelectItem>
                            <SelectItem value="Puppies">Puppies</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="date" value={formData.payout_date} onChange={e => setFormData({...formData, payout_date: e.target.value})} required />
                    {formData.type === 'eCommerce' ? (
                        <Select value={formData.marketplace} onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace: value }))}>
                            <SelectTrigger><SelectValue placeholder="Select Marketplace" /></SelectTrigger>
                            <SelectContent>
                                {eCommerceMarketplaces.filter(m => m !== 'Walmart WFS' || formData.marketplace === 'Walmart WFS' || !eCommerceMarketplaces.includes('Walmart')).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Input placeholder="Source (e.g., Buyer Name)" value={formData.marketplace} onChange={e => setFormData({...formData, marketplace: e.target.value})} required />
                    )}
                    <Input type="number" step="0.01" placeholder="Payout Amount" value={formData.payout_amount} onChange={e => setFormData({...formData, payout_amount: e.target.value})} required />
                    <Textarea placeholder="Notes..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                    <DialogFooter><Button type="submit">Save Payout</Button></DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
