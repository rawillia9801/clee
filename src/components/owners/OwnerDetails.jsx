import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Edit, Phone, Mail, MapPin, Dog, PiggyBank, FileText, Repeat, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { OwnerForm } from './OwnerForm';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const getPublicUrl = (filePath) => {
    if (!filePath) return '';
    const { data } = supabase.storage.from('dog_images').getPublicUrl(filePath);
    return data.publicUrl;
};

export function OwnerDetails({ ownerId, onBack, onUpdate }) {
    const [owner, setOwner] = useState(null);
    const [puppies, setPuppies] = useState([]);
    const [payments, setPayments] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchAllDetails = useCallback(async () => {
        if (!ownerId || !user) return;
        setLoading(true);
        
        const [ownerRes, puppiesRes, paymentsRes, docsRes] = await Promise.all([
            supabase.from('buyers').select('*').eq('id', ownerId).eq('user_id', user.id).single(),
            supabase.from('puppies').select('*').eq('buyer_id', ownerId).eq('user_id', user.id),
            supabase.from('payout_details').select('*, puppies(name)').eq('buyer_id', ownerId).eq('user_id', user.id),
            supabase.from('buyer_documents').select('*').eq('buyer_id', ownerId).eq('user_id', user.id)
        ]);

        if (ownerRes.error) toast({ title: 'Error fetching owner data', variant: 'destructive' });
        else setOwner(ownerRes.data);

        if (puppiesRes.error) toast({ title: 'Error fetching puppies', variant: 'destructive' });
        else setPuppies(puppiesRes.data || []);

        if (paymentsRes.error) toast({ title: 'Error fetching payments', variant: 'destructive' });
        else setPayments(paymentsRes.data || []);

        if (docsRes.error) toast({ title: 'Error fetching documents', variant: 'destructive' });
        else setDocuments(docsRes.data || []);

        setLoading(false);
    }, [ownerId, user, toast]);

    useEffect(() => {
        fetchAllDetails();
    }, [fetchAllDetails]);

    const handleSave = () => {
        fetchAllDetails();
        onUpdate(); // To update the main list if name changes etc.
        setIsFormOpen(false);
    };

    const handleDeleteDoc = async (doc) => {
        if(doc.file_path) {
            await supabase.storage.from('dog_images').remove([doc.file_path]);
        }
        const { error } = await supabase.from('buyer_documents').delete().eq('id', doc.id);
        if(error) {
            toast({title:'Error deleting document', variant:'destructive'});
        } else {
            toast({title: 'Document deleted'});
            fetchAllDetails();
        }
    };

    const totalSpent = puppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalBalance = totalSpent - totalPaid;

    if (loading) {
        return <div>Loading owner details...</div>;
    }

    if (!owner) {
        return <div>Owner not found. <Button onClick={onBack}>Go Back</Button></div>;
    }

    return (
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button onClick={onBack} variant="outline" className="mb-4"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Owners</Button>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-white text-black">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-xl">{owner.name}</CardTitle>
                                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8"><Edit className="w-4 h-4" /></Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <OwnerForm editingBuyer={owner} onSave={handleSave} onCancel={() => setIsFormOpen(false)} />
                                    </DialogContent>
                                </Dialog>
                            </div>
                            {owner.is_repeat_buyer && <CardDescription className="flex items-center gap-1 font-bold text-blue-600"><Repeat size={14}/> Repeat Buyer (Prev #: {owner.linked_customer_number})</CardDescription>}
                        </CardHeader>
                        <CardContent className="text-sm space-y-2">
                            <p className="flex items-center gap-2"><Mail size={14} /> {owner.email || 'N/A'}</p>
                            <p className="flex items-center gap-2"><Phone size={14} /> {owner.phone || 'N/A'}</p>
                            <p className="flex items-center gap-2"><MapPin size={14} /> {owner.address || 'N/A'}</p>
                            <div className="pt-2">
                                <p className="font-semibold">Notes:</p>
                                <p className="text-gray-600 whitespace-pre-wrap">{owner.notes || 'No notes.'}</p>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-white text-black">
                        <CardHeader><CardTitle className="text-lg">Financial Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="flex justify-between"><span>Total Purchases:</span> <span className="font-bold">${formatNumber(totalSpent)}</span></p>
                            <p className="flex justify-between"><span>Total Paid:</span> <span className="font-bold text-green-600">${formatNumber(totalPaid)}</span></p>
                            <p className="flex justify-between"><span>Overall Balance:</span> <span className="font-bold text-red-600">${formatNumber(totalBalance)}</span></p>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white text-black">
                        <CardHeader><CardTitle className="flex items-center gap-2"><Dog size={20}/> Purchased Puppies</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Date Sold</TableHead><TableHead>Puppy</TableHead><TableHead>Price</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {puppies.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.date_sold ? format(new Date(p.date_sold), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell>${formatNumber(p.price_sold)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {puppies.length === 0 && <p className="text-center text-gray-500 py-4">No puppies recorded for this owner.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><PiggyBank size={20}/> Payment History</CardTitle></CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Puppy</TableHead><TableHead>Amount</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {payments.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.payment_date ? format(new Date(p.payment_date), 'MM/dd/yyyy') : 'N/A'}</TableCell>
                                            <TableCell>{p.payment_type}</TableCell>
                                            <TableCell>{p.puppies?.name || 'N/A'}</TableCell>
                                            <TableCell>${formatNumber(p.amount)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                            {payments.length === 0 && <p className="text-center text-gray-500 py-4">No payments recorded.</p>}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><FileText size={20}/> Documents</CardTitle></CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {documents.map(doc => (
                                    <div key={doc.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                        <div>
                                            <a href={getPublicUrl(doc.file_path)} target="_blank" rel="noopener noreferrer" className="flex-grow truncate hover:underline">{doc.file_name}</a>
                                            <p className="text-xs text-gray-500">{doc.document_type}</p>
                                        </div>
                                        <div className="flex items-center">
                                            <a href={getPublicUrl(doc.file_path)} download><Button variant="ghost" size="icon"><Download className="w-4 h-4" /></Button></a>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="w-4 h-4" /></Button></AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader><AlertDialogTitle>Delete Document?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the document.</AlertDialogDescription></AlertDialogHeader>
                                                    <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteDoc(doc)}>Delete</AlertDialogAction></AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {documents.length === 0 && <p className="text-center text-gray-500 py-4">No documents uploaded.</p>}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </motion.div>
    );
}