import { getPluginSettings, savePluginSettings } from './service/settings.service';

// Teams API Service
// Bu dosya gerçek API endpoint'leri ile entegrasyon için hazırlanmıştır

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
    id: 'views',
    name: 'Views',
    route: '/views',
    description: 'Custom visualizations',
    icon: '🧩',
  },
  {
    id: 'alerts',
    name: 'Alerts',
    route: '/alerts',
    description: 'Alert rules and incidents',
    icon: '⏰',
  },
  {
    id: 'exceptions',
    name: 'Exceptions',
    route: '/exceptions',
    description: 'Error tracking & triage',
    icon: '🧨',
  },
  {
    id: 'teams',
    name: 'Teams',
    route: '/teams',
    description: 'Team management',
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

const getStoredTeamPages = async (): Promise<TeamPagesSettingsEntry[]> => {
  try {
    const settings = await getPluginSettings();
    return normaliseTeamPagesSetting(settings?.teamPages);
  } catch (error) {
    console.error('Error reading team pages from plugin settings:', error);
    return [];
  }
};

const saveTeamPagesToSettings = async (pages: TeamPagesSettingsEntry[]) => {
  try {
    await savePluginSettings({ teamPages: pages });
  } catch (error) {
    console.error('Error saving team pages to plugin settings:', error);
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

// Teams API
export const teamsApi = {
  // Ana teams listesi
  async getTeams(): Promise<Team[]> {
    try {
      const response = await fetch('http://localhost:3000/org/teams');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching teams:', error);
      throw error;
    }
  },

  // Yeni team oluştur
  async createTeam(data: CreateTeamData): Promise<Team> {
    try {
      const response = await fetch('http://localhost:3000/org/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error creating team:', error);
      throw error;
    }
  },

  // Team detayları (members ile birlikte)
  async getTeamDetails(teamId: string): Promise<{
    team: Team;
    members: TeamMember[];
  }> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/edit/${teamId}/members`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching team details:', error);
      throw error;
    }
  },

  // Team üyelerini güncelle
  async updateTeamMembers(teamId: string, data: AddMembersData): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/edit/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating team members:', error);
      throw error;
    }
  },

  // Team üyesini çıkar
  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/edit/${teamId}/members/${memberId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error removing team member:', error);
      throw error;
    }
  },

  // Team ayarları
  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/edit/${teamId}/settings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching team settings:', error);
      throw error;
    }
  },

  // Team ayarlarını güncelle
  async updateTeamSettings(teamId: string, settings: TeamSettings): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/edit/${teamId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error updating team settings:', error);
      throw error;
    }
  },

  // Mevcut üyeleri getir (team'a eklenebilecek)
  async getAvailableMembers(): Promise<AvailableMember[]> {
    try {
      const response = await fetch('http://localhost:3000/org/members');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error fetching available members:', error);
      throw error;
    }
  },

  // Team'den çık
  async leaveTeam(teamId: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/${teamId}/leave`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error leaving team:', error);
      throw error;
    }
  },

  // Team'i sil
  async deleteTeam(teamId: string): Promise<void> {
    try {
      const response = await fetch(`http://localhost:3000/org/teams/${teamId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error deleting team:', error);
      throw error;
    }
  },

  // Team pages API
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

// Mock data (development için)
export const mockTeamsData = {
  teams: [
    {
      id: '1',
      name: 'Engineers',
      icon: '🔧',
      members: [
        { id: '1', name: 'Gökhan Sipahi', email: 'gosipahi@gmail.com', joinedAt: '2024-01-15' },
        { id: '2', name: 'John Doe', email: 'john@example.com', joinedAt: '2024-01-16' },
        { id: '3', name: 'Jane Smith', email: 'jane@example.com', joinedAt: '2024-01-17' },
        { id: '4', name: 'Bob Johnson', email: 'bob@example.com', joinedAt: '2024-01-18' },
        { id: '5', name: 'Alice Brown', email: 'alice@example.com', joinedAt: '2024-01-19' },
      ],
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Designers',
      icon: '🎨',
      members: [
        { id: '6', name: 'Sarah Wilson', email: 'sarah@example.com', joinedAt: '2024-01-20' },
        { id: '7', name: 'Mike Davis', email: 'mike@example.com', joinedAt: '2024-01-21' },
        { id: '8', name: 'Lisa Garcia', email: 'lisa@example.com', joinedAt: '2024-01-22' },
      ],
      createdAt: '2024-01-20',
    },
    {
      id: '3',
      name: 'Product',
      icon: '📊',
      members: [
        { id: '9', name: 'Tom Anderson', email: 'tom@example.com', joinedAt: '2024-02-01' },
        { id: '10', name: 'Emma Taylor', email: 'emma@example.com', joinedAt: '2024-02-02' },
        { id: '11', name: 'David Miller', email: 'david@example.com', joinedAt: '2024-02-03' },
        { id: '12', name: 'Sophie White', email: 'sophie@example.com', joinedAt: '2024-02-04' },
      ],
      createdAt: '2024-02-01',
    },
  ] as Team[],

  availableMembers: [
  ] as AvailableMember[],

  teamMembers: [
    {
      id: '1',
      name: 'Gökhan Sipahi',
      email: 'gosipahi@gmail.com',
      joinedAt: 'Today',
    },
  ] as TeamMember[],

  teamSettings: {
    name: 'Engineers',
    icon: '🔧',
  } as TeamSettings,

  teamPages: [
    {
      id: '1',
      name: 'Services',
      route: '/services',
      description: 'Monitor service performance metrics',
      icon: '📊',
      addedAt: '2024-01-15',
    },
    {
      id: '2',
      name: 'Traces',
      route: '/traces',
      description: 'Explore distributed traces',
      icon: '🔍',
      addedAt: '2024-01-16',
    },
  ] as TeamPage[],

  availablePages: [...PLUGIN_PAGE_CATALOG] as AvailablePage[],
};

// Development mode için mock API wrapper
export const mockApi = {
  async getTeams(): Promise<Team[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTeamsData.teams), 500);
    });
  },

  async createTeam(data: CreateTeamData): Promise<Team> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const newTeam: Team = {
          id: Date.now().toString(),
          uid: Date.now().toString(),
          name: data.name,
          icon: data.icon,
          members: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        resolve(newTeam);
      }, 500);
    });
  },

  async getTeamDetails(teamId: string): Promise<{
    team: Team;
    members: TeamMember[];
  }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const team = mockTeamsData.teams.find(t => t.id === teamId) || mockTeamsData.teams[0];
        resolve({
          team,
          members: mockTeamsData.teamMembers,
        });
      }, 500);
    });
  },

  async updateTeamMembers(teamId: string, data: AddMembersData): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },

  async removeTeamMember(teamId: string, memberId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },

  async getTeamSettings(teamId: string): Promise<TeamSettings> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTeamsData.teamSettings), 500);
    });
  },

  async updateTeamSettings(teamId: string, settings: TeamSettings): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },

  async getAvailableMembers(): Promise<AvailableMember[]> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(mockTeamsData.availableMembers), 500);
    });
  },

  async leaveTeam(teamId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },

  async deleteTeam(teamId: string): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), 500);
    });
  },

  async getTeamPages(teamId: string): Promise<TeamPage[]> {
    return getTeamPagesByTeamId(teamId);
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

// Environment'a göre API seçimi
const isDevelopment = process.env.NODE_ENV === 'development';
export const api = isDevelopment ? mockApi : teamsApi;
