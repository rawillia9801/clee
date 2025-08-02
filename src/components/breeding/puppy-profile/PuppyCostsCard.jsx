
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, toInputDate, toDisplayDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const PuppyCostsCard = ({ puppyId, onUpdate, readOnly }) => {
    const [costs, setCosts] = useState([]);
    const [newCost, setNewCost] = useState({ cost_date: toInputDate(new Date()), description: '', amount: '', cost_type: 'Other' });
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchCosts = useCallback(async () => {
        if (!puppyId) return;
        const { data, error } = await supabase.from('puppy_costs').select('*').eq('puppy_id', puppyId).order('cost_date', { ascending: true });
        if (!error) setCosts(data);
    }, [puppyId]);

    useEffect(() => { fetchCosts() }, [fetchCosts]);

    const handleAddCost = async () => {
        if (!newCost.amount || !newCost.cost_date || (newCost.cost_type === 'Other' && !newCost.description)) {
            toast({ title: 'Missing Information', description: 'Please fill out all fields for the cost.', variant: 'destructive' });
            return;
        }
        const description = newCost.cost_type === 'Other' ? newCost.description : newCost.cost_type;
        const { error } = await supabase.from('puppy_costs').insert({
            puppy_id: puppyId, user_id: user.id, cost_date: newCost.cost_date, description, amount: parseFloat(newCost.amount), cost_type: newCost.cost_type
        });
        if(error) toast({ title: 'Error adding cost', variant: 'destructive' });
        else {
            setNewCost({ cost_date: toInputDate(new Date()), description: '', amount: '', cost_type: 'Other' });
            fetchCosts();
            if (onUpdate) onUpdate();
            toast({ title: 'Success', description: 'Cost added successfully.' });
        }
    };

    const handleDeleteCost = async (id) => {
        const { error } = await supabase.from('puppy_costs').delete().eq('id', id);
        if(error) toast({ title: 'Error deleting cost', variant: 'destructive' });
        else {
            fetchCosts();
            if (onUpdate) onUpdate();
            toast({ title: 'Success', description: 'Cost deleted.' });
        }
    };

    const totalCosts = costs.reduce((sum, c) => sum + (c.amount || 0), 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><DollarSign size={20}/>Puppy Costs</CardTitle>
                    <p className="font-bold">Total: ${formatNumber(totalCosts)}</p>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2 pt-4 border-t">
                    <p className="font-semibold">Cost History</p>
                    <ul className="space-y-1 text-sm max-h-32 overflow-y-auto">
                        {costs.map(c => (
                            <li key={c.id} className="flex justify-between items-center group">
                                <span>{toDisplayDate(c.cost_date)}: {c.description} - ${formatNumber(c.amount)}</span>
                                {!readOnly && <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive" onClick={() => handleDeleteCost(c.id)}><Trash2 size={14}/></Button>}
                            </li>
                        ))}
                         {costs.length === 0 && <p className="text-muted-foreground text-center">No costs recorded.</p>}
                    </ul>
                    {!readOnly && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
                            <Select value={newCost.cost_type} onValueChange={val => setNewCost({...newCost, cost_type: val})}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="DHPP Vaccination">DHPP Vaccination</SelectItem>
                                    <SelectItem value="Vet. Care">Vet. Care</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                            {newCost.cost_type === 'Other' && (
                                <Input type="text" placeholder="Description" value={newCost.description} onChange={e => setNewCost({...newCost, description: e.target.value})} />
                            )}
                            <Input type="number" placeholder="Amount" value={newCost.amount} onChange={e => setNewCost({...newCost, amount: e.target.value})} className={newCost.cost_type !== 'Other' ? 'col-span-2' : ''} />
                            <Input type="date" value={newCost.cost_date} onChange={e => setNewCost({...newCost, cost_date: e.target.value})} />
                            <Button onClick={handleAddCost} className="w-full"><Plus size={16} /></Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
