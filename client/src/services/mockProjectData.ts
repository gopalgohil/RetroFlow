/**
 * @file mockProjectData.ts
 * @description Production-ready Data Service for RetroFlow Pro
 * High cohesion, single responsibility data store strictly for Payment Gateway Integration
 */

import { Project, Sprint, BacklogItem, ProjectRetroLink, CreateProjectPayload } from '@/types/project';

// v3 storage key guarantees clean migration in browser without stale dummy projects
const STORAGE_KEY = 'retroflow_projects_store_v3';

export const MOCK_PROJECT_LEADS = [
  { id: 'lead-1', name: 'Gopal', email: 'gopalgohel249@gmail.com', role: 'Manager' as const, avatar: 'G' },
];

/**
 * Single Canonical Dynamic Project: Retro (RET)
 */
export const INITIAL_PROJECTS: Project[] = [
  {
    id: '6aa29fac0ae6747bfed5307f',
    name: 'Retro',
    key: 'RET',
    description: 'Dynamic agile workspace for sprint retrospectives and team delivery.',
    type: 'scrum',
    healthStatus: 'on_track',
    cadence: '2_weeks',
    lead: {
      id: '6a9ff515f6ed7508f5b2088b',
      name: 'jaynit',
      email: 'drakpatel2004@gmail.com',
      avatar: 'J',
    },
    members: [
      { id: 'm-1', name: 'jaynit', email: 'drakpatel2004@gmail.com', role: 'Manager', avatar: 'J', joinedAt: '2026-06-01' },
      { id: 'm-2', name: 'sharad', email: 'gopalg@internal.digiflux.io', role: 'Developer', avatar: 'S', joinedAt: '2026-06-01' },
    ],
    velocityHistory: [
      { sprintName: 'Sprint 1', committedPoints: 30, completedPoints: 28 },
    ],
    retrospectives: [
      {
        id: 'retro-ret-1',
        shareToken: '5f4c7f80-d15',
        title: 'Retro - Sprint 1 Retrospective',
        scheduledDate: '2026-09-08',
        status: 'active',
        sprintName: 'Sprint 1',
        topicsCount: 3,
        cardsCount: 5,
        actionItemsCount: 2,
        actionItemsExported: false,
      },
    ],
    sprints: [
      {
        id: 'sprint-1',
        projectId: '6aa29fac0ae6747bfed5307f',
        name: 'Sprint 1 - Launch & Foundation',
        number: 1,
        status: 'active',
        startDate: '2026-09-01',
        endDate: '2026-09-15',
        goal: 'Establish core platform workflows and automated retro synchronization.',
        daysLeft: 4,
        totalStoryPoints: 20,
        completedStoryPoints: 12,
        openBlockers: 0,
        items: [],
      },
    ],
    createdAt: '2026-09-01',
    updatedAt: '2026-09-11',
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
