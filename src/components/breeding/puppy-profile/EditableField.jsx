import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Edit, Check, X } from 'lucide-react';
import { cn, toInputDate, toDisplayDate } from '@/lib/utils';

export const EditableField = ({ label, value, onSave, type = 'text', step = 'any', inputClassName = '', wrapperClassName = '' }) => {
    const [editing, setEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value || '');

    useEffect(() => {
        setCurrentValue(type === 'date' && value ? toInputDate(value) : value || '');
    }, [value, type]);

    const handleSave = () => {
        onSave(currentValue);
        setEditing(false);
    }
    
    if (editing) {
        const InputComponent = type === 'textarea' ? Textarea : Input;
        return (
            <div className="flex items-center gap-2 my-1 w-full">
                <InputComponent 
                    value={currentValue} 
                    onChange={(e) => setCurrentValue(e.target.value)} 
                    className={cn("h-9", inputClassName)} 
                    type={type} 
                    step={step}
                    autoFocus
                />
                <Button size="icon" className="h-9 w-9" onClick={handleSave}><Check size={16}/></Button>
                <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => setEditing(false)}><X size={16}/></Button>
            </div>
        )
    }

    const formattedValue = () => {
        if (!value) return <span className="text-muted-foreground">N/A</span>;
        if (type === 'date') return toDisplayDate(value);
        return value;
    }

    return (
        <div className={cn("flex items-center gap-2 group justify-between w-full", wrapperClassName)}>
            <div className="flex items-baseline gap-2 text-sm">
                <span className="font-semibold text-muted-foreground">{label}:</span> 
                <span className={cn("text-foreground", inputClassName)}>{formattedValue()}</span>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 shrink-0" onClick={() => setEditing(true)}><Edit size={14}/></Button>
        </div>
    );
};