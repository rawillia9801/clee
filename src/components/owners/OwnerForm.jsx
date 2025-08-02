import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OwnerForm = ({ editingBuyer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ 
        name: '', email: '', phone: '', address: '', notes: '', credit: '0', customer_number: '', city_state: '', is_repeat_buyer: false, linked_customer_number: '', delivery_method: '', delivery_mileage: '', delivery_cost: '', delivery_notes: '' 
    });

    useEffect(() => {
        if (editingBuyer) {
            setFormData({
                name: editingBuyer.name || '', email: editingBuyer.email || '', phone: editingBuyer.phone || '', address: editingBuyer.address || '', notes: editingBuyer.notes || '',
                credit: editingBuyer.credit?.toString() || '0', customer_number: editingBuyer.customer_number?.toString() || '',
                city_state: editingBuyer.city_state || '',
                is_repeat_buyer: editingBuyer.is_repeat_buyer || false,
                linked_customer_number: editingBuyer.linked_customer_number?.toString() || '',
                delivery_method: editingBuyer.delivery_method || '',
                delivery_mileage: editingBuyer.delivery_mileage?.toString() || '',
                delivery_cost: editingBuyer.delivery_cost?.toString() || '',
                delivery_notes: editingBuyer.delivery_notes || ''
            });
        } else {
            setFormData({ name: '', email: '', phone: '', address: '', notes: '', credit: '0', customer_number: '', city_state: '', is_repeat_buyer: false, linked_customer_number: '', delivery_method: '', delivery_mileage: '', delivery_cost: '', delivery_notes: '' });
        }
    }, [editingBuyer]);
    
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleCheckboxChange = (checked) => {
        setFormData(prev => ({...prev, is_repeat_buyer: checked}));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, 
            credit: parseFloat(formData.credit || 0), 
            customer_number: parseInt(formData.customer_number) || null,
            linked_customer_number: formData.is_repeat_buyer ? parseInt(formData.linked_customer_number) || null : null,
            delivery_mileage: parseFloat(formData.delivery_mileage || 0),
            delivery_cost: parseFloat(formData.delivery_cost || 0),
        };
        onSave(dataToSave);
    };

    return (
        <DialogContent className="bg-white text-black max-w-3xl">
            <DialogHeader><DialogTitle>{editingBuyer ? 'Edit' : 'Add'} Owner</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="customer_number">Customer #</Label><Input id="customer_number" type="number" value={formData.customer_number} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="address">Full Address</Label><Input id="address" value={formData.address} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="city_state">City, State (for map)</Label><Input id="city_state" value={formData.city_state} onChange={handleChange} placeholder="e.g. Los Angeles, CA"/></div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="is_repeat_buyer" checked={formData.is_repeat_buyer} onCheckedChange={handleCheckboxChange} />
                    <Label htmlFor="is_repeat_buyer">Repeat Buyer</Label>
                </div>
                {formData.is_repeat_buyer && (
                    <div className="space-y-2"><Label htmlFor="linked_customer_number">Previous Customer #</Label><Input id="linked_customer_number" type="number" value={formData.linked_customer_number} onChange={handleChange} /></div>
                )}
                <div className="space-y-2"><Label>Delivery/Pickup</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="delivery_method" className="text-xs">Method</Label>
                            <Select id="delivery_method" value={formData.delivery_method} onValueChange={value => setFormData(prev => ({...prev, delivery_method: value}))}>
                                <SelectTrigger><SelectValue placeholder="Select Method"/></SelectTrigger>
                                <SelectContent><SelectItem value="Owner Pickup">Owner Pickup</SelectItem><SelectItem value="We Met">We Met Halfway</SelectItem><SelectItem value="We Delivered">We Delivered</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="delivery_mileage" className="text-xs">Mileage</Label><Input id="delivery_mileage" type="number" value={formData.delivery_mileage} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="delivery_cost" className="text-xs">Associated Cost</Label><Input id="delivery_cost" type="number" step="0.01" value={formData.delivery_cost} onChange={handleChange} /></div>
                    </div>
                    <Textarea id="delivery_notes" value={formData.delivery_notes} onChange={handleChange} placeholder="Delivery notes..."/>
                </div>
                <div className="space-y-2"><Label htmlFor="notes">General Notes</Label><Textarea id="notes" value={formData.notes} onChange={handleChange} /></div>
                <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editingBuyer ? 'Update' : 'Add'} Owner</Button></DialogFooter>
            </form>
        </DialogContent>
    );
};