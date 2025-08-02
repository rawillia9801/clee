
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SalesDialog } from './SalesDialog';
import { SalesListCard } from './SalesListCard';
import { InsightsTab } from '@/components/insights/InsightsTab';

export function EcommerceSalesTab() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSalesAndInventory = useCallback(async () => {
    if (!user) return;
    const [salesRes, inventoryRes] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', user.id).eq('sale_type', 'Marketplace').order('date', { ascending: false }),
      supabase.from('inventory').select('id, name, quantity, upc, cost').eq('user_id', user.id)
    ]);
    if (salesRes.error) toast({ title: 'Error fetching sales', variant: 'destructive' }); else setSales(salesRes.data || []);
    if (inventoryRes.error) toast({ title: 'Error fetching inventory', variant: 'destructive' }); else setInventory(inventoryRes.data || []);
  }, [user, toast]);

  useEffect(() => { fetchSalesAndInventory(); }, [fetchSalesAndInventory]);

  const handleSaleAdded = () => { fetchSalesAndInventory(); setIsDialogOpen(false); setEditingSale(null); };
  
  const handleDeleteSale = async (id) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting sale', variant: 'destructive' });
    else { toast({ title: "Success", description: "Sale record deleted" }); fetchSalesAndInventory(); }
  };
  
  const handleEditSale = (sale) => { setEditingSale(sale); setIsDialogOpen(true); };

  const monthlySales = useMemo(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
    return sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= firstDay && saleDate <= lastDay;
    }).sort((a,b) => b.sale_number - a.sale_number);
  }, [sales]);

  return (
    <div className="space-y-6">
      <InsightsTab type="ecommerce" />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">eCommerce Sales (Current Month)</h2>
            <p className="text-muted-foreground">Record and view all marketplace sales for the current month.</p>
          </div>
          <Button onClick={() => { setEditingSale(null); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Record Sale</Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.3 }}>
        <SalesListCard 
          title="eCommerce Sales"
          icon={<ShoppingCart />}
          sales={monthlySales}
          onEdit={handleEditSale}
          onDelete={handleDeleteSale}
        />
      </motion.div>

      <SalesDialog 
        isOpen={isDialogOpen} 
        setIsOpen={setIsDialogOpen}
        editingSale={editingSale} 
        onSaleAdded={handleSaleAdded}
        inventory={inventory}
      />
    </div>
  );
}
