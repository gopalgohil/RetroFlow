'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=projects');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Redirecting to My Projects...</span>
      </div>
    </div>
  );
}
