
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { StatusBadge } from './StatusBadge';
import { ChevronDown, GitBranch } from 'lucide-react';
import { format } from 'date-fns';
import { formatNumber, toDisplayDate } from '@/lib/utils';

const PuppyRow = ({ puppy, onSelectPuppy }) => (
  <TableRow className="hover:bg-muted/50 cursor-pointer" onClick={() => onSelectPuppy(puppy)}>
    <TableCell className="font-medium">{puppy.name || 'Unnamed'}</TableCell>
    <TableCell>{puppy.gender}</TableCell>
    <TableCell>{toDisplayDate(puppy.birth_date)}</TableCell>
    <TableCell>${formatNumber(puppy.price_sold)}</TableCell>
    <TableCell>{puppy.buyers?.name || 'N/A'}</TableCell>
    <TableCell><StatusBadge status={puppy.status} /></TableCell>
  </TableRow>
);

const LitterGroup = ({ litter, onSelectPuppy }) => (
  <div className="ml-4 mt-4 mb-6 pl-4 border-l-2 border-primary/20">
    <h4 className="text-lg font-semibold text-foreground mb-2 flex items-center gap-2">
      <GitBranch className="h-5 w-5 text-primary/80" />
      Litter: {litter.sire_name} ({format(new Date(litter.litter_date), 'MMMM dd, yyyy')})
    </h4>
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Sex</TableHead>
            <TableHead>DOB</TableHead>
            <TableHead>Sale Price</TableHead>
            <TableHead>Buyer</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {litter.puppies.map(puppy => (
            <PuppyRow key={puppy.id} puppy={puppy} onSelectPuppy={onSelectPuppy} />
          ))}
        </TableBody>
      </Table>
    </div>
  </div>
);

const DamSection = ({ damName, litters, onSelectPuppy }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-6 bg-card rounded-xl border p-4">
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between cursor-pointer">
          <h3 className="text-2xl font-bold text-foreground">{damName}</h3>
          <Button variant="ghost" size="sm">
            <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="overflow-hidden data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up">
        <div className="pt-4">
            {litters.map(litter => (
              <LitterGroup key={litter.id} litter={litter} onSelectPuppy={onSelectPuppy} />
            ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export const PuppyList = ({ groupedData, onSelectPuppy }) => {
  if (Object.keys(groupedData).length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground bg-card rounded-xl border">
        <p className="text-lg">No puppies match the current filters.</p>
        <p>Try adjusting your search criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <AnimatePresence>
        {Object.entries(groupedData).map(([damName, litters]) => (
          <motion.div
            key={damName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            layout
          >
            <DamSection damName={damName} litters={litters} onSelectPuppy={onSelectPuppy} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
