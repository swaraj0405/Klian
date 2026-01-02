import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';
import { Event, Role } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { EventCard } from '../components/EventCard';
import { Input } from '../components/ui/Input';
import { useAuth } from '../hooks/useAuth';
import { useSocket } from '../contexts/SocketContext';
import { eventsAPI } from '../src/api/events';

const EventCardSkeleton: React.FC = () => (
  <Card className="bg-white dark:bg-slate-800 p-6 animate-pulse">
    <div className="flex items-start gap-4">
      <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-xl" />
      <div className="flex-1 space-y-3">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  </Card>
);

const Calendar: React.FC<{
  currentDate: Date;
  changeMonth: (delta: number) => void;
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
  eventDays: Set<number>;
  reminderDays: Set<number>;
}> = ({ currentDate, changeMonth, selectedDate, onDateChange, eventDays, reminderDays }) => {
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const today = new Date();
  const isCurrentMonthInView = today.getFullYear() === currentYear && today.getMonth() === currentMonth;

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => i);

  const monthName = currentDate.toLocaleString('default', { month: 'long' });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 px-2">
        <button 
          onClick={() => changeMonth(-1)} 
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {ICONS.chevronLeft}
        </button>
        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
          {monthName} {currentYear}
        </h3>
        <button 
          onClick={() => changeMonth(1)} 
          className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          {ICONS.chevronRight}
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-2 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={`${day}-${idx}`} className="font-semibold text-slate-500 dark:text-slate-400 text-xs py-2">
            {day}
          </div>
        ))}
        {emptyDays.map(d => <div key={`empty-${d}`} />)}
        {days.map(day => {
          const date = new Date(currentYear, currentMonth, day);
          const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
          const isToday = isCurrentMonthInView && day === today.getDate();
          const hasEvent = eventDays.has(day);
          const hasReminder = reminderDays.has(day);

          const buttonClasses = `
            h-9 w-9 rounded-lg flex items-center justify-center relative text-sm
            transition-all duration-200 
            ${isToday && !isSelected ? 'text-red-600 dark:text-red-400 font-bold ring-2 ring-red-500' : 'text-slate-700 dark:text-slate-300'}
            ${isSelected ? 'bg-red-500 text-white font-bold shadow-md' : 'hover:bg-slate-100 dark:hover:bg-slate-700'}
          `;

          return (
            <div key={day} className="flex justify-center items-center">
              <button
                onClick={() => onDateChange(date)}
                className={buttonClasses}
              >
                <span>{day}</span>
                {(hasEvent || hasReminder) && (
                  <div className="absolute bottom-0.5 flex items-center justify-center w-full space-x-0.5">
                    {hasEvent && !hasReminder && <span key="event" className="h-1 w-1 bg-red-500 rounded-full"></span>}
                    {hasReminder && <span key="reminder" className="h-1 w-1 bg-amber-500 rounded-full"></span>}
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const EventsPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [events, setEvents] = useState<Event[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [reminders, setReminders] = useState<Set<string>>(new Set());
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  
  // Fetch events from database
  useEffect(() => {
    const fetchEvents = async () => {
      if (!user) return;
      setIsLoading(true);
      
      try {
        const response = await eventsAPI.getEvents();
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEvents();
  }, [user]);
  
  // Listen for real-time event updates
  useEffect(() => {
    if (!socket) return;
    
    socket.on('new-event', (newEvent) => {
      setEvents(prevEvents => [newEvent, ...prevEvents]);
      setIsCreating(false); // Clear skeleton when event arrives
    });
    
    socket.on('event-deleted', (deletedEventId) => {
      setEvents(prevEvents => prevEvents.filter(e => 
        (e.id || e._id) !== deletedEventId
      ));
    });
    
    socket.on('event-updated', (updatedEvent) => {
      setEvents(prevEvents => 
        prevEvents.map(e => 
          (e.id || e._id) === (updatedEvent.id || updatedEvent._id) 
            ? updatedEvent 
            : e
        )
      );
    });
    
    return () => {
      socket.off('new-event');
      socket.off('event-deleted');
      socket.off('event-updated');
    };
  }, [socket]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
        navigate(-1);
    } else {
        navigate('/home', { replace: true });
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(e => (e.id || e._id) !== eventId));
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const changeMonth = (delta: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setDate(1); // Avoid issues with different month lengths
      newDate.setMonth(newDate.getMonth() + delta);
      return newDate;
    });
  };

  const toggleReminder = (eventId: string) => {
    setReminders(prev => {
        const newReminders = new Set(prev);
        if (newReminders.has(eventId)) {
            newReminders.delete(eventId);
        } else {
            newReminders.add(eventId);
        }
        return newReminders;
    });
  };

  const eventDaysInView = useMemo(() => {
    return new Set(
      events
        .map(e => new Date(e.date))
        .filter(d => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
        .map(d => d.getDate())
    );
  }, [events, currentMonth, currentYear]);
  
  const reminderDaysInView = useMemo(() => {
    return new Set(
      events
        .filter(e => reminders.has(e.id))
        .map(e => new Date(e.date))
        .filter(d => d.getMonth() === currentMonth && d.getFullYear() === currentYear)
        .map(d => d.getDate())
    );
  }, [events, reminders, currentMonth, currentYear]);

  const filteredEvents = useMemo(() => {
    if (!selectedDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return events
            .filter(event => new Date(event.date) >= today)
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    return events.filter(event => new Date(event.date).toDateString() === selectedDate.toDateString());
  }, [events, selectedDate]);

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    
    const formData = new FormData(e.currentTarget);
    const eventData = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      location: formData.get('location') as string,
      date: new Date(formData.get('date') as string).toISOString()
    };
    
    try {
      setIsModalOpen(false); // Close modal immediately
      setIsCreating(true); // Show skeleton
      const response = await eventsAPI.createEvent(eventData);
      // The socket will handle adding the new event to the list
    } catch (error) {
      console.error('Error creating event:', error);
      setIsCreating(false); // Hide skeleton on error
    }
  };

  return (
    <div className="h-screen bg-slate-50 dark:bg-slate-900 flex flex-col lg:overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 lg:overflow-hidden overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-full">
          {/* Left Column - Calendar (Static/Sticky) */}
          <div className="lg:col-span-1 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <button 
                  onClick={handleBack} 
                  className="md:hidden p-2 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm"
                >
                  {ICONS.chevronLeft}
                </button>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">Events</h1>
              </div>
              {(user?.role === Role.TEACHER || user?.role === Role.ADMIN) && (
                <Button onClick={() => setIsModalOpen(true)} className="text-sm md:text-base">
                  Create Event
                </Button>
              )}
            </div>
            
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm p-4 mb-4">
              <Calendar 
                currentDate={currentDate}
                changeMonth={changeMonth}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                eventDays={eventDaysInView}
                reminderDays={reminderDaysInView}
              />
            </div>
            
            {selectedDate && (
              <Button 
                variant="secondary" 
                className="w-full" 
                onClick={() => setSelectedDate(null)}
              >
                Clear Filter
              </Button>
            )}
          </div>
          
          {/* Right Column - Events List (Scrollable on desktop only) */}
          <div className="lg:col-span-2 flex flex-col lg:h-full lg:overflow-hidden">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white mb-6 flex-shrink-0">
              {selectedDate ? `Events on ${selectedDate.toLocaleDateString()}` : "Upcoming Events"}
            </h2>
            <div className="lg:flex-1 lg:overflow-y-auto space-y-4 scrollbar-hide">
              {isLoading && (
                <>
                  {[1, 2, 3].map((i) => (
                    <EventCardSkeleton key={`event-skeleton-${i}`} />
                  ))}
                </>
              )}

              {isCreating && !isLoading && <EventCardSkeleton />}

              {!isLoading && filteredEvents.length > 0 && (
                filteredEvents.map((event) => (
                  <EventCard 
                    key={event.id || event._id} 
                    event={event} 
                    isReminderSet={reminders.has(event.id || event._id)} 
                    onToggleReminder={toggleReminder}
                    onDelete={handleDeleteEvent}
                  />
                ))
              )}

              {!isLoading && !isCreating && filteredEvents.length === 0 && (
                <Card className="bg-white dark:bg-slate-800">
                  <p className="text-center py-12 text-slate-500 dark:text-slate-400">
                    No events found.
                  </p>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Event">
        <form onSubmit={handleCreateEvent} className="space-y-4">
          <Input name="title" label="Event Title" placeholder="e.g., Tech Summit" required />
          <Input name="description" label="Description" placeholder="What's the event about?" required />
          <Input name="location" label="Location" placeholder="e.g., Grand Hall" required />
          <Input name="date" label="Date and Time" type="datetime-local" required />
          <div className="flex justify-end pt-4">
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};