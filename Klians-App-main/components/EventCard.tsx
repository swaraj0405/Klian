import React, { useState } from 'react';
import { Event, User } from '../types';
import { ICONS } from '../constants';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { ConfirmModal } from './ConfirmModal';
import { useAuth } from '../hooks/useAuth';
import { eventsAPI } from '../src/api/events';

interface EventCardProps {
  event: Event;
  isReminderSet: boolean;
  onToggleReminder: (eventId: string) => void;
  onDelete?: (eventId: string) => void;
}

const LocationIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const CalendarIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;


export const EventCard: React.FC<EventCardProps> = ({ event, isReminderSet, onToggleReminder, onDelete }) => {
  const { user } = useAuth();
  const [isAttending, setIsAttending] = useState(
    user && event.attendees ? event.attendees.some(attendee => 
      (typeof attendee === 'string' ? attendee === user.id : attendee._id === user.id)
    ) : false
  );
  const [isLoadingAttend, setIsLoadingAttend] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const eventAttendees = event.attendees || [];
  const creatorId = event.creator?._id || event.creator || event.createdBy?._id || event.createdBy;
  const isCreator = user && creatorId && (creatorId.toString() === user.id || creatorId.toString() === user._id);
  
  const handleAttend = async () => {
    if (!user || isLoadingAttend) return;
    
    setIsLoadingAttend(true);
    try {
      if (!isAttending) {
        await eventsAPI.attendEvent(event.id || event._id);
      } else {
        await eventsAPI.unattendEvent(event.id || event._id);
      }
      setIsAttending(!isAttending);
    } catch (error) {
      console.error('Error updating attendance:', error);
    } finally {
      setIsLoadingAttend(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!user || !isCreator || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await eventsAPI.deleteEvent(event.id || event._id);
      if (onDelete) {
        onDelete(event.id || event._id);
      }
      setShowDeleteModal(false);
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
      setIsDeleting(false);
    }
  };

  const eventDate = new Date(event.date);
  const creator = event.creator || event.createdBy || { name: 'Unknown' };

  return (
    <>
      <Card>
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">{event.title}</h3>
                {isReminderSet && (
                  <span className="text-yellow-500" title="Reminder is set">
                    {ICONS.bellSolid}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Created by {creator.name}
              </p>
            </div>
            
            {isCreator && (
              <button
                onClick={handleDeleteClick}
                disabled={isDeleting}
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                title="Delete event"
              >
                {ICONS.trash}
              </button>
            )}
          </div>
        
        <p className="mt-4 text-slate-700 dark:text-slate-300">{event.description}</p>
        
        <div className="mt-4 flex flex-col space-y-2 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center space-x-2">
            <CalendarIcon />
            <span>{eventDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} at {eventDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <div className="flex items-center space-x-2">
            <LocationIcon />
            <span>{event.location}</span>
          </div>
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <div className="flex items-center gap-2">
            {eventAttendees.length > 0 ? (
              <>
                <div className="flex -space-x-2">
                  {eventAttendees.slice(0, 2).map((attendee, index) => {
                    const attendeeId = typeof attendee === 'string' ? 
                      attendee : 
                      (attendee._id || `attendee-${event.id || event._id}-${index}`);
                    
                    return (
                      <Avatar 
                        key={attendeeId}
                        src={typeof attendee === 'object' ? attendee.profilePicture : undefined} 
                        alt={typeof attendee === 'object' ? attendee.name : 'Attendee'} 
                        size="sm" 
                        className="border-2 border-white dark:border-slate-800" 
                      />
                    );
                  })}
                  {eventAttendees.length > 2 && (
                    <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold border-2 border-white dark:border-slate-800">
                      +{eventAttendees.length - 2}
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {eventAttendees.length} {eventAttendees.length === 1 ? 'person' : 'people'} attending
                </span>
              </>
            ) : (
              <p className="text-sm text-slate-500">No one is attending yet</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => onToggleReminder(event.id || event._id)} 
              className={`p-2 rounded-full transition-colors ${isReminderSet ? 'text-yellow-500 bg-yellow-100 dark:bg-yellow-900/50' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`} 
              title={isReminderSet ? 'Remove reminder' : 'Set reminder'}
              aria-label={isReminderSet ? 'Remove reminder' : 'Set reminder'}
            >
              {isReminderSet ? ICONS.bellSolid : ICONS.bell}
            </button>
            <Button 
              onClick={handleAttend} 
              variant={isAttending ? 'secondary' : 'primary'}
              disabled={isLoadingAttend}
              className="min-w-[100px]"
            >
              {isLoadingAttend ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  <span>Loading...</span>
                </div>
              ) : (
                isAttending ? 'Attending' : 'Attend'
              )}
            </Button>
          </div>
        </div>
      </div>
    </Card>

    <ConfirmModal
      isOpen={showDeleteModal}
      onClose={() => setShowDeleteModal(false)}
      onConfirm={handleConfirmDelete}
      title="Delete Event"
      message="Are you sure you want to delete this event? This action cannot be undone and all attendees will be notified."
      confirmText="Delete Event"
      cancelText="Cancel"
      isLoading={isDeleting}
      variant="danger"
    />
    </>
  );
};