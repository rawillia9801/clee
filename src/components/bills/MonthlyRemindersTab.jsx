
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { isBefore, startOfToday } from 'date-fns';
import { formatNumber, toDisplayDate } from '@/lib/utils';

export function MonthlyRemindersTab() {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchBills = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'Unpaid')
      .order('due_date', { ascending: true });

    if (error) {
      toast({ title: 'Error fetching bills', description: error.message, variant: 'destructive' });
    } else {
      setBills(data || []);
    }
    setLoading(false);
  }, [user, toast]);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  const { upcomingBills, overdueBills } = useMemo(() => {
    const today = startOfToday();
    return {
      upcomingBills: bills.filter(bill => !isBefore(new Date(bill.due_date), today)),
      overdueBills: bills.filter(bill => isBefore(new Date(bill.due_date), today)),
    };
  }, [bills]);

  if (loading) {
    return <div className="text-center p-8">Loading reminders...</div>;
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>Bill Reminders</CardTitle>
            <CardDescription>A summary of your upcoming and overdue unpaid bills.</CardDescription>
          </CardHeader>
        </Card>
      </motion.div>

      {overdueBills.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}>
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle />
                Overdue Bills
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {overdueBills.map(bill => (
                  <Card key={bill.id} className="bg-destructive/10">
                    <CardHeader>
                      <CardTitle className="text-base">{bill.vendor}</CardTitle>
                      <CardDescription>{bill.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-bold text-lg">${formatNumber(bill.amount)}</p>
                      <p className="text-sm text-destructive font-semibold">Due: {toDisplayDate(bill.due_date)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar />
              Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingBills.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {upcomingBills.map(bill => (
                  <Card key={bill.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{bill.vendor}</CardTitle>
                      <CardDescription>{bill.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="font-bold text-lg">${formatNumber(bill.amount)}</p>
                      <p className="text-sm text-muted-foreground">Due: {toDisplayDate(bill.due_date)}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">You're all caught up on your bills! 🎉</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
