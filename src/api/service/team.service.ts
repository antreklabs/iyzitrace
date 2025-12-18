import { getPluginSettings, savePluginSettings } from './settings.service';
import { getBackendSrv } from "@grafana/runtime";

export interface Team {
  id: string;
  uid: string;
  name: string;
  icon: string;
  members: number | TeamMember[];
  createdAt: string;
  settings?: TeamSettings;
  pages?: TeamPage[];
}

export interface TeamWithMembers extends Team {
  members: TeamMember[];
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  joinedAt: string;
}

export interface TeamSettings {
  name: string;
  icon: string;
}

export interface AvailableMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface TeamPage {
  id: string;
  name: string;
  route: string;
  description: string;
  icon: string;
  addedAt: string;
}

export interface AvailablePage {
  id: string;
  name: string;
  route: string;
  description: string;
  icon: string;
}

interface TeamPagesSettingsEntry extends TeamPage {
  teamId: string;
}

const PLUGIN_PAGE_CATALOG: AvailablePage[] = [
  {
    id: 'landing',
    name: 'Home',
    route: '/landing',
    description: 'Landing dashboard for quick insights',
    icon: '🏠',
  },
  {
    id: 'overview',
    name: 'Overview',
    route: '/overview',
    description: 'High-level health overview',
    icon: '🧱',
  },
  {
    id: 'views',
    name: 'Views',
    route: '/views',
    description: 'Custom visualizations',
    icon: '🧩',
  },
  {
    id: 'service-map',
    name: 'Service Map',
    route: '/service-map',
    description: 'Visualize service dependencies',
    icon: '🗺️',
  },
  {
    id: 'services',
    name: 'Services',
    route: '/services',
    description: 'Service performance metrics',
    icon: '📊',
  },
  {
    id: 'traces',
    name: 'Traces',
    route: '/traces',
    description: 'Distributed tracing explorer',
    icon: '🔍',
  },
  {
    id: 'logs',
    name: 'Logs',
    route: '/logs',
    description: 'Centralized log analysis',
    icon: '📄',
  },
  {
    id: 'exceptions',
    name: 'Exceptions',
    route: '/exceptions',
    description: 'Error tracking & triage',
    icon: '🧨',
  },
  {
    id: 'ai',
    name: 'AI Assistant',
    route: '/ai',
    description: 'Intelligent observability insights powered by AI',
    icon: '🤖',
  },
  {
    id: 'teams',
    name: 'Teams',
    route: '/teams',
    description: 'Manage teams and members',
    icon: '👥',
  },
  {
    id: 'settings',
    name: 'Settings',
    route: '/settings',
    description: 'Plugin & workspace settings',
    icon: '⚙️',
  },
];

const normaliseTeamPagesSetting = (data: any): TeamPagesSettingsEntry[] => {
  if (!Array.isArray(data)) {
    return [];
  }

  return data
    .map((entry) => ({
      teamId: String(entry?.teamId ?? ''),
      id: String(entry?.id ?? entry?.pageId ?? ''),
      name: entry?.name ?? '',
      route: entry?.route ?? '',
      description: entry?.description ?? '',
      icon: entry?.icon ?? '',
      addedAt: entry?.addedAt ?? new Date().toISOString().split('T')[0],
    }))
    .filter((entry) => entry.teamId && entry.id);
};

export const getStoredTeamPages = async (): Promise<TeamPagesSettingsEntry[]> => {
  try {
    const settings = await getPluginSettings();
    return normaliseTeamPagesSetting(settings?.teamPages);
  } catch (error) {
    return [];
  }
};

const saveTeamPagesToSettings = async (pages: TeamPagesSettingsEntry[]) => {
  try {
    await savePluginSettings({ teamPages: pages });
  } catch (error) {
    throw error;
  }
};

export const getTeamPagesByTeamId = async (teamId: string): Promise<TeamPage[]> => {
  const pages = await getStoredTeamPages();
  return pages
    .filter((page) => page.teamId === teamId)
    .map(({ teamId: _team, ...page }) => page);
};

const addPagesToTeam = async (teamId: string, pageIds: string[]) => {
  if (!teamId || pageIds.length === 0) {
    return;
  }

  const storedPages = await getStoredTeamPages();
  const existingIds = new Set(
    storedPages.filter((page) => page.teamId === teamId).map((page) => page.id)
  );

  const today = new Date().toISOString().split('T')[0];
  const pagesToInsert = PLUGIN_PAGE_CATALOG
    .filter((page) => pageIds.includes(page.id) && !existingIds.has(page.id))
    .map((page) => ({
      teamId,
      id: page.id,
      name: page.name,
      route: page.route,
      description: page.description,
      icon: page.icon,
      addedAt: today,
    }));

  if (pagesToInsert.length === 0) {
    return;
  }

  await saveTeamPagesToSettings([...storedPages, ...pagesToInsert]);
};

const removePageFromTeam = async (teamId: string, pageId: string) => {
  if (!teamId || !pageId) {
    return;
  }

  const storedPages = await getStoredTeamPages();
  const updated = storedPages.filter(
    (page) => !(page.teamId === teamId && page.id === pageId)
  );
  await saveTeamPagesToSettings(updated);
};

export interface CreateTeamData {
  name: string;
  icon: string;
}

export interface AddMembersData {
  memberIds: string[];
}

export const api = {
  async getTeams(): Promise<Team[]> {
    try {
      const teamsResponse = await getBackendSrv().get<any>('/api/teams/search');
      return teamsResponse.teams || [];
    } catch (error) {
      throw error;
    }
  },

  async createTeam(data: CreateTeamData): Promise<Team> {
    try {
      const response = await getBackendSrv().post<any>('/api/teams', {
        name: data.name,
      });
      return {
        id: String(response.id),
        uid: response.uid,
        name: response.name,
        icon: response.avatarUrl || data.icon || '👥',
        members: [],
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      throw error;
    }
  },

  async getTeamDetails(teamId: string): Promise<{
    team: Team;
    members: TeamMember[];
  }> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      const members = await getTeamMembers(team.uid);
      return {
        team,
        members,
      };
    } catch (error) {
      throw error;
    }
  },

  async updateTeamMembers(teamId: string, data: AddMembersData): Promise<void> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      for (const userId of data.memberIds) {
        await getBackendSrv().post(`/api/teams/${team.uid}/members`, { userId });
      }
    } catch (error) {
      throw error;
    }
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      await getBackendSrv().delete(`/api/teams/${team.uid}/members/${memberId}`);
    } catch (error) {
      throw error;
    }
  },

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      return {
        name: team.name,
        icon: team.icon,
      };
    } catch (error) {
      throw error;
    }
  },

  async updateTeamSettings(teamId: string, settings: TeamSettings): Promise<void> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      await getBackendSrv().put(`/api/teams/${team.id}`, {
        name: settings.name,
      });
    } catch (error) {
      throw error;
    }
  },

  async getAvailableMembers(): Promise<AvailableMember[]> {
    try {
      const users = await getBackendSrv().get<any[]>('/api/org/users');
      return users.map((user: any) => ({
        id: String(user.userId),
        name: user.name || user.login,
        email: user.email,
        avatar: user.avatarUrl,
      }));
    } catch (error) {
      throw error;
    }
  },

  async leaveTeam(teamId: string): Promise<void> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      await getBackendSrv().post(`/api/teams/${team.id}/leave`);
    } catch (error) {
      throw error;
    }
  },

  async deleteTeam(teamId: string): Promise<void> {
    try {
      const teams = await getTeams();
      const team = teams.find((t: Team) => String(t.id) === String(teamId) || t.uid === teamId);
      if (!team) {
        throw new Error('Team not found');
      }
      await getBackendSrv().delete(`/api/teams/${team.id}`);
    } catch (error) {
      throw error;
    }
  },

  async getTeamPages(teamId: string): Promise<TeamPage[]> {
    return await getTeamPagesByTeamId(teamId);
  },

  async getAvailablePages(): Promise<AvailablePage[]> {
    return PLUGIN_PAGE_CATALOG;
  },

  async addTeamPages(teamId: string, pageIds: string[]): Promise<void> {
    await addPagesToTeam(teamId, pageIds);
  },

  async removeTeamPage(teamId: string, pageId: string): Promise<void> {
    await removePageFromTeam(teamId, pageId);
  },
};

export const getTeams = async (options?: {
  query?: string;
  page?: number;
  perpage?: number;
  sort?: string;
}): Promise<any> => {
  try {
    const params: Record<string, any> = {};
    if (options?.query) {
      params.query = options.query;
    }
    if (options?.page) {
      params.page = options.page;
    }
    if (options?.perpage) {
      params.perpage = options.perpage;
    }
    if (options?.sort) {
      params.sort = options.sort;
    }

    const teamsResponse = await getBackendSrv().get<any>('/api/teams/search', params);
    
    const teamsWithMembers = await Promise.all(
      teamsResponse.teams.map(async (team: any) => {
        try {
          const teamMembers = await getTeamMembers(team.uid);
          return {
            id: team.id,
            uid: team.uid,
            name: team.name,
            icon: team.avatarUrl,
            members: teamMembers,
          };
        } catch (error) {
          return {
            id: team.id,
            uid: team.uid,
            name: team.name,
            icon: team.avatarUrl,
            members: [],
          };
        }
      })
    );

    return teamsWithMembers;
  } catch (error: any) {
    throw error;
  }
};

export const getTeamMembers = async (teamUid: string): Promise<any> => {
  try {
    if (!teamUid) {
      throw new Error('Team UID is required');
    }

    const membersResponse = await getBackendSrv().get<any>(`/api/teams/${teamUid}/members`);
    const teamMembers = membersResponse.map((member: any) => ({
      id: member.userId,
      name: member.name || member.login,
      email: member.email,
      avatar: member.avatarUrl,
    }));
    
    return teamMembers || [];
  } catch (error: any) {
    throw error;
  }
};