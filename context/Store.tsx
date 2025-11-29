import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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
    hash = (hash << 5) - hash + char;
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
  // Map UUID to hashed number ID for proper lookups
  const [uuidToIdMap, setUuidToIdMap] = useState<Map<string, number>>(
    new Map()
  );

  // Load initial data from Supabase on mount
  useEffect(() => {
    const loadInitialData = async () => {
      // Create UUID to ID mapping
      const newUuidMap = new Map<string, number>();

      try {
        // Load users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from("user_profiles")
          .select("*")
          .order("created_at", { ascending: true });

        if (!usersError && usersData) {
          console.log("Loaded Users:", usersData.length, usersData);

          const convertedUsers: User[] = usersData.map((u: any) => {
            const hashedId = hashStringToNumber(u.id);
            newUuidMap.set(u.id, hashedId); // Store UUID -> ID mapping

            return {
              id: hashedId,
              name: u.name,
              email: u.email,
              role: u.role as User["role"],
              avatar:
                u.avatar ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name.replace(
                  " ",
                  ""
                )}`,
            };
          });

          console.log("UUID Map Size:", newUuidMap.size);
          setUuidToIdMap(newUuidMap);

          setUsers((prev) => {
            // Merge with initial users, replacing mocks with real data
            const merged = [...prev];
            convertedUsers.forEach((newUser) => {
              const existingIndex = merged.findIndex(
                (u) => u.email === newUser.email
              );
              if (existingIndex >= 0) {
                // Replace existing (likely mock) user with real data
                merged[existingIndex] = newUser;
              } else {
                merged.push(newUser);
              }
            });
            return merged;
          });
        } else if (usersError) {
          console.error("Error loading users:", usersError);
        }

        // Load teams from Supabase (must be after users to use the UUID map)
        const { data: teamsData, error: teamsError } = await supabase
          .from("teams")
          .select("*")
          .order("created_at", { ascending: true });

        if (!teamsError && teamsData) {
          console.log("Loaded Teams:", teamsData);
          const convertedTeams: Team[] = teamsData.map((t: any) => ({
            id: t.id,
            name: t.name,
            skills: t.skills || [],
            lead_id: t.lead_id
              ? newUuidMap.get(t.lead_id) || hashStringToNumber(t.lead_id)
              : 0,
          }));
          setTeams((prev) => {
            // Merge with initial teams, avoiding duplicates
            const merged = [...prev];
            convertedTeams.forEach((newTeam) => {
              if (!merged.find((t) => t.id === newTeam.id)) {
                merged.push(newTeam);
              }
            });
            return merged;
          });
        }

        // Load team_members from Supabase
        const { data: membersData, error: membersError } = await supabase
          .from("team_members")
          .select("*")
          .order("created_at", { ascending: true });

        if (!membersError && membersData) {
          console.log("Loaded Members:", membersData);
          const convertedMembers: TeamMember[] = membersData.map((m: any) => ({
            id: m.id,
            team_id: m.team_id,
            member_id:
              newUuidMap.get(m.member_id) || hashStringToNumber(m.member_id), // Use UUID map
            workload: m.workload || 0,
          }));
          setTeamMembers((prev) => {
            // Merge with initial members, avoiding duplicates
            const merged = [...prev];
            convertedMembers.forEach((newMember) => {
              if (!merged.find((m) => m.id === newMember.id)) {
                merged.push(newMember);
              }
            });
            return merged;
          });
          // Ensure `users` contains entries for every team member (useful when
          // some profiles haven't been loaded yet). This prevents missing
          // display names/avatars and keeps workload mapping consistent.
          setUsers((prev) => {
            const existing = [...prev];
            convertedMembers.forEach((mbr) => {
              const found = existing.find((u) => u.id === mbr.member_id);
              if (!found) {
                existing.push({
                  id: mbr.member_id,
                  name: `User ${mbr.member_id}`,
                  email: `user${mbr.member_id}@local`,
                  role: "member",
                  avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${mbr.member_id}`,
                });
              }
            });
            return existing;
          });
        }

        // Load tasks from Supabase
        const { data: tasksData, error: tasksError } = await supabase
          .from("tasks")
          .select("*")
          .order("created_at", { ascending: false });

        if (!tasksError && tasksData) {
          const convertedTasks: Task[] = tasksData.map((t: any) => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status as Task["status"],
            assigned_team_id: t.assigned_team_id,
            assigned_member_id: t.assigned_member_id
              ? newUuidMap.get(t.assigned_member_id) ||
                hashStringToNumber(t.assigned_member_id)
              : null,
            progress: t.progress || 0,
            deadline: t.deadline,
            overload_flag: t.overload_flag || false,
            created_at: t.created_at,
          }));
          setTasks(convertedTasks);
        }
      } catch (err) {
        console.error("Error loading initial data from Supabase:", err);
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
        .from("user_profiles")
        .select("*")
        .eq("email", email)
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
        role: data.role as User["role"],
        avatar:
          data.avatar ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.name.replace(
            " ",
            ""
          )}`,
      };

      // Add to local state, replacing mock if exists
      setUsers((prev) => {
        const existingIndex = prev.findIndex((u) => u.email === email);
        if (existingIndex >= 0) {
          const newUsers = [...prev];
          newUsers[existingIndex] = user;
          return newUsers;
        }
        return [...prev, user];
      });

      setCurrentUser(user);
      return true;
    } catch (err) {
      console.error("Login error:", err);
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
      // Check if user already exists in profiles
      const { data: existingUser } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("email", email)
        .single();

      if (existingUser) {
        // User exists, just log them in
        const userId = hashStringToNumber(existingUser.id);
        const user: User = {
          id: userId,
          name: existingUser.name,
          email: existingUser.email,
          role: existingUser.role as User["role"],
          avatar:
            existingUser.avatar ||
            `https://api.dicebear.com/7.x/avataaars/svg?seed=${existingUser.name.replace(
              " ",
              ""
            )}`,
        };
        setUsers((prev) => {
          if (prev.find((u) => u.email === email)) return prev;
          return [...prev, user];
        });
        setCurrentUser(user);
        return;
      }

      // Create new user using Supabase Auth
      const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${name.replace(
        " ",
        ""
      )}`;

      // Generate a temporary password (you can customize this)
      const tempPassword = `${name.replace(/\s+/g, "")}@${Math.random()
        .toString(36)
        .slice(-8)}`;

      // Sign up the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: tempPassword,
        options: {
          data: {
            name,
            role,
            avatar,
          },
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error("Failed to create user");
      }

      // Ensure the `name` and other fields are present in the `user_profiles` table.
      // Some Supabase setups rely on an auth trigger to create a profile row —
      // if that trigger is absent or delayed, explicitly upsert the profile here
      // so the frontend has the expected fields immediately.
      try {
        const { data: upsertData, error: upsertError } = await supabase
          .from("user_profiles")
          .upsert([
            {
              id: authData.user.id,
              email,
              name,
              role,
              avatar,
              created_at: new Date().toISOString(),
            },
          ])
          .select()
          .single();

        if (upsertError) {
          // Not fatal for frontend — log and continue to attempt to read the profile
          console.warn("Upsert profile error:", upsertError);
        }
      } catch (e) {
        console.warn("Upsert profile threw:", e);
      }

      // Fetch the created/updated profile
      const { data: newUserData, error: profileError } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (profileError || !newUserData) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Profile was not created properly");
      }

      // Update the profile with the correct role if needed
      if (newUserData.role !== role) {
        const { error: updateError } = await supabase
          .from("user_profiles")
          .update({ role })
          .eq("id", authData.user.id);

        if (updateError) {
          console.error("Error updating role:", updateError);
        }
      }

      // Convert UUID to number for frontend compatibility
      const userId = hashStringToNumber(newUserData.id);
      const newUser: User = {
        id: userId,
        name: newUserData.name,
        email: newUserData.email,
        role: role, // Use the role from signup form
        avatar: newUserData.avatar,
      };

      setUsers((prev) => {
        const existingIndex = prev.findIndex((u) => u.email === email);
        if (existingIndex >= 0) {
          const newUsers = [...prev];
          newUsers[existingIndex] = newUser;
          return newUsers;
        }
        return [...prev, newUser];
      });

      // If user selected a team, handle team assignment based on role
      if (teamId && authData.user.id) {
        // If user is a team_lead, update the team's lead_id
        if (role === "team_lead") {
          const { error: updateTeamError } = await supabase
            .from("teams")
            .update({ lead_id: authData.user.id })
            .eq("id", teamId);

          if (updateTeamError) {
            console.error("Error setting team lead:", updateTeamError);
          } else {
            // Update local state
            setTeams((prev) =>
              prev.map((t) => (t.id === teamId ? { ...t, lead_id: userId } : t))
            );
          }
        }

        // Add user to team_members table (for both team_lead and member)
        // First check if team_member already exists
        const { data: existingMember } = await supabase
          .from("team_members")
          .select("*")
          .eq("team_id", teamId)
          .eq("member_id", authData.user.id)
          .single();

        if (!existingMember) {
          const { data: newMemberData, error: memberError } = await supabase
            .from("team_members")
            .insert([
              {
                team_id: teamId,
                member_id: authData.user.id, // UUID from auth
                workload: 0,
              },
            ])
            .select()
            .single();

          if (memberError) {
            console.error("Error creating team member:", memberError);
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
      console.error("Signup error:", err);
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

    // Find the UUID for the assigned member (need to reverse the hash)
    const assignedMemberUUID = assignedMemberId
      ? users.find((u) => u.id === assignedMemberId)?.email // We'll use email to find the UUID
      : null;

    // Get the actual UUID from team_members table
    let memberUUID = null;
    if (assignedMemberId) {
      const memberData = teamMembers.find(
        (tm) => tm.member_id === assignedMemberId
      );
      if (memberData) {
        // Fetch the actual UUID from Supabase
        const { data: memberInfo } = await supabase
          .from("team_members")
          .select("member_id")
          .eq("id", memberData.id)
          .single();

        if (memberInfo) {
          memberUUID = memberInfo.member_id;
        }
      }
    }

    // Save to Supabase first
    const { data: savedTask, error: taskError } = await supabase
      .from("tasks")
      .insert([
        {
          title,
          description,
          status: "Pending",
          assigned_team_id: assignedTeamId,
          assigned_member_id: memberUUID,
          progress: 0,
          deadline,
          overload_flag: false,
        },
      ])
      .select()
      .single();

    if (taskError) {
      console.error("Error creating task in Supabase:", taskError);
      return;
    }

    // Create local task object with the ID from Supabase
    const newTask: Task = {
      id: savedTask.id,
      title: savedTask.title,
      description: savedTask.description,
      status: savedTask.status as Task["status"],
      assigned_team_id: savedTask.assigned_team_id,
      assigned_member_id: assignedMemberId,
      progress: savedTask.progress,
      deadline: savedTask.deadline,
      overload_flag: savedTask.overload_flag,
      created_at: savedTask.created_at,
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

  const updateTaskProgress = async (taskId: number, progress: number) => {
    const newStatus =
      progress === 100 ? "Completed" : progress > 0 ? "InProgress" : "Pending";

    // Update in Supabase
    const { error } = await supabase
      .from("tasks")
      .update({
        progress,
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", taskId);

    if (error) {
      console.error("Error updating task progress:", error);
      return;
    }

    // Update local state
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== taskId) return t;
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
