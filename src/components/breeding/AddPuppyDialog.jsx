
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toInputDate } from '@/lib/utils';

export const AddPuppyDialog = ({ litterId, buyers, editingPuppy, isOpen, setIsOpen, onPuppyAdded }) => {
    const [formData, setFormData] = useState({
        name: '', gender: '', color: '', status: 'Available', price_sold: '', sold_to: '', buyer_id: '', date_sold: '', cost_of_goods: '100.00'
    });
    const { user } = useAuth();
    const { toast } = useToast();
    
    useEffect(() => {
      if (isOpen) {
        if (editingPuppy) {
            setFormData({
                name: editingPuppy.name || '',
                gender: editingPuppy.gender || '',
                color: editingPuppy.color || '',
                status: editingPuppy.status || 'Available',
                price_sold: editingPuppy.price_sold?.toString() || '',
                sold_to: editingPuppy.sold_to || '',
                buyer_id: editingPuppy.buyer_id || '',
                date_sold: toInputDate(editingPuppy.date_sold),
                cost_of_goods: editingPuppy.cost_of_goods?.toString() || '100.00'
            });
        } else {
            setFormData({
                name: '', gender: '', color: '', status: 'Available', price_sold: '', sold_to: '', buyer_id: '', date_sold: '', cost_of_goods: '100.00'
            });
        }
      }
    }, [isOpen, editingPuppy]);

    const handlePuppySubmit = async (e) => {
        e.preventDefault();
        
        const selectedBuyer = buyers.find(b => b.id === formData.buyer_id);

        const puppyData = {
            litter_id: litterId,
            user_id: user.id,
            name: formData.name,
            gender: formData.gender,
            color: formData.color,
            status: formData.status,
            price_sold: formData.price_sold ? parseFloat(formData.price_sold) : null,
            sold_to: selectedBuyer ? selectedBuyer.name : formData.sold_to,
            buyer_id: formData.buyer_id || null,
            date_sold: formData.date_sold || null,
            cost_of_goods: formData.cost_of_goods ? parseFloat(formData.cost_of_goods) : 100.00
        };

        if (puppyData.status !== 'Sold') {
            puppyData.price_sold = null;
            puppyData.sold_to = null;
            puppyData.buyer_id = null;
            puppyData.date_sold = null;
        }

        const { data: upsertedPuppy, error } = editingPuppy
            ? await supabase.from('puppies').update(puppyData).eq('id', editingPuppy.id).select().single()
            : await supabase.from('puppies').insert(puppyData).select().single();

        if (error) {
            toast({ title: `Error ${editingPuppy ? 'updating' : 'adding'} puppy`, description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: `Puppy ${editingPuppy ? 'updated' : 'added'} successfully` });
            
            if (puppyData.status === 'Sold' && puppyData.price_sold > 0) {
                await createSaleRecord(upsertedPuppy);
            }

            setIsOpen(false);
            onPuppyAdded();
        }
    };

    const createSaleRecord = async (puppy) => {
        const saleData = {
            user_id: user.id,
            product_name: puppy.name || 'Unnamed Puppy',
            quantity: 1,
            sale_price: puppy.price_sold,
            cost: puppy.cost_of_goods,
            customer_name: puppy.sold_to,
            date: puppy.date_sold || new Date().toISOString(),
            notes: `Sale of puppy ID: ${puppy.id}`,
            sale_type: 'SWVA Chihuahua',
            marketplace: 'Direct Sale'
        };
        const { error } = await supabase.from('sales').insert(saleData);
        if (error) {
            toast({ title: 'Error creating linked sale record', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Sale record created', description: 'A sale record has been automatically created.' });
        }
    }

    return (
        <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingPuppy ? 'Edit' : 'Add'} Puppy to Litter</DialogTitle></DialogHeader>
            <form onSubmit={handlePuppySubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Name</Label><Input placeholder="Puppy Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Gender</Label><Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}><SelectTrigger><SelectValue placeholder="Select Gender" /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1"><Label>Color</Label><Input placeholder="Color" value={formData.color} onChange={e => setFormData({ ...formData, color: e.target.value })} /></div>
                    <div className="space-y-1"><Label>Status</Label><Select value={formData.status} onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}><SelectTrigger><SelectValue placeholder="Select Status" /></SelectTrigger><SelectContent><SelectItem value="Available">Available</SelectItem><SelectItem value="Sold">Sold</SelectItem><SelectItem value="Kept">Kept</SelectItem><SelectItem value="Hold">Hold</SelectItem><SelectItem value="Deposit Received">Deposit Received</SelectItem></SelectContent></Select></div>
                </div>
                {formData.status === 'Sold' && (
                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1"><Label>Price Sold</Label><Input placeholder="Price Sold" type="number" step="0.01" value={formData.price_sold} onChange={e => setFormData({ ...formData, price_sold: e.target.value })} /></div>
                        <div className="space-y-1"><Label>Buyer</Label><Select value={formData.buyer_id} onValueChange={(value) => setFormData(prev => ({ ...prev, buyer_id: value }))}>
                            <SelectTrigger><SelectValue placeholder="Select Buyer" /></SelectTrigger>
                            <SelectContent>
                                {buyers && buyers.map(buyer => <SelectItem key={buyer.id} value={buyer.id}>{buyer.name}</SelectItem>)}
                            </SelectContent>
                        </Select></div>
                        <div className="space-y-1"><Label>Date Sold</Label><Input type="date" value={formData.date_sold} onChange={e => setFormData({ ...formData, date_sold: e.target.value })} /></div>
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="cost_of_goods">Cost of Goods</Label>
                    <Input id="cost_of_goods" placeholder="Cost of Goods" type="number" step="0.01" value={formData.cost_of_goods} onChange={e => setFormData({ ...formData, cost_of_goods: e.target.value })} />
                </div>
                <DialogFooter><Button type="submit">{editingPuppy ? 'Update' : 'Add'} Puppy</Button></DialogFooter>
            </form>
        </DialogContent>
    );
};
