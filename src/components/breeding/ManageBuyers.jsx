import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Mail, Home, DollarSign, Gift, Truck, MapPin, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { formatNumber } from '@/lib/utils';

const BuyerForm = ({ editingBuyer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', email: '', phone: '', address: '', notes: '', credit: '0', customer_number: '' });

    useEffect(() => {
        if (editingBuyer) {
            setFormData({
                name: editingBuyer.name || '', email: editingBuyer.email || '', phone: editingBuyer.phone || '', address: editingBuyer.address || '', notes: editingBuyer.notes || '',
                credit: editingBuyer.credit?.toString() || '0', customer_number: editingBuyer.customer_number?.toString() || ''
            });
        } else {
            setFormData({ name: '', email: '', phone: '', address: '', notes: '', credit: '0', customer_number: '' });
        }
    }, [editingBuyer]);

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({ ...formData, credit: parseFloat(formData.credit || 0), customer_number: parseInt(formData.customer_number) || null });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 text-black">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="name">Name *</Label><Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /></div>
                <div className="space-y-2"><Label htmlFor="customer_number">Customer #</Label><Input id="customer_number" type="number" value={formData.customer_number} onChange={e => setFormData({...formData, customer_number: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                <div className="space-y-2"><Label htmlFor="phone">Phone</Label><Input id="phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
            </div>
            <div className="space-y-2"><Label htmlFor="address">Address</Label><Input id="address" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="credit">Credits</Label><Input id="credit" type="number" step="0.01" value={formData.credit} onChange={e => setFormData({...formData, credit: e.target.value})} /></div>
            <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
            <DialogFooter><Button type="button" variant="outline" onClick={onCancel}>Cancel</Button><Button type="submit">{editingBuyer ? 'Update' : 'Add'} Buyer</Button></DialogFooter>
        </form>
    );
};

const RefundDialog = ({ onConfirm }) => {
    const [depositAmount, setDepositAmount] = useState('');
    return (
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Deposit Refund</AlertDialogTitle><AlertDialogDescription>Was the deposit for this transaction refunded?</AlertDialogDescription></AlertDialogHeader>
            <div className="space-y-4"><Label>If no, please enter the non-refunded deposit amount:</Label><Input type="number" step="0.01" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} placeholder="Enter deposit amount" /></div>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onConfirm(true, 0)}>Yes, Deposit Refunded</AlertDialogAction><AlertDialogAction onClick={() => onConfirm(false, parseFloat(depositAmount || 0))}>No, Keep Deposit</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
    )
};

const DeliveryForm = ({ buyer, onSave, onCancel }) => {
    const [deliveryInfo, setDeliveryInfo] = useState(buyer.delivery_info || { miles: '', cost: '', notes: '' });
    
    const handleSave = () => {
        onSave(deliveryInfo);
    };

    return (
        <DialogContent className="bg-white text-black">
            <DialogHeader><DialogTitle>Delivery/Pickup Info for {buyer.name}</DialogTitle></DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2"><Label htmlFor="miles">Miles Traveled</Label><Input id="miles" type="number" value={deliveryInfo.miles} onChange={e => setDeliveryInfo({...deliveryInfo, miles: e.target.value})} /></div>
                <div className="space-y-2"><Label htmlFor="cost">Associated Costs</Label><Input id="cost" type="number" step="0.01" value={deliveryInfo.cost} onChange={e => setDeliveryInfo({...deliveryInfo, cost: e.target.value})} /></div>
                <div className="space-y-2"><Label htmlFor="delivery-notes">Notes</Label><Textarea id="delivery-notes" value={deliveryInfo.notes} onChange={e => setDeliveryInfo({...deliveryInfo, notes: e.target.value})} /></div>
            </div>
            <DialogFooter><Button variant="outline" onClick={onCancel}>Cancel</Button><Button onClick={handleSave}>Save</Button></DialogFooter>
        </DialogContent>
    )
}

export function BuyersTab() {
    const [buyers, setBuyers] = useState([]);
    const [puppies, setPuppies] = useState([]);
    const [payoutDetails, setPayoutDetails] = useState([]);
    const [selectedBuyer, setSelectedBuyer] = useState(null);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingBuyer, setEditingBuyer] = useState(null);
    const [isRefund, setIsRefund] = useState(false);
    const [isDeliveryFormOpen, setIsDeliveryFormOpen] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const fetchData = useCallback(async () => {
        if (!user) return;
        const [buyersRes, puppiesRes, payoutsRes] = await Promise.all([
            supabase.from('buyers').select('*').eq('user_id', user.id).order('customer_number'),
            supabase.from('puppies').select('*').eq('user_id', user.id).eq('status', 'Sold'),
            supabase.from('payout_details').select('*').eq('user_id', user.id)
        ]);
        if (buyersRes.error) toast({ title: 'Error fetching buyers', variant: 'destructive' }); else setBuyers(buyersRes.data || []);
        if (puppiesRes.error) toast({ title: 'Error fetching puppies', variant: 'destructive' }); else setPuppies(puppiesRes.data || []);
        if (payoutsRes.error) toast({ title: 'Error fetching payments', variant: 'destructive' }); else setPayoutDetails(payoutsRes.data || []);
    }, [user, toast]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const buyerData = useMemo(() => buyers.map(buyer => {
        const buyerPuppies = puppies.filter(p => p.buyer_id === buyer.id);
        const buyerPayments = payoutDetails.filter(p => p.buyer_id === buyer.id);
        const totalOwed = buyerPuppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
        const totalPaid = buyerPayments.reduce((sum, p) => sum + (p.amount || 0), 0) + (buyer.credit || 0);
        return { ...buyer, puppies: buyerPuppies, payments: buyerPayments, totalOwed, totalPaid, balance: totalOwed - totalPaid };
    }), [buyers, puppies, payoutDetails]);

    const handleSaveBuyer = async (formData) => {
        const dataToSave = { ...formData, user_id: user.id };
        const { error } = editingBuyer ? await supabase.from('buyers').update(dataToSave).eq('id', editingBuyer.id) : await supabase.from('buyers').insert(dataToSave);
        if (error) toast({ title: `Error saving buyer`, description: error.message, variant: 'destructive' });
        else {
            toast({ title: 'Success', description: `Buyer ${editingBuyer ? 'updated' : 'added'}.` });
            setIsFormOpen(false); setEditingBuyer(null); fetchData();
        }
    };
    
    const handleSaveDeliveryInfo = async (deliveryInfo) => {
        const { error } = await supabase.from('buyers').update({ delivery_info: deliveryInfo }).eq('id', selectedBuyer.id);
        if (error) toast({ title: 'Error saving delivery info', variant: 'destructive' });
        else {
            toast({ title: 'Success', description: 'Delivery info saved.' });
            setIsDeliveryFormOpen(false);
            fetchData();
            setSelectedBuyer(prev => ({...prev, delivery_info: deliveryInfo}));
        }
    };

    const handleRefundConfirm = async (wasRefunded, amount) => {
        if (!wasRefunded && amount > 0) {
            const { error } = await supabase.from('non_refunded_deposits').insert({ user_id: user.id, buyer_id: selectedBuyer.id, deposit_amount: amount, reason: 'Customer refund processed without deposit return.' });
            if (error) toast({title: 'Error logging deposit', variant: 'destructive'}); else toast({title: 'Success', description: 'Non-refunded deposit logged.'});
        }
        setIsRefund(false);
    };

    return (
        <div className="bg-white text-black p-6 rounded-lg max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-black">Buyers</h1>
                <Button onClick={() => { setEditingBuyer(null); setIsFormOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Buyer</Button>
            </div>
            <div className="flex gap-6">
                <div className="w-1/3"><div className="space-y-2">{buyerData.map(buyer => (
                    <Card key={buyer.id} onClick={() => setSelectedBuyer(buyer)} className={`cursor-pointer hover:border-pink-500 ${selectedBuyer?.id === buyer.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200'}`}>
                        <CardContent className="p-3"><p className="font-bold text-black">#{buyer.customer_number} - {buyer.name}</p><p className={`text-sm ${buyer.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>Balance: ${formatNumber(buyer.balance)}</p></CardContent>
                    </Card>))}</div>
                </div>
                <div className="w-2/3">{selectedBuyer ? (
                    <motion.div initial={{opacity: 0}} animate={{opacity: 1}} className="space-y-6">
                        <Card><CardHeader className="flex flex-row justify-between items-start">
                                <div><CardTitle className="text-2xl text-black">#{selectedBuyer.customer_number} - {selectedBuyer.name}</CardTitle>
                                    <div className="text-gray-500 space-y-1 mt-2">
                                        {selectedBuyer.email && <p className="flex items-center gap-2"><Mail size={14}/> {selectedBuyer.email}</p>}
                                        {selectedBuyer.address && <p className="flex items-center gap-2"><Home size={14}/> {selectedBuyer.address}</p>}
                                        {selectedBuyer.credit > 0 && <p className="flex items-center gap-2 text-blue-600"><Gift size={14}/> Credit: ${formatNumber(selectedBuyer.credit)}</p>}
                                    </div></div>
                                <div className="flex flex-col gap-2 items-end">
                                    <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { setEditingBuyer(selectedBuyer); setIsFormOpen(true); }}><Edit size={14}/></Button><Button variant="destructive" size="sm"><Trash2 size={14}/></Button></div>
                                    <div className="flex items-center space-x-2 pt-2"><Checkbox id="refund-check" onCheckedChange={checked => checked && setIsRefund(true)} /><Label htmlFor="refund-check">Refund</Label></div>
                                </div></CardHeader>
                            <CardContent className="space-y-4">
                                {selectedBuyer.notes && <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                    <h4 className="font-bold flex items-center gap-2 mb-1 text-black"><StickyNote size={16}/> General Notes</h4>
                                    <p>{selectedBuyer.notes}</p>
                                </div>}
                                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                                     <div className="flex justify-between items-center">
                                        <h4 className="font-bold flex items-center gap-2 text-black"><Truck size={16}/> Delivery/Pickup Info</h4>
                                        <Button variant="ghost" size="sm" onClick={() => setIsDeliveryFormOpen(true)}><Edit size={14} /></Button>
                                     </div>
                                     <p><MapPin size={14} className="inline mr-1"/> Miles: {selectedBuyer.delivery_info?.miles || 'N/A'}</p>
                                     <p><DollarSign size={14} className="inline mr-1"/> Cost: ${formatNumber(selectedBuyer.delivery_info?.cost || 0)}</p>
                                     <p className="mt-1">{selectedBuyer.delivery_info?.notes || 'No delivery notes.'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ) : <div className="flex items-center justify-center h-full text-gray-500">Select a buyer to see details</div>}
                </div></div>
            <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}><DialogContent className="bg-white text-black"><DialogHeader><DialogTitle>{editingBuyer ? 'Edit' : 'Add'} Buyer</DialogTitle></DialogHeader><BuyerForm editingBuyer={editingBuyer} onSave={handleSaveBuyer} onCancel={() => setIsFormOpen(false)} /></DialogContent></Dialog>
            <AlertDialog open={isRefund} onOpenChange={setIsRefund}><RefundDialog onConfirm={handleRefundConfirm} /></AlertDialog>
            <Dialog open={isDeliveryFormOpen} onOpenChange={setIsDeliveryFormOpen}>{selectedBuyer && <DeliveryForm buyer={selectedBuyer} onSave={handleSaveDeliveryInfo} onCancel={() => setIsDeliveryFormOpen(false)} />}</Dialog>
        </div>
    );
};