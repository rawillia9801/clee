
import React from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export const PuppyFilterBar = ({ dams, onFilterChange, filters }) => {
  const handleDateChange = (date) => {
    onFilterChange({ ...filters, dateRange: date });
  };

  const clearFilters = () => {
    onFilterChange({
      damId: 'all',
      dateRange: { from: null, to: null },
      showOnlyActive: false,
      sortBy: 'birth_date_desc',
    });
  };

  return (
    <div className="p-4 bg-card rounded-xl border flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Label htmlFor="dam-filter" className="text-sm">Dam:</Label>
        <Select
          value={filters.damId}
          onValueChange={(value) => onFilterChange({ ...filters, damId: value })}
        >
          <SelectTrigger id="dam-filter" className="w-[180px]">
            <SelectValue placeholder="Filter by Dam" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Dams</SelectItem>
            {dams.map(dam => (
              <SelectItem key={dam.id} value={dam.id}>{dam.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-sm">Litter Date:</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !filters.dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateRange.from ? (
                filters.dateRange.to ? (
                  <>
                    {format(filters.dateRange.from, "LLL dd, y")} - {format(filters.dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(filters.dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={handleDateChange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="active-puppies"
          checked={filters.showOnlyActive}
          onCheckedChange={(checked) => onFilterChange({ ...filters, showOnlyActive: checked })}
        />
        <Label htmlFor="active-puppies" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Active Puppies Only</Label>
      </div>

      <Button variant="ghost" onClick={clearFilters} className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
        <X size={16} /> Clear
      </Button>
    </div>
  );
};
