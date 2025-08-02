
import React from 'react';
import { motion } from 'framer-motion';
import { PayoutStatCard } from './PayoutStatCard';
import { format, startOfToday, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subYears } from 'date-fns';

const calculateStats = (payouts) => {
    const today = new Date();
    
    const todayRange = { start: startOfToday(), end: new Date() };
    const monthRange = { start: startOfMonth(today), end: endOfMonth(today) };
    const quarterRange = { start: startOfQuarter(today), end: endOfQuarter(today) };
    const yearRange = { start: startOfYear(today), end: endOfYear(today) };

    const lastYearToday = subYears(today, 1);
    const lastYearMonthRange = { start: startOfMonth(lastYearToday), end: endOfMonth(lastYearToday) };

    const calculateSum = (items, range) => 
        items
            .filter(p => {
                const payoutDate = new Date(p.payout_date);
                const userTimezoneOffset = payoutDate.getTimezoneOffset() * 60000;
                const adjustedPayoutDate = new Date(payoutDate.getTime() + userTimezoneOffset);
                return adjustedPayoutDate >= range.start && adjustedPayoutDate <= range.end;
            })
            .reduce((sum, p) => sum + p.payout_amount, 0);

    const daily = calculateSum(payouts, todayRange);
    const monthly = calculateSum(payouts, monthRange);
    const quarterly = calculateSum(payouts, quarterRange);
    const yearly = calculateSum(payouts, yearRange);

    const lastYearMonthly = calculateSum(payouts, lastYearMonthRange);
    const yoyChange = lastYearMonthly > 0 ? ((monthly - lastYearMonthly) / lastYearMonthly) * 100 : (monthly > 0 ? 100 : 0);

    return { daily, monthly, quarterly, yearly, yoyChange };
};

export function PayoutsDashboard({ data }) {
    if (!data || data.length === 0) {
        return (
            <div className="text-center py-10 text-muted-foreground">
                <p>No payout data available to generate insights.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Insights</h2>
            {data.map(({ marketplace, items }, index) => {
                const stats = calculateStats(items);
                return (
                    <motion.div 
                        key={marketplace}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <div className="p-4 border rounded-lg bg-card">
                            <h3 className="text-lg font-semibold text-foreground mb-4">{marketplace}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                                <PayoutStatCard title="Today's Payouts" value={stats.daily} />
                                <PayoutStatCard title="This Month" value={stats.monthly} />
                                <PayoutStatCard title="This Quarter" value={stats.quarterly} />
                                <PayoutStatCard title="This Year" value={stats.yearly} />
                                <PayoutStatCard title="Monthly YoY" value={stats.yoyChange} isPercentage={true} />
                            </div>
                        </div>
                    </motion.div>
                );
            })}
        </div>
    );
}
