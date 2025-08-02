
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUp, ArrowDown, PackageSearch, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { cn } from '@/lib/utils';

const SortableHeader = ({ children, column, sortConfig, onSort }) => {
    const isSorted = sortConfig.key === column;
    const direction = isSorted ? sortConfig.direction : 'none';
    const Icon = direction === 'ascending' ? ArrowUp : ArrowDown;

    return (
        <TableHead onClick={() => onSort(column)} className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-2">
                {children}
                {isSorted && <Icon className="h-4 w-4" />}
            </div>
        </TableHead>
    );
};

export function InventoryTable({ items, onEdit, sortConfig, onSort }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
      <div className="relative w-full overflow-auto">
          <Table>
              <TableHeader className="sticky top-0 bg-muted/50 z-10">
                  <TableRow>
                      <SortableHeader column="item_name" sortConfig={sortConfig} onSort={onSort}>Name</SortableHeader>
                      <TableHead>UPC</TableHead>
                      <SortableHeader column="quantity" sortConfig={sortConfig} onSort={onSort}>Qty</SortableHeader>
                      <TableHead>Cost/Item</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <SortableHeader column="totalProfit" sortConfig={sortConfig} onSort={onSort}>Total Profit</SortableHeader>
                      <SortableHeader column="profitMargin" sortConfig={sortConfig} onSort={onSort}>Margin</SortableHeader>
                      <TableHead>Status</TableHead>
                  </TableRow>
              </TableHeader>
              <TableBody>
                  {items.length > 0 ? items.map((item) => (
                      <TableRow 
                          key={item.id} 
                          className={cn(
                              "cursor-pointer",
                              (item.quantity || 0) <= 0 && "bg-red-50/50 hover:bg-red-100/50 text-muted-foreground"
                          )}
                          onClick={() => onEdit(item)}
                      >
                          <TableCell className="font-medium">{item.item_name}</TableCell>
                          <TableCell>{item.upc}</TableCell>
                          <TableCell className="font-bold">{item.quantity || 0}</TableCell>
                          <TableCell>${formatNumber(item.cost)}</TableCell>
                          <TableCell className="font-semibold">${formatNumber((item.cost || 0) * (item.quantity || 0))}</TableCell>
                          <TableCell className={cn("font-semibold", item.totalProfit > 0 ? "text-green-600" : "text-red-600")}>
                            ${formatNumber(item.totalProfit)}
                          </TableCell>
                          <TableCell className={cn("font-semibold flex items-center gap-1", item.profitMargin > 0 ? "text-green-600" : "text-red-600")}>
                            <TrendingUp size={16} /> {formatNumber(item.profitMargin)}%
                          </TableCell>
                          <TableCell>
                            {(item.quantity || 0) > 0 ? (
                                <CheckCircle className="h-5 w-5 text-green-500"/>
                            ) : (
                                <XCircle className="h-5 w-5 text-destructive"/>
                            )}
                          </TableCell>
                      </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center">
                            <div className="flex flex-col items-center justify-center gap-2">
                                <PackageSearch className="h-10 w-10 text-muted-foreground" />
                                <span className="text-muted-foreground">No inventory items found.</span>
                            </div>
                        </TableCell>
                    </TableRow>
                  )}
              </TableBody>
          </Table>
      </div>
    </div>
  );
}
