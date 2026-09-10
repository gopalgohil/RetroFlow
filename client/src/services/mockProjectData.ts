/**
 * @file mockProjectData.ts
 * @description Production-ready Data Service for RetroFlow Pro
 * High cohesion, single responsibility data store strictly for Payment Gateway Integration
 */

import { Project, Sprint, BacklogItem, ProjectRetroLink, CreateProjectPayload } from '@/types/project';

// v2 storage key guarantees clean migration in browser without stale dummy projects
const STORAGE_KEY = 'retroflow_projects_store_v2';

export const MOCK_PROJECT_LEADS = [
  { id: 'lead-1', name: 'Gopal Gohel', email: 'gopalgohel249@gmail.com', role: 'Manager' as const, avatar: 'GG' },
  { id: 'lead-2', name: 'Sarah Jenkins', email: 'sarah.j@retroflow.io', role: 'Manager' as const, avatar: 'SJ' },
  { id: 'lead-3', name: 'Alex Rivera', email: 'alex.r@retroflow.io', role: 'Manager' as const, avatar: 'AR' },
];

/**
 * Single Canonical Project: Payment Gateway Integration (PGI)
 */
export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj-pgi',
    name: 'Payment Gateway Integration',
    key: 'PGI',
    description: 'Enterprise Stripe 3DS V2, multi-currency settlement, webhook idempotency, and automated retry pipelines.',
    type: 'scrum',
    healthStatus: 'on_track',
    cadence: '2_weeks',
    lead: {
      id: 'lead-1',
      name: 'Gopal Gohel',
      email: 'gopalgohel249@gmail.com',
      avatar: 'GG',
    },
    members: [
      { id: 'm-1', name: 'Gopal Gohel', email: 'gopalgohel249@gmail.com', role: 'Manager', avatar: 'GG', joinedAt: '2026-06-01' },
      { id: 'm-2', name: 'Sarah Jenkins', email: 'sarah.j@retroflow.io', role: 'Developer', avatar: 'SJ', joinedAt: '2026-06-05' },
      { id: 'm-3', name: 'Marcus Chen', email: 'marcus.c@retroflow.io', role: 'Developer', avatar: 'MC', joinedAt: '2026-06-12' },
      { id: 'm-4', name: 'Priya Sharma', email: 'priya.s@retroflow.io', role: 'QA', avatar: 'PS', joinedAt: '2026-06-15' },
      { id: 'm-5', name: 'David Miller', email: 'david.m@retroflow.io', role: 'Viewer', avatar: 'DM', joinedAt: '2026-07-01' },
    ],
    velocityHistory: [
      { sprintName: 'Sprint 10', committedPoints: 35, completedPoints: 34 },
      { sprintName: 'Sprint 11', committedPoints: 38, completedPoints: 38 },
      { sprintName: 'Sprint 12', committedPoints: 40, completedPoints: 36 },
      { sprintName: 'Sprint 13', committedPoints: 42, completedPoints: 40 },
      { sprintName: 'Sprint 14', committedPoints: 42, completedPoints: 34 },
    ],
    retrospectives: [
      {
        id: 'retro-pgi-1',
        shareToken: 'retro-pgi-14',
        title: 'Sprint 14 Mid-Cycle Sync',
        scheduledDate: '2026-09-08',
        status: 'active',
        sprintName: 'Sprint 14 (Active)',
        topicsCount: 4,
        cardsCount: 18,
        actionItemsCount: 4,
        actionItemsExported: false,
      },
      {
        id: 'retro-pgi-2',
        shareToken: 'retro-pgi-13',
        title: 'Sprint 13 Retro: Stripe 3DS V2',
        scheduledDate: '2026-08-26',
        status: 'completed',
        sprintName: 'Sprint 13',
        topicsCount: 3,
        cardsCount: 26,
        actionItemsCount: 5,
        actionItemsExported: true,
      },
      {
        id: 'retro-pgi-3',
        shareToken: 'retro-pgi-12',
        title: 'Sprint 12 Post-Mortem & Flow',
        scheduledDate: '2026-08-12',
        status: 'completed',
        sprintName: 'Sprint 12',
        topicsCount: 4,
        cardsCount: 22,
        actionItemsCount: 3,
        actionItemsExported: true,
      },
    ],
    sprints: [
      {
        id: 'sprint-14',
        projectId: 'proj-pgi',
        name: 'Sprint 14 - Webhook Resilience & Failover',
        number: 14,
        status: 'active',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        goal: 'Harden Stripe webhook callback queue and reach 99.99% idempotency on dual-charge retries.',
        daysLeft: 4,
        totalStoryPoints: 42,
        completedStoryPoints: 34,
        openBlockers: 1,
        items: [
          {
            id: 'item-101',
            projectId: 'proj-pgi',
            sprintId: 'sprint-14',
            title: 'Implement exponential backoff on stripe 500 responses',
            type: 'story',
            priority: 'high',
            status: 'done',
            storyPoints: 5,
            assignee: { name: 'Sarah Jenkins', avatar: 'SJ' },
            createdAt: '2026-09-02',
          },
          {
            id: 'item-102',
            projectId: 'proj-pgi',
            sprintId: 'sprint-14',
            title: 'Stripe webhook signature validation failing on staging proxy',
            type: 'bug',
            priority: 'critical',
            status: 'in_progress',
            storyPoints: 8,
            assignee: { name: 'Marcus Chen', avatar: 'MC' },
            createdAt: '2026-09-04',
          },
          {
            id: 'item-103',
            projectId: 'proj-pgi',
            sprintId: 'sprint-14',
            title: 'Add automated integration tests for 3DS challenge flow',
            type: 'task',
            priority: 'medium',
            status: 'todo',
            storyPoints: 5,
            assignee: { name: 'Priya Sharma', avatar: 'PS' },
            createdAt: '2026-09-05',
          },
        ],
      },
      {
        id: 'sprint-15',
        projectId: 'proj-pgi',
        name: 'Sprint 15 - Multi-Currency Settlement',
        number: 15,
        status: 'upcoming',
        startDate: '2026-09-16',
        endDate: '2026-09-30',
        goal: 'Enable EUR and GBP settlement pipelines with automated daily exchange rate caching.',
        daysLeft: 19,
        totalStoryPoints: 38,
        completedStoryPoints: 0,
        openBlockers: 0,
        items: [
          {
            id: 'item-201',
            projectId: 'proj-pgi',
            sprintId: 'sprint-15',
            title: 'ECB daily rate sync worker cron setup',
            type: 'story',
            priority: 'high',
            status: 'todo',
            storyPoints: 8,
            assignee: { name: 'Marcus Chen', avatar: 'MC' },
            createdAt: '2026-09-07',
          },
          {
            id: 'item-202',
            projectId: 'proj-pgi',
            sprintId: 'sprint-15',
            title: 'Settlement reconciliation audit log view',
            type: 'story',
            priority: 'medium',
            status: 'todo',
            storyPoints: 5,
            assignee: { name: 'Sarah Jenkins', avatar: 'SJ' },
            createdAt: '2026-09-07',
          },
        ],
      },
      {
        id: 'sprint-13',
        projectId: 'proj-pgi',
        name: 'Sprint 13 - Stripe 3DS V2 Rollout',
        number: 13,
        status: 'completed',
        startDate: '2026-08-16',
        endDate: '2026-08-31',
        goal: 'Deliver compliant 3DS V2 checkout friction reduction across EU customers.',
        daysLeft: 0,
        totalStoryPoints: 40,
        completedStoryPoints: 40,
        openBlockers: 0,
        items: [
          {
            id: 'item-091',
            projectId: 'proj-pgi',
            sprintId: 'sprint-13',
            title: 'Client modal fallback for legacy browser non-iframe 3DS',
            type: 'story',
            priority: 'medium',
            status: 'done',
            storyPoints: 5,
            createdAt: '2026-08-20',
          },
        ],
      },
    ],
    createdAt: '2026-06-01',
    updatedAt: '2026-09-08',
  },
];

/**
 * Service to manage project state with localStorage persistence
 */
export class ProjectDataService {
  private static getStoredProjects(): Project[] {
    if (typeof window === 'undefined') return INITIAL_PROJECTS;
    try {
      // Clean up legacy v1 key if present
      localStorage.removeItem('retroflow_projects_store');

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_PROJECTS));
        return INITIAL_PROJECTS;
      }
      return parsed;
    } catch {
      return INITIAL_PROJECTS;
    }
  }

  private static saveProjects(projects: Project[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (err) {
      console.error('[ProjectService] Failed to save projects:', err);
    }
  }

  public static getProjects(): Project[] {
    const projects = this.getStoredProjects();
    return projects.map((p) => ({
      ...p,
      activeSprint: p.sprints.find((s) => s.status === 'active') || p.sprints[0],
    }));
  }

  public static getProjectById(id: string): Project | null {
    const projects = this.getProjects();
    return (
      projects.find((p) => p.id === id || p.key.toLowerCase() === id.toLowerCase()) ||
      projects[0] ||
      null
    );
  }

  public static createProject(payload: CreateProjectPayload): Project {
    const projects = this.getStoredProjects();
    const leadUser =
      MOCK_PROJECT_LEADS.find((l) => l.id === payload.leadId) || MOCK_PROJECT_LEADS[0];

    const initialSprint: Sprint = {
      id: `sprint-${Date.now()}`,
      projectId: `proj-${payload.key.toLowerCase()}`,
      name: `Sprint 1 - Foundation & Kickoff`,
      number: 1,
      status: 'active',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      goal: `Kickoff sprint for ${payload.name} deliverables.`,
      daysLeft: payload.cadence === '1_week' ? 7 : payload.cadence === '3_weeks' ? 21 : 14,
      totalStoryPoints: 20,
      completedStoryPoints: 0,
      openBlockers: 0,
      items: [],
    };

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: payload.name.trim(),
      key: payload.key.toUpperCase().trim(),
      description: payload.description?.trim(),
      type: payload.type,
      healthStatus: 'on_track',
      cadence: payload.cadence,
      customCadenceDays: payload.customCadenceDays,
      lead: {
        id: leadUser.id,
        name: leadUser.name,
        email: leadUser.email,
        avatar: leadUser.avatar,
      },
      members: [
        {
          id: `m-lead-${Date.now()}`,
          name: leadUser.name,
          email: leadUser.email,
          role: 'Manager',
          avatar: leadUser.avatar,
          joinedAt: new Date().toISOString(),
        },
        ...payload.members.map((m, idx) => ({
          id: `m-${Date.now()}-${idx}`,
          name: m.name,
          email: m.email,
          role: m.role,
          avatar: m.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2),
          joinedAt: new Date().toISOString(),
        })),
      ],
      sprints: [initialSprint],
      activeSprint: initialSprint,
      retrospectives: [],
      velocityHistory: [
        { sprintName: 'Sprint 1', committedPoints: 20, completedPoints: 0 },
      ],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };

    projects.unshift(newProject);
    this.saveProjects(projects);
    return newProject;
  }

  public static startSprint(projectId: string, sprintId: string): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        return { ...s, status: 'active', daysLeft: 14 };
      }
      if (s.status === 'active') {
        return { ...s, status: 'completed', daysLeft: 0 };
      }
      return s;
    });

    project.updatedAt = new Date().toISOString().split('T')[0];
    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static completeSprint(projectId: string, sprintId: string): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        return {
          ...s,
          status: 'completed',
          daysLeft: 0,
          completedStoryPoints: s.totalStoryPoints,
        };
      }
      return s;
    });

    project.updatedAt = new Date().toISOString().split('T')[0];
    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static updateSprintItemStatus(
    projectId: string,
    sprintId: string,
    itemId: string,
    status: 'todo' | 'in_progress' | 'done'
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        const updatedItems = s.items.map((i) => (i.id === itemId ? { ...i, status } : i));
        const completedStoryPoints = updatedItems
          .filter((i) => i.status === 'done')
          .reduce((acc, i) => acc + (i.storyPoints || 0), 0);

        return {
          ...s,
          items: updatedItems,
          completedStoryPoints,
        };
      }
      return s;
    });

    project.updatedAt = new Date().toISOString().split('T')[0];
    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static updateSprintDates(
    projectId: string,
    sprintId: string,
    payload: { startDate: string; endDate: string; goal?: string; name?: string }
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    const startMs = new Date(payload.startDate).getTime();
    const endMs = new Date(payload.endDate).getTime();
    if (isNaN(startMs) || isNaN(endMs) || endMs < startMs) {
      throw new Error('Ending date cannot be earlier than starting date');
    }

    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        const endMs = new Date(payload.endDate).getTime();
        const diffDays = Math.ceil((endMs - Date.now()) / 86400000);
        return {
          ...s,
          startDate: payload.startDate,
          endDate: payload.endDate,
          daysLeft: Math.max(0, diffDays),
          goal: payload.goal !== undefined ? payload.goal : s.goal,
          name: payload.name !== undefined ? payload.name : s.name,
        };
      }
      return s;
    });

    project.updatedAt = new Date().toISOString().split('T')[0];
    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static addMember(
    projectId: string,
    member: { name: string; email: string; role: Project['members'][0]['role'] }
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.members.push({
      id: `m-${Date.now()}`,
      name: member.name,
      email: member.email,
      role: member.role,
      avatar: member.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2),
      joinedAt: new Date().toISOString(),
    });

    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static removeMember(projectId: string, memberId: string): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.members = project.members.filter((m) => m.id !== memberId && m.email !== memberId);
    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static exportActionItemsToSprint(
    projectId: string,
    targetSprintId: string,
    items: Array<{ title: string; description?: string; sourceRetroId?: string; sourceRetroTitle?: string }>
  ): { success: boolean; addedCount: number } {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return { success: false, addedCount: 0 };

    const project = projects[projIndex];
    const sprint = project.sprints.find((s) => s.id === targetSprintId) || project.sprints[0];
    if (!sprint) return { success: false, addedCount: 0 };

    const newBacklogItems: BacklogItem[] = items.map((item, idx) => ({
      id: `act-item-${Date.now()}-${idx}`,
      projectId: project.id,
      sprintId: sprint.id,
      title: item.title,
      description: item.description,
      type: 'action_item',
      priority: 'high',
      status: 'todo',
      storyPoints: 3,
      sourceRetroId: item.sourceRetroId,
      sourceRetroTitle: item.sourceRetroTitle || 'Sprint Retrospective',
      createdAt: new Date().toISOString().split('T')[0],
    }));

    sprint.items = [...(sprint.items || []), ...newBacklogItems];
    sprint.totalStoryPoints += newBacklogItems.reduce(
      (acc, curr) => acc + (curr.storyPoints || 0),
      0
    );

    if (items[0]?.sourceRetroId) {
      project.retrospectives = project.retrospectives.map((r) =>
        r.id === items[0].sourceRetroId || r.shareToken === items[0].sourceRetroId
          ? { ...r, actionItemsExported: true }
          : r
      );
    }

    projects[projIndex] = project;
    this.saveProjects(projects);
    return { success: true, addedCount: newBacklogItems.length };
  }

  public static deleteProjectRetro(projectId: string, retroId: string): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.retrospectives = (project.retrospectives || []).filter(
      (r) => r.id !== retroId && r.shareToken !== retroId
    );

    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }

  public static updateProjectRetro(
    projectId: string,
    retroId: string,
    payload: { title?: string; scheduledDate?: string; sprintName?: string }
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.retrospectives = (project.retrospectives || []).map((r) => {
      if (r.id === retroId || r.shareToken === retroId) {
        return {
          ...r,
          ...(payload.title ? { title: payload.title } : {}),
          ...(payload.scheduledDate ? { scheduledDate: payload.scheduledDate } : {}),
          ...(payload.sprintName ? { sprintName: payload.sprintName } : {}),
        };
      }
      return r;
    });

    projects[projIndex] = project;
    this.saveProjects(projects);
    return project;
  }
}
