
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Car } from 'lucide-react';
import { EditableField } from './EditableField';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export const PuppyTransportationCard = ({ puppy, onFieldSave, readOnly }) => {
    const [mileage, setMileage] = useState(0);
    const { user } = useAuth();
    
    useEffect(() => {
        const fetchMileage = async () => {
            if(!puppy.buyer_id || !user) return;
            
            const { data, error } = await supabase
                .from('events')
                .select('mileage')
                .eq('user_id', user.id)
                .eq('event_type', 'Puppy Drop Off')
                .ilike('buyer_name', `%${puppy.buyers?.name}%`);

            if (!error && data) {
                const totalMileage = data.reduce((sum, event) => sum + (Number(event.mileage) || 0), 0) * 2;
                setMileage(totalMileage);
            }
        };

        fetchMileage();
    }, [puppy.buyer_id, puppy.buyers?.name, user]);

    const handleSave = (field, value) => {
        const currentDetails = puppy.transportation_details || {};
        const newDetails = { ...currentDetails, [field]: value };
        onFieldSave('transportation_details', newDetails);
    };

    const details = puppy.transportation_details || {};

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                    <Car size={20} className="text-primary"/>Transportation Details
                </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <EditableField 
                    label="Transport Method" 
                    value={details.transport_method} 
                    onSave={(val) => handleSave('transport_method', val)}
                    readOnly={readOnly}
                />
                <EditableField 
                    label="Delivery Date" 
                    value={details.delivery_date} 
                    onSave={(val) => handleSave('delivery_date', val)} 
                    type="date" 
                    readOnly={readOnly}
                />
                <EditableField 
                    label="Meeting Location" 
                    value={details.meeting_location} 
                    onSave={(val) => handleSave('meeting_location', val)} 
                    readOnly={readOnly}
                />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-muted-foreground">Total Mileage (from events):</span>
                    <span className="text-foreground">{mileage} mi</span>
                </div>
                <EditableField 
                    label="Gas Cost" 
                    value={details.gas_cost} 
                    onSave={(val) => handleSave('gas_cost', parseFloat(val) || 0)} 
                    type="number" 
                    step="0.01" 
                    readOnly={readOnly}
                />
                <EditableField 
                    label="Hotel Cost" 
                    value={details.hotel_cost} 
                    onSave={(val) => handleSave('hotel_cost', parseFloat(val) || 0)} 
                    type="number" 
                    step="0.01" 
                    readOnly={readOnly}
                />
            </CardContent>
        </Card>
    );
};
