import { getBackendSrv } from "@grafana/runtime";

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
    
    // Her team için members'ları paralel olarak al
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
          // Bir team'in members'ları alınamazsa, boş array ile devam et
          console.warn(`Failed to fetch members for team ${team.uid}:`, error);
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
    
    console.log('teams', teamsWithMembers);

    return teamsWithMembers;
  } catch (error: any) {
    console.error('Error fetching teams:', error);
    throw error;
  }
};

export const getTeamMembers = async (teamUid: string): Promise<any> => {
  try {
    if (!teamUid) {
      throw new Error('Team UID is required');
    }

    const membersResponse = await getBackendSrv().get<any>(`/api/teams/${teamUid}/members`);
    console.log('teamMembersResponse', membersResponse);
    const teamMembers = membersResponse.map((member: any) => ({
      id: member.userId,
      name: member.name || member.login,
      email: member.email,
      avatar: member.avatarUrl,
    }));
    
    return teamMembers || [];
  } catch (error: any) {
    console.error('Error fetching team members:', error);
    throw error;
  }
};