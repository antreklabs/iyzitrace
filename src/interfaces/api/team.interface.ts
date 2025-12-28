/* Team Service Interfaces */

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

export interface TeamPagesSettingsEntry extends TeamPage {
    teamId: string;
}

export interface CreateTeamData {
    name: string;
    icon: string;
}

export interface AddMembersData {
    memberIds: string[];
}
