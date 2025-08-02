
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Bone, DollarSign, Car, MessageSquare, Activity, ShieldCheck, Users, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { PuppyProfileHeader } from './puppy-profile/PuppyProfileHeader';
import { PuppyFinancialsCard } from './puppy-profile/PuppyFinancialsCard';
import { PuppyDetailsCard } from './puppy-profile/PuppyDetailsCard';
import { PuppyDocumentsCard } from './puppy-profile/PuppyDocumentsCard';
import { PuppyTransportationCard } from './puppy-profile/PuppyTransportationCard';
import { PuppyNotesCard } from './puppy-profile/PuppyNotesCard';
import { PuppyCostsCard } from './puppy-profile/PuppyCostsCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PaymentPlanCard } from './puppy-profile/PaymentPlanCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const OverviewCard = ({ title, icon, children, className }) => (
    <Card className={`bg-card shadow-sm hover:shadow-md transition-shadow duration-300 ${className}`}>
        <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg font-semibold text-foreground">
                {icon}
                {title}
            </CardTitle>
        </CardHeader>
        <CardContent>
            {children}
        </CardContent>
    </Card>
);

const VaccinationChecklist = ({ puppy, onFieldSave }) => {
    const vaxDates = puppy.vaccination_dates || {};
    const handleCheck = (vax, date) => {
        onFieldSave('vaccination_dates', { ...vaxDates, [vax]: date });
    };

    return (
        <div className="space-y-3">
            {['DHPP (6 wks)', 'DHPP (9 wks)', 'DHPP (12 wks)', 'Rabies (16 wks)'].map(vax => (
                <div key={vax} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                    <Label htmlFor={vax} className="text-sm font-medium">{vax}</Label>
                    <Input id={vax} type="date" value={vaxDates[vax] || ''} onChange={(e) => handleCheck(vax, e.target.value)} className="w-40 h-8" />
                </div>
            ))}
        </div>
    );
};

const SocializationMilestones = ({ puppy, onFieldSave }) => {
    const milestones = puppy.socialization_milestones || {};
    const handleCheck = (milestone, checked) => {
        onFieldSave('socialization_milestones', { ...milestones, [milestone]: checked });
    };
    
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {['Met new people', 'Played with other dogs', 'Experienced car ride', 'Walked on leash'].map(ms => (
                 <div key={ms} className="flex items-center space-x-3 p-2 rounded-md bg-muted/50">
                    <Checkbox id={ms} checked={!!milestones[ms]} onCheckedChange={(checked) => handleCheck(ms, checked)} />
                    <Label htmlFor={ms} className="text-sm font-medium leading-none">{ms}</Label>
                </div>
            ))}
        </div>
    );
};

export const PuppyProfile = ({ puppy: initialPuppy, onBack, onUpdate: onListUpdate }) => {
    const [puppy, setPuppy] = useState(initialPuppy);
    const [buyers, setBuyers] = useState([]);
    const { toast } = useToast();
    const { user } = useAuth();
    
    const fetchPuppyData = useCallback(async () => {
        if (!initialPuppy?.id) return;
        const { data, error } = await supabase.from('puppies').select('*, buyers(name)').eq('id', initialPuppy.id).single();
        if(!error) setPuppy(data);
        else toast({ title: 'Error fetching puppy data', variant: 'destructive', description: error.message });
    }, [initialPuppy?.id, toast]);

    const fetchBuyers = useCallback(async () => {
        if (!user?.id) return;
        const { data, error } = await supabase.from('buyers').select('id, name').eq('user_id', user.id);
        if (!error) setBuyers(data);
        else toast({ title: 'Error fetching buyers', variant: 'destructive', description: error.message });
    }, [user?.id, toast]);

    useEffect(() => {
        fetchPuppyData();
        fetchBuyers();
    }, [fetchPuppyData, fetchBuyers]);
    
    const handleFieldSave = async (field, value) => {
        let updateData = { [field]: value };

        if (field === 'status' && value !== 'Sold') {
            updateData = { ...updateData, buyer_id: null, price_sold: null, date_sold: null };
        } else if (field === 'buyer_id' && value) {
            updateData = { ...updateData, status: 'Sold' };
        }

        const { data, error } = await supabase.from('puppies').update(updateData).eq('id', puppy.id).select('*, buyers(name)').single();
        if(error) {
            toast({ title: 'Error updating puppy', variant: 'destructive', description: error.message });
        } else {
            setPuppy(data);
            if(onListUpdate) onListUpdate(data, 'update');
            toast({ title: 'Success', description: 'Puppy profile updated.' });
        }
    }

    const weightData = [
        { name: 'Birth', weight: parseFloat(puppy.weight_at_birth) || 0 },
        { name: '2 wks', weight: parseFloat(puppy.weight_2_weeks) || 0 },
        { name: '4 wks', weight: parseFloat(puppy.weight_4_weeks) || 0 },
        { name: '6 wks', weight: parseFloat(puppy.weight_6_weeks) || 0 },
        { name: '7 wks', weight: parseFloat(puppy.weight_7_weeks) || 0 },
    ].filter(d => d.weight > 0);

    if (!puppy) {
        return <div className="text-foreground">Loading puppy...</div>;
    }

    const TabTrigger = ({ value, icon, children }) => (
        <TabsTrigger value={value} className="flex items-center gap-2">
            {icon}
            <span className="hidden sm:inline">{children}</span>
        </TabsTrigger>
    );

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <Button onClick={onBack} variant="outline" className="bg-card"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Puppies</Button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <PuppyProfileHeader puppy={puppy} buyers={buyers} onFieldSave={handleFieldSave} onUpdate={fetchPuppyData} />
                </div>
                <div className="lg:col-span-2">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 mb-4">
                            <TabTrigger value="overview" icon={<PawPrint size={16}/>}>Overview</TabTrigger>
                            <TabTrigger value="details" icon={<Bone size={16}/>}>Details</TabTrigger>
                            <TabTrigger value="financials" icon={<DollarSign size={16}/>}>Financials</TabTrigger>
                            <TabTrigger value="costs" icon={<DollarSign size={16}/>}>Costs</TabTrigger>
                            <TabTrigger value="transport" icon={<Car size={16}/>}>Transport</TabTrigger>
                        </TabsList>
                        <TabsContent value="overview" className="space-y-6">
                            {weightData.length > 1 && (
                                <OverviewCard title="Weight Tracking" icon={<Activity size={20} className="text-primary"/>}>
                                    <div className="h-[250px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={weightData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis dataKey="name" />
                                                <YAxis />
                                                <Tooltip />
                                                <Legend />
                                                <Line type="monotone" dataKey="weight" stroke="hsl(var(--primary))" strokeWidth={2} activeDot={{ r: 8 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </OverviewCard>
                            )}
                            <OverviewCard title="Vaccination Checklist" icon={<ShieldCheck size={20} className="text-primary"/>}>
                                <VaccinationChecklist puppy={puppy} onFieldSave={handleFieldSave} />
                            </OverviewCard>
                            <OverviewCard title="Socialization Milestones" icon={<Users size={20} className="text-primary"/>}>
                                <SocializationMilestones puppy={puppy} onFieldSave={handleFieldSave} />
                            </OverviewCard>
                        </TabsContent>
                        <TabsContent value="details">
                            <PuppyDetailsCard puppy={puppy} onFieldSave={handleFieldSave} />
                        </TabsContent>
                        <TabsContent value="financials">
                          <div className="space-y-6">
                            <PuppyFinancialsCard puppy={puppy} onUpdate={fetchPuppyData} onFieldSave={handleFieldSave} />
                            <PaymentPlanCard puppy={puppy} onFieldSave={handleFieldSave} />
                          </div>
                        </TabsContent>
                        <TabsContent value="costs">
                            <PuppyCostsCard puppyId={puppy.id} onUpdate={fetchPuppyData} />
                        </TabsContent>
                        <TabsContent value="transport">
                             <div className="space-y-6">
                                <PuppyTransportationCard puppy={puppy} onFieldSave={handleFieldSave} />
                                <PuppyDocumentsCard puppy={puppy} onUpdate={fetchPuppyData} />
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            <PuppyNotesCard puppy={puppy} />
        </motion.div>
    );
};
