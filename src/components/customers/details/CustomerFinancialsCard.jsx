
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatNumber, toDisplayDate } from '@/lib/utils';
import { DollarSign, PiggyBank, Receipt, CalendarClock, Link } from 'lucide-react';

export function CustomerFinancialsCard({ customer, puppies, payments, onUpdate }) {

    const totalSpent = puppies.reduce((sum, p) => sum + (p.price_sold || 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0) + puppies.reduce((sum, p) => sum + (p.deposit_amount || 0), 0);
    const totalCredits = (customer?.credit || 0) + puppies.reduce((sum, p) => sum + (p.credits || 0), 0);
    const totalDiscounts = customer?.discounts || 0;
    const totalBalance = totalSpent - totalPaid - totalCredits - totalDiscounts;

    const anyOnPaymentPlan = puppies.some(p => p.on_payment_plan);
    const lastPayment = payments.length > 0 ? payments.reduce((latest, p) => new Date(p.payment_date) > new Date(latest.payment_date) ? p : latest, payments[0]) : null;

    const getPaymentPlanStatus = () => {
        if (!anyOnPaymentPlan) return { text: 'Not Set', variant: 'secondary' };
        if (totalBalance <= 0) return { text: 'Paid', variant: 'default' };
        return { text: 'Active', variant: 'destructive' };
    };

    const paymentPlanStatus = getPaymentPlanStatus();

    return (
        <Card className="bg-card text-card-foreground shadow-lg border-primary/20">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl font-bold">
                    <PiggyBank className="text-primary" />
                    Financial Summary
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Puppy Price:</span>
                        <span className="font-semibold text-foreground">${formatNumber(totalSpent)}</span>
                    </div>
                     <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Total Discounts:</span>
                        <span className="font-semibold text-foreground">${formatNumber(totalDiscounts)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Total Paid:</span>
                        <span className="font-semibold text-green-600">${formatNumber(totalPaid)}</span>
                    </div>
                    <div className="flex justify-between items-baseline">
                        <span className="text-muted-foreground">Total Credit:</span>
                        <span className="font-semibold text-foreground">${formatNumber(totalCredits)}</span>
                    </div>
                </div>

                <div className="pt-3 mt-3 border-t">
                    <div className="flex justify-between items-center text-lg">
                        <span className="font-bold text-muted-foreground">Remaining Balance:</span>
                        <span className={`font-bold ${totalBalance > 0 ? 'text-destructive' : 'text-primary'}`}>
                            ${formatNumber(totalBalance)}
                        </span>
                    </div>
                </div>

                <div className="pt-3 border-t space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Receipt size={14} /> Payment Plan:</span>
                        <Badge variant={paymentPlanStatus.variant}>{paymentPlanStatus.text}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5"><CalendarClock size={14} /> Last Payment:</span>
                        <span>{lastPayment ? toDisplayDate(lastPayment.payment_date) : 'N/A'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground flex items-center gap-1.5"><Link size={14}/> Payment History:</span>
                        <a href="#" className="text-primary hover:underline" onClick={(e) => { e.preventDefault(); /* Scroll logic here */ }}>View History</a>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
