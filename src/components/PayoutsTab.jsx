import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, ShoppingBag, Edit, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';

const toLocalISOString = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        const timezoneOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - timezoneOffset);
        return localDate.toISOString().split('T')[0];
    } catch (e) {
        return '';
    }
};

export function PayoutsTab() {
  const [payouts, setPayouts] = useState([]);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [payoutFormData, setPayoutFormData] = useState({ payout_date: '', marketplace: '', payout_amount: '', notes: '' });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchPayouts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('payouts').select('*').eq('user_id', user.id).order('payout_date', { ascending: false });
    if (error) toast({ title: 'Error fetching payouts', description: error.message, variant: 'destructive' });
    else setPayouts(data || []);
  }, [user, toast]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const resetForms = () => {
    setIsPayoutDialogOpen(false);
    setEditingEntry(null);
    setPayoutFormData({ payout_date: '', marketplace: '', payout_amount: '', notes: '' });
  };

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    const data = { ...payoutFormData, user_id: user.id, payout_amount: parseFloat(payoutFormData.payout_amount) };
    const { error } = editingEntry ? await supabase.from('payouts').update(data).eq('id', editingEntry.id) : await supabase.from('payouts').insert(data);
    if (error) toast({ title: 'Error saving payout', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Success', description: `Payout ${editingEntry ? 'updated' : 'saved'} successfully` });
      resetForms();
      fetchPayouts();
    }
  };
  
  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setPayoutFormData({ payout_date: toLocalISOString(entry.payout_date), marketplace: entry.marketplace, payout_amount: entry.payout_amount.toString(), notes: entry.notes || '' });
    setIsPayoutDialogOpen(true);
  };
  
  const handleDelete = async (id) => {
    const { error } = await supabase.from('payouts').delete().eq('id', id);
    if (error) toast({ title: `Error deleting entry`, description: error.message, variant: 'destructive' });
    else {
        toast({ title: 'Success', description: 'Entry deleted successfully' });
        fetchPayouts();
    }
  };

  const totalPayouts = payouts.reduce((sum, p) => sum + p.payout_amount, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-effect border-white/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-300">Total Marketplace Payouts</CardTitle>
                <ShoppingBag className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-white">${totalPayouts.toFixed(2)}</div>
            </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader><div className="flex justify-between items-center"><CardTitle className="text-white">Marketplace Payouts</CardTitle>
              <Dialog open={isPayoutDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) resetForms(); else setIsPayoutDialogOpen(true); }}>
                <DialogTrigger asChild><Button onClick={() => setEditingEntry(null)}><Plus className="w-4 h-4 mr-2" />Add Payout</Button></DialogTrigger>
                <DialogContent className="bg-slate-800 border-white/20 text-white"><DialogHeader><DialogTitle>{editingEntry ? 'Edit' : 'Add'} Payout</DialogTitle></DialogHeader>
                  <form onSubmit={handlePayoutSubmit} className="space-y-4">
                    <Input type="date" value={payoutFormData.payout_date} onChange={e => setPayoutFormData({...payoutFormData, payout_date: e.target.value})} className="bg-white/10" required />
                    <Input placeholder="Marketplace" value={payoutFormData.marketplace} onChange={e => setPayoutFormData({...payoutFormData, marketplace: e.target.value})} className="bg-white/10" required />
                    <Input type="number" step="0.01" placeholder="Payout Amount" value={payoutFormData.payout_amount} onChange={e => setPayoutFormData({...payoutFormData, payout_amount: e.target.value})} className="bg-white/10" required />
                    <Textarea placeholder="Notes..." value={payoutFormData.notes} onChange={e => setPayoutFormData({...payoutFormData, notes: e.target.value})} className="bg-white/10" />
                    <DialogFooter><Button type="submit">Save Payout</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div></CardHeader>
          <CardContent><Table><TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Marketplace</TableHead><TableHead>Amount</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
              <TableBody>{payouts.map(p => <TableRow key={p.id} className="hover:bg-white/10 cursor-pointer" onClick={() => handleEdit(p)}><TableCell>{toLocalISOString(p.payout_date)}</TableCell><TableCell>{p.marketplace}</TableCell><TableCell>${p.payout_amount.toFixed(2)}</TableCell><TableCell onClick={(e) => e.stopPropagation()} className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(p)}><Edit className="w-4 h-4"/></Button><Button size="sm" variant="outline" onClick={() => handleDelete(p.id)}><Trash2 className="w-4 h-4"/></Button></TableCell></TableRow>)}</TableBody>
            </Table></CardContent>
        </Card>
      </motion.div>
    </div>
  );
}