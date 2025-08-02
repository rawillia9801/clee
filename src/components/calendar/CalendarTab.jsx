
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { EventDialog } from './EventDialog';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { differenceInDays } from 'date-fns';
import { motion } from 'framer-motion';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const EventModal = ({ event, onClose, onEdit }) => {
    if (!event) return null;
    
    return (
        <Dialog open={true} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{event.title}</DialogTitle>
                </DialogHeader>
                <div className="space-y-2 text-sm">
                    <p><strong>Type:</strong> <span className={`px-2 py-0.5 rounded-full text-xs ${event.classNames.join(' ')}`}>{event.extendedProps.event_type}</span></p>
                    <p><strong>Starts:</strong> {new Date(event.start).toLocaleString()}</p>
                    {event.end && <p><strong>Ends:</strong> {new Date(event.end).toLocaleString()}</p>}
                    {event.extendedProps.notes && <p><strong>Notes:</strong> {event.extendedProps.notes}</p>}
                </div>
                <DialogFooter className="justify-between">
                    <Button variant="outline" onClick={onClose}>Close</Button>
                    <Button onClick={() => onEdit(event)}>Edit</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};


export function CalendarTab() {
  const [events, setEvents] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEventForEdit, setSelectedEventForEdit] = useState(null);
  const [selectedEventForView, setSelectedEventForView] = useState(null);
  const [dialogInitialDate, setDialogInitialDate] = useState(new Date());
  const { user } = useAuth();
  const { toast } = useToast();
  const remindedEventsRef = useRef(new Set());

  const checkReminders = useCallback((allEvents) => {
    const today = new Date();
    allEvents.forEach(event => {
      const eventDate = new Date(event.start_time);
      const daysUntil = differenceInDays(eventDate, today);

      if (daysUntil >= 0 && daysUntil <= 3 && !remindedEventsRef.current.has(event.id)) {
        let reminderMessage = `Reminder: "${event.title}" is`;
        if (daysUntil === 0) reminderMessage += " today!";
        else if (daysUntil === 1) reminderMessage += " tomorrow!";
        else reminderMessage += ` in ${daysUntil} days.`;
        
        toast({ title: 'Upcoming Event', description: reminderMessage, duration: 10000 });
        remindedEventsRef.current.add(event.id);
      }
    });
  }, [toast]);

  const fetchAllData = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase.from('calendar_events').select('id, title, start_time, end_time, event_type, notes, description').eq('user_id', user.id);
    if (error) {
      toast({ title: 'Error fetching events', description: error.message, variant: 'destructive' });
    } else {
      setEvents(data || []);
      checkReminders(data || []);
    }
  }, [user, toast, checkReminders]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 3600000); // Check every hour
    return () => clearInterval(interval);
  }, [fetchAllData]);
  
  const handleDateClick = (arg) => {
    setSelectedEventForEdit(null);
    setDialogInitialDate(arg.date);
    setIsDialogOpen(true);
  };

  const handleEventClick = (arg) => {
    setSelectedEventForView(arg.event);
  };
  
  const handleEditFromModal = (event) => {
      setSelectedEventForView(null);
      handleEventDoubleClick(event);
  }

  const handleEventDoubleClick = (event) => {
      const fullEventData = events.find(e => e.id === event.id);
      if (fullEventData) {
        setSelectedEventForEdit(fullEventData);
        setIsDialogOpen(true);
      }
  };

  const handleEventDrop = async (info) => {
    const { event } = info;
    const { error } = await supabase
      .from('calendar_events')
      .update({ 
        start_time: event.start.toISOString(),
        end_time: event.end ? event.end.toISOString() : null
      })
      .eq('id', event.id);

    if (error) {
      toast({ title: 'Error updating event', description: error.message, variant: 'destructive' });
      info.revert();
    } else {
      toast({ title: 'Event updated!' });
      fetchAllData();
    }
  };

  const handleSaveEvent = async (eventData) => {
    const dataToSave = { ...eventData, user_id: user.id };
    const { error } = selectedEventForEdit 
      ? await supabase.from('calendar_events').update(dataToSave).eq('id', selectedEventForEdit.id)
      : await supabase.from('calendar_events').insert(dataToSave);
    
    if (error) {
        toast({ title: `Error ${selectedEventForEdit ? 'updating' : 'creating'} event`, description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Success', description: `Event ${selectedEventForEdit ? 'updated' : 'created'} successfully.` });
        fetchAllData();
        setIsDialogOpen(false);
        setSelectedEventForEdit(null);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    const { error } = await supabase.from('calendar_events').delete().eq('id', eventId);
    if (error) {
        toast({ title: 'Error deleting event', description: error.message, variant: 'destructive' });
    } else {
        toast({ title: 'Event deleted successfully' });
        fetchAllData();
        setIsDialogOpen(false);
        setSelectedEventForEdit(null);
    }
  };

  const calendarEvents = useMemo(() => {
    return events.map(event => {
      let className = '';
      if (new Date(event.start_time) < new Date() && !event.end_time) className = 'event-overdue';
      else if (event.event_type === 'Puppy Drop Off') className = 'event-puppy-pickup';
      else if (event.event_type === 'Business') className = 'event-business-appointment';
      else if (event.event_type === 'Personal') className = 'event-personal';
      
      return {
        id: event.id,
        title: event.title,
        start: new Date(event.start_time),
        end: event.end_time ? new Date(event.end_time) : null,
        allDay: !event.end_time || !event.start_time.includes('T'),
        classNames: [className],
        extendedProps: event,
      };
    });
  }, [events]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Calendar</CardTitle>
                <CardDescription>Manage your business and personal events. Double click to edit.</CardDescription>
              </div>
              <Button onClick={() => { setSelectedEventForEdit(null); setDialogInitialDate(new Date()); setIsDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Event
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
              initialView="dayGridMonth"
              events={calendarEvents}
              editable={true}
              selectable={true}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              eventDoubleClick={({event}) => handleEventDoubleClick(event)}
              height="auto"
              firstDay={1}
            />
          </CardContent>
        </Card>
      </motion.div>

      <EventDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        event={selectedEventForEdit}
        initialDate={dialogInitialDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
      
      {selectedEventForView && (
        <EventModal event={selectedEventForView} onClose={() => setSelectedEventForView(null)} onEdit={handleEditFromModal} />
      )}
    </div>
  );
}
