
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ChevronsUp, TrendingDown, Hash, ArrowLeft, ArrowRight, AlertCircle, ShoppingCart, Dog, Route, Calendar, GitBranch, BarChart2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, startOfMonth, endOfMonth, subMonths, addMonths, startOfYear, endOfYear, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter, eachDayOfInterval, subDays } from 'date-fns';
import { StatCard } from './StatCard';
import { MonthlyReport } from './MonthlyReport';
import { toDisplayDate } from '@/lib/utils';

const fetchReportData = async (user, startDate, endDate, platform) => {
  let query = supabase
    .from('sales')
    .select('total_amount, cost_of_goods, shipping_costs, fees, profit')
    .eq('user_id', user.id)
    .gte('sale_date', startDate.toISOString())
    .lte('sale_date', endDate.toISOString());

  if (platform && platform !== 'All') {
    query = query.eq('platform', platform);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching report data:', error);
    return { totalSales: 0, costOfGoods: 0, shipping: 0, fees: 0, refunds: 0, profit: 0, salesCount: 0 };
  }

  const sales = data || [];
  const totalSales = sales.reduce((sum, s) => sum + (s.total_amount || 0), 0);
  const costOfGoods = sales.reduce((sum, s) => sum + (s.cost_of_goods || 0), 0);
  const shipping = sales.reduce((sum, s) => sum + (s.shipping_costs || 0), 0);
  const fees = sales.reduce((sum, s) => sum + (s.fees || 0), 0);
  const profit = sales.reduce((sum, s) => sum + (s.profit || 0), 0);
  const salesCount = sales.length;
  
  // Note: Refunds are not directly linked to sales in this model, so they are fetched separately or assumed to be 0.
  return { totalSales, costOfGoods, shipping, fees, refunds: 0, profit, salesCount };
};

export function InsightsTab() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeframe, setTimeframe] = useState('Monthly');
  const [platform, setPlatform] = useState('All');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchInsightsData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    let startDate, endDate;
    const now = currentDate;

    switch (timeframe) {
      case 'Daily':
        startDate = subDays(now, 6);
        endDate = now;
        break;
      case 'Weekly':
        startDate = startOfWeek(now);
        endDate = endOfWeek(now);
        break;
      case 'Quarterly':
        startDate = startOfQuarter(now);
        endDate = endOfQuarter(now);
        break;
      case 'Yearly':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      case 'Monthly':
      default:
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
    }

    const data = await fetchReportData(user, startDate, endDate, platform);
    setReportData(data);
    setLoading(false);
  }, [user, currentDate, timeframe, platform]);

  useEffect(() => { fetchInsightsData(); }, [fetchInsightsData]);

  const handlePrev = () => {
    switch (timeframe) {
      case 'Daily': setCurrentDate(subDays(currentDate, 7)); break;
      case 'Weekly': setCurrentDate(subMonths(currentDate, 1)); break; // Simplified to month for week
      case 'Monthly': setCurrentDate(subMonths(currentDate, 1)); break;
      case 'Quarterly': setCurrentDate(subMonths(currentDate, 3)); break;
      case 'Yearly': setCurrentDate(subMonths(currentDate, 12)); break;
      default: break;
    }
  };
  const handleNext = () => {
    switch (timeframe) {
      case 'Daily': setCurrentDate(addMonths(currentDate, 0)); break; // Simplified
      case 'Weekly': setCurrentDate(addMonths(currentDate, 1)); break; // Simplified
      case 'Monthly': setCurrentDate(addMonths(currentDate, 1)); break;
      case 'Quarterly': setCurrentDate(addMonths(currentDate, 3)); break;
      case 'Yearly': setCurrentDate(addMonths(currentDate, 12)); break;
      default: break;
    }
  };

  const renderReport = () => {
    if (!reportData) return <Card><CardContent className="pt-6 text-center text-muted-foreground"><AlertCircle className="mx-auto h-12 w-12 text-yellow-500" /><h3 className="mt-4 text-lg font-medium">No Data Available</h3><p>Could not load financial data for this period.</p></CardContent></Card>;
    
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-3"><CardHeader><CardTitle>Summary for {format(currentDate, 'MMMM yyyy')} ({timeframe})</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatCard title="Gross Sales" value={reportData.totalSales} icon={DollarSign} />
                    <StatCard title="Net Profit" value={reportData.profit} icon={ChevronsUp} />
                    <StatCard title="Cost of Goods" value={reportData.costOfGoods} icon={TrendingDown} />
                    <StatCard title="Sales Count" value={reportData.salesCount} icon={Hash} isCount={true} />
                </CardContent>
            </Card>
        </div>
        <MonthlyReport data={reportData} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <CardTitle className="text-3xl font-bold flex items-center gap-2"><BarChart2 /> Sales Insights</CardTitle>
                <CardDescription>Analyze sales performance across different timeframes and platforms.</CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Select value={timeframe} onValueChange={setTimeframe}>
                  <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Platforms</SelectItem>
                    <SelectItem value="Walmart">Walmart</SelectItem>
                    <SelectItem value="Walmart WFS">Walmart WFS</SelectItem>
                    <SelectItem value="eBay">eBay</SelectItem>
                    <SelectItem value="Puppies">Puppies</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
                  <Button variant="ghost" size="icon" onClick={handlePrev}><ArrowLeft className="h-4 w-4" /></Button>
                  <span className="text-sm font-semibold w-32 text-center">{format(currentDate, 'MMM yyyy')}</span>
                  <Button variant="ghost" size="icon" onClick={handleNext}><ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </motion.div>
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {loading ? <div className="text-center py-10">Loading insights...</div> : renderReport()}
      </motion.div>
    </div>
  );
}
