import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    
      <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-4xl font-bold text-gray-900 text-center">
        Are you overpaying for AI tools?
      </h1>
      <p className="text-gray-500 mt-4 text-center max-w-md">
        Get a free audit in 2 minutes. See exactly where your team is wasting money.
      </p>
      <Link
        href="/audit"
        className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
      >
        Start free audit →
      </Link>
    </main>
    
  );
}
