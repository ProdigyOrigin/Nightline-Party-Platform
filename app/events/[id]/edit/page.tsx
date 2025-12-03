'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

type FormState = {
  name: string;
  description: string;
  date: string;
  start_time: string;
  end_time: string;
  venue_name: string;
  venue_address: string;
  city: string;
  ticket_button_label: string;
  ticket_url: string;
};

function EditEventPage(): JSX.Element {
  const { user, loading } = useAuth();
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [form, setForm] = useState<FormState>({
    name: '',
    description: '',
    date: '',
    start_time: '',
    end_time: '',
    venue_name: '',
    venue_address: '',
    city: '',
    ticket_button_label: 'Purchase tickets',
    ticket_url: ''
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');
  const [loadingEvent, setLoadingEvent] = useState<boolean>(true);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!['promoter', 'admin', 'owner'].includes(user.role)) {
        router.push('/');
        return;
      }
      if (params.id) {
        void fetchEvent();
      }
    }
  }, [user, loading, router, params.id]);

  const fetchEvent = async (): Promise<void> => {
    try {
      setLoadingEvent(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', params.id as string)
        .single();

      if (error) throw error;

      // Check if user has permission to edit this event
      if (user?.role === 'promoter' && data.submitted_by_promoter_id !== user.id) {
        router.push('/my-events');
        return;
      }

      if (user?.role === 'admin' && data.organizer_user_id !== user.id && data.submitted_by_promoter_id !== user.id) {
        router.push('/event-management');
        return;
      }

      setForm({
        name: data.name || '',
        description: data.description || '',
        date: data.date || '',
        start_time: data.start_time || '',
        end_time: data.end_time || '',
        venue_name: data.venue_name || '',
        venue_address: data.venue_address || '',
        city: data.city || '',
        ticket_button_label: data.ticket_button_label || 'Purchase tickets',
        ticket_url: data.ticket_url || ''
      });
    } catch (error) {
      console.error('Error fetching event:', error);
      setMessage('Failed to load event');
      setMessageType('error');
    } finally {
      setLoadingEvent(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (!form.name.trim()) return 'Event name is required';
    if (!form.date) return 'Event date is required';
    if (!form.start_time) return 'Start time is required';
    if (!form.venue_name.trim()) return 'Venue name is required';
    if (!form.venue_address.trim()) return 'Venue address is required';
    if (!form.city.trim()) return 'City is required';
    return null;
  };

  const handleSubmit = async (): Promise<void> => {
    if (!user) return;
    const errorMsg = validate();
    if (errorMsg) {
      setMessage(errorMsg);
      setMessageType('error');
      return;
    }

    try {
      setSubmitting(true);
      setMessage('');

      const { error } = await supabase
        .from('events')
        .update({
          name: form.name.trim(),
          description: form.description ? form.description : null,
          date: form.date,
          start_time: form.start_time,
          end_time: form.end_time ? form.end_time : null,
          venue_name: form.venue_name.trim(),
          venue_address: form.venue_address.trim(),
          city: form.city.trim(),
          ticket_button_label: form.ticket_button_label || 'Purchase tickets',
          ticket_url: form.ticket_url ? form.ticket_url : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', params.id as string);

      if (error) throw error;

      setMessage('Event updated successfully!');
      setMessageType('success');
    } catch (err) {
      console.error('Error updating event:', err);
      setMessage('Failed to update event');
      setMessageType('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || loadingEvent) {
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

  if (!user || !['promoter', 'admin', 'owner'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-primary-neon mb-2">Edit Event</h1>
              <p className="text-secondary">Update your event information</p>
            </div>
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

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Event Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Date</label>
                <input
                  type="date"
                  name="date"
                  value={form.date}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-secondary">Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Start Time</label>
                <input
                  type="time"
                  name="start_time"
                  value={form.start_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">End Time</label>
                <input
                  type="time"
                  name="end_time"
                  value={form.end_time}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Venue Name</label>
                <input
                  type="text"
                  name="venue_name"
                  value={form.venue_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">City</label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-secondary">Venue Address</label>
              <input
                type="text"
                name="venue_address"
                value={form.venue_address}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Ticket Button Label</label>
                <input
                  type="text"
                  name="ticket_button_label"
                  value={form.ticket_button_label}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-secondary">Ticket URL (optional)</label>
                <input
                  type="url"
                  name="ticket_url"
                  value={form.ticket_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4 mt-6">
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="btn-primary"
              >
                {submitting ? 'Updating...' : 'Update Event'}
              </button>
              <button
                onClick={() => router.back()}
                className="btn-primary bg-gray-700 hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EditEventPage;
