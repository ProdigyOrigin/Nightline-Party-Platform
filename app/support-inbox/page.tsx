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
  sender_username?: string;
  sender_role?: string;
  handler_username?: string;
}

export default function SupportInboxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<SupportMessage | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
        return;
      }
      if (!['admin', 'owner'].includes(user.role)) {
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
          sender:users!support_messages_sender_user_id_fkey (username, role),
          handler:users!support_messages_handled_by_admin_id_fkey (username)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedMessages = (data || []).map(msg => ({
        ...msg,
        sender_username: msg.sender?.username,
        sender_role: msg.sender?.role,
        handler_username: msg.handler?.username,
        sender: undefined,
        handler: undefined
      }));

      setMessages(processedMessages as SupportMessage[]);
    } catch (err) {
      console.error('Error fetching support messages:', err);
      setError('Failed to fetch support messages');
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleStatusUpdate = async (newStatus: 'open' | 'in_progress' | 'resolved') => {
    if (!selectedMessage) return;

    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('support_messages')
        .update({
          status: newStatus,
          handled_by_admin_id: newStatus !== 'open' ? user.id : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      await fetchMessages();
      setSelectedMessage({ ...selectedMessage, status: newStatus });
      setSuccessMessage('Status updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleReply = async () => {
    if (!selectedMessage || !message.trim()) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('support_messages')
        .update({
          message_body: selectedMessage.message_body + '\n\n--- Admin Reply ---\n' + message.trim(),
          status: 'in_progress',
          handled_by_admin_id: user.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedMessage.id);

      if (error) throw error;

      await fetchMessages();
      setSelectedMessage({
        ...selectedMessage,
        message_body: selectedMessage.message_body + '\n\n--- Admin Reply ---\n' + message.trim(),
        status: 'in_progress'
      });
      setMessage('');
      setSuccessMessage('Reply sent successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send reply');
      setTimeout(() => setError(''), 3000);
    } finally {
      setSubmitting(false);
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

  if (loading || loadingMessages) {
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

  if (!user || !['admin', 'owner'].includes(user.role)) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-neon mb-2">
              Support Inbox
            </h1>
            <p className="text-secondary">
              Manage and respond to support tickets
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

          {/* Filter */}
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="px-4 py-2 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
            >
              <option value="all">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Messages List */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-white mb-4">Messages</h2>
              {filteredMessages.length === 0 ? (
                <div className="text-secondary text-center py-8">
                  No support messages found
                </div>
              ) : (
                filteredMessages.map((msg) => (
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
                        <h3 className="text-white font-medium">{msg.subject}</h3>
                        <p className="text-sm text-secondary">
                          From: {msg.sender_username} ({msg.sender_role})
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(msg.status)}`}>
                          {msg.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-400">
                      {new Date(msg.created_at).toLocaleDateString()} {new Date(msg.created_at).toLocaleTimeString()}
                    </p>
                    {msg.handler_username && (
                      <p className="text-sm text-secondary mt-1">
                        Handled by: {msg.handler_username}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Message Detail */}
            <div>
              {selectedMessage ? (
                <div>
                  <h2 className="text-xl font-semibold text-white mb-4">Message Details</h2>
                  <div className="bg-secondary border border-gray-700 rounded-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium text-white mb-2">{selectedMessage.subject}</h3>
                      <div className="flex items-center gap-4 text-sm text-secondary mb-4">
                        <span>From: {selectedMessage.sender_username} ({selectedMessage.sender_role})</span>
                      </div>
                      <div className="text-sm text-gray-400 mb-4">
                        Created: {new Date(selectedMessage.created_at).toLocaleDateString()} {new Date(selectedMessage.created_at).toLocaleTimeString()}
                      </div>
                    </div>

                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-secondary mb-2">Message:</h4>
                      <div className="bg-black/50 rounded-lg p-4">
                        <pre className="text-sm text-white whitespace-pre-wrap font-sans">
                          {selectedMessage.message_body}
                        </pre>
                      </div>
                    </div>

                    {/* Status Actions */}
                    <div className="mb-6">
                      <h4 className="text-sm font-medium text-secondary mb-2">Status:</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleStatusUpdate('open')}
                          disabled={selectedMessage.status === 'open'}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            selectedMessage.status === 'open'
                              ? 'bg-red-900/50 text-red-400'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          Open
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('in_progress')}
                          disabled={selectedMessage.status === 'in_progress'}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            selectedMessage.status === 'in_progress'
                              ? 'bg-yellow-900/50 text-yellow-400'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          In Progress
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('resolved')}
                          disabled={selectedMessage.status === 'resolved'}
                          className={`px-3 py-1 rounded text-sm font-medium ${
                            selectedMessage.status === 'resolved'
                              ? 'bg-green-900/50 text-green-400'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          Resolved
                        </button>
                      </div>
                    </div>

                    {/* Reply Section */}
                    <div>
                      <h4 className="text-sm font-medium text-secondary mb-2">Reply:</h4>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={4}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white resize-none"
                        placeholder="Type your reply here..."
                      />
                      <button
                        onClick={handleReply}
                        disabled={submitting || !message.trim()}
                        className="mt-2 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-secondary py-12">
                  Select a message to view details
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
