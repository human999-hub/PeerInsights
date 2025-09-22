import Link from 'next/link';

export default function Home() {
  return (
    // bg-gray-50
    <main className="min-h-screen flex flex-col justify-center items-center px-6 py-10 font-figtree">
      <div className="max-w-xl text-center p-8 glass-card-orange">
        <h1 className="text-4xl font-bold text-primary mb-4">
          Welcome to PeerInsights
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          View/Create Classes:
        </p>
        <Link
          href="/classes"
          className="button-primary"
        >
          Classes
        </Link>
        <p className="text-gray-700 text-lg mb-6">
          Click below to evaluate your team members:
        </p>
        <Link
          href="/evaluation"
          className="button-primary"
        >
          Go to Evaluation Form
        </Link>
      </div>
    </main>
  );
}
