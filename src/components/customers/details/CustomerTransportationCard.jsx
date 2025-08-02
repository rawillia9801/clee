
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';
import { Truck, Edit } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/lib/utils';

export function CustomerTransportationCard({ puppies, onUpdate }) {
    const [editingPuppy, setEditingPuppy] = useState(null);
    const [formData, setFormData] = useState({});
    const { toast } = useToast();

    const handleEdit = (puppy) => {
        setEditingPuppy(puppy);
        setFormData(puppy.transportation_details || { disposition: '', mileage: '', hotel_costs: '', other_costs: '' });
    };

    const handleSave = async () => {
        const { error } = await supabase
            .from('puppies')
            .update({ transportation_details: formData })
            .eq('id', editingPuppy.id);
        
        if (error) {
            toast({ title: 'Error saving transportation details', variant: 'destructive' });
        } else {
            toast({ title: 'Transportation details saved!' });
            setEditingPuppy(null);
            onUpdate();
        }
    };

    return (
        <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Truck size={20}/>Transportation</CardTitle></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Puppy</TableHead><TableHead>Disposition</TableHead><TableHead>Mileage</TableHead><TableHead>Costs</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {puppies.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.name}</TableCell>
                                <TableCell>{p.transportation_details?.disposition || 'N/A'}</TableCell>
                                <TableCell>{p.transportation_details?.mileage || 'N/A'}</TableCell>
                                <TableCell>${formatNumber((p.transportation_details?.hotel_costs || 0) + (p.transportation_details?.other_costs || 0))}</TableCell>
                                <TableCell>
                                    <Dialog open={!!editingPuppy && editingPuppy.id === p.id} onOpenChange={(isOpen) => !isOpen && setEditingPuppy(null)}>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}><Edit size={14}/></Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <CardHeader><CardTitle>Edit Transportation for {p.name}</CardTitle></CardHeader>
                                            <div className="p-4 space-y-4">
                                                <Input placeholder="Disposition Details" value={formData.disposition || ''} onChange={e => setFormData({...formData, disposition: e.target.value})} />
                                                <Input type="number" placeholder="Mileage" value={formData.mileage || ''} onChange={e => setFormData({...formData, mileage: e.target.value})} />
                                                <Input type="number" placeholder="Hotel Costs" value={formData.hotel_costs || ''} onChange={e => setFormData({...formData, hotel_costs: parseFloat(e.target.value) || 0})} />
                                                <Input type="number" placeholder="Other Costs" value={formData.other_costs || ''} onChange={e => setFormData({...formData, other_costs: parseFloat(e.target.value) || 0})} />
                                                <Button onClick={handleSave}>Save</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
