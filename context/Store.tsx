import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import { User, Team, TeamMember, Task, AgentLog } from "../types";
import {
  classifyTaskAndSelectTeam,
  analyzeTaskHealth,
} from "../services/geminiService";
import { supabase } from "../services/supabaseClient";

// --- INITIAL DATA (Requested Teams) ---

const INITIAL_TEAMS: Team[] = [
  {
    id: 1,
    name: "Frontend",
    skills: ["React", "Vue", "CSS", "Tailwind", "UI/UX"],
    lead_id: 2,
  },
  {
    id: 2,
    name: "Backend",
    skills: ["Node.js", "Python", "FastAPI", "SQL", "Microservices"],
    lead_id: 3,
  },
  {
    id: 3,
    name: "Cloud",
    skills: ["AWS", "Docker", "Kubernetes", "Terraform", "CI/CD"],
    lead_id: 0,
  },
  {
    id: 4,
    name: "Cybersecurity",
    skills: ["Penetration Testing", "Auditing", "SecOps", "Compliance"],
    lead_id: 0,
  },
  {
    id: 5,
    name: "HR",
    skills: ["Recruiting", "Culture", "Payroll", "Onboarding"],
    lead_id: 0,
  },
];

const INITIAL_USERS: User[] = [
  {
    id: 1,
    name: "Alice Admin",
    email: "admin@corp.com",
    role: "admin",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alice",
  },
  {
    id: 2,
    name: "Bob Frontend Lead",
    email: "bob@corp.com",
    role: "team_lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Bob",
  },
  {
    id: 3,
    name: "Charlie Backend Lead",
    email: "charlie@corp.com",
    role: "team_lead",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie",
  },
];

const INITIAL_MEMBERS: TeamMember[] = [
  { id: 1, team_id: 1, member_id: 2, workload: 0 }, // Bob is in Frontend
  { id: 2, team_id: 2, member_id: 3, workload: 0 }, // Charlie is in Backend
];

interface StoreContextType {
  currentUser: User | null;
  users: User[];
  teams: Team[];
  tasks: Task[];
  teamMembers: TeamMember[];
  agentLogs: AgentLog[];
  login: (email: string) => Promise<boolean>;
  signup: (
    name: string,
    email: string,
    role: User["role"],
    teamId?: number
  ) => Promise<void>;
  logout: () => void;
  createTask: (
    title: string,
    description: string,
    deadline: string
  ) => Promise<void>;
  createTeam: (name: string, skills: string[]) => void;
  updateTaskProgress: (taskId: number, progress: number) => void;
  triggerAIHealthCheck: () => Promise<void>;
}

// Helper function to convert UUID string to a consistent number for frontend compatibility
function hashStringToNumber(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const StoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([]);

  // Load initial data from Supabase on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Load users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: true });

        if (!usersError && usersData) {
          const convertedUsers: User[] = usersData.map((u: any) => ({
            id: hashStringToNumber(u.id),
            name: u.name,
            email: u.email,
            role: u.role as User['role'],
            avatar: u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name.replace(" ", "")}`,
          }));
          setUsers((prev) => {
            // Merge with initial users, avoiding duplicates
            const merged = [...prev];
            convertedUsers.forEach((newUser) => {
              if (!merged.find(u => u.email === newUser.email)) {
                merged.push(newUser);
              }
            });
            return merged;
          });
        }

        // Load teams from Supabase
        const { data: teamsData, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .order('created_at', { ascending: true });

        if (!teamsError && teamsData) {
          const convertedTeams: Team[] = teamsData.map((t: any) => ({
            id: t.id,
            name: t.name,
            skills: t.skills || [],
            lead_id: t.lead_id ? hashStringToNumber(t.lead_id) : 0,
          }));
          setTeams((prev) => {
            // Merge with initial teams, avoiding duplicates
            const merged = [...prev];
            convertedTeams.forEach((newTeam) => {
              if (!merged.find(t => t.id === newTeam.id)) {
                merged.push(newTeam);
              }
            });
            return merged;
          });
        }

        // Load team_members from Supabase
        const { data: membersData, error: membersError } = await supabase
          .from('team_members')
          .select('*')
          .order('created_at', { ascending: true });

        if (!membersError && membersData) {
          const convertedMembers: TeamMember[] = membersData.map((m: any) => ({
            id: m.id,
            team_id: m.team_id,
            member_id: hashStringToNumber(m.member_id), // Convert UUID to number
            workload: m.workload || 0,
          }));
          setTeamMembers((prev) => {
            // Merge with initial members, avoiding duplicates
            const merged = [...prev];
            convertedMembers.forEach((newMember) => {
              if (!merged.find(m => m.id === newMember.id)) {
                merged.push(newMember);
              }
            });
            return merged;
          });
        }
      } catch (err) {
        console.error('Error loading initial data from Supabase:', err);
      }
    };

    loadInitialData();
  }, []);

  // Calculate workloads dynamically
  useEffect(() => {
    const newMembers = [...teamMembers];
    newMembers.forEach((tm) => {
      const activeCount = tasks.filter(
        (t) => t.assigned_member_id === tm.member_id && t.status !== "Completed"
      ).length;
      tm.workload = activeCount;
    });
    setTeamMembers(newMembers);
  }, [tasks]);

  const login = async (email: string) => {
    // First check local state
    const localUser = users.find((u) => u.email === email);
    if (localUser) {
      setCurrentUser(localUser);
      return true;
    }

    // If not found locally, check Supabase
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !data) {
        return false;
      }

      // Convert UUID to number for frontend compatibility (hash the UUID)
      const userId = hashStringToNumber(data.id);
      const user: User = {
        id: userId,
        name: data.name,
        email: data.email,
        role: data.role as User['role'],
        avatar: data.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name.replace(" ", "")}`,
      };

      // Add to local state if not already there
      setUsers((prev) => {
        if (prev.find(u => u.email === email)) return prev;
        return [...prev, user];
      });

      setCurrentUser(user);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const signup = async (
    name: string,
    email: string,
    role: User["role"],
    teamId?: number
  ) => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (existingUser) {
        // User exists, just log them in
        const userId = hashStringToNumber(existingUser.id);
        const user: User = {
          id: userId,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role as User['role'],
          avatar: existingUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${existingUser.name.replace(" ", "")}`,
        };
        setUsers((prev) => {
          if (prev.find(u => u.email === email)) return prev;
          return [...prev, user];
        });
        setCurrentUser(user);
        return;
      }

      // Create new user in Supabase
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(" ", "")}`;
      
      // Generate UUID for the user (since database might not have default)
      const userUuid = uuidv4();
      
      const { data: newUserData, error: userError } = await supabase
        .from('user_profiles')
        .insert([
          {
            id: userUuid,
            email,
            name,
            role,
            avatar,
          }
        ])
        .select()
        .single();

      if (userError) {
        console.error('Error creating user:', userError);
        throw userError;
      }

      // Convert UUID to number for frontend compatibility
      const userId = hashStringToNumber(newUserData.id);
      const newUser: User = {
        id: userId,
        name: newUserData.name,
        email: newUserData.email,
        role: newUserData.role as User['role'],
        avatar: newUserData.avatar,
      };

      setUsers((prev) => [...prev, newUser]);

      // If user selected a team, add them to team_members in Supabase
      if (teamId && newUserData.id) {
        // First check if team_member already exists
        const { data: existingMember } = await supabase
          .from('team_members')
          .select('*')
          .eq('team_id', teamId)
          .eq('member_id', newUserData.id)
          .single();

        if (!existingMember) {
          const { data: newMemberData, error: memberError } = await supabase
            .from('team_members')
            .insert([
              {
                team_id: teamId,
                member_id: newUserData.id, // UUID from database
                workload: 0,
              }
            ])
            .select()
            .single();

          if (memberError) {
            console.error('Error creating team member:', memberError);
          } else if (newMemberData) {
            // Add to local state
            const newMember: TeamMember = {
              id: newMemberData.id,
              team_id: newMemberData.team_id,
              member_id: userId, // Use converted number ID for frontend
              workload: 0,
            };
            setTeamMembers((prev) => [...prev, newMember]);
          }
        }
      }

      setCurrentUser(newUser);
    } catch (err) {
      console.error('Signup error:', err);
      throw err;
    }
  };

  const logout = () => setCurrentUser(null);

  const addLog = (
    taskId: number,
    agent: AgentLog["agent_name"],
    action: string
  ) => {
    const newLog: AgentLog = {
      id: Date.now(),
      task_id: taskId,
      agent_name: agent,
      action,
      timestamp: new Date().toISOString(),
    };
    setAgentLogs((prev) => [newLog, ...prev]);
  };

  const createTeam = (name: string, skills: string[]) => {
    const newTeam: Team = {
      id: Date.now(),
      name,
      skills,
      lead_id: 0, // Default no lead initially
    };
    setTeams((prev) => [...prev, newTeam]);
  };

  const createTask = async (
    title: string,
    description: string,
    deadline: string
  ) => {
    // 1. RAG Agent: Classify based on DYNAMIC teams list
    // The agent receives the current 'teams' state, so it sees new skills immediately.
    const classification = await classifyTaskAndSelectTeam(
      title,
      description,
      teams
    );
    const assignedTeamId = classification ? classification.teamId : teams[0].id;

    // 2. Assignment Agent: Find lowest workload member
    const teamMates = teamMembers.filter((tm) => tm.team_id === assignedTeamId);
    teamMates.sort((a, b) => a.workload - b.workload);

    const assignedMemberId =
      teamMates.length > 0 ? teamMates[0].member_id : null;

    const newTask: Task = {
      id: Date.now(),
      title,
      description,
      status: "Pending",
      assigned_team_id: assignedTeamId,
      assigned_member_id: assignedMemberId,
      progress: 0,
      deadline,
      overload_flag: false,
      created_at: new Date().toISOString(),
    };

    setTasks((prev) => [...prev, newTask]);

    if (classification) {
      addLog(
        newTask.id,
        "RAG",
        `Selected Team ${
          teams.find((t) => t.id === assignedTeamId)?.name
        }. Reason: ${classification.reasoning}`
      );
    } else {
      addLog(newTask.id, "RAG", `Fallback assignment to default team.`);
    }

    if (assignedMemberId) {
      const u = users.find((u) => u.id === assignedMemberId);
      addLog(
        newTask.id,
        "Assignment",
        `Auto-assigned to ${u?.name} (Current Workload: ${teamMates[0].workload})`
      );
    } else {
      addLog(
        newTask.id,
        "Assignment",
        `No members available in team. Task unassigned.`
      );
    }
  };

  const updateTaskProgress = (taskId: number, progress: number) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
        const newStatus =
          progress === 100
            ? "Completed"
            : progress > 0
            ? "InProgress"
            : "Pending";
        return { ...t, progress, status: newStatus };
      })
    );
    addLog(taskId, "Progress", `User updated progress to ${progress}%`);
  };

  const triggerAIHealthCheck = async () => {
    for (const task of tasks) {
      if (task.status === "Completed") continue;

      const deadlineDate = new Date(task.deadline);
      const now = new Date();
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const analysis = await analyzeTaskHealth(
        task.title,
        task.progress,
        diffDays
      );

      if (analysis.flagOverload && !task.overload_flag) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === task.id ? { ...t, overload_flag: true } : t
          )
        );
        addLog(task.id, "Reassignment", `FLAGGED: ${analysis.suggestion}`);

        const currentMember = teamMembers.find(
          (tm) => tm.member_id === task.assigned_member_id
        );
        if (currentMember) {
          const teamMates = teamMembers.filter(
            (tm) =>
              tm.team_id === currentMember.team_id &&
              tm.member_id !== currentMember.member_id
          );
          const freeMember = teamMates.find(
            (tm) => tm.workload < currentMember.workload
          );

          if (freeMember) {
            setTasks((prev) =>
              prev.map((t) =>
                t.id === task.id
                  ? {
                      ...t,
                      assigned_member_id: freeMember.member_id,
                      overload_flag: false,
                    }
                  : t
              )
            );
            const u = users.find((u) => u.id === freeMember.member_id);
            addLog(
              task.id,
              "Reassignment",
              `Re-assigned task to ${u?.name} to relieve load.`
            );
          }
        }
      }
    }
  };

  return (
    <StoreContext.Provider
      value={{
        currentUser,
        users,
        teams,
        tasks,
        teamMembers,
        agentLogs,
        login,
        signup,
        logout,
        createTask,
        createTeam,
        updateTaskProgress,
        triggerAIHealthCheck,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
};
