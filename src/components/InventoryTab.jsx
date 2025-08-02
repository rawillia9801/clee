import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit, Trash2, Package, DollarSign, Image as ImageIcon, ShoppingCart, PlusCircle, Archive, BarChart, ArrowDown, ArrowUp, XCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const SortableHeader = ({ children, column, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === column;
    const direction = isSorted ? sortConfig.direction : 'none';
    const Icon = direction === 'ascending' ? ArrowUp : ArrowDown;

    return (
        <TableHead onClick={() => onSort(column)} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
                {children}
                {isSorted && <Icon className="h-4 w-4" />}
            </div>
        </TableHead>
    );
};

const InventoryTable = ({ items, onEdit, sortConfig, onSort }) => (
  <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
    <div className="relative w-full overflow-auto">
        <Table>
            <TableHeader className="sticky top-0 bg-muted/50 z-10">
                <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>UPC</TableHead>
                    <SortableHeader column="purchased_qty" sortConfig={sortConfig} onSort={onSort}>Purchased</SortableHeader>
                    <SortableHeader column="sold_qty" sortConfig={sortConfig} onSort={onSort}>Sold</SortableHeader>
                    <SortableHeader column="total_sales" sortConfig={sortConfig} onSort={onSort}>Total Sales</SortableHeader>
                    <SortableHeader column="quantity" sortConfig={sortConfig} onSort={onSort}>Qty</SortableHeader>
                    <TableHead>Cost/Item</TableHead>
                    <SortableHeader column="total_cost" sortConfig={sortConfig} onSort={onSort}>Total Cost</SortableHeader>
                    <TableHead>MSRP</TableHead>
                    <SortableHeader column="profit" sortConfig={sortConfig} onSort={onSort}>Profit</SortableHeader>
                </TableRow>
            </TableHeader>
            <TableBody>
                {items.map((item, index) => (
                    <TableRow 
                        key={item.id} 
                        className={cn(
                            "cursor-pointer",
                            index % 2 === 0 ? "bg-card" : "bg-muted/30",
                            item.quantity === 0 && "bg-destructive/10"
                        )}
                        onClick={() => onEdit(item)}
                    >
                        <TableCell>
                             <div className="relative">
                                {item.image_url ? (
                                    <img src={item.image_url} alt={item.name} className="w-12 h-12 object-cover rounded-md" />
                                ) : (
                                    <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                                        <ImageIcon className="w-6 h-6 text-gray-400" />
                                    </div>
                                )}
                                {item.quantity === 0 && <XCircle className="absolute -top-1 -right-1 h-5 w-5 text-destructive bg-white rounded-full"/>}
                                {item.quantity > 0 && <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-green-500 bg-white rounded-full"/>}
                            </div>
                        </TableCell>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.upc}</TableCell>
                        <TableCell>{item.purchased_qty || item.quantity}</TableCell>
                        <TableCell>{item.sold_qty || 0}</TableCell>
                        <TableCell className="font-semibold">${formatNumber(item.total_sales || 0)}</TableCell>
                        <TableCell className="font-bold">{item.quantity}</TableCell>
                        <TableCell>${formatNumber(item.cost)}</TableCell>
                        <TableCell className="font-semibold">${formatNumber(item.cost * item.quantity)}</TableCell>
                        <TableCell className="font-bold">${formatNumber(item.msrp)}</TableCell>
                        <TableCell className="font-bold">
                            <div className={`flex flex-col ${item.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                <span>${formatNumber(item.profit || 0)}</span>
                                <span className="text-xs font-normal">({formatNumber(item.profit_margin || 0, 0)}%)</span>
                            </div>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
        {items.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">No inventory items found</div>
        )}
    </div>
  </div>
);

const ItemForm = ({ editingItem, handleSubmit, formData, setFormData, itemHistory, onDelete }) => {
    const [isWriteOff, setIsWriteOff] = useState(false);
    const [writeOffData, setWriteOffData] = useState({ quantity: 1, reason: '' });
    const listingOptions = ['Walmart', 'eBay', 'Amazon', 'FB Marketplace', 'Other'];

    const handleWriteOffSubmit = (e) => {
        e.preventDefault();
        handleSubmit(e, { isWriteOff: true, writeOffData });
    };

    const handleListingChange = (option) => {
        const currentListings = formData.listed_on || [];
        const newListings = currentListings.includes(option)
            ? currentListings.filter(item => item !== option)
            : [...currentListings, option];
        setFormData(prev => ({ ...prev, listed_on: newListings }));
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2"><Label htmlFor="image_url">Image URL</Label><Input id="image_url" value={formData.image_url} onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))} className="bg-gray-100 border-gray-300" /></div>
                <div className="space-y-2"><Label htmlFor="upc">UPC Code *</Label><Input id="upc" value={formData.upc} onChange={(e) => setFormData(prev => ({ ...prev, upc: e.target.value }))} className="bg-gray-100 border-gray-300" required /></div>
                <div className="space-y-2"><Label htmlFor="name">Product Name *</Label><Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} className="bg-gray-100 border-gray-300" required /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} className="bg-gray-100 border-gray-300" /></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="quantity">Quantity *</Label><Input id="quantity" type="number" value={formData.quantity} onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))} className="bg-gray-100 border-gray-300" required /></div>
                    <div className="space-y-2"><Label htmlFor="cost">Cost *</Label><Input id="cost" type="number" step="0.01" value={formData.cost} onChange={(e) => setFormData(prev => ({ ...prev, cost: e.target.value }))} className="bg-gray-100 border-gray-300" required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="msrp">MSRP</Label><Input id="msrp" type="number" step="0.01" value={formData.msrp} onChange={(e) => setFormData(prev => ({ ...prev, msrp: e.target.value }))} className="bg-gray-100 border-gray-300" /></div>
                    <div className="space-y-2"><Label htmlFor="purchase_date">Date Purchased</Label><Input id="purchase_date" type="date" value={formData.purchase_date} onChange={(e) => setFormData(prev => ({ ...prev, purchase_date: e.target.value }))} className="bg-gray-100 border-gray-300" /></div>
                </div>
                <div className="space-y-2"><Label>Listed On</Label>
                    <div className="flex flex-wrap gap-4">
                        {listingOptions.map(option => (
                            <div key={option} className="flex items-center space-x-2">
                                <Checkbox id={`listed_on_${option}`} checked={(formData.listed_on || []).includes(option)} onCheckedChange={() => handleListingChange(option)} />
                                <Label htmlFor={`listed_on_${option}`}>{option}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                {editingItem && (
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox id="is_write_off" checked={isWriteOff} onCheckedChange={setIsWriteOff} />
                        <Label htmlFor="is_write_off">Write-off inventory</Label>
                    </div>
                )}
                <DialogFooter className="justify-between">
                    {editingItem && (
                        <AlertDialog>
                            <AlertDialogTrigger asChild>
                                <Button variant="destructive"><Trash2 className="w-4 h-4 mr-2" />Delete Item</Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action cannot be undone. This will permanently delete the item from your inventory.
                                </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDelete(editingItem.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    )}
                    <Button type="submit">{editingItem ? 'Update' : 'Add'} Item</Button>
                </DialogFooter>
            </form>
            {editingItem && (
                <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Stock History</h3>
                    <div className="max-h-60 overflow-y-auto pr-2 space-y-3">
                        {itemHistory.length > 0 ? itemHistory.map(entry => (
                            <div key={entry.id} className="flex items-center gap-4 p-2 rounded-md bg-gray-50 border">
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${entry.type === 'sale' ? 'bg-red-100 text-red-600' : entry.type === 'write-off' ? 'bg-yellow-100 text-yellow-600' : 'bg-green-100 text-green-600'}`}>
                                    {entry.type === 'sale' ? <ShoppingCart size={16} /> : entry.type === 'write-off' ? <Archive size={16} /> : <PlusCircle size={16} />}
                                </div>
                                <div className="flex-grow"><p className="font-medium text-sm">{entry.reason}</p><p className="text-xs text-gray-500">{format(new Date(entry.created_at), 'MM/dd/yyyy, p')}</p></div>
                                <div className="text-right"><p className={`font-bold text-sm ${entry.new_quantity < entry.old_quantity ? 'text-red-600' : 'text-green-600'}`}>{entry.new_quantity - entry.old_quantity > 0 ? '+' : ''}{entry.new_quantity - entry.old_quantity}</p><p className="text-xs text-gray-500">Bal: {entry.new_quantity}</p></div>
                            </div>
                        )) : <p className="text-gray-500 text-center py-4">No history for this item.</p>}
                    </div>
                    {isWriteOff && (
                        <form onSubmit={handleWriteOffSubmit} className="mt-4 p-4 border rounded-lg space-y-3 bg-yellow-50">
                            <h4 className="font-semibold">Write-off Details</h4>
                            <div className="space-y-2"><Label htmlFor="writeoff_quantity">Quantity to Write Off</Label><Input id="writeoff_quantity" type="number" min="1" max={editingItem.quantity} value={writeOffData.quantity} onChange={e => setWriteOffData(prev => ({...prev, quantity: parseInt(e.target.value)}))} required /></div>
                            <div className="space-y-2"><Label htmlFor="writeoff_reason">Reason</Label><Textarea id="writeoff_reason" value={writeOffData.reason} onChange={e => setWriteOffData(prev => ({...prev, reason: e.target.value}))} placeholder="e.g., Damaged, Expired" required /></div>
                            <Button type="submit" variant="destructive">Confirm Write-off</Button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
};

export function InventoryTab({ defaultAction }) {
  const [inventory, setInventory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemHistory, setItemHistory] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [formData, setFormData] = useState({
    upc: '', name: '', quantity: '', cost: '', description: '', image_url: '', purchase_date: new Date().toISOString().split('T')[0], msrp: '', listed_on: []
  });
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInventoryAndSales = useCallback(async () => {
    if (!user) return;
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('inventory').select('*').eq('user_id', user.id);
    if (inventoryError) {
      toast({ title: 'Error fetching inventory', description: inventoryError.message, variant: 'destructive' });
      return;
    }

    const { data: salesData, error: salesError } = await supabase
      .from('sales').select('inventory_id, quantity, sale_price, profit').eq('user_id', user.id).not('inventory_id', 'is', null);
    if (salesError) {
      toast({ title: 'Error fetching sales data', description: salesError.message, variant: 'destructive' });
      return;
    }

    const salesByInventoryId = salesData.reduce((acc, sale) => {
      if (!acc[sale.inventory_id]) {
        acc[sale.inventory_id] = { sold_qty: 0, total_sales: 0, profit: 0 };
      }
      acc[sale.inventory_id].sold_qty += sale.quantity;
      acc[sale.inventory_id].total_sales += sale.sale_price * sale.quantity;
      acc[sale.inventory_id].profit += sale.profit || 0;
      return acc;
    }, {});

    const enrichedInventory = inventoryData.map(item => {
      const salesInfo = salesByInventoryId[item.id] || { sold_qty: 0, total_sales: 0, profit: 0 };
      const profitMargin = salesInfo.total_sales > 0 ? (salesInfo.profit / salesInfo.total_sales) * 100 : 0;
      return { ...item, ...salesInfo, profit_margin: profitMargin, total_cost: item.quantity * item.cost };
    });

    setInventory(enrichedInventory);
  }, [user, toast]);

  useEffect(() => { fetchInventoryAndSales(); }, [fetchInventoryAndSales]);

  useEffect(() => {
    if (defaultAction === 'add') {
      setEditingItem(null);
      setFormData({ upc: '', name: '', quantity: '', cost: '', description: '', image_url: '', purchase_date: new Date().toISOString().split('T')[0], msrp: '', listed_on: [] });
      setIsDialogOpen(true);
    }
  }, [defaultAction]);

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const sortedItems = useMemo(() => {
    let sortableItems = [...inventory];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [inventory, sortConfig]);

  const { activeItems, inactiveItems } = useMemo(() => {
    const filtered = sortedItems.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.upc && item.upc.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return {
      activeItems: filtered.filter(item => item.quantity > 0),
      inactiveItems: filtered.filter(item => item.quantity === 0),
    };
  }, [sortedItems, searchTerm]);

  const fetchItemHistory = useCallback(async (itemId) => {
    if (!user || !itemId) return;
    const { data, error } = await supabase.from('inventory_history').select('*, sales(order_number, date)').eq('inventory_id', itemId).order('created_at', { ascending: false });
    if (error) toast({ title: 'Error fetching item history', description: error.message, variant: 'destructive' });
    else {
        const historyWithSaleDate = data.map(h => ({...h, created_at: h.type === 'sale' && h.sales?.date ? h.sales.date : h.created_at }));
        setItemHistory(historyWithSaleDate);
    }
  }, [user, toast]);

  useEffect(() => {
    if (editingItem) fetchItemHistory(editingItem.id);
    else setItemHistory([]);
  }, [editingItem, fetchItemHistory]);

  const inventoryStats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = inventory.reduce((total, item) => total + ((parseFloat(item.cost) || 0) * (item.quantity || 0)), 0);
    const uniqueItems = inventory.length;
    return { totalItems, totalValue, uniqueItems };
  }, [inventory]);

  const handleSubmit = async (e, options = {}) => {
    e.preventDefault();
    if (options.isWriteOff) {
        const { writeOffData } = options;
        const oldQuantity = editingItem.quantity;
        const newQuantity = oldQuantity - writeOffData.quantity;
        if (newQuantity < 0) { toast({ title: "Error", description: "Write-off quantity cannot exceed current stock.", variant: "destructive" }); return; }
        const { error: updateError } = await supabase.from('inventory').update({ quantity: newQuantity }).eq('id', editingItem.id);
        if (updateError) { toast({ title: "Error writing off item", variant: "destructive" }); return; }
        await supabase.from('inventory_history').insert({ inventory_id: editingItem.id, user_id: user.id, old_quantity: oldQuantity, new_quantity: newQuantity, reason: `Write-off: ${writeOffData.reason}`, type: 'write-off' });
        toast({ title: "Success", description: "Item written off successfully." });
        fetchInventoryAndSales(); setIsDialogOpen(false);
        return;
    }
    if (!formData.name || !formData.upc || !formData.quantity || !formData.cost) { toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" }); return; }
    const itemData = { user_id: user.id, ...formData, quantity: parseInt(formData.quantity), cost: parseFloat(formData.cost), msrp: parseFloat(formData.msrp) || null, purchased_qty: editingItem ? editingItem.purchased_qty : parseInt(formData.quantity) };
    const { error } = editingItem ? await supabase.from('inventory').update({ ...itemData, updated_at: new Date().toISOString() }).eq('id', editingItem.id) : await supabase.from('inventory').insert(itemData);
    if (error) toast({ title: `Error ${editingItem ? 'updating' : 'adding'} item`, description: error.message, variant: 'destructive' });
    else { toast({ title: "Success", description: `Inventory item ${editingItem ? 'updated' : 'added'} successfully` }); fetchInventoryAndSales(); setIsDialogOpen(false); }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      upc: item.upc || '', name: item.name, quantity: item.quantity.toString(), cost: item.cost ? item.cost.toString() : '',
      description: item.description || '', image_url: item.image_url || '',
      purchase_date: item.purchase_date || new Date().toISOString().split('T')[0],
      msrp: item.msrp ? item.msrp.toString() : '',
      listed_on: item.listed_on || []
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting item', description: error.message, variant: 'destructive' });
    else { toast({ title: "Success", description: "Inventory item deleted successfully" }); fetchInventoryAndSales(); setIsDialogOpen(false); }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Items</CardTitle><Package className="h-4 w-4 text-primary" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(inventoryStats.totalItems, 0)}</div><p className="text-xs text-muted-foreground">Total units in stock</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory Value</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader><CardContent><div className="text-2xl font-bold">${formatNumber(inventoryStats.totalValue)}</div><p className="text-xs text-muted-foreground">Based on cost price</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Unique Products</CardTitle><BarChart className="h-4 w-4 text-purple-500" /></CardHeader><CardContent><div className="text-2xl font-bold">{formatNumber(inventoryStats.uniqueItems, 0)}</div><p className="text-xs text-muted-foreground">Number of distinct products</p></CardContent></Card>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2"><Package className="w-6 h-6" /><span>Inventory Management</span></CardTitle>
            <CardDescription>Manage your product inventory with UPC tracking and automatic quantity adjustments</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by name or UPC..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-muted/50" />
              </div>
              <Button onClick={() => { setEditingItem(null); setFormData({ upc: '', name: '', quantity: '', cost: '', description: '', image_url: '', purchase_date: new Date().toISOString().split('T')[0], msrp: '', listed_on: [] }); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-4xl" onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle><DialogDescription>{editingItem ? 'Update' : 'Add'} product details to your inventory</DialogDescription></DialogHeader>
                  <ItemForm editingItem={editingItem} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} itemHistory={itemHistory} onDelete={handleDelete} />
                </DialogContent>
            </Dialog>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Out of Stock</TabsTrigger>
              </TabsList>
              <TabsContent value="active" className="mt-4">
                <InventoryTable items={activeItems} onEdit={handleEdit} sortConfig={sortConfig} onSort={handleSort} />
              </TabsContent>
              <TabsContent value="inactive" className="mt-4">
                <InventoryTable items={inactiveItems} onEdit={handleEdit} sortConfig={sortConfig} onSort={handleSort} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
