
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PayoutDialog } from '@/components/payouts/PayoutDialog';
import { PayoutsList } from '@/components/payouts/PayoutsList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

export function PayoutsTab({ type }) {
  const [payouts, setPayouts] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPayout, setEditingPayout] = useState(null);
  const [isListVisible, setIsListVisible] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const payoutType = type === 'ecommerce' ? 'eCommerce' : 'Puppies';

  const fetchPayouts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('payouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', payoutType)
      .order('payout_date', { ascending: false });

    if (error) {
      toast({ title: 'Error fetching payments', variant: 'destructive', description: error.message });
    } else {
      setPayouts(data || []);
    }
  }, [user, toast, payoutType]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  const handleSave = async (formData) => {
    const dataToSave = {
        ...formData,
        user_id: user.id,
        payout_amount: parseFloat(formData.payout_amount) || 0,
        type: payoutType
    };

    const { error } = editingPayout
        ? await supabase.from('payouts').update(dataToSave).eq('id', editingPayout.id)
        : await supabase.from('payouts').insert(dataToSave);
    
    if (error) {
        toast({ title: `Error saving payment`, variant: 'destructive', description: error.message });
    } else {
        toast({ title: 'Success', description: `Payment ${editingPayout ? 'updated' : 'added'}.` });
        fetchPayouts();
        setIsDialogOpen(false);
        setEditingPayout(null);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('payouts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting payment', variant: 'destructive', description: error.message });
    } else {
      toast({ title: "Success", description: "Payment deleted" });
      fetchPayouts();
    }
  };
  
  const handleEdit = (payout) => {
    setEditingPayout(payout);
    setIsDialogOpen(true);
  };
  
  const totalPayouts = useMemo(() => {
    return payouts.reduce((sum, p) => sum + p.payout_amount, 0);
  }, [payouts]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{payoutType} Payments Received</h1>
          <Button onClick={() => { setEditingPayout(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Record Payment
          </Button>
        </div>
      </motion.div>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total {payoutType} Payments</CardTitle>
          <DollarSign className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${formatNumber(totalPayouts)}</div>
          <p className="text-xs text-muted-foreground">Total amount received from {payoutType.toLowerCase()} sales.</p>
        </CardContent>
      </Card>

      <div className="text-center">
        <Button variant="outline" onClick={() => setIsListVisible(!isListVisible)}>
          {isListVisible ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {isListVisible ? 'Hide All Payments' : 'View All Payments'}
        </Button>
      </div>
      
      <AnimatePresence>
        {isListVisible && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6">
                <PayoutsList payouts={payouts} onEdit={handleEdit} onDelete={handleDelete} />
            </motion.div>
        )}
      </AnimatePresence>

      <PayoutDialog 
        isOpen={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        editingEntry={editingPayout} 
        onSave={handleSave} 
        defaultType={payoutType}
      />
    </div>
  );
}
