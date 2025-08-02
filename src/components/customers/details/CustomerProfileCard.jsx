
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit, Phone, Mail, MapPin, Repeat, Trash2 } from 'lucide-react';
import { CustomerForm } from '../CustomerForm';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

export function CustomerProfileCard({ customer, onUpdate, onDelete }) {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();

    const handleSave = async (formData) => {
        const { error } = await supabase.from('buyers').update(formData).eq('id', customer.id);
        if (error) {
            toast({ title: 'Error updating customer', variant: 'destructive', description: error.message });
        } else {
            toast({ title: 'Customer updated successfully' });
            onUpdate();
            setIsFormOpen(false);
        }
    };

    return (
        <Card className="bg-white text-black">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl">{customer.name}</CardTitle>
                    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                        <DialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button></DialogTrigger>
                        <CustomerForm editingCustomer={customer} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />
                    </Dialog>
                </div>
                {customer.is_repeat_buyer && <CardDescription className="flex items-center gap-1 font-bold text-blue-600"><Repeat size={14}/> Repeat Buyer (Prev #: {customer.linked_customer_number})</CardDescription>}
            </CardHeader>
            <CardContent className="text-sm space-y-2">
                <p className="flex items-center gap-2"><Mail size={14} /> {customer.email || 'N/A'}</p>
                <p className="flex items-center gap-2"><Phone size={14} /> {customer.phone || 'N/A'}</p>
                <p className="flex items-center gap-2"><MapPin size={14} /> {customer.address || 'N/A'}</p>
                <div className="pt-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="destructive" className="w-full"><Trash2 className="mr-2 h-4 w-4" /> Delete Customer</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete this customer and all their associated notes. This cannot be undone.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
        </Card>
    );
}
