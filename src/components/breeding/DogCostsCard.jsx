
import React, { useState, useEffect, useCallback } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber, toInputDate, toDisplayDate } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const DogCostsCard = ({ dogId }) => {
    const [costs, setCosts] = useState([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState({ cost_date: toInputDate(new Date()), description: '', amount: '', cost_type: 'Other' });
    const { user } = useAuth();
    const { toast } = useToast();

    const fetchCosts = useCallback(async () => {
        if (!user || !dogId) return;
        const { data, error } = await supabase.from('dog_costs').select('*').eq('dog_id', dogId).order('cost_date', { ascending: false });
        if (error) toast({ title: 'Error fetching costs', variant: 'destructive' });
        else setCosts(data);
    }, [user, dogId, toast]);

    useEffect(() => { fetchCosts(); }, [fetchCosts]);

    const handleSave = async (e) => {
        e.preventDefault();
        const description = formData.cost_type === 'Other' ? formData.description : formData.cost_type;
        const dataToSave = { ...formData, user_id: user.id, dog_id: dogId, amount: parseFloat(formData.amount), description };
        const { error } = await supabase.from('dog_costs').insert(dataToSave);
        if (error) toast({ title: 'Error saving cost', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Cost added.' });
            setIsDialogOpen(false);
            setFormData({ cost_date: toInputDate(new Date()), description: '', amount: '', cost_type: 'Other' });
            fetchCosts();
        }
    };

    const handleDelete = async (id) => {
        const { error } = await supabase.from('dog_costs').delete().eq('id', id);
        if (error) toast({ title: 'Error deleting cost', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Cost deleted.' });
            fetchCosts();
        }
    };

    const totalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><DollarSign />Dog-Specific Costs</CardTitle>
                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Cost</Button></DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Add New Cost</DialogTitle></DialogHeader>
                            <form onSubmit={handleSave} className="space-y-4">
                                <Input type="date" value={formData.cost_date} onChange={e => setFormData({...formData, cost_date: e.target.value})} required />
                                <Select value={formData.cost_type} onValueChange={val => setFormData({...formData, cost_type: val})}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Vaccinations">Vaccinations</SelectItem>
                                        <SelectItem value="Registration Fee">Registration Fee</SelectItem>
                                        <SelectItem value="Other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                                {formData.cost_type === 'Other' && (
                                    <Input placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} required />
                                )}
                                <Input type="number" step="0.01" placeholder="Amount" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} required />
                                <DialogFooter><Button type="submit">Save Cost</Button></DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <p className="mb-2 font-bold">Total Costs: ${formatNumber(totalCosts)}</p>
                <div className="max-h-48 overflow-y-auto">
                    <Table>
                        <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Description</TableHead><TableHead>Amount</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
                        <TableBody>
                            {costs.map(cost => (
                                <TableRow key={cost.id}>
                                    <TableCell>{toDisplayDate(cost.cost_date)}</TableCell>
                                    <TableCell>{cost.description}</TableCell>
                                    <TableCell>${formatNumber(cost.amount)}</TableCell>
                                    <TableCell><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(cost.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                {costs.length === 0 && <p className="text-center text-muted-foreground py-4">No costs recorded.</p>}
            </CardContent>
        </Card>
    );
};
