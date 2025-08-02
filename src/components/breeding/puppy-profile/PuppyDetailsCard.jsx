
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bone } from 'lucide-react';
import { EditableField } from './EditableField';

export const PuppyDetailsCard = ({ puppy, onFieldSave, readOnly }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Bone size={20} className="text-primary"/>Birth & Weight Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <EditableField label="Projected Adult Weight" value={puppy.projected_adult_weight} onSave={(val) => onFieldSave('projected_adult_weight', val)} readOnly={readOnly} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <EditableField label="Birth" value={puppy.weight_at_birth} onSave={(val) => onFieldSave('weight_at_birth', val)} readOnly={readOnly} />
                    <EditableField label="2 Weeks" value={puppy.weight_2_weeks} onSave={(val) => onFieldSave('weight_2_weeks', val)} readOnly={readOnly} />
                    <EditableField label="4 Weeks" value={puppy.weight_4_weeks} onSave={(val) => onFieldSave('weight_4_weeks', val)} readOnly={readOnly} />
                    <EditableField label="6 Weeks" value={puppy.weight_6_weeks} onSave={(val) => onFieldSave('weight_6_weeks', val)} readOnly={readOnly} />
                    <EditableField label="7 Weeks" value={puppy.weight_7_weeks} onSave={(val) => onFieldSave('weight_7_weeks', val)} readOnly={readOnly} />
                </div>
                <div className="border-t pt-4 mt-2">
                     <EditableField label="Birth Notes" value={puppy.birth_notes} onSave={(val) => onFieldSave('birth_notes', val)} type="textarea" readOnly={readOnly} />
                </div>
            </CardContent>
        </Card>
    );
};
