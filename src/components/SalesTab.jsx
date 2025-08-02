import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, DollarSign, Edit, Trash2, Calendar, Search, ShoppingCart, Dog } from 'lucide-react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

const SalesCard = ({ title, icon, sales, onEdit, onDelete, totalRevenue }) => (
  <Card className="glass-effect border-white/20 flex-1">
    <CardHeader>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <CardTitle className="text-white">{title}</CardTitle>
            <CardDescription className="text-gray-300">Sales this month: ${totalRevenue.toFixed(2)}</CardDescription>
          </div>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border border-white/20 bg-white/5">
        <Table>
          <TableHeader>
            <TableRow className="border-white/20">
              <TableHead>Sale #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Sale Price</TableHead>
              <TableHead>Profit</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sales.map((sale) => (
              <TableRow key={sale.id} className="border-white/20 hover:bg-white/10 cursor-pointer" onClick={() => onEdit(sale)}>
                <TableCell>{sale.sale_number}</TableCell>
                <TableCell>{toLocalISOString(sale.date)}</TableCell>
                <TableCell className="font-medium">{sale.product_name}</TableCell>
                <TableCell>${parseFloat(sale.sale_price).toFixed(2)}</TableCell>
                <TableCell className={`font-medium ${sale.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>${parseFloat(sale.profit || 0).toFixed(2)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onEdit(sale)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(sale.id)} className="text-red-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {sales.length === 0 && (<div className="text-center py-8 text-gray-400">No sales recorded for this month</div>)}
      </div>
    </CardContent>
  </Card>
);

export function SalesTab() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [upcInput, setUpcInput] = useState('');
  
  const getTodayDateString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    inventory_id: null, product_name: '', quantity: '1', sale_price: '', cost: '', shipping: '', commission: '', other_fees: '', customer_name: '', order_number: '', notes: '', sale_type: 'Marketplace', marketplace: '', profit: '0.00', date: getTodayDateString(), sale_number: null, is_refund: false,
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const calculateProfit = useCallback((data) => {
    const quantity = parseInt(data.quantity) || 0;
    const sale_price = parseFloat(data.sale_price) || 0;
    const cost = parseFloat(data.cost) || 0;
    const shipping = parseFloat(data.shipping) || 0;
    const commission = parseFloat(data.commission) || 0;
    const other_fees = parseFloat(data.other_fees) || 0;
    const total_costs = (cost * quantity) + shipping + commission + other_fees;
    const profit = (sale_price * quantity) - total_costs;
    return profit.toFixed(2);
  }, []);

  useEffect(() => {
    setFormData(prev => ({ ...prev, profit: calculateProfit(prev) }));
  }, [formData.quantity, formData.sale_price, formData.cost, formData.shipping, formData.commission, formData.other_fees, calculateProfit]);

  const fetchSales = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('sales').select('*').eq('user_id', user.id).order('date', { ascending: false });
    if (error) {
      toast({ title: 'Error fetching sales', description: error.message, variant: 'destructive' });
    } else {
      setSales(data);
    }
  }, [user, toast]);

  const fetchInventory = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('inventory').select('id, name, quantity, upc, cost').eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error fetching inventory', description: error.message, variant: 'destructive' });
    } else {
      setInventory(data);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSales();
    fetchInventory();
  }, [fetchSales, fetchInventory]);

  const handleUpcChange = async (upc) => {
    setUpcInput(upc);
    const item = inventory.find(i => i.upc === upc);
    if (item) {
        setFormData(prev => ({
            ...prev,
            inventory_id: item.id,
            product_name: item.name,
            cost: item.cost ? item.cost.toString() : '0',
        }));
        toast({ title: "Item Found", description: `${item.name} details loaded.` });
    } else {
        setFormData(prev => ({ ...prev, inventory_id: null, product_name: '', cost: '' }));
    }
  };
  
  const getNextSaleNumber = async (saleDate) => {
      const date = new Date(saleDate);
      const firstDayOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth(), 1);
      const lastDayOfMonth = new Date(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 23, 59, 59, 999);
      
      const { data, error, count } = await supabase
        .from('sales')
        .select('sale_number', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', firstDayOfMonth.toISOString())
        .lte('date', lastDayOfMonth.toISOString());

      if (error) {
        toast({ title: 'Error fetching sale count', description: error.message, variant: 'destructive' });
        return 1;
      }
      return (count || 0) + 1;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.product_name || !formData.quantity || !formData.sale_price || !formData.date) {
      toast({ title: "Error", description: "Product Name, Quantity, Sale Price, and Date are required.", variant: "destructive" });
      return;
    }
    
    let saleNumber = formData.sale_number;
    const existingSaleInMonth = editingSale ? new Date(editingSale.date).getUTCMonth() === new Date(formData.date).getUTCMonth() : false;
    
    if (!editingSale || !existingSaleInMonth) {
      saleNumber = await getNextSaleNumber(formData.date);
    }

    const profit = parseFloat(calculateProfit(formData));
    const quantitySold = parseInt(formData.quantity);
    const total_costs = (parseFloat(formData.cost) * quantitySold) + (parseFloat(formData.shipping) || 0) + (parseFloat(formData.commission) || 0) + (parseFloat(formData.other_fees) || 0);

    const saleData = {
      user_id: user.id,
      inventory_id: formData.inventory_id || null,
      product_name: formData.product_name,
      quantity: quantitySold,
      sale_price: parseFloat(formData.sale_price),
      cost: parseFloat(formData.cost) || 0,
      shipping: parseFloat(formData.shipping) || 0,
      commission: parseFloat(formData.commission) || 0,
      other_fees: parseFloat(formData.other_fees) || 0,
      total_costs,
      profit,
      customer_name: formData.customer_name,
      order_number: formData.order_number,
      notes: formData.notes,
      sale_type: formData.sale_type,
      marketplace: formData.sale_type === 'Marketplace' ? formData.marketplace : null,
      date: formData.date,
      sale_number: saleNumber,
    };
    
    let error, saleResult;
    if (editingSale) {
      const { data, error: updateError } = await supabase.from('sales').update(saleData).eq('id', editingSale.id).select().single();
      error = updateError;
      saleResult = data;
    } else {
      const { data, error: insertError } = await supabase.from('sales').insert(saleData).select().single();
      error = insertError;
      saleResult = data;
    }

    if (error) {
      toast({ title: `Error ${editingSale ? 'updating' : 'recording'} sale`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: `Sale ${editingSale ? 'updated' : 'recorded'} successfully` });
      
      if (formData.is_refund) {
          await createRefundFromSale(saleResult);
      }
      
      if (formData.inventory_id && !editingSale) {
        await updateInventoryOnSale(formData.inventory_id, quantitySold, saleResult);
      }
      resetForm();
      fetchSales();
    }
  };
  
  const createRefundFromSale = async (sale) => {
    const refundData = {
        user_id: user.id,
        date_refunded: new Date().toISOString().split('T')[0],
        date_sold: sale.date.split('T')[0],
        item_name: sale.product_name,
        original_order_number: sale.order_number,
        purchase_price: sale.cost,
        sales_price: sale.sale_price,
        shipping_costs: sale.shipping,
        refund_for_return: sale.sale_price,
        notes: `Refund generated from sale #${sale.sale_number}. Customer: ${sale.customer_name || 'N/A'}`
    };
    const { error } = await supabase.from('refunds').insert(refundData);
    if(error) {
        toast({ title: "Refund Creation Error", description: error.message, variant: "destructive" });
    } else {
        toast({ title: "Refund Created", description: "A refund record has been created automatically." });
    }
  }

  const updateInventoryOnSale = async (inventoryId, soldQuantity, sale) => {
    const inventoryItem = inventory.find(item => item.id === inventoryId);
    if (inventoryItem) {
      const oldQuantity = inventoryItem.quantity;
      if (oldQuantity >= soldQuantity) {
        const newQuantity = oldQuantity - soldQuantity;
        const { error: updateError } = await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', inventoryId);
        if (updateError) { toast({ title: "Inventory Update Error", description: updateError.message, variant: "destructive" }); return; }
        const historyReason = `Sale of ${soldQuantity} unit(s). Order: ${sale.order_number || 'N/A'}. Sale Amount: $${(sale.sale_price * sale.quantity).toFixed(2)}.`;
        const { error: historyError } = await supabase.from('inventory_history').insert({ inventory_id: inventoryId, user_id: user.id, old_quantity: oldQuantity, new_quantity: newQuantity, reason: historyReason, type: 'sale', sale_id: sale.id });
        if (historyError) { toast({ title: "History Logging Error", description: historyError.message, variant: "destructive" }); }
        fetchInventory();
      } else {
        toast({ title: "Warning", description: `Insufficient inventory for ${inventoryItem.name}.`, variant: "destructive" });
      }
    }
  };

  const resetForm = () => {
    setFormData({ inventory_id: null, product_name: '', quantity: '1', sale_price: '', cost: '', shipping: '', commission: '', other_fees: '', customer_name: '', order_number: '', notes: '', sale_type: 'Marketplace', marketplace: '', profit: '0.00', date: getTodayDateString(), sale_number: null, is_refund: false });
    setEditingSale(null);
    setIsAddDialogOpen(false);
    setUpcInput('');
  };

  const handleEdit = (sale) => {
    setEditingSale(sale);
    const formattedSale = { ...sale };
     Object.keys(formattedSale).forEach(key => {
        if (formattedSale[key] === null) { formattedSale[key] = ''; } 
        else if (typeof formattedSale[key] === 'number') { formattedSale[key] = formattedSale[key].toString(); }
    });
    
    const saleDate = toLocalISOString(sale.date);
    const inventoryItem = inventory.find(i => i.id === sale.inventory_id);
    setUpcInput(inventoryItem ? inventoryItem.upc : '');

    setFormData({ ...formattedSale, sale_type: sale.sale_type || 'Marketplace', marketplace: sale.marketplace || '', date: saleDate, is_refund: false });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting sale', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: "Success", description: "Sale record deleted successfully" });
      fetchSales();
    }
  };

  const { marketplaceSales, swvaSales } = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    const monthlySales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });
    return {
      marketplaceSales: monthlySales.filter(s => s.sale_type === 'Marketplace').sort((a,b) => b.sale_number - a.sale_number),
      swvaSales: monthlySales.filter(s => s.sale_type === 'SWVA Chihuahua').sort((a,b) => b.sale_number - a.sale_number),
    };
  }, [sales]);

  const marketplaceRevenue = marketplaceSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);
  const swvaRevenue = swvaSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Sales Dashboard</h1>
            <p className="text-gray-300">Record sales and track performance for the current month.</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => { if (!isOpen) resetForm(); else setIsAddDialogOpen(true); }}>
            <DialogTrigger asChild><Button onClick={() => { setEditingSale(null); resetForm(); }} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"><Plus className="w-4 h-4 mr-2" />Record Sale</Button></DialogTrigger>
            <DialogContent className="bg-slate-800 border-white/20 text-white max-w-2xl">
              <DialogHeader><DialogTitle>{editingSale ? 'Edit' : 'Record New'} Sale</DialogTitle><DialogDescription className="text-gray-300">Enter UPC to auto-fill product details, or enter manually.</DialogDescription></DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="upc">UPC Code</Label><div className="relative"><Input id="upc" value={upcInput} onChange={(e) => handleUpcChange(e.target.value)} className="bg-white/10 pr-10" placeholder="Scan or enter UPC..." /><Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" /></div></div>
                    <div className="space-y-2"><Label htmlFor="product_name">Product Name *</Label><Input id="product_name" value={formData.product_name} onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))} className="bg-white/10" required readOnly={!!formData.inventory_id} /></div>
                  </div>
                  <div className="space-y-2"><Label>Business Entity *</Label><Select value={formData.sale_type} onValueChange={(value) => setFormData(prev => ({ ...prev, sale_type: value, marketplace: '' }))}><SelectTrigger className="bg-white/10"><SelectValue placeholder="Select business entity" /></SelectTrigger><SelectContent className="bg-slate-800 text-white"><SelectItem value="Marketplace">eCommerce</SelectItem><SelectItem value="SWVA Chihuahua">SWVA Chihuahua</SelectItem></SelectContent></Select></div>
                  {formData.sale_type === 'Marketplace' && (
                      <div className="space-y-2"><Label>Marketplace *</Label><Select value={formData.marketplace} onValueChange={(value) => setFormData(prev => ({ ...prev, marketplace: value }))}><SelectTrigger className="bg-white/10"><SelectValue placeholder="Select marketplace" /></SelectTrigger><SelectContent className="bg-slate-800 text-white"><SelectItem value="Walmart Seller">Walmart Seller</SelectItem><SelectItem value="Walmart WFS">Walmart WFS</SelectItem><SelectItem value="eBay">eBay</SelectItem><SelectItem value="Amazon">Amazon</SelectItem><SelectItem value="Facebook Marketplace">Facebook Marketplace</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                  )}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="quantity">Quantity *</Label><Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="bg-white/10" required /></div>
                    <div className="space-y-2"><Label htmlFor="sale_price">Sale Price (Total) *</Label><Input id="sale_price" type="number" step="0.01" value={formData.sale_price} onChange={(e) => setFormData(prev => ({ ...prev, sale_price: e.target.value }))} className="bg-white/10" required /></div>
                    <div className="space-y-2"><Label htmlFor="cost">Cost per Item</Label><Input id="cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))} className="bg-white/10" readOnly={!!formData.inventory_id} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2"><Label htmlFor="shipping">Shipping</Label><Input id="shipping" type="number" step="0.01" value={formData.shipping} onChange={(e) => setFormData(prev => ({ ...prev, shipping: e.target.value }))} className="bg-white/10" /></div>
                    <div className="space-y-2"><Label htmlFor="commission">Commission</Label><Input id="commission" type="number" step="0.01" value={formData.commission} onChange={(e) => setFormData(prev => ({ ...prev, commission: e.target.value }))} className="bg-white/10" /></div>
                    <div className="space-y-2"><Label htmlFor="other_fees">Other Fees</Label><Input id="other_fees" type="number" step="0.01" value={formData.other_fees} onChange={(e) => setFormData(prev => ({ ...prev, other_fees: e.target.value }))} className="bg-white/10" /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="profit">Calculated Profit</Label><Input id="profit" type="number" value={formData.profit} className="bg-white/10 text-green-400 font-bold" readOnly /></div>
                    <div className="space-y-2"><Label htmlFor="date">Sale Date *</Label><div className="relative"><Input id="date" type="date" value={formData.date} onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))} className="bg-white/10 pr-10" required /><Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400" /></div></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="order_number">Order Number</Label><Input id="order_number" value={formData.order_number} onChange={(e) => setFormData(prev => ({ ...prev, order_number: e.target.value }))} className="bg-white/10" /></div>
                    <div className="space-y-2"><Label htmlFor="customer_name">Customer Name</Label><Input id="customer_name" value={formData.customer_name} onChange={(e) => setFormData(prev => ({ ...prev, customer_name: e.target.value }))} className="bg-white/10" /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="notes">Notes</Label><Textarea id="notes" value={formData.notes} onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))} className="bg-white/10" /></div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="is_refund" checked={formData.is_refund} onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_refund: checked }))} />
                    <label htmlFor="is_refund" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Mark for Refund</label>
                  </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>
                  <Button type="submit" className="bg-gradient-to-r from-purple-500 to-blue-500">{editingSale ? 'Update' : 'Record'} Sale</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col md:flex-row gap-6">
        <SalesCard 
          title="eCommerce Sales"
          icon={<ShoppingCart className="h-8 w-8 text-blue-400" />}
          sales={marketplaceSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalRevenue={marketplaceRevenue}
        />
        <SalesCard
          title="SWVA Chihuahua Sales"
          icon={<Dog className="h-8 w-8 text-purple-400" />}
          sales={swvaSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalRevenue={swvaRevenue}
        />
      </motion.div>
    </div>
  );
}