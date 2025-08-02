import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Printer, Edit, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';

export const CheckList = ({ checks, onPreview, onEdit, onVoid, onDelete }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Check #</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Payee</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {checks.map(check => (
          <TableRow key={check.id}>
            <TableCell>{check.check_number}</TableCell>
            <TableCell>{format(new Date(check.check_date.replace(/-/g, '/')), 'MM/dd/yyyy')}</TableCell>
            <TableCell>{check.payee_name}</TableCell>
            <TableCell>${parseFloat(check.amount).toFixed(2)}</TableCell>
            <TableCell><Badge variant={check.status === 'printed' ? 'default' : (check.status === 'voided' ? 'destructive' : 'secondary')}>{check.status}</Badge></TableCell>
            <TableCell>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => onPreview(check)} disabled={check.status === 'voided'}><Printer className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={() => onEdit(check)} disabled={check.status === 'voided'}><Edit className="w-4 h-4" /></Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="ghost" disabled={check.status !== 'printed'}><FileText className="w-4 h-4 text-orange-600" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Void this check?</AlertDialogTitle>
                      <AlertDialogDescription>This will mark the check as voided. This action cannot be undone.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onVoid(check.id)}>Void Check</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive"><Trash2 className="w-4 h-4" /></Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this record?</AlertDialogTitle>
                      <AlertDialogDescription>This will permanently delete this check record from the database.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDelete(check.id)}>Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};