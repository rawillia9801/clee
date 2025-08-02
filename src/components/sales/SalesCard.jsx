
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { formatNumber } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const toLocalISOString = (dateString) => {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return format(date, 'MM/dd/yyyy');
    } catch (e) {
        return '';
    }
};

const BuyerRow = ({ buyer, sales, onEdit, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <Collapsible asChild open={isOpen} onOpenChange={setIsOpen}>
            <>
                <TableRow className="border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <CollapsibleTrigger asChild>
                        <TableCell colSpan={5} className="font-medium text-black">
                            <div className="flex items-center gap-2">
                                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                                {buyer}
                            </div>
                        </TableCell>
                    </CollapsibleTrigger>
                </TableRow>
                <CollapsibleContent asChild>
                    <>
                        {sales.map(sale => (
                            <TableRow key={sale.id} className="bg-muted/50">
                                <TableCell>{sale.sale_number}</TableCell>
                                <TableCell>{toLocalISOString(sale.date)}</TableCell>
                                <TableCell className="font-medium text-black">{sale.product_name}</TableCell>
                                <TableCell>${formatNumber(sale.sale_price)}</TableCell>
                                <TableCell className={`font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${formatNumber(sale.profit || 0)}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <div className="flex space-x-2">
                                        <Button size="sm" variant="outline" onClick={() => onEdit(sale)}><Edit className="w-4 h-4" /></Button>
                                        <Button size="sm" variant="destructive" onClick={() => onDelete(sale.id)}><Trash2 className="w-4 h-4" /></Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </>
                </CollapsibleContent>
            </>
        </Collapsible>
    );
};

export const SalesCard = ({ title, icon, sales, onEdit, onDelete, totalRevenue, isPuppySales = false }) => {
    const groupedByBuyer = sales.reduce((acc, sale) => {
        const buyerName = sale.customer_name || 'Unknown Buyer';
        if (!acc[buyerName]) {
            acc[buyerName] = [];
        }
        acc[buyerName].push(sale);
        return acc;
    }, {});

    return (
        <Card className="bg-white text-black flex-1">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {React.cloneElement(icon, { className: "h-8 w-8 text-pink-500" })}
                        <div>
                            <CardTitle className="text-black">{title}</CardTitle>
                            <CardDescription className="text-gray-500">Sales this month: ${formatNumber(totalRevenue)}</CardDescription>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="rounded-lg border border-gray-200 bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-gray-200">
                                <TableHead>Sale #</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>{isPuppySales ? 'Buyer Name' : 'Product'}</TableHead>
                                <TableHead>Sale Price</TableHead>
                                <TableHead>Profit</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isPuppySales ? (
                                Object.entries(groupedByBuyer).map(([buyer, buyerSales]) => (
                                    <BuyerRow key={buyer} buyer={buyer} sales={buyerSales} onEdit={onEdit} onDelete={onDelete} />
                                ))
                            ) : (
                                sales.map((sale) => (
                                    <TableRow key={sale.id} className="border-gray-200 hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(sale)}>
                                        <TableCell>{sale.sale_number}</TableCell>
                                        <TableCell>{toLocalISOString(sale.date)}</TableCell>
                                        <TableCell className="font-medium text-black">{sale.product_name}</TableCell>
                                        <TableCell>${formatNumber(sale.sale_price)}</TableCell>
                                        <TableCell className={`font-medium ${sale.profit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${formatNumber(sale.profit || 0)}</TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <div className="flex space-x-2">
                                                <Button size="sm" variant="outline" onClick={() => onEdit(sale)}><Edit className="w-4 h-4" /></Button>
                                                <Button size="sm" variant="destructive" onClick={() => onDelete(sale.id)}><Trash2 className="w-4 h-4" /></Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                    {sales.length === 0 && (<div className="text-center py-8 text-gray-500">No sales recorded for this month</div>)}
                </div>
            </CardContent>
        </Card>
    );
};
