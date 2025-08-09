import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-6 py-10 font-[Arial]">
      <div className="max-w-xl text-center bg-white p-8 rounded shadow-md">
        <h1 className="text-4xl font-bold text-[#861f41] mb-4">
          Welcome to PeerInsights
        </h1>
        <p className="text-gray-700 text-lg mb-6">
          Click below to evaluate your team members:
        </p>
        <Link
          href="/evaluation"
          className="inline-block px-5 py-2 bg-[#861f41] text-white rounded hover:bg-[#731a37] transition"
        >
          Go to Evaluation Form
        </Link>
      </div>
    </main>
  );
}
