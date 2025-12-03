'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { User, UserRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

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
  organizer_user_id: string;
  ticket_button_label: string;
  ticket_url: string | null;
  is_published: boolean;
  status: string;
  is_featured: boolean;
  featured_rank: number | null;
  submitted_by_promoter_id: string | null;
  created_at: string;
  updated_at: string;
  organizer_username?: string;
  promoter_username?: string;
}

export default function EventManagement() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    city: '',
    ticket_button_label: 'Purchase tickets',
    ticket_url: '',
    is_published: false,
    status: 'draft' as string,
    is_featured: false,
    featured_rank: null as number | null
  });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'pending_review' | 'approved' | 'rejected'>('all');

  useEffect(() => {
    if (!loading && (!user || (user.role !== 'owner' && user.role !== 'admin'))) {
      router.push('/');
      return;
    }
    if (user && (user.role === 'owner' || user.role === 'admin')) {
      fetchEvents();
    }
  }, [user, loading, router]);

  const fetchEvents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          organizer:users!events_organizer_user_id_fkey (username),
          promoter:users!events_submitted_by_promoter_id_fkey (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const processedEvents = (data || []).map(event => ({
        ...event,
        organizer_username: event.organizer?.username,
        promoter_username: event.promoter?.username,
        organizer: undefined,
        promoter: undefined
      }));
      
      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      setMessage('Failed to fetch events');
      setMessageType('error');
    } finally {
      setLoadingEvents(false);
    }
  };

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setFormData({
      name: event.name,
      description: event.description || '',
      date: event.date,
      start_time: event.start_time,
      end_time: event.end_time || '',
      venue_name: event.venue_name,
      venue_address: event.venue_address,
      city: event.city,
      ticket_button_label: event.ticket_button_label,
      ticket_url: event.ticket_url || '',
      is_published: event.is_published,
      status: event.status,
      is_featured: event.is_featured,
      featured_rank: event.featured_rank
    });
    setMessage('');
  };

  const handleCancel = () => {
    setEditingEvent(null);
    setFormData({
      name: '',
      description: '',
      date: '',
      start_time: '',
      end_time: '',
      venue_name: '',
      venue_address: '',
      city: '',
      ticket_button_label: 'Purchase tickets',
      ticket_url: '',
      is_published: false,
      status: 'draft',
      is_featured: false,
      featured_rank: null
    });
    setMessage('');
  };

  const handleSave = async () => {
    if (!editingEvent) return;

    try {
      const supabase = createClient();
      const updateData = {
        name: formData.name,
        description: formData.description || null,
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time || null,
        venue_name: formData.venue_name,
        venue_address: formData.venue_address,
        city: formData.city,
        ticket_button_label: formData.ticket_button_label,
        ticket_url: formData.ticket_url || null,
        is_published: formData.is_published,
        status: formData.status,
        is_featured: formData.is_featured,
        featured_rank: formData.featured_rank,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('events')
        .update(updateData)
        .eq('id', editingEvent.id);

      if (error) throw error;

      await fetchEvents();
      setEditingEvent(null);
      setMessage('Event updated successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to update event');
      setMessageType('error');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : 
              type === 'number' ? (value ? parseInt(value) : null) : 
              value
    }));
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;

      await fetchEvents();
      setMessage('Event deleted successfully!');
      setMessageType('success');
    } catch (error) {
      setMessage('Failed to delete event');
      setMessageType('error');
    }
  };

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'published') return event.is_published;
    return event.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-900/50 text-gray-400';
      case 'pending_review': return 'bg-yellow-900/50 text-yellow-400';
      case 'approved': return 'bg-green-900/50 text-green-400';
      case 'rejected': return 'bg-red-900/50 text-red-400';
      case 'published': return 'bg-blue-900/50 text-blue-400';
      default: return 'bg-gray-900/50 text-gray-400';
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

  if (!user || (user.role !== 'owner' && user.role !== 'admin')) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-neon mb-2">
                Event Management
              </h1>
              <p className="text-secondary">
                Manage all events in the system
              </p>
            </div>
            <button onClick={() => router.push('/events/new')} className="btn-primary">
              Create Event
            </button>
          </div>

          {message && (
            <div className={`mb-6 p-4 rounded-lg text-sm ${
              messageType === 'success' 
                ? 'bg-green-900/50 border border-green-500 text-green-400' 
                : 'bg-red-900/50 border border-red-500 text-red-400'
            }`}>
              {message}
            </div>
          )}

          {/* Filter */}
          <div className="mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
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

          {/* Events Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-3 text-sm font-medium text-secondary">Event Name</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Date</th>
                  <th className="pb-3 text-sm font-medium text-secondary">City</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Organizer</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Status</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Featured</th>
                  <th className="pb-3 text-sm font-medium text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="border-b border-gray-800">
                    <td className="py-4 text-sm">
                      <Link 
                        href={`/events/${event.id}`}
                        className="text-primary-neon hover:text-primary-neon/80 transition-colors"
                      >
                        {event.name}
                      </Link>
                    </td>
                    <td className="py-4 text-sm text-gray-400">
                      {new Date(event.date).toLocaleDateString()}
                    </td>
                    <td className="py-4 text-sm text-gray-400">{event.city}</td>
                    <td className="py-4 text-sm text-gray-400">
                      {event.organizer_username || 'Unknown'}
                    </td>
                    <td className="py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(event.status)}`}>
                        {event.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4">
                      {event.is_featured ? (
                        <span className="text-accent text-sm">
                          {event.featured_rank ? `#${event.featured_rank}` : 'Yes'}
                        </span>
                      ) : (
                        <span className="text-gray-500 text-sm">No</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex space-x-2">
                        {/* Removed Create button */}
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-primary-neon hover:text-primary-neon/80 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-500 hover:text-red-400 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Edit Modal */}
          {editingEvent && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-secondary border border-gray-700 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-bold text-white mb-4">Edit Event</h2>
                
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Event Name
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Date
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={3}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Start Time
                      </label>
                      <input
                        type="time"
                        name="start_time"
                        value={formData.start_time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        End Time
                      </label>
                      <input
                        type="time"
                        name="end_time"
                        value={formData.end_time}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Venue Name
                      </label>
                      <input
                        type="text"
                        name="venue_name"
                        value={formData.venue_name}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        City
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-secondary">
                      Venue Address
                    </label>
                    <input
                      type="text"
                      name="venue_address"
                      value={formData.venue_address}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Ticket Button Label
                      </label>
                      <input
                        type="text"
                        name="ticket_button_label"
                        value={formData.ticket_button_label}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Ticket URL
                      </label>
                      <input
                        type="url"
                        name="ticket_url"
                        value={formData.ticket_url}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Status
                      </label>
                      <select
                        name="status"
                        value={formData.status}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      >
                        <option value="draft">Draft</option>
                        <option value="pending_review">Pending Review</option>
                        <option value="approved">Approved</option>
                        <option value="rejected">Rejected</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    <div className="flex items-center space-x-4">
                      <label className="flex items-center space-x-2 text-secondary">
                        <input
                          type="checkbox"
                          name="is_published"
                          checked={formData.is_published}
                          onChange={handleInputChange}
                          className="rounded border-gray-700 bg-secondary text-primary-neon focus:ring-primary-neon"
                        />
                        <span className="text-sm">Published</span>
                      </label>

                      <label className="flex items-center space-x-2 text-secondary">
                        <input
                          type="checkbox"
                          name="is_featured"
                          checked={formData.is_featured}
                          onChange={handleInputChange}
                          className="rounded border-gray-700 bg-secondary text-primary-neon focus:ring-primary-neon"
                        />
                        <span className="text-sm">Featured</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-secondary">
                        Featured Rank
                      </label>
                      <select
                        name="featured_rank"
                        value={formData.featured_rank || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                      >
                        <option value="">None</option>
                        <option value="1">1</option>
                        <option value="2">2</option>
                        <option value="3">3</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-4 mt-6">
                  <button
                    onClick={handleSave}
                    className="btn-primary flex-1"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancel}
                    className="btn-primary flex-1 bg-gray-700 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
