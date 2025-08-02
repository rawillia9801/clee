import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ChevronsUp, ShoppingBag, TrendingUp, TrendingDown, Dog, ShoppingCart, ArrowLeft, ArrowRight, BarChart, AlertCircle, Hash } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { formatNumber } from '@/lib/utils';

const StatCard = ({ title, value, icon: Icon, prefix = '$', isCount = false }) => (
  <Card className="glass-effect border-white/20">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-300">{title}</CardTitle>
      <Icon className="h-4 w-4 text-purple-400" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-white">{isCount ? '' : prefix}{isCount ? value : formatNumber(value)}</div>
    </CardContent>
  </Card>
);

const MonthlyReport = ({ data, type }) => {
  const chartData = [
    { name: 'Sales', value: data.totalSales },
    { name: 'CoGS', value: data.costOfGoods },
    { name: 'Shipping', value: data.shipping },
    { name: 'Fees', value: data.fees },
    { name: 'Refunds', value: data.refunds },
    { name: 'Profit', value: data.profit },
  ];

  return (
    <Card className="glass-effect border-white/20 flex-grow">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          {type === 'eCommerce' ? <ShoppingCart /> : <Dog />}
          {type} Report
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm"><span className="text-gray-300">Gross Sales:</span> <span className="font-medium text-white">${formatNumber(data.totalSales)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-300">Cost of Goods:</span> <span className="font-medium text-red-400">-${formatNumber(data.costOfGoods)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-300">Shipping Costs:</span> <span className="font-medium text-red-400">-${formatNumber(data.shipping)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-300">Commissions & Fees:</span> <span className="font-medium text-red-400">-${formatNumber(data.fees)}</span></div>
          <div className="flex justify-between text-sm"><span className="text-gray-300">Refunds:</span> <span className="font-medium text-red-400">-${formatNumber(data.refunds)}</span></div>
          <hr className="border-white/20 my-2" />
          <div className="flex justify-between font-bold text-lg"><span className="text-gray-100">Net Profit:</span> <span className={data.profit >= 0 ? 'text-green-400' : 'text-red-400'}>${formatNumber(data.profit)}</span></div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#9ca3af" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip
                contentStyle={{
                  background: "rgba(30, 41, 59, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.2)",
                  color: "#fff"
                }}
                cursor={{ fill: 'rgba(167, 139, 250, 0.1)' }}
              />
              <Bar dataKey="value" fill="rgba(139, 92, 246, 0.7)" radius={[4, 4, 0, 0]} />
            </RechartsBarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

export function InsightsTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const [salesRes, refundsRes, puppiesRes] = await Promise.all([
      supabase.from('sales').select('*').eq('user_id', user.id).gte('date', startDate.toISOString()).lte('date', endDate.toISOString()),
      supabase.from('refunds').select('*').eq('user_id', user.id).gte('date_refunded', startDate.toISOString()).lte('date_refunded', endDate.toISOString()),
      supabase.from('puppies').select('price_sold, cost_of_goods, date_sold').eq('user_id', user.id).gte('date_sold', startDate.toISOString()).lte('date_sold', endDate.toISOString())
    ]);

    if (salesRes.error || refundsRes.error || puppiesRes.error) {
      console.error('Error fetching data:', salesRes.error || refundsRes.error || puppiesRes.error);
      setLoading(false);
      return;
    }

    const maxSaleNumber = salesRes.data.reduce((max, s) => Math.max(max, s.sale_number || 0), 0);

    const processData = (salesData, type) => {
      const relevantSales = salesData.filter(s => s.sale_type === type);
      const totalSales = relevantSales.reduce((sum, s) => sum + (s.sale_price * s.quantity), 0);
      const costOfGoods = relevantSales.reduce((sum, s) => sum + (s.cost * s.quantity), 0);
      const shipping = relevantSales.reduce((sum, s) => sum + (s.shipping || 0), 0);
      const fees = relevantSales.reduce((sum, s) => sum + (s.commission || 0) + (s.other_fees || 0), 0);
      return { totalSales, costOfGoods, shipping, fees };
    };
    
    const eCommerceData = processData(salesRes.data, 'Marketplace');
    const refunds = refundsRes.data.reduce((sum, r) => sum + (r.refund_for_return || 0), 0); // Assuming refunds are global for now
    eCommerceData.refunds = refunds;
    eCommerceData.profit = eCommerceData.totalSales - eCommerceData.costOfGoods - eCommerceData.shipping - eCommerceData.fees - eCommerceData.refunds;

    const puppySales = puppiesRes.data.reduce((sum, p) => sum + (p.price_sold || 0), 0);
    const puppyCOGS = puppiesRes.data.reduce((sum, p) => sum + (p.cost_of_goods || 0), 0);
    
    const swvaData = {
        totalSales: puppySales,
        costOfGoods: puppyCOGS,
        shipping: 0, 
        fees: 0, 
        refunds: 0,
        profit: puppySales - puppyCOGS,
    };

    setData({ eCommerce: eCommerceData, swva: swvaData, maxSaleNumber });
    setLoading(false);
  }, [user, currentDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Monthly Insights</h1>
          <div className="flex items-center gap-2 p-1 bg-slate-700/50 rounded-lg">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth}><ArrowLeft className="h-4 w-4" /></Button>
            <span className="text-lg font-semibold text-white w-40 text-center">{format(currentDate, 'MMMM yyyy')}</span>
            <Button variant="ghost" size="icon" onClick={handleNextMonth}><ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      </motion.div>

      {loading ? (
        <div className="text-white text-center py-10">Loading insights...</div>
      ) : data ? (
        <>
          <motion.div
            key={format(currentDate, 'yyyy-MM')}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <StatCard title="Total Gross Sales" value={data.eCommerce.totalSales + data.swva.totalSales} icon={DollarSign} />
            <StatCard title="Total Net Profit" value={data.eCommerce.profit + data.swva.profit} icon={ChevronsUp} />
            <StatCard title="Total CoGS" value={data.eCommerce.costOfGoods + data.swva.costOfGoods} icon={TrendingDown} />
            <StatCard title="Monthly Sales Count" value={data.maxSaleNumber} icon={Hash} isCount={true} />
          </motion.div>
          <motion.div
            key={`reports-${format(currentDate, 'yyyy-MM')}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col lg:flex-row gap-6"
          >
            <MonthlyReport data={data.eCommerce} type="eCommerce" />
            <MonthlyReport data={data.swva} type="SWVA Chihuahua" />
          </motion.div>
        </>
      ) : (
        <Card className="glass-effect border-white/20">
          <CardContent className="pt-6 text-center text-gray-300">
            <AlertCircle className="mx-auto h-12 w-12 text-yellow-400" />
            <h3 className="mt-4 text-lg font-medium text-white">No Data Available</h3>
            <p>Could not load financial data for this period.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}