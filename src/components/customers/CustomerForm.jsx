
import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const CustomerForm = ({ editingCustomer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ 
        name: '', email: '', phone: '', address: '', notes: '', credits: '0', discounts: '0', customer_number: '', city_state: '', is_repeat_buyer: false, linked_customer_number: '', delivery_method: '', delivery_mileage: '', delivery_cost: '', delivery_notes: '',
        on_payment_plan: false, payment_plan_balance: '', payment_plan_terms: '', payment_plan_amount: ''
    });
    const [availablePuppies, setAvailablePuppies] = useState([]);
    const [selectedPuppyId, setSelectedPuppyId] = useState(null);
    const { user } = useAuth();

    const fetchAvailablePuppies = useCallback(async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('puppies')
            .select('id, name')
            .eq('status', 'Available')
            .eq('user_id', user.id);
        
        if (!error) {
            setAvailablePuppies(data);
        }
    }, [user]);

    useEffect(() => {
        fetchAvailablePuppies();
    }, [fetchAvailablePuppies]);

    useEffect(() => {
        const defaults = { 
            name: '', email: '', phone: '', address: '', notes: '', credits: '0', discounts: '0', customer_number: '', city_state: '', is_repeat_buyer: false, linked_customer_number: '', delivery_method: '', delivery_mileage: '', delivery_cost: '', delivery_notes: '',
            on_payment_plan: false, payment_plan_balance: '', payment_plan_terms: '', payment_plan_amount: ''
        };
        if (editingCustomer) {
            const customerData = {};
            for (const key in defaults) {
                customerData[key] = editingCustomer[key] ?? defaults[key];
                if (typeof customerData[key] === 'number') {
                    customerData[key] = customerData[key].toString();
                }
            }
            setFormData(customerData);
        } else {
            setFormData(defaults);
            setSelectedPuppyId(null);
        }
    }, [editingCustomer]);
    
    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({...prev, [id]: value}));
    }

    const handleCheckboxChange = (id, checked) => {
        setFormData(prev => ({...prev, [id]: !!checked}));
    }

    const handleSubmit = (e) => {
        e.preventDefault();
        const dataToSave = { ...formData, 
            credits: parseFloat(formData.credits || 0), 
            discounts: parseFloat(formData.discounts || 0),
            customer_number: parseInt(formData.customer_number) || null,
            linked_customer_number: formData.is_repeat_buyer ? parseInt(formData.linked_customer_number) || null : null,
            delivery_mileage: parseFloat(formData.delivery_mileage || 0),
            delivery_cost: parseFloat(formData.delivery_cost || 0),
            payment_plan_balance: formData.on_payment_plan ? parseFloat(formData.payment_plan_balance || 0) : null,
            payment_plan_amount: formData.on_payment_plan ? parseFloat(formData.payment_plan_amount || 0) : null,
            payment_plan_terms: formData.on_payment_plan ? formData.payment_plan_terms : null,
        };
        onSave(dataToSave, selectedPuppyId);
    };

    return (
        <DialogContent className="bg-white text-black max-w-3xl z-[1000]">
            <DialogHeader><DialogTitle>{editingCustomer ? 'Edit' : 'Add'} Customer</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={handleChange} required /></div>
                    <div className="space-y-2"><Label htmlFor="customer_number">Customer #</Label><Input id="customer_number" type="number" value={formData.customer_number} onChange={handleChange} /></div>
                </div>
                {!editingCustomer && (
                    <div className="space-y-2">
                        <Label htmlFor="puppy_id">Assign Puppy (Optional)</Label>
                        <Select onValueChange={value => setSelectedPuppyId(value)}>
                            <SelectTrigger><SelectValue placeholder="Select an available puppy"/></SelectTrigger>
                            <SelectContent>
                                <SelectItem value={null}>None</SelectItem>
                                {availablePuppies.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={handleChange} /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="address">Full Address</Label><Input id="address" value={formData.address} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="city_state">City, State (for map)</Label><Input id="city_state" value={formData.city_state} onChange={handleChange} placeholder="e.g. Los Angeles, CA"/></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="credits">Credits ($)</Label><Input id="credits" type="number" step="0.01" value={formData.credits} onChange={handleChange} /></div>
                    <div className="space-y-2"><Label htmlFor="discounts">Discounts ($)</Label><Input id="discounts" type="number" step="0.01" value={formData.discounts} onChange={handleChange} /></div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                    <Checkbox id="is_repeat_buyer" checked={formData.is_repeat_buyer} onCheckedChange={(checked) => handleCheckboxChange('is_repeat_buyer', checked)} />
                    <Label htmlFor="is_repeat_buyer">Repeat Buyer (Link to another profile)</Label>
                </div>
                {formData.is_repeat_buyer && (
                    <div className="space-y-2"><Label htmlFor="linked_customer_number">Previous Customer #</Label><Input id="linked_customer_number" type="number" value={formData.linked_customer_number} onChange={handleChange} /></div>
                )}
                <div className="space-y-2"><Label>Delivery/Pickup</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2"><Label htmlFor="delivery_method" className="text-xs">Method</Label>
                            <Select value={formData.delivery_method} onValueChange={value => setFormData(prev => ({...prev, delivery_method: value}))}>
                                <SelectTrigger><SelectValue placeholder="Select Method"/></SelectTrigger>
                                <SelectContent><SelectItem value="Owner Pickup">Owner Pickup</SelectItem><SelectItem value="We Met">We Met Halfway</SelectItem><SelectItem value="We Delivered">We Delivered</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2"><Label htmlFor="delivery_mileage" className="text-xs">Mileage</Label><Input id="delivery_mileage" type="number" value={formData.delivery_mileage} onChange={handleChange} /></div>
                        <div className="space-y-2"><Label htmlFor="delivery_cost" className="text-xs">Associated Cost</Label><Input id="delivery_cost" type="number" step="0.01" value={formData.delivery_cost} onChange={handleChange} /></div>
                    </div>
                    <Textarea id="delivery_notes" value={formData.delivery_notes} onChange={handleChange} placeholder="Delivery notes (e.g., hotel bills, meeting points)..."/>
                </div>
                <div className="space-y-2 pt-2 border-t">
                    <div className="flex items-center space-x-2">
                        <Checkbox id="on_payment_plan" checked={formData.on_payment_plan} onCheckedChange={(checked) => handleCheckboxChange('on_payment_plan', checked)} />
                        <Label htmlFor="on_payment_plan">On Payment Plan</Label>
                    </div>
                    {formData.on_payment_plan && (
                        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-md">
                            <div className="space-y-2"><Label htmlFor="payment_plan_balance">Balance</Label><Input id="payment_plan_balance" type="number" step="0.01" value={formData.payment_plan_balance} onChange={handleChange} /></div>
                            <div className="space-y-2"><Label htmlFor="payment_plan_terms">Terms</Label><Input id="payment_plan_terms" value={formData.payment_plan_terms} onChange={handleChange} placeholder="e.g., Weekly, Bi-Weekly"/></div>
                            <div className="space-y-2"><Label htmlFor="payment_plan_amount">Payment Amt</Label><Input id="payment_plan_amount" type="number" step="0.01" value={formData.payment_plan_amount} onChange={handleChange} /></div>
                        </div>
                    )}
                </div>
                <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editingCustomer ? 'Update' : 'Add'} Customer</Button></DialogFooter>
            </form>
        </DialogContent>
    );
};
