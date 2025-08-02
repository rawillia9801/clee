
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toInputDate } from '@/lib/utils';

export const AddLitterDialog = ({ damId, isOpen, setIsOpen, onLitterAdded }) => {
    const [formData, setFormData] = useState({ sire_name: '', litter_date: '', number_of_puppies: '', notes: '' });
    const { user } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (isOpen) {
            setFormData({ sire_name: '', litter_date: toInputDate(new Date()), number_of_puppies: '', notes: '' });
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        const { error } = await supabase.from('litters').insert({ ...formData, dam_id: damId, user_id: user.id, litter_date: formData.litter_date });
        if (error) {
            toast({ title: 'Error adding litter', description: error.message, variant: 'destructive' });
        } else {
            toast({ title: 'Success', description: 'Litter added successfully' });
            setIsOpen(false);
            onLitterAdded();
        }
    };

    return (
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Litter</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="sire_name">Sire Name</Label><Input id="sire_name" placeholder="Sire Name" value={formData.sire_name} onChange={e => setFormData({ ...formData, sire_name: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="litter_date">Litter Date</Label><Input id="litter_date" type="date" value={formData.litter_date} onChange={e => setFormData({ ...formData, litter_date: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="number_of_puppies">Number of Puppies</Label><Input id="number_of_puppies" type="number" placeholder="Number of Puppies" value={formData.number_of_puppies} onChange={e => setFormData({ ...formData, number_of_puppies: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" placeholder="Notes" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} /></div>
                <DialogFooter><Button type="submit">Add Litter</Button></DialogFooter>
            </form>
        </DialogContent>
    );
};
