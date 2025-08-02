
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, toDisplayDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Edit, Download } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export const DogProfileCard = ({ dog, onEdit }) => {
    const getVaccineRecordUrl = () => {
        if (!dog.vaccination_records_path) return null;
        const { data } = supabase.storage.from('dog_images').getPublicUrl(dog.vaccination_records_path);
        return data.publicUrl;
    };

    const vaccineRecordUrl = getVaccineRecordUrl();

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div className="flex flex-col items-center gap-4 flex-grow">
                        {dog.image_url ? 
                          <img src={dog.image_url} alt={dog.name} className="w-32 h-32 rounded-full object-cover border-4 border-primary/20" />
                          :
                          <div className="w-32 h-32 rounded-full object-cover border-4 border-primary/20 bg-muted flex items-center justify-center">
                            <span className="text-4xl font-bold text-primary">{dog.name ? dog.name[0] : '?'}</span>
                          </div>
                        }
                        <div>
                            <CardTitle className="text-3xl text-center">{dog.name}</CardTitle>
                            <CardDescription className="text-center">{dog.color}</CardDescription>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => onEdit(dog)}><Edit className="w-5 h-5" /></Button>
                </div>
            </CardHeader>
            <CardContent className="space-y-2">
                <p><strong>Gender:</strong> {dog.gender}</p>
                <p><strong>DOB:</strong> {toDisplayDate(dog.date_of_birth)}</p>
                <p><strong>Purchased From:</strong> {dog.purchase_location || 'N/A'}</p>
                <p><strong>Cost:</strong> {dog.kept_from_litter ? `Valued at $${formatNumber(dog.value_of_dog || 0)}` : `$${formatNumber(dog.price_paid || 0)}`}</p>
                {dog.registry1 && <p><strong>Registry 1:</strong> {dog.registry1} ({dog.registration_number1 || 'N/A'})</p>}
                {dog.registry2 && <p><strong>Registry 2:</strong> {dog.registry2} ({dog.registration_number2 || 'N/A'})</p>}
                <p><strong>Rabies Vaccinated:</strong> {toDisplayDate(dog.rabies_vaccination_date)}</p>
                <p><strong>Vaccination Due:</strong> {toDisplayDate(dog.rabies_vaccination_due_date)}</p>
                <p><strong>Rabies Tag #:</strong> {dog.rabies_tag_number || 'N/A'}</p>
                <div className="flex items-center justify-between">
                    <strong>Vaccination Records:</strong>
                    {vaccineRecordUrl ? (
                        <a href={vaccineRecordUrl} target="_blank" rel="noopener noreferrer" download>
                            <Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" /> View/Download</Button>
                        </a>
                    ) : (
                        <span>Not Uploaded</span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
