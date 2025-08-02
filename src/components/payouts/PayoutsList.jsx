import React, { useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { format, parseISO } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { Edit, Trash2 } from 'lucide-react';

export function PayoutsList({ payouts, onEdit, onDelete }) {
    const groupedByMonth = useMemo(() => {
        return payouts.reduce((acc, p) => {
            const month = format(parseISO(p.payout_date), 'MMMM yyyy');
            if (!acc[month]) {
                acc[month] = [];
            }
            acc[month].push(p);
            return acc;
        }, {});
    }, [payouts]);

    return (
        <div className="space-y-6">
            {Object.entries(groupedByMonth).map(([month, monthlyPayouts]) => (
                <Card key={month}>
                    <CardHeader>
                        <CardTitle>{month}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Source / Marketplace</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Notes</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {monthlyPayouts.map((payout) => (
                                        <TableRow key={payout.id} className="hover:bg-secondary/50">
                                            <TableCell>{format(parseISO(payout.payout_date), 'MM/dd/yyyy')}</TableCell>
                                            <TableCell className="font-medium">{payout.marketplace}</TableCell>
                                            <TableCell className="text-green-600 font-semibold">${formatNumber(payout.payout_amount)}</TableCell>
                                            <TableCell className="text-muted-foreground truncate max-w-xs">{payout.notes}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex gap-2 justify-end">
                                                    <Button size="icon" variant="ghost" onClick={() => onEdit(payout)}><Edit className="w-4 h-4" /></Button>
                                                    <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => onDelete(payout.id)}><Trash2 className="w-4 h-4" /></Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}