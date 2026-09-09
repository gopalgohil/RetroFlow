'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectDataService } from '@/services/mockProjectData';

export default function ProjectsIndexPage() {
  const router = useRouter();

  useEffect(() => {
    const activeId =
      typeof window !== 'undefined'
        ? localStorage.getItem('retroflow_active_project_id')
        : null;

    if (activeId) {
      router.replace(`/projects/${activeId}`);
    } else {
      const projects = ProjectDataService.getProjects();
      const firstId = projects[0]?.id || 'proj-pgi';
      router.replace(`/projects/${firstId}`);
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
        <div className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Redirecting to active project...</span>
      </div>
    </div>
  );
}
