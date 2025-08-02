
import React from 'react';
import { Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatNumber, toDisplayDate } from '@/lib/utils';

export const BillList = ({ title, icon, bills, total, onEdit, onDelete, onToggleStatus }) => (
  <Card className="bg-white text-black flex-1 border-gray-200 shadow-sm">
    <CardHeader>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-xl font-bold">${formatNumber(total)}</p>
        </div>
      </div>
    </CardHeader>
    <CardContent>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bills.map((bill) => (
              <TableRow key={bill.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onEdit(bill)}>
                <TableCell className="font-medium">{bill.description}</TableCell>
                <TableCell>{toDisplayDate(bill.due_date)}</TableCell>
                <TableCell>${formatNumber(bill.amount)}</TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => onToggleStatus(bill)} className={bill.status === 'Paid' ? 'text-yellow-600' : 'text-green-600'}>
                      {bill.status === 'Paid' ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => onEdit(bill)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="outline" onClick={() => onDelete(bill.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {bills.length === 0 && (<div className="text-center py-8 text-gray-500">No bills in this category.</div>)}
      </div>
    </CardContent>
  </Card>
);
