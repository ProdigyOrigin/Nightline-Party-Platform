'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

interface SupportMessage {
  id: string;
  sender_user_id: string;
  subject: string;
  message_body: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
  handled_by_admin_id: string | null;
  handler_username?: string;
}

export default function SupportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/support');
        return;
      }
      if (!['user', 'promoter'].includes(user.role)) {
        router.push('/');
        return;
      }
      fetchMessages();
    }
  }, [user, loading, router]);

  const fetchMessages = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('support_messages')
        .select(`
          *,
          handler:users!support_messages_handled_by_admin_id_fkey (username)
        `)
        .eq('sender_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedMessages = (data || []).map(msg => ({
        ...msg,
        handler_username: msg.handler?.username,
        handler: undefined
      }));

      setMessages(processedMessages as SupportMessage[]);
    } catch (err) {
      console.error('Error fetching support messages:', err);
      setError('Failed to fetch your support messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('support_messages')
        .insert({
          sender_user_id: user.id,
          subject: subject.trim(),
          message_body: message.trim(),
          status: 'open'
        });

      if (error) throw error;

      setSuccessMessage('Your support ticket has been submitted successfully!');
      setSubject('');
      setMessage('');
      await fetchMessages();
    } catch (err: any) {
      setError(err.message || 'Failed to submit support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !replyMessage.trim()) return;

    setSubmittingReply(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('support_messages')
        .update({
          message_body: selectedMessage.message_body + '\n\n--- User Reply ---\n' + replyMessage.trim(),
          status: 'open',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      await fetchMessages();
      setSelectedMessage({
        ...selectedMessage,
        message_body: selectedMessage.message_body + '\n\n--- User Reply ---\n' + replyMessage.trim(),
        status: 'open'
      });
      setReplyMessage('');
      setSuccessMessage('Reply sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    return filter === 'all' || msg.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-900/50 text-red-400';
      case 'in_progress': return 'bg-yellow-900/50 text-yellow-400';
      case 'resolved': return 'bg-green-900/50 text-green-400';
      default: return 'bg-gray-900/50 text-gray-400';
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

  if (!user || !['user', 'promoter'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-6xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-neon mb-2">
              Support Center
            </h1>
            <p className="text-secondary">
              Need help? Submit a support ticket and our team will get back to you.
            </p>
          </div>

          {successMessage && (
            <div className="mb-6 p-4 bg-green-900/50 border border-green-500 rounded-lg text-green-400">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-500 rounded-lg text-red-400">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - New Ticket Form */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Create New Ticket</h2>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium mb-2 text-secondary">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                    required
                    placeholder="Brief description of your issue"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium mb-2 text-secondary">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white resize-none"
                    required
                    placeholder="Please describe your issue in detail. Include any relevant information such as error messages, steps to reproduce, etc."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </form>

              <div className="mt-8 p-4 bg-secondary rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Frequently Asked Questions</h3>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-primary-neon mb-1">How do I create an event?</h4>
                    <p className="text-xs text-secondary">
                      If you're a promoter, you can create events by going to "My Events" and clicking "Create Event". 
                      Your events will be submitted for admin review.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary-neon mb-1">How long does event approval take?</h4>
                    <p className="text-xs text-secondary">
                      Event reviews are typically processed within 24-48 hours during business days.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-primary-neon mb-1">Can I edit my event after submission?</h4>
                    <p className="text-xs text-secondary">
                      Yes, you can edit your event details at any time from the "My Events" page.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Your Tickets */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Your Tickets</h2>
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value as any)}
                  className="px-3 py-1 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>

              {loadingMessages ? (
                <div className="text-center py-8">
                  <p className="text-secondary">Loading your tickets...</p>
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="text-secondary text-center py-8">
                  No support tickets found. Create your first ticket!
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMessages.map((msg) => (
                    <div
                      key={msg.id}
                      onClick={() => setSelectedMessage(msg)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedMessage?.id === msg.id
                          ? 'border-primary-neon bg-primary-neon/10'
                          : 'border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-white font-medium text-sm">{msg.subject}</h3>
                          <p className="text-xs text-secondary mt-1">
                            {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(msg.status)}`}>
                          {msg.status.replace('_', ' ')}
                        </span>
                      </div>
                      {msg.handler_username && (
                        <p className="text-xs text-secondary mt-1">
                          Handled by: {msg.handler_username}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Message Detail */}
              {selectedMessage && (
                <div className="mt-6 bg-secondary border border-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-medium text-white mb-3">{selectedMessage.subject}</h3>
                  
                  <div className="mb-4">
                    <div className="text-xs text-gray-400 mb-2">
                      Created: {new Date(selectedMessage.created_at).toLocaleDateString()} {new Date(selectedMessage.created_at).toLocaleTimeString()}
                    </div>
                    {selectedMessage.handler_username && (
                      <div className="text-xs text-secondary mb-2">
                        Handled by: {selectedMessage.handler_username}
                      </div>
                    )}
                    <div className="text-xs text-secondary mb-3">
                      Status: <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(selectedMessage.status)}`}>
                        {selectedMessage.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-secondary mb-2">Conversation:</h4>
                    <div className="bg-black/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <pre className="text-xs text-white whitespace-pre-wrap font-sans">
                        {selectedMessage.message_body}
                      </pre>
                    </div>
                  </div>

                  {selectedMessage.status !== 'resolved' && (
                    <div>
                      <h4 className="text-sm font-medium text-secondary mb-2">Add Reply:</h4>
                      <textarea
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white resize-none text-sm"
                        placeholder="Type your reply here..."
                      />
                      <button
                        onClick={handleReply}
                        disabled={submittingReply || !replyMessage.trim()}
                        className="mt-2 btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
