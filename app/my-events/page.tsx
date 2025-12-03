'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface EventRow {
  id: string;
  name: string;
  description: string | null;
  date: string;
  start_time: string;
  end_time: string | null;
  venue_name: string;
  venue_address: string;
  city: string;
  organizer_user_id: string;
  ticket_button_label: string | null;
  ticket_url: string | null;
  is_published: boolean | null;
  status: string;
  is_featured: boolean | null;
  featured_rank: number | null;
  submitted_by_promoter_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

type Filter =
  | 'all'
  | 'published'
  | 'draft'
  | 'pending_review'
  | 'approved'
  | 'rejected';

export default function MyEventsPage(): JSX.Element | null {
  const { user, loading } = useAuth();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [loadingEvents, setLoadingEvents] = useState<boolean>(true);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (user.role !== 'promoter') {
        router.push('/');
        return;
      }
      void fetchMyEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  const fetchMyEvents = async (): Promise<void> => {
    try {
      setLoadingEvents(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('submitted_by_promoter_id', user?.id ?? '')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEvents((data ?? []) as EventRow[]);
    } catch (err) {
      console.error('Error fetching my events:', err);
      setMessage('Failed to fetch your events');
      setMessageType('error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleCreateEvent = async (): Promise<void> => {
    if (!user) return;
    try {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: 'Untitled Event',
          description: null,
          date: new Date().toISOString().slice(0, 10),
          start_time: '20:00',
          end_time: null,
          venue_name: 'Venue',
          venue_address: 'Address',
          city: 'City',
          organizer_user_id: user.id,
          ticket_button_label: 'Purchase tickets',
          ticket_url: null,
          is_published: false,
          status: 'draft',
          is_featured: false,
          featured_rank: null,
          submitted_by_promoter_id: user.id,
          created_at: nowIso,
          updated_at: nowIso,
        })
        .select('id')
        .single();

      if (error) throw error;

      setMessage('Event created! You can edit its details.');
      setMessageType('success');
      await fetchMyEvents();

      if (data?.id) {
        router.push(`/events/${data.id}`);
      }
    } catch (err) {
      console.error('Error creating event:', err);
      setMessage('Failed to create event');
      setMessageType('error');
    }
  };

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      if (filter === 'all') return true;
      if (filter === 'published') return Boolean(evt.is_published);
      return evt.status === filter;
    });
  }, [events, filter]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-900/50 text-gray-400';
      case 'pending_review':
        return 'bg-yellow-900/50 text-yellow-400';
      case 'approved':
        return 'bg-green-900/50 text-green-400';
      case 'rejected':
        return 'bg-red-900/50 text-red-400';
      case 'published':
        return 'bg-blue-900/50 text-blue-400';
      default:
        return 'bg-gray-900/50 text-gray-400';
    }
  };

  if (loading || loadingEvents) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <p className="text-secondary">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user || user.role !== 'promoter') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-neon mb-2">My Events</h1>
              <p className="text-secondary">Create and manage events you submitted</p>
            </div>
            <button onClick={() => router.push('/events/new')} className="btn-primary">
              Create Event
            </button>
          </div>

          {message && (
            <div
              className={`mb-6 p-4 rounded-lg text-sm ${
                messageType === 'success'
                  ? 'bg-green-900/50 border border-green-500 text-green-400'
                  : 'bg-red-900/50 border border-red-500 text-red-400'
              }`}
            >
              {message}
            </div>
          )}

          <div className="mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as Filter)}
              className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
            >
              <option value="all">All Events</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending_review">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="text-secondary">No events found. Create your first event!</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="pb-3 text-sm font-medium text-secondary">Event Name</th>
                    <th className="pb-3 text-sm font-medium text-secondary">Date</th>
                    <th className="pb-3 text-sm font-medium text-secondary">City</th>
                    <th className="pb-3 text-sm font-medium text-secondary">Status</th>
                    <th className="pb-3 text-sm font-medium text-secondary">Featured</th>
                    <th className="pb-3 text-sm font-medium text-secondary">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEvents.map((evt) => (
                    <tr key={evt.id} className="border-b border-gray-800">
                      <td className="py-4 text-sm">
                        <Link
                          href={`/events/${evt.id}`}
                          className="text-primary-neon hover:text-primary-neon/80 transition-colors"
                        >
                          {evt.name}
                        </Link>
                      </td>
                      <td className="py-4 text-sm text-gray-400">
                        {new Date(evt.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 text-sm text-gray-400">{evt.city}</td>
                      <td className="py-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            evt.status
                          )}`}
                        >
                          {evt.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4">
                        {evt.is_featured ? (
                          <span className="text-accent text-sm">
                            {evt.featured_rank ? `#${evt.featured_rank}` : 'Yes'}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">No</span>
                        )}
                      </td>
                      <td className="py-4">
                        <div className="flex space-x-2">
                          <Link
                            href={`/events/${evt.id}/edit`}
                            className="text-primary-neon hover:text-primary-neon/80 text-sm"
                          >
                            Edit
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
