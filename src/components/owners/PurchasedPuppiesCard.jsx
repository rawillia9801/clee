import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dog } from 'lucide-react';
import { formatNumber } from '@/lib/utils';

export const PurchasedPuppiesCard = ({ puppies, payments }) => {
    return (
        <Card className="bg-white text-black">
            <CardHeader><CardTitle className="flex items-center gap-2"><Dog size={20} /> Purchased Puppies</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {puppies.length > 0 ? puppies.map(puppy => {
                    const puppyPayments = payments.filter(p => p.puppy_id === puppy.id).reduce((sum, p) => sum + p.amount, 0);
                    const balance = (puppy.price_sold || 0) - puppyPayments;
                    return (
                        <div key={puppy.id} className="p-4 border rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <img-replace src={puppy.image_url || '/placeholder.svg'} alt={puppy.name} className="w-12 h-12 rounded-md object-cover" />
                                <div>
                                    <p className="font-bold">{puppy.name || 'Unnamed Puppy'}</p>
                                    <p className="text-sm text-gray-500">Litter from {puppy.litters?.breeding_dogs?.name || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p>Price: ${formatNumber(puppy.price_sold)}</p>
                                <p>Paid: <span className="text-green-600">${formatNumber(puppyPayments)}</span></p>
                                <p>Balance: <span className="text-red-500 font-bold">${formatNumber(balance)}</span></p>
                            </div>
                        </div>
                    );
                }) : <p className="text-gray-500">No puppies purchased.</p>}
            </CardContent>
        </Card>
    );
};