export type Role = 'admin' | 'team_lead' | 'member';
export type TaskStatus = 'Pending' | 'InProgress' | 'Completed';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  avatar: string;
}

export interface Team {
  id: number;
  name: string;
  skills: string[];
  lead_id: number;
}

export interface TeamMember {
  id: number;
  team_id: number;
  member_id: number;
  workload: number; // calculated field in our frontend logic
}

export interface Task {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  assigned_team_id: number | null;
  assigned_member_id: number | null;
  progress: number;
  deadline: string;
  overload_flag: boolean;
  created_at: string;
}

export interface AgentLog {
  id: number;
  task_id: number;
  agent_name: 'RAG' | 'Assignment' | 'Progress' | 'Reassignment';
  action: string;
  timestamp: string;
}

// Helper interface for the AI response
export interface AIClassificationResult {
  teamId: number;
  reasoning: string;
  estimatedComplexity: 'Low' | 'Medium' | 'High';
}
