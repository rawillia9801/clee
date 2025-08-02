
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Dog, Plus, DollarSign, GitBranch, Map, Route } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { DogList } from '@/components/breeding/DogList';
import { DogDetailsView } from '@/components/breeding/DogDetailsView';
import { AddDogDialog } from '@/components/breeding/AddDogDialog';
import { LocationMap } from '@/components/maps/LocationMap';
import { formatNumber } from '@/lib/utils';

export function PuppiesMainTab() {
  const [dogs, setDogs] = useState([]);
  const [dogCosts, setDogCosts] = useState([]);
  const [isAddDogOpen, setIsAddDogOpen] = useState(false);
  const [editingDog, setEditingDog] = useState(null);
  const [selectedDog, setSelectedDog] = useState(null);
  const [totalDistance, setTotalDistance] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [dogsRes, costsRes, eventsRes, puppiesRes] = await Promise.all([
        supabase.from('breeding_dogs').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('dog_costs').select('amount').eq('user_id', user.id),
        supabase.from('events').select('mileage').eq('user_id', user.id).eq('event_type', 'Puppy Drop Off').not('mileage', 'is', null),
        supabase.from('puppies').select('transportation_details').eq('user_id', user.id)
    ]);

    if (dogsRes.error) toast({ title: 'Error fetching dogs', description: dogsRes.error.message, variant: 'destructive' });
    else setDogs(dogsRes.data);

    if (costsRes.error) toast({ title: 'Error fetching costs', description: costsRes.error.message, variant: 'destructive' });
    else setDogCosts(costsRes.data);

    let eventMiles = 0;
    if (eventsRes.error) toast({ title: 'Error fetching mileage from events', description: eventsRes.error.message, variant: 'destructive' });
    else eventMiles = eventsRes.data.reduce((sum, event) => sum + (Number(event.mileage) || 0), 0);

    let transportMiles = 0;
    if (puppiesRes.error) toast({ title: 'Error fetching mileage from puppies', description: puppiesRes.error.message, variant: 'destructive' });
    else {
        transportMiles = puppiesRes.data.reduce((sum, puppy) => {
            const details = puppy.transportation_details;
            return sum + (details && details.total_mileage ? Number(details.total_mileage) : 0);
        }, 0);
    }
    
    setTotalDistance((eventMiles > 0 ? eventMiles : transportMiles) * 2);

  }, [user, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  
  const handleDogAdded = () => {
    fetchData();
    if(selectedDog) {
        const updatedDog = dogs.find(d => d.id === selectedDog.id);
        if(updatedDog) setSelectedDog(updatedDog);
    }
  };

  const handleDogDeleted = () => {
    fetchData();
    setSelectedDog(null);
  }

  const handleEditDog = (dog) => {
    setEditingDog(dog);
    setIsAddDogOpen(true);
  };

  const totalInvestment = useMemo(() => {
    const paid = dogs.filter(d => !d.kept_from_litter).reduce((sum, d) => sum + (d.price_paid || 0), 0);
    const valued = dogs.filter(d => d.kept_from_litter).reduce((sum, d) => sum + (d.value_of_dog || 0), 0);
    return { paid, valued, total: paid + valued };
  }, [dogs]);
  const totalDogCosts = useMemo(() => dogCosts.reduce((sum, c) => sum + (c.amount || 0), 0), [dogCosts]);
  
  const mapLocations = useMemo(() => 
    dogs.filter(d => d.purchase_location).map(d => ({
        location: d.purchase_location,
        tooltip: `${d.name} from ${d.purchase_location}`
    })), [dogs]);

  const handleSelectDog = (dog) => {
    setSelectedDog(dog);
  };

  if (selectedDog) {
    return <DogDetailsView dog={selectedDog} onBack={() => setSelectedDog(null)} onUpdate={fetchData} onDogDeleted={handleDogDeleted} />;
  }

  return (
    <div className="space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Dog Costs</CardTitle>
                    <Dog className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${formatNumber(totalDogCosts)}</div>
                    <p className="text-xs text-muted-foreground">From all dogs</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Investment (Dogs)</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">${formatNumber(totalInvestment.total)}</div>
                     <p className="text-xs text-muted-foreground">Paid: ${formatNumber(totalInvestment.paid)} | Kept: ${formatNumber(totalInvestment.valued)}</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Total Miles Driven for Puppies</CardTitle>
                    <Route className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatNumber(totalDistance, 0)} mi</div>
                    <p className="text-xs text-muted-foreground">Total round trip miles</p>
                </CardContent>
            </Card>
        </motion.div>
      <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2"><GitBranch />Our Dogs</CardTitle>
                <CardDescription>Manage your breeding dogs and view their litters.</CardDescription>
              </div>
              <Button 
                onClick={() => { setEditingDog(null); setIsAddDogOpen(true); }}
              >
                <Plus className="w-4 h-4 mr-2" />Add Dog
              </Button>
            </div>
          </CardHeader>
          <CardContent>
             <Dialog open={isAddDogOpen} onOpenChange={setIsAddDogOpen}>
                <AddDogDialog 
                    isOpen={isAddDogOpen}
                    setIsOpen={setIsAddDogOpen}
                    editingDog={editingDog}
                    onDogAdded={handleDogAdded}
                    onDogDeleted={handleDogDeleted}
                />
            </Dialog>
            <DogList 
              dogs={dogs} 
              onSelectDog={handleSelectDog} 
              onEditDog={handleEditDog} 
              onDeleteDog={handleDogDeleted} 
            />
          </CardContent>
        </Card>
      </motion.div>
       <motion.div 
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }} 
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2"><Map />Dog Purchase Locations</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="h-[500px] relative z-0">
            <LocationMap 
                locations={mapLocations} 
                origin="Marion, Virginia"
            />
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
