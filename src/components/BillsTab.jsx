import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit, Trash2, Calendar, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UpcomingBillsCard = ({ bills, onEdit }) => (
  <Card className="glass-effect border-white/20">
    <CardHeader>
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 text-yellow-400" />
        <CardTitle className="text-white">Upcoming Bills (Next 30 Days)</CardTitle>
      </div>
      <CardDescription className="text-gray-300">Unpaid bills due soon that need your attention.</CardDescription>
    </CardHeader>
    <CardContent>
      {bills.length > 0 ? (
        <ul className="space-y-3">
          {bills.map(bill => (
            <li key={bill.id} className="flex justify-between items-center p-2 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer" onClick={() => onEdit(bill)}>
              <div>
                <p className="font-medium text-white">{bill.description}</p>
                <p className="text-sm text-gray-400">{new Date(bill.due_date).toLocaleDateString()}</p>
              </div>
              <p className="font-bold text-lg text-yellow-400">${bill.amount.toFixed(2)}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-400 text-center py-4">No upcoming bills in the next 30 days. You're all caught up! 🎉</p>
      )}
    </CardContent>
  </Card>
);

const BillStatusSection = ({ title, icon, bills, total, onEdit, onDelete, onToggleStatus }) => (
  <Card className="glass-effect border-white/20 flex-1">
    <CardHeader>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle className="text-white">{title}</CardTitle>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-400">Total</p>
          <p className="text-xl font-bold text-white">${total.toFixed(2)}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border border-white/20 bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead>Description</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id} className="border-white/20 hover:bg-white/10 cursor-pointer" onClick={() => onEdit(bill)}>
                <TableCell className="font-medium">{bill.description}</TableCell>
                <TableCell>{new Date(bill.due_date).toLocaleDateString()}</TableCell>
                <TableCell>${parseFloat(bill.amount).toFixed(2)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onToggleStatus(bill)} className={`border-white/20 ${bill.status === 'Paid' ? 'text-yellow-400' : 'text-green-400'}`}>
                      {bill.status === 'Paid' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(bill)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(bill.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {bills.length === 0 && (<div className="text-center py-8 text-gray-400">No bills in this category.</div>)}
      </div>
    </CardContent>
  </Card>
);

export function BillsTab() {
  const [bills, setBills] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [formData, setFormData] = useState({
    description: '', vendor: '', amount: '', dueDate: '', category: '', notes: '', type: 'eCommerce Cost of Goods', recurring: false, status: 'Unpaid'
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBills = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('bills').select('*').eq('user_id', user.id).order('due_date', { ascending: true });
    if (error) {
      toast({ title: 'Error fetching bills', description: error.message, variant: 'destructive' });
    } else {
      setBills(data);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description || !formData.vendor || !formData.amount || !formData.dueDate) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    const billData = {
      user_id: user.id,
      description: formData.description,
      vendor: formData.vendor,
      amount: parseFloat(formData.amount),
      due_date: formData.dueDate,
      category: formData.category,
      notes: formData.notes,
      type: formData.type,
      recurring: formData.recurring,
      status: formData.status,
    };

    let error;
    if (editingBill) {
      const { error: updateError } = await supabase.from('bills').update(billData).eq('id', editingBill.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('bills').insert(billData);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingBill ? 'updating' : 'adding'} bill`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: `Bill ${editingBill ? 'updated' : 'added'} successfully` });
      resetForm();
      fetchBills();
    }
  };

  const resetForm = () => {
    setFormData({ description: '', vendor: '', amount: '', dueDate: '', category: '', notes: '', type: 'eCommerce Cost of Goods', recurring: false, status: 'Unpaid' });
    setEditingBill(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (bill) => {
    setEditingBill(bill);
    setFormData({
      description: bill.description,
      vendor: bill.vendor,
      amount: bill.amount.toString(),
      dueDate: bill.due_date,
      category: bill.category || '',
      notes: bill.notes || '',
      type: bill.type,
      recurring: bill.recurring,
      status: bill.status,
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('bills').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting bill', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: "Bill deleted successfully" });
      fetchBills();
    }
  };

  const handleToggleStatus = async (bill) => {
    const newStatus = bill.status === 'Paid' ? 'Unpaid' : 'Paid';
    const { error } = await supabase.from('bills').update({ status: newStatus }).eq('id', bill.id);
    if (error) {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `Bill marked as ${newStatus}` });
      fetchBills();
    }
  };

  const { paidBills, unpaidBills, upcomingBills, totalPaid, totalUnpaid } = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    today.setHours(0, 0, 0, 0);

    const paid = bills.filter(b => b.status === 'Paid');
    const unpaid = bills.filter(b => b.status === 'Unpaid');

    return {
      paidBills: paid,
      unpaidBills: unpaid,
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
        <UpcomingBillsCard bills={upcomingBills} onEdit={handleEdit} />
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div><CardTitle className="text-white">Bills Management</CardTitle><CardDescription className="text-gray-300">Track personal and business bills, payments, and balances</CardDescription></div>
              <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogTrigger asChild><Button onClick={() => { setEditingBill(null); resetForm(); }} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"><Plus className="w-4 h-4 mr-2" />Add Bill</Button></DialogTrigger>
                <DialogContent className="bg-slate-800 border-white/20 text-white max-w-2xl">
                  <DialogHeader><DialogTitle>{editingBill ? 'Edit' : 'Add New'} Bill</DialogTitle><DialogDescription className="text-gray-300">Enter bill details and payment information</DialogDescription></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="description">Description *</Label><Input id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="bg-white/10 border-white/20 text-white" required /></div>
                      <div className="space-y-2"><Label htmlFor="vendor">Vendor/Payee *</Label><Input id="vendor" value={formData.vendor} onChange={(e) => setFormData(prev => ({ ...prev, vendor: e.target.value }))} className="bg-white/10 border-white/20 text-white" required /></div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label>Bill Type *</Label><Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}><SelectTrigger className="bg-white/10"><SelectValue placeholder="Select bill type" /></SelectTrigger><SelectContent className="bg-slate-800 text-white"><SelectItem value="eCommerce Cost of Goods">eCommerce Cost of Goods</SelectItem><SelectItem value="SWVA Chihuahua Cost of Goods">SWVA Chihuahua Cost of Goods</SelectItem><SelectItem value="Personal">Personal</SelectItem></SelectContent></Select></div>
                      <div className="space-y-2"><Label htmlFor="amount">Total Amount *</Label><Input id="amount" type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))} className="bg-white/10 border-white/20 text-white" required /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="dueDate">Due Date *</Label><Input id="dueDate" type="date" value={formData.dueDate} onChange={(e) => setFormData(prev => ({ ...prev, dueDate: e.target.value }))} className="bg-white/10 border-white/20 text-white" required /></div>
                      <div className="space-y-2"><Label htmlFor="category">Category</Label><Input id="category" value={formData.category} onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))} className="bg-white/10 border-white/20 text-white" placeholder="e.g., Utilities, Office Supplies" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="bg-white/10 border-white/20 text-white" /></div>
                    <div className="flex items-center space-x-2"><Checkbox id="recurring" checked={formData.recurring} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, recurring: !!checked }))} /><Label htmlFor="recurring">Recurring Bill</Label></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500">{editingBill ? 'Update' : 'Add'} Bill</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col lg:flex-row gap-6">
             <BillStatusSection 
              title="Unpaid Bills"
              icon={<XCircle className="h-6 w-6 text-red-400" />}
              bills={unpaidBills}
              total={totalUnpaid}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
            <BillStatusSection
              title="Paid Bills"
              icon={<CheckCircle className="h-6 w-6 text-green-400" />}
              bills={paidBills}
              total={totalPaid}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleStatus={handleToggleStatus}
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}