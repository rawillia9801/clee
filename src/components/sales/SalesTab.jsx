
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Plus, ShoppingCart, Dog, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SalesDialog } from './SalesDialog';
import { SalesCard } from './SalesCard';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber } from '@/lib/utils';

export function SalesTab() {
  const [sales, setSales] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchSalesAndInventory = useCallback(async () => {
    if (!user) return;
    const [salesRes, inventoryRes] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', user.id).order('date', { ascending: false }),
      supabase.from('inventory').select('id, name, quantity, upc, cost').eq('user_id', user.id)
    ]);
    if (salesRes.error) toast({ title: 'Error fetching sales', variant: 'destructive' }); else setSales(salesRes.data || []);
    if (inventoryRes.error) toast({ title: 'Error fetching inventory', variant: 'destructive' }); else setInventory(inventoryRes.data || []);
  }, [user, toast]);

  useEffect(() => { fetchSalesAndInventory(); }, [fetchSalesAndInventory]);

  const handleSaleAdded = () => { fetchSalesAndInventory(); setIsDialogOpen(false); setEditingSale(null); };
  
  const handleDelete = async (id) => {
    const { error } = await supabase.from('sales').delete().eq('id', id);
    if (error) toast({ title: 'Error deleting sale', variant: 'destructive' });
    else { toast({ title: "Success", description: "Sale record deleted" }); fetchSalesAndInventory(); }
  };
  
  const handleEdit = (sale) => { setEditingSale(sale); setIsDialogOpen(true); };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const { marketplaceSales, swvaSales, lastSaleNumber } = useMemo(() => {
    const firstDay = startOfMonth(currentDate);
    const lastDay = endOfMonth(currentDate);
    const monthlySales = sales.filter(s => {
      const saleDate = new Date(s.date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });
    
    const swvaSalesData = monthlySales.filter(s => s.sale_type === 'SWVA Chihuahua').sort((a,b) => b.sale_number - a.sale_number);
    const lastNum = swvaSalesData.length > 0 ? Math.max(...swvaSalesData.map(s => s.sale_number)) : 0;

    return {
      marketplaceSales: monthlySales.filter(s => s.sale_type === 'Marketplace').sort((a,b) => b.sale_number - a.sale_number),
      swvaSales: swvaSalesData,
      lastSaleNumber: lastNum,
    };
  }, [sales, currentDate]);

  const marketplaceRevenue = marketplaceSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);
  const swvaRevenue = swvaSales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Sales Dashboard</h1>
            <p className="text-muted-foreground">Record sales and track performance.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 p-1 bg-muted rounded-lg">
                <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ArrowLeft className="h-4 w-4" /></Button>
                <span className="text-lg font-semibold w-40 text-center">{format(currentDate, 'MMMM yyyy')}</span>
                <Button variant="ghost" size="icon" onClick={handleNextMonth}><ArrowRight className="h-4 w-4" /></Button>
            </div>
            <Button onClick={() => { setEditingSale(null); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" />Record Sale</Button>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
            <CardHeader><CardTitle>Total eCommerce Sales</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">${formatNumber(marketplaceRevenue)}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Total Puppy Sales</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">${formatNumber(swvaRevenue)}</p></CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Last Puppy Sale #</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{lastSaleNumber}</p></CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col md:flex-row gap-6">
        <SalesCard 
          title="eCommerce Sales"
          icon={<ShoppingCart />}
          sales={marketplaceSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalRevenue={marketplaceRevenue}
        />
        <SalesCard
          title="SWVA Chihuahua Sales"
          icon={<Dog />}
          sales={swvaSales}
          onEdit={handleEdit}
          onDelete={handleDelete}
          totalRevenue={swvaRevenue}
          isPuppySales={true}
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
