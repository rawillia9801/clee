
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dog, Plus, Edit, Save, X } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';

export function CustomerPuppiesCard({ customer, puppies, onUpdate }) {
    const [editingPuppy, setEditingPuppy] = useState(null);
    const [isAddPuppyOpen, setIsAddPuppyOpen] = useState(false);
    const [availablePuppies, setAvailablePuppies] = useState([]);
    const [selectedPuppyToAdd, setSelectedPuppyToAdd] = useState('');
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchAvailablePuppies = useCallback(async () => {
        if (!user) return;
        const { data } = await supabase.from('puppies').select('id, name').eq('status', 'Available').eq('user_id', user.id);
        setAvailablePuppies(data || []);
    }, [user]);

    useEffect(() => {
        if (isAddPuppyOpen) {
            fetchAvailablePuppies();
        }
    }, [isAddPuppyOpen, fetchAvailablePuppies]);

    const handlePuppySaleUpdate = async () => {
        const { error } = await supabase.from('puppies').update({ price_sold: editingPuppy.price_sold, date_sold: editingPuppy.date_sold }).eq('id', editingPuppy.id);
        if (error) toast({ title: 'Error updating puppy sale', variant: 'destructive' });
        else {
            toast({ title: 'Puppy sale updated!' });
            setEditingPuppy(null);
            onUpdate();
        }
    };

    const handleAddPuppyToCustomer = async () => {
        if (!selectedPuppyToAdd) return;
        const { error } = await supabase.from('puppies').update({ buyer_id: customer.id, status: 'Sold' }).eq('id', selectedPuppyToAdd);
        if (error) {
            toast({ title: 'Error assigning puppy', variant: 'destructive' });
        } else {
            toast({ title: 'Puppy assigned successfully!' });
            setIsAddPuppyOpen(false);
            setSelectedPuppyToAdd('');
            onUpdate();
        }
    };

    return (
        <Card className="bg-white text-black">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2"><Dog size={20}/> Purchased Puppies</CardTitle>
                    <Dialog open={isAddPuppyOpen} onOpenChange={setIsAddPuppyOpen}>
                        <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2"/>Add Puppy</Button></DialogTrigger>
                        <DialogContent>
                            <CardHeader><CardTitle>Add another puppy for {customer.name}</CardTitle></CardHeader>
                            <div className="p-4 space-y-4">
                                <Select onValueChange={setSelectedPuppyToAdd}><SelectTrigger><SelectValue placeholder="Select an available puppy"/></SelectTrigger>
                                    <SelectContent>{availablePuppies.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                                </Select>
                                <Button onClick={handleAddPuppyToCustomer} disabled={!selectedPuppyToAdd}>Assign Puppy</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Puppy</TableHead><TableHead>Date Sold</TableHead><TableHead>Price</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {puppies.map(p => (
                            <TableRow key={p.id}>
                                <TableCell><Button variant="link" className="p-0 h-auto" onClick={() => window.dispatchEvent(new CustomEvent('setactivetab', { detail: `puppies_${p.id}` }))}>{p.name}</Button></TableCell>
                                {editingPuppy?.id === p.id ? (
                                    <>
                                        <TableCell><Input type="date" value={editingPuppy.date_sold ? format(new Date(editingPuppy.date_sold), 'yyyy-MM-dd') : ''} onChange={e => setEditingPuppy({...editingPuppy, date_sold: e.target.value})} className="h-8" /></TableCell>
                                        <TableCell><Input type="number" value={editingPuppy.price_sold} onChange={e => setEditingPuppy({...editingPuppy, price_sold: e.target.value})} className="h-8 w-24" /></TableCell>
                                        <TableCell className="flex gap-1"><Button size="icon" className="h-8 w-8" onClick={handlePuppySaleUpdate}><Save size={16}/></Button><Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingPuppy(null)}><X size={16}/></Button></TableCell>
                                    </>
                                ) : (
                                    <>
                                        <TableCell>{p.date_sold ? format(new Date(p.date_sold), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                        <TableCell>${formatNumber(p.price_sold)}</TableCell>
                                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingPuppy({...p})}><Edit size={14}/></Button></TableCell>
                                    </>
                                )}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {puppies.length === 0 && <p className="text-center text-gray-500 py-4">No puppies recorded for this customer.</p>}
            </CardContent>
        </Card>
    );
}
