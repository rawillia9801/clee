
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, toInputDate, toDisplayDate } from '@/lib/utils';
import { EditableField } from './EditableField';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export const PuppyFinancialsCard = ({ puppy, onUpdate, onFieldSave, readOnly }) => {
    const [payments, setPayments] = useState([]);
    const [newPayment, setNewPayment] = useState({ payment_date: toInputDate(new Date()), amount: '' });
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchPayments = useCallback(async () => {
        if (!puppy?.id) return;
        const { data, error } = await supabase.from('puppy_payments').select('*').eq('puppy_id', puppy.id).order('payment_date', { ascending: true });
        if (!error) setPayments(data);
    }, [puppy?.id]);

    useEffect(() => { fetchPayments() }, [fetchPayments]);

    const handleAddPayment = async () => {
        if (!newPayment.amount || !newPayment.payment_date) return;
        const { error } = await supabase.from('puppy_payments').insert({
            puppy_id: puppy.id, user_id: user.id, payment_date: newPayment.payment_date, amount: parseFloat(newPayment.amount)
        });
        if(error) toast({ title: 'Error adding payment', variant: 'destructive' });
        else {
            setNewPayment({ payment_date: toInputDate(new Date()), amount: '' });
            fetchPayments();
            if (onUpdate) onUpdate();
        }
    };

    const handleDeletePayment = async (id) => {
        const { error } = await supabase.from('puppy_payments').delete().eq('id', id);
        if(error) toast({ title: 'Error deleting payment', variant: 'destructive' });
        else {
            fetchPayments();
            if (onUpdate) onUpdate();
        }
    };

    const handleFreePuppyToggle = (checked) => {
        onFieldSave('is_free', checked);
    };

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0) + (puppy.deposit_amount || 0);
    const balance = (puppy.price_sold || 0) - totalPaid - (puppy.credits || 0);

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><DollarSign size={20}/>Financials</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox id="is_free" checked={puppy.is_free} onCheckedChange={handleFreePuppyToggle} disabled={readOnly} />
                    <Label htmlFor="is_free">This was a free puppy (no charge)</Label>
                </div>
                {!puppy.is_free && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <EditableField label="Price" value={puppy.price_sold} onSave={(val) => onFieldSave('price_sold', parseFloat(val) || 0)} type="number" step="0.01" readOnly={readOnly} />
                            <p><strong>Total Paid:</strong> <span className="text-green-400">${formatNumber(totalPaid)}</span></p>
                            <EditableField label="Deposit" value={puppy.deposit_amount} onSave={(val) => onFieldSave('deposit_amount', parseFloat(val) || 0)} type="number" step="0.01" readOnly={readOnly} />
                            <EditableField label="Credits" value={puppy.credits} onSave={(val) => onFieldSave('credits', parseFloat(val) || 0)} type="number" step="0.01" readOnly={readOnly} />
                            <p className="col-span-2"><strong>Balance:</strong> <span className="font-bold text-red-400">${formatNumber(balance)}</span></p>
                        </div>
                        <div className="space-y-2 pt-4 border-t">
                            <p className="font-semibold">Payment History</p>
                            <ul className="space-y-1 text-sm max-h-32 overflow-y-auto">
                                {puppy.deposit_amount > 0 && (
                                    <li className="flex justify-between items-center group">
                                        <span>{puppy.deposit_date ? toDisplayDate(puppy.deposit_date) : 'Deposit'}: ${formatNumber(puppy.deposit_amount)}</span>
                                    </li>
                                )}
                                {payments.map(p => (
                                    <li key={p.id} className="flex justify-between items-center group">
                                        <span>{toDisplayDate(p.payment_date)}: ${formatNumber(p.amount)}</span>
                                        {!readOnly && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDeletePayment(p.id)}><Trash2 size={14}/></Button>}
                                    </li>
                                ))}
                            </ul>
                            {!readOnly && (
                                <div className="flex items-center gap-2">
                                    <Input type="number" placeholder="Amount" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} />
                                    <Input type="date" value={newPayment.payment_date} onChange={e => setNewPayment({...newPayment, payment_date: e.target.value})} />
                                    <Button onClick={handleAddPayment}><Plus size={16} /></Button>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
};
