
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, DollarSign, Edit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { DogProfileCard } from '@/components/breeding/DogProfileCard';
import { DogNotesCard } from '@/components/breeding/DogNotesCard';
import { LitterManagementCard } from '@/components/breeding/LitterManagementCard';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { PuppyProfile } from '@/components/breeding/PuppyProfile';
import { AddDogDialog } from '@/components/breeding/AddDogDialog';
import { AddLitterDialog } from '@/components/breeding/AddLitterDialog';
import { DogCostsCard } from '@/components/breeding/DogCostsCard';
import { formatNumber } from '@/lib/utils';

export const DogDetailsView = ({ dog, onBack, onUpdate, onDogDeleted }) => {
    const [litters, setLitters] = useState([]);
    const [puppies, setPuppies] = useState({});
    const [selectedPuppy, setSelectedPuppy] = useState(null);
    const [isLitterDialogOpen, setIsLitterDialogOpen] = useState(false);
    const [isDogDialogOpen, setIsDogDialogOpen] = useState(false);
    const [currentDog, setCurrentDog] = useState(dog);
    const { toast } = useToast();

    const fetchLittersAndPuppies = useCallback(async () => {
        if (!currentDog) return;
        const { data: litterData, error: litterError } = await supabase
            .from('litters')
            .select('*')
            .eq('dam_id', currentDog.id)
            .order('litter_date', { ascending: false });

        if (litterError) {
            toast({ title: 'Error fetching litters', description: litterError.message, variant: 'destructive' });
            return;
        }
        setLitters(litterData);
        
        if (litterData.length === 0) {
            setPuppies({});
            return;
        }

        const litterIds = litterData.map(l => l.id);
        const { data: puppyData, error: puppyError } = await supabase
            .from('puppies')
            .select('*, buyers(name)')
            .in('litter_id', litterIds);

        if (puppyError) {
            toast({ title: 'Error fetching puppies', description: puppyError.message, variant: 'destructive' });
            return;
        }

        const puppiesByLitter = puppyData.reduce((acc, puppy) => {
            if (!acc[puppy.litter_id]) {
                acc[puppy.litter_id] = [];
            }
            acc[puppy.litter_id].push(puppy);
            return acc;
        }, {});

        setPuppies(puppiesByLitter);

    }, [currentDog, toast]);
    
    useEffect(() => {
        fetchLittersAndPuppies();
    }, [fetchLittersAndPuppies]);

    const handleDogUpdate = async () => {
        const { data, error } = await supabase.from('breeding_dogs').select('*').eq('id', currentDog.id).single();
        if (!error && data) {
            setCurrentDog(data);
            onUpdate();
        }
    };

    const totalSalesFromPuppies = useMemo(() => {
        return Object.values(puppies).flat().reduce((sum, puppy) => sum + (puppy.price_sold || 0), 0);
    }, [puppies]);
    
    if (selectedPuppy) {
        return <PuppyProfile puppy={selectedPuppy} onBack={() => setSelectedPuppy(null)} onUpdate={fetchLittersAndPuppies} />
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Dialog open={isDogDialogOpen} onOpenChange={setIsDogDialogOpen}>
                 <AddDogDialog 
                    isOpen={isDogDialogOpen}
                    setIsOpen={setIsDogDialogOpen}
                    editingDog={currentDog}
                    onDogAdded={handleDogUpdate}
                    onDogDeleted={() => {
                        onDogDeleted();
                        onBack();
                    }}
                />
            </Dialog>
            <Dialog open={isLitterDialogOpen} onOpenChange={setIsLitterDialogOpen}>
                <AddLitterDialog damId={currentDog.id} isOpen={isLitterDialogOpen} setIsOpen={setIsLitterDialogOpen} onLitterAdded={fetchLittersAndPuppies} />
            </Dialog>

            <Button onClick={onBack} variant="outline" className="mb-4">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Dogs
            </Button>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <DogProfileCard dog={currentDog} onEdit={() => setIsDogDialogOpen(true)} />
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sales from Puppies</CardTitle>
                            <DollarSign className="h-4 w-4 text-primary" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">${formatNumber(totalSalesFromPuppies)}</div>
                        </CardContent>
                    </Card>
                    <DogCostsCard dogId={currentDog.id} />
                    <DogNotesCard dogId={currentDog.id} />
                </div>
                <div className="lg:col-span-2">
                    {currentDog.gender === 'Female' ? (
                        <LitterManagementCard 
                            dog={currentDog} 
                            litters={litters} 
                            puppies={puppies} 
                            onUpdate={fetchLittersAndPuppies}
                            onPuppySelect={setSelectedPuppy}
                            onAddLitter={() => setIsLitterDialogOpen(true)}
                        />
                    ) : (
                       <Card className="h-full flex items-center justify-center">
                          <CardContent className="pt-6">
                              <p className="text-muted-foreground text-center">Litter tracking is only available for Dams.</p>
                          </CardContent>
                      </Card>
                    )}
                </div>
            </div>
        </motion.div>
    );
};
