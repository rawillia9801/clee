import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EditableSelectField = ({ label, value, onSave, options, placeholder, inputClassName, wrapperClassName }) => {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');

    useEffect(() => {
        setCurrentValue(value || '');
    }, [value]);

    const handleSave = () => {
        onSave(currentValue);
        setEditing(false);
    };

    if (editing) {
        return (
            <div className="flex items-center gap-2 my-1 w-full">
                <Select onValueChange={setCurrentValue} defaultValue={currentValue}>
                    <SelectTrigger className="h-9"><SelectValue placeholder={placeholder} /></SelectTrigger>
                    <SelectContent>
                        {options.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button size="icon" className="h-9 w-9" onClick={handleSave}><Check size={16}/></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditing(false)}><X size={16}/></Button>
            </div>
        );
    }

    const displayValue = options.find(opt => opt.value === value)?.label || <span className="text-muted-foreground">N/A</span>;
    return (
        <div className={cn("flex items-center gap-2 group justify-between w-full", wrapperClassName)}>
             <div className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">{label}:</span> 
                <span className={cn("text-foreground", inputClassName)}>{displayValue}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => setEditing(true)}><Edit size={14}/></Button>
        </div>
    );
};