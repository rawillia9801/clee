
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const getTodayDateString = () => new Date().toISOString().split('T')[0];

const toLocalISOString = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

export function SalesDialog({ isOpen, setIsOpen, editingSale, onSaleAdded, inventory, buyers }) {
    const [formData, setFormData] = useState({
        inventory_id: null,
        buyer_id: null,
        total_amount: '',
        cost_of_goods: '',
        shipping_costs: '',
        fees: '',
        profit: '0.00',
        platform: 'Puppies',
        notes: '',
        sale_date: getTodayDateString(),
    });
    const { toast } = useToast();
    const { user } = useAuth();

    const calculateProfit = useCallback((data) => {
        const total_amount = parseFloat(data.total_amount) || 0;
        const cost_of_goods = parseFloat(data.cost_of_goods) || 0;
        const shipping_costs = parseFloat(data.shipping_costs) || 0;
        const fees = parseFloat(data.fees) || 0;
        const total_costs = cost_of_goods + shipping_costs + fees;
        return (total_amount - total_costs).toFixed(2);
    }, []);

    const resetForm = () => {
        setFormData({ inventory_id: null, buyer_id: null, total_amount: '', cost_of_goods: '', shipping_costs: '', fees: '', profit: '0.00', platform: 'Puppies', notes: '', sale_date: getTodayDateString() });
        setIsOpen(false);
    };

    useEffect(() => {
        if (isOpen) {
            if (editingSale) {
                const formattedSale = { ...editingSale };
                Object.keys(formattedSale).forEach(key => {
                    if (formattedSale[key] === null) formattedSale[key] = '';
                    else if (typeof formattedSale[key] === 'number') formattedSale[key] = formattedSale[key].toString();
                });
                setFormData({ ...formattedSale, sale_date: toLocalISOString(editingSale.sale_date) });
            } else {
                resetForm();
                setIsOpen(true);
            }
        }
    }, [isOpen, editingSale]);
    
    useEffect(() => {
        setFormData(prev => ({ ...prev, profit: calculateProfit(prev) }));
    }, [formData.total_amount, formData.cost_of_goods, formData.shipping_costs, formData.fees, calculateProfit]);

    const handleInventorySelect = (inventoryId) => {
        const item = inventory.find(i => i.id === inventoryId);
        if (item) {
            setFormData(prev => ({ ...prev, inventory_id: item.id, cost_of_goods: item.cost ? item.cost.toString() : '0', total_amount: item.price ? item.price.toString() : '' }));
            toast({ title: "Item Selected", description: `${item.item_name} details loaded.` });
        }
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.inventory_id || !formData.buyer_id || !formData.total_amount || !formData.sale_date) {
            toast({ title: "Error", description: "Item, Buyer, Sale Price, and Date are required.", variant: "destructive" });
            return;
        }

        const saleData = {
            user_id: user.id,
            inventory_id: formData.inventory_id,
            buyer_id: formData.buyer_id,
            total_amount: parseFloat(formData.total_amount),
            cost_of_goods: parseFloat(formData.cost_of_goods) || 0,
            shipping_costs: parseFloat(formData.shipping_costs) || 0,
            fees: parseFloat(formData.fees) || 0,
            profit: parseFloat(formData.profit),
            platform: formData.platform,
            notes: formData.notes,
            sale_date: formData.sale_date,
        };

        const { error } = editingSale ?
            await supabase.from('sales').update(saleData).eq('id', editingSale.id) :
            await supabase.from('sales').insert(saleData);

        if (error) { toast({ title: 'Error saving sale', description: error.message, variant: 'destructive' }); return; }
        
        toast({ title: "Success", description: `Sale ${editingSale ? 'updated' : 'recorded'}.` });
        onSaleAdded();
    };

    return (
        <DialogContent className="bg-card text-card-foreground max-w-2xl">
            <DialogHeader><DialogTitle>{editingSale ? 'Edit' : 'Record New'} Sale</DialogTitle><DialogDescription>Select an item and buyer to record a sale.</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Item/Puppy *</Label>
                        <Select value={formData.inventory_id || ''} onValueChange={handleInventorySelect}>
                            <SelectTrigger><SelectValue placeholder="Select an item" /></SelectTrigger>
                            <SelectContent>
                                {inventory.map(item => <SelectItem key={item.id} value={item.id}>{item.item_name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Buyer *</Label>
                        <Select value={formData.buyer_id || ''} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                            <SelectTrigger><SelectValue placeholder="Select a buyer" /></SelectTrigger>
                            <SelectContent>
                                {buyers.map(buyer => <SelectItem key={buyer.id} value={buyer.id}>{buyer.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Platform *</Label>
                    <Select value={formData.platform} onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}>
                        <SelectTrigger><SelectValue placeholder="Select platform" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Walmart">Walmart</SelectItem>
                            <SelectItem value="Walmart WFS">Walmart WFS</SelectItem>
                            <SelectItem value="eBay">eBay</SelectItem>
                            <SelectItem value="Puppies">Puppies</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Sale Price *</Label><Input type="number" step="0.01" value={formData.total_amount} onChange={(e) => setFormData(prev => ({ ...prev, total_amount: e.target.value }))} required /></div>
                    <div className="space-y-2"><Label>Cost of Goods</Label><Input type="number" step="0.01" value={formData.cost_of_goods} onChange={(e) => setFormData(prev => ({ ...prev, cost_of_goods: e.target.value }))} readOnly={!!formData.inventory_id} /></div>
                    <div className="space-y-2"><Label>Shipping</Label><Input type="number" step="0.01" value={formData.shipping_costs} onChange={(e) => setFormData(prev => ({ ...prev, shipping_costs: e.target.value }))} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Fees</Label><Input type="number" step="0.01" value={formData.fees} onChange={(e) => setFormData(prev => ({ ...prev, fees: e.target.value }))} /></div>
                    <div className="space-y-2"><Label>Profit</Label><Input type="number" value={formData.profit} className="font-bold text-green-600" readOnly /></div>
                    <div className="space-y-2"><Label>Sale Date *</Label><div className="relative"><Input type="date" value={formData.sale_date} onChange={(e) => setFormData(prev => ({ ...prev, sale_date: e.target.value }))} required /><Calendar className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /></div></div>
                </div>
                <div className="space-y-2"><Label>Notes</Label><Textarea value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} /></div>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                    <Button type="submit">{editingSale ? 'Update' : 'Record'} Sale</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    );
}
