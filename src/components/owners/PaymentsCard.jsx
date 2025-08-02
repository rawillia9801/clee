import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PiggyBank, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { PaymentForm } from './PaymentForm';

export const PaymentsCard = ({ owner, puppies, initialPayments, onUpdate }) => {
    const [payments, setPayments] = useState(initialPayments);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const { user } = useAuth();
    const { toast } = useToast();

    const handleSavePayment = async (formData) => {
        const paymentData = { ...formData, user_id: user.id, buyer_id: owner.id, buyer_name: owner.name, puppy_id: formData.puppy_id || null };
        const { error } = await supabase.from('payout_details').insert(paymentData);
        if (error) toast({ title: 'Error saving payment', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Payment saved.' });
            setIsDialogOpen(false);
            onUpdate();
        }
    };

    const handleDeletePayment = async (paymentId) => {
        const { error } = await supabase.from('payout_details').delete().eq('id', paymentId);
        if (error) toast({ title: 'Error deleting payment', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Payment deleted.' });
            onUpdate();
        }
    };

    React.useEffect(() => {
        setPayments(initialPayments);
    }, [initialPayments]);

    return (
        <Card className="bg-white text-black">
            <CardHeader className="flex flex-row justify-between items-center">
                <CardTitle className="flex items-center gap-2"><PiggyBank size={20} /> Payments</CardTitle>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-2" />Add Payment</Button></DialogTrigger>
                    <DialogContent className="bg-white text-black">
                        <DialogHeader><DialogTitle>Add Payment for {owner.name}</DialogTitle></DialogHeader>
                        <PaymentForm puppies={puppies} onSave={handleSavePayment} onCancel={() => setIsDialogOpen(false)} />
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Amount</TableHead><TableHead>Type</TableHead><TableHead>Puppy</TableHead><TableHead></TableHead></TableRow></TableHeader>
                    <TableBody>
                        {payments.map(p => (
                            <TableRow key={p.id}>
                                <TableCell>{p.payment_date ? format(new Date(p.payment_date), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                <TableCell>${formatNumber(p.amount)}</TableCell>
                                <TableCell>{p.payment_type}</TableCell>
                                <TableCell>{p.puppies?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="h-8 w-8 text-red-500"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Payment?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeletePayment(p.id)}>Delete</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                {payments.length === 0 && <p className="text-gray-500 text-center pt-4">No payments recorded.</p>}
            </CardContent>
        </Card>
    );
};