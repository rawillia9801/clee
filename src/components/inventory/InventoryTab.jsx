
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { InventoryTable } from './InventoryTable';
import { InventoryForm } from './InventoryForm';
import { InventoryStats } from './InventoryStats';

const initialFormData = {
  upc: '',
  item_name: '',
  quantity: '',
  cost: '',
  price: '',
  supplier: '',
  purchase_date: null,
  location: '',
  platform: '',
};

export function InventoryTab({ defaultAction }) {
  const [inventory, setInventory] = useState([]);
  const [sales, setSales] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'item_name', direction: 'ascending' });
  const [formData, setFormData] = useState(initialFormData);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [inventoryRes, salesRes] = await Promise.all([
        supabase.from('inventory').select('*').eq('user_id', user.id),
        supabase.from('sales').select('inventory_id, profit').eq('user_id', user.id).not('inventory_id', 'is', null)
    ]);
    
    if (inventoryRes.error) {
      toast({ title: 'Error fetching inventory', description: inventoryRes.error.message, variant: 'destructive' });
    } else {
      setInventory(inventoryRes.data || []);
    }

    if (salesRes.error) {
        toast({ title: 'Error fetching sales data', description: salesRes.error.message, variant: 'destructive' });
    } else {
        setSales(salesRes.data || []);
    }
  }, [user, toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (defaultAction === 'add') {
      handleAddNew();
    }
  }, [defaultAction]);
  
  const handleAddNew = () => {
    setEditingItem(null);
    setFormData(initialFormData);
    setIsDialogOpen(true);
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const inventoryWithProfit = useMemo(() => {
    return inventory.map(item => {
        const itemSales = sales.filter(sale => sale.inventory_id === item.id);
        const totalProfit = itemSales.reduce((sum, sale) => sum + (sale.profit || 0), 0);
        const totalCost = (item.cost || 0) * (item.quantity || 0);
        const profitMargin = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;
        return { ...item, totalProfit, profitMargin };
    });
  }, [inventory, sales]);

  const sortedItems = useMemo(() => {
    let sortableItems = [...inventoryWithProfit];
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
  }, [inventoryWithProfit, sortConfig]);

  const { activeItems, inactiveItems } = useMemo(() => {
    const filtered = sortedItems.filter(item =>
      (item.item_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.upc && item.upc.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    return {
      activeItems: filtered.filter(item => (item.quantity || 0) > 0),
      inactiveItems: filtered.filter(item => (item.quantity || 0) <= 0),
    };
  }, [sortedItems, searchTerm]);

  const inventoryStats = useMemo(() => {
    const totalItems = inventory.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const totalValue = inventory.reduce((total, item) => total + ((parseFloat(item.cost) || 0) * (item.quantity || 0)), 0);
    const uniqueItems = inventory.length;
    return { totalItems, totalValue, uniqueItems };
  }, [inventory]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.item_name || !formData.upc || !formData.quantity || !formData.cost) { 
        toast({ title: "Error", description: "Please fill in all required fields.", variant: "destructive" }); 
        return; 
    }
    
    const itemData = { 
        user_id: user.id, 
        ...formData, 
        quantity: parseInt(formData.quantity, 10), 
        cost: parseFloat(formData.cost), 
        price: formData.price ? parseFloat(formData.price) : null,
        last_updated: new Date().toISOString()
    };
    
    let error;
    if (editingItem) {
        const { error: updateError } = await supabase.from('inventory').update(itemData).eq('id', editingItem.id);
        error = updateError;
    } else {
        const { error: insertError } = await supabase.from('inventory').insert(itemData);
        error = insertError;
    }

    if (error) {
        toast({ title: `Error ${editingItem ? 'updating' : 'adding'} item`, description: error.message, variant: 'destructive' });
    } else { 
        toast({ title: "Success", description: `Inventory item ${editingItem ? 'updated' : 'added'} successfully` }); 
        fetchData(); 
        setIsDialogOpen(false); 
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      ...initialFormData,
      ...item,
      quantity: item.quantity?.toString() || '',
      cost: item.cost?.toString() || '',
      price: item.price?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id);
    if (error) {
        toast({ title: 'Error deleting item', description: error.message, variant: 'destructive' });
    } else { 
        toast({ title: "Success", description: "Inventory item deleted successfully" }); 
        fetchData(); 
        setIsDialogOpen(false); 
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <InventoryStats stats={inventoryStats} />
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
              <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2" />Add Item</Button>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
                  <DialogHeader><DialogTitle>{editingItem ? 'Edit' : 'Add'} Inventory Item</DialogTitle><DialogDescription>{editingItem ? 'Update an existing item in' : 'Add a new item to'} your inventory.</DialogDescription></DialogHeader>
                  <InventoryForm editingItem={editingItem} handleSubmit={handleSubmit} formData={formData} setFormData={setFormData} onDelete={handleDelete} />
                </DialogContent>
            </Dialog>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">In Stock</TabsTrigger>
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
