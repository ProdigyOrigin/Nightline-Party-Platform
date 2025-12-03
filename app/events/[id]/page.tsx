'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { notFound } from 'next/navigation';

interface Event {
  id: string;
  name: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  ticket_button_label: string;
  ticket_url: string | null;
  is_published: boolean;
  status: string;
  is_featured: boolean;
  featured_rank: number | null;
  organizer_user_id: string;
  submitted_by_promoter_id: string | null;
  created_at: string;
  updated_at: string;
  organizer_username?: string;
}

export default function EventPage() {
  const params = useParams();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('events')
          .select(`
            *,
            organizer:users!events_organizer_user_id_fkey (username)
          `)
          .eq('id', params.id as string)
          .eq('is_published', true)
          .single();

        if (error || !data) {
          notFound();
          return;
        }

        const processedEvent = {
          ...data,
          organizer_username: data.organizer?.username,
          organizer: undefined
        };

        setEvent(processedEvent);
      } catch (error) {
        console.error('Error fetching event:', error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchEvent();
    }
  }, [params.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const handleShare = () => {
    if (navigator.share && event) {
      navigator.share({
        title: event.name,
        text: `Check out ${event.name} on ${formatDate(event.date)}`,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Event link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-secondary">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!event) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="card-neon">
          {/* Event Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary-neon mb-4">
              {event.name}
            </h1>
            <div className="flex items-center justify-center space-x-4 text-secondary">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>{formatDate(event.date)}</span>
              </div>
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{formatTime(event.start_time)}</span>
                {event.end_time && (
                  <>
                    <span>-</span>
                    <span>{formatTime(event.end_time)}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Event Image Placeholder */}
          <div className="w-full h-64 bg-secondary rounded-lg flex items-center justify-center mb-8">
            <svg className="w-24 h-24 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Event Details */}
          <div className="grid md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Description */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">About this event</h2>
                <div className="text-secondary leading-relaxed whitespace-pre-wrap">
                  {event.description || 'Join us for an amazing event! More details coming soon.'}
                </div>
              </div>

              {/* Venue Information */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">Venue</h2>
                <div className="bg-secondary rounded-lg p-6 space-y-3">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-primary-neon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <div>
                      <div className="text-white font-medium">{event.venue_name}</div>
                      <div className="text-secondary">{event.venue_address}</div>
                      <div className="text-secondary">{event.city}, CA</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Organizer Information */}
              {event.organizer_username && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">Organizer</h2>
                  <div className="bg-secondary rounded-lg p-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {event.organizer_username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-white font-medium">{event.organizer_username}</div>
                        <div className="text-secondary">Event Organizer</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Ticket Information */}
              <div className="bg-secondary rounded-lg p-6 sticky top-24">
                <h3 className="text-xl font-bold text-white mb-4">Get Tickets</h3>
                
                {event.ticket_url ? (
                  <div className="space-y-4">
                    <a 
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full text-center inline-block"
                    >
                      {event.ticket_button_label || 'Purchase tickets'}
                    </a>
                    <p className="text-sm text-secondary text-center">
                      You will be redirected to an external ticketing platform
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link 
                      href={`/checkout/${event.id}`}
                      className="btn-primary w-full text-center inline-block"
                    >
                      {event.ticket_button_label || 'Purchase tickets'}
                    </Link>
                    <p className="text-sm text-secondary text-center">
                      Ticket sales will be available soon
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-700">
                  <div className="text-sm text-secondary space-y-2">
                    <div className="flex justify-between">
                      <span>Date:</span>
                      <span className="text-white">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Time:</span>
                      <span className="text-white">
                        {formatTime(event.start_time)}
                        {event.end_time && ` - ${formatTime(event.end_time)}`}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Location:</span>
                      <span className="text-white">{event.city}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Share Event */}
              <div className="bg-secondary rounded-lg p-6">
                <h3 className="text-xl font-bold text-white mb-4">Share Event</h3>
                <div className="space-y-3">
                  <button 
                    onClick={handleShare}
                    className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Share Event
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Back to Events */}
          <div className="mt-12 pt-8 border-t border-gray-800">
            <div className="flex justify-between items-center">
              <Link 
                href="/"
                className="text-secondary hover:text-primary-neon transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>Back</span>
              </Link>
              
              <div className="text-sm text-secondary">
                Event posted {new Date(event.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
