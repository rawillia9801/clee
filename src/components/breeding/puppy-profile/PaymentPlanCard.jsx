import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { FileText } from 'lucide-react';
import { EditableField } from './EditableField';
import { EditableSelectField } from './EditableSelectField';

export const PaymentPlanCard = ({ puppy, onFieldSave, onUpdate }) => {
    const handleCheckboxChange = (checked) => {
        onFieldSave('on_payment_plan', checked);
    };

    const statusOptions = [
        { value: 'Active', label: 'Active' },
        { value: 'Paid in Full', label: 'Paid in Full' },
        { value: 'Contract Breached', label: 'Contract Breached' },
    ];

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FileText size={20} className="text-primary" />
                    Payment Plan
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="on_payment_plan"
                        checked={puppy.on_payment_plan}
                        onCheckedChange={handleCheckboxChange}
                    />
                    <Label htmlFor="on_payment_plan">
                        This puppy is on a payment plan.
                    </Label>
                </div>

                {puppy.on_payment_plan && (
                    <div className="space-y-4 pt-4 border-t">
                        <EditableField
                            label="Start Date"
                            value={puppy.payment_plan_start_date}
                            onSave={(val) => onFieldSave('payment_plan_start_date', val)}
                            type="date"
                        />
                        <EditableField
                            label="Agreed Amount"
                            value={puppy.payment_plan_agreed_amount}
                            onSave={(val) => onFieldSave('payment_plan_agreed_amount', parseFloat(val) || 0)}
                            type="number"
                            step="0.01"
                        />
                        <EditableField
                            label="Payment Terms"
                            value={puppy.payment_plan_terms}
                            onSave={(val) => onFieldSave('payment_plan_terms', val)}
                            placeholder="e.g., Weekly, Bi-Weekly"
                        />
                        <EditableSelectField
                            label="Plan Status"
                            value={puppy.payment_plan_status}
                            onSave={(val) => onFieldSave('payment_plan_status', val)}
                            options={statusOptions}
                            placeholder="Select Status"
                        />
                        <EditableField
                            label="Notes"
                            value={puppy.payment_plan_notes}
                            onSave={(val) => onFieldSave('payment_plan_notes', val)}
                            type="textarea"
                        />
                    </div>
                )}
            </CardContent>
        </Card>
    );
};