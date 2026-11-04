
import { Project, Sprint, BacklogItem, ProjectRetroLink, CreateProjectPayload } from '@/types/project';

const STORAGE_KEY = 'retroflow_projects_store_v3';

export const MOCK_PROJECT_LEADS = [
  { id: 'lead-1', name: 'Project Lead', email: 'lead@retroflow.io', role: 'Manager' as const, avatar: 'PL' },
];

export const INITIAL_PROJECTS: Project[] = [];

export class ProjectDataService {
  private static getStoredProjects(): Project[] {
    if (typeof window === 'undefined') return [];
    try {
      localStorage.removeItem('retroflow_projects_store');
      localStorage.removeItem('retroflow_projects_store_v2');
      localStorage.removeItem('retroflow_projects_store_v3');
      localStorage.removeItem('retroflow_cached_project_6aa29fac0ae6747bfed5307f');
      localStorage.removeItem('retroflow_cached_project_RET');

      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
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
      activeSprint: (p.sprints || []).find((s) => s.status === 'active') || (p.sprints || [])[0] || undefined,
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
      sprints: [],
      activeSprint: undefined,
      retrospectives: [],
      velocityHistory: [],
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
    const targetSprint = project.sprints.find((s) => s.id === sprintId);
    const targetNum = targetSprint?.number || 1;

    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        return { ...s, status: 'active' as const, daysLeft: 14 };
      }
      if (s.status === 'active') {
        if ((s.number || 0) > targetNum) {
          return { ...s, status: 'upcoming' as const };
        }
        return { ...s, status: 'completed' as const, daysLeft: 0 };
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
    let completedSprint: Sprint | null = null;

    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        const done = (s.items || []).filter((i) => i.status === 'done');
        completedSprint = { ...s };
        const donePoints = done.reduce((acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3), 0);
        return {
          ...s,
          items: done,
          status: 'completed' as const,
          daysLeft: 0,
          totalStoryPoints: donePoints,
          completedStoryPoints: donePoints,
        };
      }
      return s;
    });

    if (!completedSprint) return null;

    const incompleteItems = ((completedSprint as Sprint).items || []).filter((i) => i.status !== 'done');

    // Calculate next month dates (1st of next month to last day of next month)
    const ref = (completedSprint as Sprint).endDate ? new Date((completedSprint as Sprint).endDate) : new Date();
    const nextStart = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth() + 1, 1));
    const nextEnd = new Date(Date.UTC(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, 0));
    const totalDays = Math.max(1, Math.ceil((nextEnd.getTime() - nextStart.getTime()) / 86400000));
    const now = new Date();
    const rawDiff = Math.ceil((nextEnd.getTime() - now.getTime()) / 86400000);
    const daysLeft = Math.max(1, Math.min(totalDays, rawDiff));
    const nextStartDate = nextStart.toISOString().split('T')[0];
    const nextEndDate = nextEnd.toISOString().split('T')[0];

    const nextNum = ((completedSprint as Sprint).number || 0) + 1;
    let nextSprint = project.sprints.find((s) => s.number === nextNum && s.id !== (completedSprint as Sprint).id) ||
                     project.sprints.find((s) => s.status === 'upcoming');

    if (nextSprint) {
      nextSprint.status = 'active';
      nextSprint.startDate = nextSprint.startDate || nextStartDate;
      nextSprint.endDate = nextSprint.endDate || nextEndDate;
      nextSprint.daysLeft = daysLeft;
    } else {
      nextSprint = {
        id: `sprint-${Date.now()}`,
        projectId: project.id,
        name: `Sprint ${nextNum} - Execution & Backlog`,
        number: nextNum,
        status: 'active' as const,
        startDate: nextStartDate,
        endDate: nextEndDate,
        goal: `Sprint ${nextNum} deliverables and retrospective action items.`,
        daysLeft,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        openBlockers: 0,
        items: [],
      };
      project.sprints.push(nextSprint);
    }

    if (incompleteItems.length > 0) {
      const existingIds = new Set((nextSprint.items || []).map((it) => it.id));
      const rolledOver = incompleteItems
        .filter((item) => !existingIds.has(item.id))
        .map((item) => ({
          ...item,
          sprintId: nextSprint!.id,
          dueDate: nextSprint!.endDate || item.dueDate,
        }));
      nextSprint.items = [...(nextSprint.items || []), ...rolledOver];
    }

    nextSprint.totalStoryPoints = (nextSprint.items || []).reduce(
      (acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3),
      0
    );
    nextSprint.completedStoryPoints = (nextSprint.items || [])
      .filter((i) => i.status === 'done')
      .reduce((acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3), 0);

    // Deduplicate any sprints with identical numbers
    const seenNums = new Set<number>();
    project.sprints = project.sprints.filter((s) => {
      if (!s.number) return true;
      if (seenNums.has(s.number)) return false;
      seenNums.add(s.number);
      return true;
    });

    project.activeSprint = nextSprint;
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

  public static deleteSprintItem(
    projectId: string,
    sprintId: string,
    itemId: string
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.sprints = project.sprints.map((s) => {
      if (s.id === sprintId) {
        const updatedItems = s.items.filter((i) => i.id !== itemId);
        const totalStoryPoints = updatedItems.reduce(
          (acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3),
          0
        );
        const completedStoryPoints = updatedItems
          .filter((i) => i.status === 'done')
          .reduce((acc, i) => acc + (typeof i.storyPoints === 'number' ? i.storyPoints : 3), 0);

        return {
          ...s,
          items: updatedItems,
          totalStoryPoints,
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

  public static deleteSprint(
    projectId: string,
    sprintId: string
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    project.sprints = (project.sprints || []).filter((s) => s.id !== sprintId);

    if (!project.sprints.some((s) => s.status === 'active')) {
      const nextUpcoming = project.sprints.find((s) => s.status === 'upcoming');
      if (nextUpcoming) {
        nextUpcoming.status = 'active';
      }
    }

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
        const cappedItems = (s.items || []).map((item) => {
          if (item.dueDate) {
            const itemDueMs = new Date(item.dueDate).getTime();
            if (!isNaN(itemDueMs) && itemDueMs > endMs) {
              return { ...item, dueDate: payload.endDate };
            }
          }
          return item;
        });

        return {
          ...s,
          startDate: payload.startDate,
          endDate: payload.endDate,
          daysLeft: Math.max(0, diffDays),
          goal: payload.goal !== undefined ? payload.goal : s.goal,
          name: payload.name !== undefined ? payload.name : s.name,
          items: cappedItems,
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

  public static updateMemberRole(
    projectId: string,
    memberIdOrEmail: string,
    role: Project['members'][0]['role']
  ): Project | null {
    const projects = this.getStoredProjects();
    const projIndex = projects.findIndex((p) => p.id === projectId);
    if (projIndex === -1) return null;

    const project = projects[projIndex];
    const member = project.members.find(
      (m) => m.id === memberIdOrEmail || m.email.toLowerCase() === memberIdOrEmail.toLowerCase()
    );
    if (member) {
      member.role = role;
      projects[projIndex] = project;
      this.saveProjects(projects);
    }
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
    let sprint = project.sprints.find((s) => s.id === targetSprintId);
    if (!sprint) {
      sprint = project.sprints.find((s) => s.status === 'upcoming') ||
               project.sprints.find((s) => s.status === 'active') ||
               project.sprints[0];
    }
    if (!sprint) {
      const now = new Date();
      const nextStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
      const nextEnd = new Date(Date.UTC(nextStart.getUTCFullYear(), nextStart.getUTCMonth() + 1, 0));
      const totalDays = Math.max(1, Math.ceil((nextEnd.getTime() - nextStart.getTime()) / 86400000));
      const rawDiff = Math.ceil((nextEnd.getTime() - now.getTime()) / 86400000);
      const daysLeft = Math.max(1, Math.min(totalDays, rawDiff));
      const nextNum = (project.sprints.length || 0) + 1;
      sprint = {
        id: `sprint-${Date.now()}`,
        projectId: project.id,
        name: `Sprint ${nextNum} - Execution & Backlog`,
        number: nextNum,
        status: 'active',
        startDate: nextStart.toISOString().split('T')[0],
        endDate: nextEnd.toISOString().split('T')[0],
        goal: `Sprint ${nextNum} deliverables and retrospective action items.`,
        daysLeft,
        totalStoryPoints: 0,
        completedStoryPoints: 0,
        openBlockers: 0,
        items: [],
      };
      project.sprints.push(sprint);
    }

    const newBacklogItems: BacklogItem[] = items.map((item: any, idx) => ({
      id: `act-item-${Date.now()}-${idx}`,
      projectId: project.id,
      sprintId: sprint.id,
      title: item.title,
      description: item.description,
      type: 'action_item',
      priority: item.priority || 'high',
      status: 'todo',
      storyPoints: typeof item.storyPoints === 'number' ? item.storyPoints : 3,
      assignee: item.assignee,
      givenBy: item.givenBy || project.lead?.name || 'Project Manager',
      dueDate: item.dueDate || sprint.endDate,
      sourceRetroId: item.sourceRetroId,
      sourceRetroTitle: item.sourceRetroTitle || 'Sprint Retrospective',
      createdAt: new Date().toISOString().split('T')[0],
    }));

    sprint.items = [...(sprint.items || []), ...newBacklogItems];
    sprint.totalStoryPoints += newBacklogItems.reduce(
      (acc, curr) => acc + (curr.storyPoints || 0),
      0
    );

    if (sprint.status === 'upcoming') {
      sprint.status = 'active';
      sprint.daysLeft = project.cadence === '1_week' ? 7 : project.cadence === '3_weeks' ? 21 : 14;
    }

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
    payload: { title?: string; scheduledDate?: string; startDate?: string | null; endDate?: string | null; sprintName?: string }
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
          ...(payload.startDate !== undefined ? { startDate: payload.startDate } : {}),
          ...(payload.endDate !== undefined ? { endDate: payload.endDate } : {}),
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
