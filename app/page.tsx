import Header from '@/components/Header';
import { createClient } from '@/lib/supabase/server';
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
  is_published: boolean;
  is_featured: boolean;
  featured_rank: number | null;
}

export default async function Home() {
  const supabase = await createClient();

  // Fetch only 2 featured events
  const { data: featuredEvents } = await supabase
    .from('events')
    .select('*')
    .eq('is_published', true)
    .eq('is_featured', true)
    .order('featured_rank', { ascending: true })
    .limit(2);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const EventCard = ({ event }: { event: Event }) => (
    <div className="card-neon glow-neon-hover group h-full flex flex-col">
      <div className="space-y-4 flex-1 flex flex-col">
        {/* Placeholder Image - Now flexible to fill remaining space */}
        <div className="w-full flex-1 min-h-0 bg-secondary rounded-lg flex items-center justify-center">
          <svg className="w-16 h-16 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        
        <div>
          <h3 className="text-xl font-bold text-primary-neon mb-2">
            {event.name}
          </h3>
          <div className="flex items-center space-x-4 text-sm text-secondary">
            <span>{formatDate(event.date)}</span>
            <span>{formatTime(event.start_time)}</span>
            <span>{event.city}</span>
          </div>
        </div>
        
        <div className="text-base text-secondary line-clamp-3">
          {event.description || 'Join us for an amazing event!'}
        </div>
        
        <div className="text-sm text-secondary">
          <div className="font-medium text-primary">{event.venue_name}</div>
          <div>{event.venue_address}</div>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            href={`/events/${event.id}`}
            className="btn-primary flex-1 text-center"
          >
            View event
          </Link>
          <Link 
            href={`/checkout/${event.id}`}
            className="btn-primary flex-1 text-center bg-accent hover:bg-primary-neon"
          >
            Purchase tickets
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <main className="px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-4rem)]">
        {/* Featured Events Section */}
        {featuredEvents && featuredEvents.length > 0 && (
          <section className="h-full">
            <div className="grid md:grid-cols-2 gap-8 h-full">
              {featuredEvents.map(event => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
