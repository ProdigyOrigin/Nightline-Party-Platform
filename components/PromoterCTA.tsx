import Link from 'next/link';

export default function PromoterCTA() {
  return (
    <section className="mt-16 text-center">
      <div className="card-neon max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold text-primary-neon mb-4">
          Want to promote your event?
        </h2>
        <p className="text-secondary mb-6">
          Join Nightline as a promoter and reach thousands of students across California.
        </p>
        <Link href="/signup" className="btn-primary">
          Sign Up to Get Started
        </Link>
      </div>
    </section>
  );
}
