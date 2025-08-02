import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, RefreshCw, Edit, Trash2 } from 'lucide-react';
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

export function RefundsTab() {
  const [refunds, setRefunds] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingRefund, setEditingRefund] = useState(null);
  const [formData, setFormData] = useState({
    date_refunded: '', date_sold: '', item_name: '', original_order_number: '', purchase_price: '', sales_price: '', shipping_costs: '', return_shipping_costs: '', commission_credits: '', refund_for_return: '', dispute_credit: '', notes: ''
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchRefunds = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('refunds').select('*').eq('user_id', user.id).order('date_refunded', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching refunds', description: error.message, variant: 'destructive' });
    } else {
      setRefunds(data || []);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchRefunds();
  }, [fetchRefunds]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date_refunded || !formData.item_name) {
      toast({ title: "Error", description: "Please fill in Date Refunded and Item Name", variant: "destructive" });
      return;
    }

    const refundData = {
      user_id: user.id,
      ...formData,
      date_sold: formData.date_sold || null,
      purchase_price: formData.purchase_price ? parseFloat(formData.purchase_price) : null,
      sales_price: formData.sales_price ? parseFloat(formData.sales_price) : null,
      shipping_costs: formData.shipping_costs ? parseFloat(formData.shipping_costs) : null,
      return_shipping_costs: formData.return_shipping_costs ? parseFloat(formData.return_shipping_costs) : null,
      commission_credits: formData.commission_credits ? parseFloat(formData.commission_credits) : null,
      refund_for_return: formData.refund_for_return ? parseFloat(formData.refund_for_return) : null,
      dispute_credit: formData.dispute_credit ? parseFloat(formData.dispute_credit) : null,
    };

    let error;
    if (editingRefund) {
      const { error: updateError } = await supabase.from('refunds').update(refundData).eq('id', editingRefund.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase.from('refunds').insert(refundData);
      error = insertError;
    }

    if (error) {
      toast({ title: `Error ${editingRefund ? 'updating' : 'adding'} refund`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: `Refund ${editingRefund ? 'updated' : 'added'} successfully` });
      resetForm();
      fetchRefunds();
    }
  };

  const resetForm = () => {
    setFormData({ date_refunded: '', date_sold: '', item_name: '', original_order_number: '', purchase_price: '', sales_price: '', shipping_costs: '', return_shipping_costs: '', commission_credits: '', refund_for_return: '', dispute_credit: '', notes: '' });
    setEditingRefund(null);
    setIsAddDialogOpen(false);
  };

  const handleEdit = (refund) => {
    setEditingRefund(refund);
    const formattedRefund = { ...refund };
    Object.keys(formattedRefund).forEach(key => {
      if (key.startsWith('date_')) {
        formattedRefund[key] = toLocalISOString(formattedRefund[key]);
      } else if (formattedRefund[key] === null) {
        formattedRefund[key] = '';
      } else if (typeof formattedRefund[key] === 'number') {
        formattedRefund[key] = formattedRefund[key].toString();
      }
    });
    setFormData(formattedRefund);
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('refunds').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting refund', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: "Refund record deleted successfully" });
      fetchRefunds();
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="glass-effect border-white/20">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center space-x-2 text-white"><RefreshCw className="w-6 h-6" /><span>Refunds Management</span></CardTitle>
                <CardDescription className="text-gray-300">Track and manage product returns and refunds</CardDescription>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { setIsAddDialogOpen(isOpen); if (!isOpen) resetForm(); }}>
                <DialogTrigger asChild><Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"><Plus className="w-4 h-4 mr-2" />Add Refund</Button></DialogTrigger>
                <DialogContent className="bg-slate-800 border-white/20 text-white max-w-4xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>{editingRefund ? 'Edit' : 'Add'} Refund</DialogTitle></DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label htmlFor="date_refunded">Date Refunded *</Label><Input id="date_refunded" type="date" value={formData.date_refunded} onChange={(e) => setFormData(prev => ({ ...prev, date_refunded: e.target.value }))} className="bg-white/10 border-white/20" required /></div>
                      <div className="space-y-2"><Label htmlFor="date_sold">Date Sold</Label><Input id="date_sold" type="date" value={formData.date_sold} onChange={(e) => setFormData(prev => ({ ...prev, date_sold: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="item_name">Item Name *</Label><Input id="item_name" value={formData.item_name} onChange={(e) => setFormData(prev => ({ ...prev, item_name: e.target.value }))} className="bg-white/10 border-white/20" required /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label htmlFor="original_order_number">Original Order #</Label><Input id="original_order_number" value={formData.original_order_number} onChange={(e) => setFormData(prev => ({ ...prev, original_order_number: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="purchase_price">Purchase Price</Label><Input id="purchase_price" type="number" step="0.01" value={formData.purchase_price} onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="sales_price">Sales Price</Label><Input id="sales_price" type="number" step="0.01" value={formData.sales_price} onChange={(e) => setFormData(prev => ({ ...prev, sales_price: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2"><Label htmlFor="shipping_costs">Shipping Costs</Label><Input id="shipping_costs" type="number" step="0.01" value={formData.shipping_costs} onChange={(e) => setFormData(prev => ({ ...prev, shipping_costs: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="return_shipping_costs">Return Shipping Costs</Label><Input id="return_shipping_costs" type="number" step="0.01" value={formData.return_shipping_costs} onChange={(e) => setFormData(prev => ({ ...prev, return_shipping_costs: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="commission_credits">Commission Credits</Label><Input id="commission_credits" type="number" step="0.01" value={formData.commission_credits} onChange={(e) => setFormData(prev => ({ ...prev, commission_credits: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2"><Label htmlFor="refund_for_return">Refund for Return</Label><Input id="refund_for_return" type="number" step="0.01" value={formData.refund_for_return} onChange={(e) => setFormData(prev => ({ ...prev, refund_for_return: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                      <div className="space-y-2"><Label htmlFor="dispute_credit">Dispute Credit</Label><Input id="dispute_credit" type="number" step="0.01" value={formData.dispute_credit} onChange={(e) => setFormData(prev => ({ ...prev, dispute_credit: e.target.value }))} className="bg-white/10 border-white/20" /></div>
                    </div>
                    <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="bg-white/10 border-white/20" placeholder="Additional notes about the refund" /></div>
                    <DialogFooter><Button type="button" variant="outline" onClick={resetForm}>Cancel</Button><Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500">{editingRefund ? 'Update' : 'Add'} Refund</Button></DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-white/20 bg-white/5">
              <Table>
                <TableHeader><TableRow className="border-white/20"><TableHead className="text-gray-300">Date Refunded</TableHead><TableHead className="text-gray-300">Item Name</TableHead><TableHead className="text-gray-300">Order #</TableHead><TableHead className="text-gray-300">Refund Amount</TableHead><TableHead className="text-gray-300">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id} className="border-white/20 hover:bg-white/10 cursor-pointer" onClick={() => handleEdit(refund)}>
                      <TableCell className="text-gray-300">{toLocalISOString(refund.date_refunded)}</TableCell>
                      <TableCell className="text-white font-medium">{refund.item_name}</TableCell>
                      <TableCell className="text-gray-300">{refund.original_order_number}</TableCell>
                      <TableCell className="text-gray-300">${(refund.refund_for_return || 0).toFixed(2)}</TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(refund)} className="border-white/20 text-white hover:bg-white/10"><Edit className="w-4 h-4" /></Button>
                          <Button size="sm" variant="outline" onClick={() => handleDelete(refund.id)} className="border-red-500/50 text-red-400 hover:bg-red-500/10"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {refunds.length === 0 && (<div className="text-center py-8 text-gray-400">No refunds recorded yet</div>)}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}