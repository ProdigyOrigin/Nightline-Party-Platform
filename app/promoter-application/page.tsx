'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase/client';

export default function PromoterApplicationPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    instagram: '',
    message: '',
    expected_attendees: '',
    experience: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/promoter-application');
        return;
      }
      if (user.role !== 'user') {
        router.push('/');
        return;
      }
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);

    try {
      const supabase = createClient();
      
      // Create the application message
      const applicationMessage = `
Promoter Application Details:
Name: ${formData.name.trim()}
Instagram: ${formData.instagram.trim()}
Expected Attendees per Event: ${formData.expected_attendees.trim()}
Experience: ${formData.experience.trim()}
Message: ${formData.message.trim()}

Applicant Username: ${user.username}
Applicant Email: ${user.email || 'Not provided'}
Applicant Phone: ${user.phone || 'Not provided'}
Application Date: ${new Date().toLocaleDateString()}
      `.trim();

      const { error } = await supabase
        .from('support_messages')
        .insert({
          sender_user_id: user.id,
          subject: 'Promoter Application',
          message_body: applicationMessage,
          status: 'open'
        });

      if (error) throw error;

      setSuccessMessage('Your promoter application has been submitted successfully! We will review it and get back to you soon.');
      setFormData({
        name: '',
        instagram: '',
        message: '',
        expected_attendees: '',
        experience: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to submit promoter application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  if (!user || user.role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="card-neon">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-neon mb-2">
              Promoter Application
            </h1>
            <p className="text-secondary">
              Want to promote events on Nightline? Fill out the application below and our team will review it.
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2 text-secondary">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                  required
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label htmlFor="instagram" className="block text-sm font-medium mb-2 text-secondary">
                  Instagram Handle *
                </label>
                <input
                  type="text"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                  required
                  placeholder="@yourinstagram"
                />
              </div>
            </div>

            <div>
              <label htmlFor="expected_attendees" className="block text-sm font-medium mb-2 text-secondary">
                How many people can you bring to an event? *
              </label>
              <input
                type="text"
                id="expected_attendees"
                name="expected_attendees"
                value={formData.expected_attendees}
                onChange={handleInputChange}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white"
                required
                placeholder="e.g., 50-100 people, 100+ people, etc."
              />
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium mb-2 text-secondary">
                  Previous Promoting Experience *
              </label>
              <textarea
                id="experience"
                name="experience"
                value={formData.experience}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white resize-none"
                required
                placeholder="Tell us about your previous experience promoting events, parties, or any relevant activities..."
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium mb-2 text-secondary">
                Why do you want to be a promoter for Nightline? *
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                rows={6}
                className="w-full px-4 py-3 bg-secondary border border-gray-700 rounded-lg focus:outline-none focus:border-primary-neon text-white resize-none"
                required
                placeholder="Tell us why you'd be a great fit for our team and what makes you excited about promoting events..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Submitting Application...' : 'Submit Promoter Application'}
            </button>
          </form>

          <div className="mt-12 p-6 bg-secondary rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">What Happens Next?</h2>
            <div className="space-y-3 text-sm text-secondary">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-neon rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black font-bold text-xs">1</span>
                </div>
                <p>Our team will review your application within 3-5 business days</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-neon rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black font-bold text-xs">2</span>
                </div>
                <p>If approved, we'll contact you via email or phone to discuss next steps</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary-neon rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-black font-bold text-xs">3</span>
                </div>
                <p>Once onboarded, you'll get access to create and promote events on Nightline</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
