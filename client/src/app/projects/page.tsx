'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard?tab=projects');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#08090a] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 text-sm font-medium">
        <div className="w-5 h-5 border-2 border-[#88c958] border-t-transparent rounded-full animate-spin" />
        <span>Redirecting to My Projects...</span>
      </div>
    </div>
  );
}
