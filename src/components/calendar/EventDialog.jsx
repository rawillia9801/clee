
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { format, setHours, setMinutes, parse, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export function EventDialog({ isOpen, onOpenChange, event, initialDate, onSave, onDelete }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'Business',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    startTime: '09:00',
    endDate: format(new Date(), 'yyyy-MM-dd'),
    endTime: '10:00',
    allDay: false,
    mileage: '',
    hotel_expenses: '',
    other_charges: '',
    buyer_name: '',
    drop_off_location: '',
    drop_off_time: '12:00',
  });
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
        if (event) {
            const startTime = event.start_time ? parseISO(event.start_time) : new Date();
            const endTime = event.end_time ? parseISO(event.end_time) : new Date();
            setFormData({
                title: event.title || '',
                description: event.description || '',
                event_type: event.event_type || 'Business',
                startDate: isValid(startTime) ? format(startTime, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                startTime: isValid(startTime) ? format(startTime, 'HH:mm') : '09:00',
                endDate: isValid(endTime) ? format(endTime, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
                endTime: isValid(endTime) ? format(endTime, 'HH:mm') : '10:00',
                allDay: !event.end_time,
                mileage: event.mileage || '',
                hotel_expenses: event.hotel_expenses || '',
                other_charges: event.other_charges || '',
                buyer_name: event.buyer_name || '',
                drop_off_location: event.drop_off_location || '',
                drop_off_time: event.drop_off_time || '12:00',
            });
        } else {
            const date = initialDate || new Date();
            setFormData({
                title: '',
                description: '',
                event_type: 'Business',
                startDate: format(date, 'yyyy-MM-dd'),
                startTime: '09:00',
                endDate: format(date, 'yyyy-MM-dd'),
                endTime: '10:00',
                allDay: false,
                mileage: '',
                hotel_expenses: '',
                other_charges: '',
                buyer_name: '',
                drop_off_location: '',
                drop_off_time: '12:00',
            });
        }
    }
  }, [event, initialDate, isOpen]);

  const handleChange = (id, value) => {
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    let startDateTime = parse(formData.startDate, 'yyyy-MM-dd', new Date());
    let endDateTime = null;

    if (!formData.allDay) {
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        startDateTime = setMinutes(setHours(startDateTime, startHour), startMinute);
        
        endDateTime = parse(formData.endDate, 'yyyy-MM-dd', new Date());
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);
        endDateTime = setMinutes(setHours(endDateTime, endHour), endMinute);
    }
    
    const eventData = {
      title: formData.title,
      description: formData.description,
      event_type: formData.event_type,
      start_time: startDateTime.toISOString(),
      end_time: formData.allDay ? null : endDateTime.toISOString(),
      mileage: formData.mileage ? Number(formData.mileage) : null,
      hotel_expenses: formData.hotel_expenses ? Number(formData.hotel_expenses) : null,
      other_charges: formData.other_charges ? Number(formData.other_charges) : null,
      buyer_name: formData.buyer_name,
      drop_off_location: formData.drop_off_location,
      drop_off_time: formData.drop_off_time,
      user_id: user.id,
    };
    onSave(eventData);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{event ? 'Edit Event' : 'Add Event'}</DialogTitle>
          <DialogDescription>
            {event ? 'Update the details for your event.' : 'Fill in the details for your new event.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" value={formData.title} onChange={e => handleChange('title', e.target.value)} placeholder="Event Title" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} placeholder="Event Description (optional)" />
            </div>
            <div className="space-y-2">
                <Label htmlFor="event_type">Type</Label>
                <Select onValueChange={value => handleChange('event_type', value)} value={formData.event_type}>
                    <SelectTrigger id="event_type"><SelectValue placeholder="Select event type" /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Puppy Drop Off">Puppy Drop Off</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {formData.event_type === 'Puppy Drop Off' && (
                <div className="p-4 border rounded-md space-y-4 bg-muted/50">
                    <h4 className="font-semibold">Drop Off Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2"><Label htmlFor="buyer_name">Buyer Name</Label><Input id="buyer_name" value={formData.buyer_name} onChange={e => handleChange('buyer_name', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="drop_off_location">Location</Label><Input id="drop_off_location" value={formData.drop_off_location} onChange={e => handleChange('drop_off_location', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="drop_off_time">Time</Label><Input id="drop_off_time" type="time" value={formData.drop_off_time} onChange={e => handleChange('drop_off_time', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="mileage">Miles (One Way)</Label><Input id="mileage" type="number" value={formData.mileage} onChange={e => handleChange('mileage', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="hotel_expenses">Hotel Expenses</Label><Input id="hotel_expenses" type="number" value={formData.hotel_expenses} onChange={e => handleChange('hotel_expenses', e.target.value)} /></div>
                        <div className="space-y-2"><Label htmlFor="other_charges">Other Charges</Label><Input id="other_charges" type="number" value={formData.other_charges} onChange={e => handleChange('other_charges', e.target.value)} /></div>
                    </div>
                </div>
            )}

            <div className="flex items-center space-x-2">
                <Checkbox id="allDay" checked={formData.allDay} onCheckedChange={checked => handleChange('allDay', checked)} />
                <Label htmlFor="allDay">All-day event</Label>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input id="startDate" type="date" value={formData.startDate} onChange={e => handleChange('startDate', e.target.value)} />
                </div>
                {!formData.allDay && (
                    <div className="space-y-2">
                        <Label htmlFor="startTime">Start Time</Label>
                        <Input id="startTime" type="time" value={formData.startTime} onChange={e => handleChange('startTime', e.target.value)} />
                    </div>
                )}
            </div>
            {!formData.allDay && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="endDate">End Date</Label>
                        <Input id="endDate" type="date" value={formData.endDate} onChange={e => handleChange('endDate', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="endTime">End Time</Label>
                        <Input id="endTime" type="time" value={formData.endTime} onChange={e => handleChange('endTime', e.target.value)} />
                    </div>
                </div>
            )}
        </div>
        <DialogFooter className="justify-between">
            {event ? (
                 <Button variant="destructive" onClick={() => onDelete(event.id)}>Delete</Button>
            ) : <div></div>}
            <div className="flex space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button onClick={handleSave}>Save Event</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
