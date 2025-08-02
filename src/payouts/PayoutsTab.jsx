
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PayoutDialog } from '@/components/payouts/PayoutDialog';
import { PayoutsDashboard } from '@/components/payouts/PayoutsDashboard';
import { PayoutsList } from '@/components/payouts/PayoutsList';
import { format, startOfMonth, endOfMonth } from 'date-fns';

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
      toast({ title: 'Error fetching payouts', variant: 'destructive', description: error.message });
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
        toast({ title: `Error saving payout`, variant: 'destructive', description: error.message });
    } else {
        toast({ title: 'Success', description: `Payout ${editingPayout ? 'updated' : 'added'}.` });
        fetchPayouts();
        setIsDialogOpen(false);
        setEditingPayout(null);
    }
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('payouts').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting payout', variant: 'destructive', description: error.message });
    } else {
      toast({ title: "Success", description: "Payout deleted" });
      fetchPayouts();
    }
  };
  
  const handleEdit = (payout) => {
    setEditingPayout(payout);
    setIsDialogOpen(true);
  };

  const dashboardData = useMemo(() => {
    const grouped = payouts.reduce((acc, p) => {
        const marketplaceKey = p.marketplace || 'Uncategorized';
        if (!acc[marketplaceKey]) {
            acc[marketplaceKey] = [];
        }
        acc[marketplaceKey].push(p);
        return acc;
    }, {});
    return Object.entries(grouped).map(([marketplace, items]) => ({ marketplace, items }));
  }, [payouts]);
  
  const payoutsByMonth = useMemo(() => {
    return payouts.reduce((acc, payout) => {
        const month = format(new Date(payout.payout_date), 'MMMM yyyy');
        if (!acc[month]) {
            acc[month] = [];
        }
        acc[month].push(payout);
        return acc;
    }, {});
  }, [payouts]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{payoutType} Payouts</h1>
          <Button onClick={() => { setEditingPayout(null); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />Record Payout
          </Button>
        </div>
      </motion.div>
      
      <PayoutsDashboard data={dashboardData} />

      <div className="text-center">
        <Button variant="outline" onClick={() => setIsListVisible(!isListVisible)}>
          {isListVisible ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
          {isListVisible ? 'Hide All Payouts' : 'View All Payouts'}
        </Button>
      </div>
      
      <AnimatePresence>
        {isListVisible && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-6">
                {Object.entries(payoutsByMonth).map(([month, monthlyPayouts]) => (
                    <PayoutsList key={month} month={month} payouts={monthlyPayouts} onEdit={handleEdit} onDelete={handleDelete} />
                ))}
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
