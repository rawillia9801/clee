
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, XCircle, CheckCircle, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { BillDialog } from './BillDialog';
import { BillList } from './BillList';
import { toDisplayDate } from '@/lib/utils';

export function BillsTab({ type }) {
  const [bills, setBills] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const currentType = type || 'Business';

  const fetchBills = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', currentType)
      .order('due_date', { ascending: true });

    if (error) toast({ title: 'Error fetching bills', variant: 'destructive', description: error.message });
    else setBills(data || []);
  }, [user, toast, currentType]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const handleSave = async (formData) => {
    const billData = { 
        user_id: user.id, 
        vendor: formData.vendor,
        description: formData.description,
        amount: parseFloat(formData.amount),
        due_date: formData.due_date,
        category: formData.category,
        notes: formData.notes,
        type: formData.type || currentType,
        recurring: formData.recurring,
        status: formData.status,
    };
    
    const { error } = editingBill 
        ? await supabase.from('bills').update(billData).eq('id', editingBill.id) 
        : await supabase.from('bills').insert(billData);

    if (error) toast({ title: `Error saving bill`, variant: 'destructive', description: error.message });
    else {
      toast({ title: "Success", description: `Bill ${editingBill ? 'updated' : 'saved'}` });
      setIsDialogOpen(false);
      setEditingBill(null);
      fetchBills();
    }
  };

  const handleEdit = (bill) => { setEditingBill(bill); setIsDialogOpen(true); };
  const handleDelete = async (id) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting bill', variant: 'destructive' });
    else { toast({ title: "Success", description: "Bill deleted" }); fetchBills(); }
  };

  const handleToggleStatus = async (bill) => {
    const newStatus = bill.status === 'Paid' ? 'Unpaid' : 'Paid';
    const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', bill.id);
    if (error) toast({ title: 'Error updating status', variant: 'destructive' });
    else { toast({ title: 'Success', description: `Bill marked as ${newStatus}` }); fetchBills(); }
  };

  const { paidBills, unpaidBills, upcomingBills, totalPaid, totalUnpaid } = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    today.setHours(0, 0, 0, 0);

    const paid = bills.filter(b => b.status === 'Paid');
    const unpaid = bills.filter(b => b.status === 'Unpaid');

    return {
      paidBills: paid, unpaidBills: unpaid,
      totalPaid: paid.reduce((sum, b) => sum + b.amount, 0),
      totalUnpaid: unpaid.reduce((sum, b) => sum + b.amount, 0),
      upcomingBills: unpaid.filter(b => {
        const dueDate = new Date(b.due_date);
        return dueDate >= today && dueDate <= thirtyDaysFromNow;
      }).sort((a,b) => new Date(a.due_date) - new Date(b.due_date)),
    }
  }, [bills]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold">{currentType} Bills</CardTitle>
                <CardDescription>Track your {currentType.toLowerCase()} expenses and payments.</CardDescription>
              </div>
              <Button onClick={() => { setEditingBill(null); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Bill</Button>
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3"><Calendar className="h-6 w-6 text-yellow-500" /><CardTitle>Upcoming Bills (Next 30 Days)</CardTitle></div>
          </CardHeader>
          <CardContent>
            {upcomingBills.length > 0 ? (
              <ul className="space-y-3">{upcomingBills.map(bill => (
                <li key={bill.id} className="flex justify-between items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer" onClick={() => handleEdit(bill)}>
                  <div><p className="font-medium">{bill.vendor}</p><p className="text-sm text-gray-500">{toDisplayDate(bill.due_date)}</p></div>
                  <p className="font-bold text-lg text-yellow-600">${bill.amount.toFixed(2)}</p>
                </li>))}
              </ul>
            ) : <p className="text-gray-500 text-center py-4">No upcoming bills. You're all caught up! 🎉</p>}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col lg:flex-row gap-6">
        <BillList title="Unpaid Bills" icon={<XCircle className="h-6 w-6 text-red-500" />} bills={unpaidBills} total={totalUnpaid} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
        <BillList title="Paid Bills" icon={<CheckCircle className="h-6 w-6 text-green-500" />} bills={paidBills} total={totalPaid} onEdit={handleEdit} onDelete={handleDelete} onToggleStatus={handleToggleStatus} />
      </motion.div>

      <BillDialog isOpen={isDialogOpen} onOpenChange={setIsDialogOpen} editingBill={editingBill} onSave={handleSave} defaultType={currentType} />
    </div>
  );
}
