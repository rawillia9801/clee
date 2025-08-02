
import React from 'react';
import { Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber } from '@/lib/utils';
import { format } from 'date-fns';

const toLocalDateString = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const userTimezoneOffset = date.getTimezoneOffset() * 60000;
    return format(new Date(date.getTime() + userTimezoneOffset), 'MM/dd/yyyy');
};

export function SalesListCard({ title, icon, sales, onEdit, onDelete }) {
  const totalRevenue = sales.reduce((sum, sale) => sum + (sale.sale_price * sale.quantity), 0);

  return (
    <Card className="flex-1">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            {React.cloneElement(icon, { className: "h-8 w-8 text-primary" })}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>Sales this month: ${formatNumber(totalRevenue)}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sale #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Profit</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.map((sale) => (
                <TableRow key={sale.id} className="hover:bg-muted/50 cursor-pointer" onClick={() => onEdit(sale)}>
                  <TableCell>{sale.sale_number}</TableCell>
                  <TableCell>{toLocalDateString(sale.date)}</TableCell>
                  <TableCell className="font-medium">{sale.product_name}</TableCell>
                  <TableCell>${formatNumber(sale.sale_price)}</TableCell>
                  <TableCell className={`font-medium ${sale.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>${formatNumber(sale.profit || 0)}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(sale)}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => onDelete(sale.id)}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {sales.length === 0 && (<div className="text-center py-8 text-muted-foreground">No sales recorded for this month</div>)}
        </div>
      </CardContent>
    </Card>
  );
}
