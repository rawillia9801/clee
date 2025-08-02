
import React from 'react';
import { Plus, Search, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { formatNumber } from '@/lib/utils';
import { BuyerStats } from './BuyerStats';

export function BuyerListSection({ buyers, searchTerm, setSearchTerm, selectedBuyer, onSelectBuyer, onEditBuyer, onDeleteBuyer, onAddBuyer, stats }) {

  return (
    <Card className="flex-grow flex flex-col h-full">
      <CardHeader className="flex-shrink-0">
        <div className="flex justify-between items-start">
            <CardTitle>Buyers</CardTitle>
            <Button onClick={onAddBuyer}><Plus className="w-4 h-4 mr-2" />Add</Button>
        </div>
        <div className="relative mt-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Search buyers..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto pr-2 space-y-2">
        {buyers.map(buyer => {
          const isSelected = selectedBuyer?.id === buyer.id;
          let rowClasses = 'p-3 rounded-lg cursor-pointer transition-all duration-200';
          if (isSelected) {
            rowClasses += ' bg-primary/10 ring-2 ring-primary';
          } else if (buyer.on_payment_plan && buyer.balance !== 0) {
            rowClasses += ' bg-yellow-100 hover:bg-yellow-200';
          } else if (buyer.balance <= 0 && buyer.puppy_price > 0) {
            rowClasses += ' bg-green-100 hover:bg-green-200';
          } else {
            rowClasses += ' hover:bg-gray-100';
          }

          return (
            <div key={buyer.id} onClick={() => onSelectBuyer(buyer)} className={rowClasses}>
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold text-lg">#{buyer.customer_number} - {buyer.name}</p>
                  <p className="text-sm text-green-700 font-medium">Purchased: ${formatNumber(buyer.puppy_price)}</p>
                  <p className="text-sm text-blue-700 font-medium">Paid: ${formatNumber(buyer.payments)}</p>
                  <p className={`text-sm font-bold ${buyer.balance > 0 ? 'text-red-500' : 'text-green-600'}`}>Balance: ${formatNumber(buyer.balance)}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onEditBuyer(buyer); }}><Edit className="w-4 h-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><Trash2 className="w-4 h-4 text-red-500" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete the buyer.</AlertDialogDescription></AlertDialogHeader>
                      <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteBuyer(buyer.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      <div className="p-4 border-t flex-shrink-0">
          <BuyerStats stats={stats} />
      </div>
    </Card>
  );
}
