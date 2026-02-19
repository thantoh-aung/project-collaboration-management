<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Models\Task;
use App\Models\Project;
use Carbon\Carbon;

class AiChatController extends Controller
{
    private function getApiKey()
    {
        return config('services.openrouter.api_key', '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');
    }

    private function getApiUrl()
    {
        return config('services.openrouter.api_url', 'https://openrouter.ai/api/v1/chat/completions');
    }

    private function getModel()
    {
        return config('services.openrouter.model', 'meta-llama/llama-3.2-3b-instruct:free');
    }

    public function chat(Request $request)
    {
        Log::info('AI Chat request received', [
            'session_id' => $request->session()->getId(),
            'session_token' => $request->session()->token(),
            'request_token' => $request->input('_token'),
            'header_token' => $request->header('X-CSRF-TOKEN'),
            'has_xsrf_cookie' => $request->hasCookie('XSRF-TOKEN'),
            'user_id' => $request->user()?->id,
            'request_data' => $request->all(),
        ]);

        // Temporarily bypass validation to debug
        // $request->validate([
        //     'message' => 'required|string|max:1000',
        //     'conversation_history' => 'nullable|array',
        // ]);

        $user = $request->user();
        $message = strtolower($request->input('message', ''));
        
        // LEVEL 2: Handle simple data queries directly (no AI needed)
        $directResponse = $this->handleDirectQuery($message, $user);
        if ($directResponse) {
            return response()->json([
                'message' => $directResponse,
                'success' => true,
                'source' => 'database'
            ]);
        }
        
        // Complex queries go to AI for guidance/explanations
        $userRole = $this->getUserRole($user);
        $taskAnalytics = $this->getTaskAnalytics($user);
        $systemPrompt = $this->buildSystemPrompt($user, $userRole, $taskAnalytics);
        
        $messages = [
            [
                'role' => 'system',
                'content' => $systemPrompt
            ]
        ];

        // Add conversation history (last 10 messages)
        if ($request->conversation_history) {
            foreach ($request->conversation_history as $msg) {
                if (isset($msg['role']) && isset($msg['content'])) {
                    $messages[] = [
                        'role' => $msg['role'],
                        'content' => $msg['content']
                    ];
                }
            }
        }

        // Add current user message
        $messages[] = [
            'role' => 'user',
            'content' => $request->message
        ];

        try {
            // Use working Gemini 2.0 Flash model
            $model = 'google/gemini-2.0-flash-001';
            
            Log::info('AI Chat using model: ' . $model);
            
            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->getApiKey(),
                'Content-Type' => 'application/json',
            ])->timeout(30)->post($this->getApiUrl(), [
                'model' => $model,
                'messages' => $messages,
                'temperature' => 0.7,
                'max_tokens' => 1000,
            ]);

            if ($response->successful()) {
                $data = $response->json();
                Log::info('AI Chat success with model: ' . $model);
                
                return response()->json([
                    'message' => $data['choices'][0]['message']['content'] ?? 'Sorry, I could not generate a response.',
                    'success' => true
                ]);
            } else {
                Log::error('AI Chat Error', [
                    'status' => $response->status(),
                    'body' => $response->body()
                ]);
                
                return response()->json([
                    'message' => 'I\'m having trouble connecting right now. Please try again.',
                    'success' => false
                ], 500);
            }
        } catch (\Exception $e) {
            Log::error('AI Chat Exception', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'An error occurred: ' . $e->getMessage(),
                'success' => false
            ], 500);
        }
    }

    private function getUserRole($user)
    {
        // Check if user is in marketplace context (no workspace)
        if (!$user->workspaces()->exists()) {
            return $user->usage_type ?? 'user'; // Return 'freelancer', 'client', or 'user'
        }
        
        // Get user's role in current workspace
        $workspace = $user->workspaces()->first();
        
        if (!$workspace) {
            return 'user';
        }

        $workspaceUser = $workspace->users()
            ->where('users.id', $user->id)
            ->first();

        return $workspaceUser->pivot->role ?? 'member';
    }

    private function getTaskAnalytics($user)
    {
        // Check if user is in marketplace context (no workspace)
        if (!$user->workspaces()->exists()) {
            return [
                'context' => 'marketplace',
                'user_type' => $user->usage_type ?? 'user',
                'message' => 'User is in marketplace context, no workspace task analytics available'
            ];
        }
        
        $workspace = $user->workspaces()->first();
        
        if (!$workspace) {
            return null;
        }

        // Get all tasks user has access to
        $tasks = Task::whereHas('project', function($query) use ($workspace) {
            $query->where('workspace_id', $workspace->id);
        })->get();

        $now = Carbon::now();
        
        return [
            'context' => 'workspace',
            'total_tasks' => $tasks->count(),
            'assigned_to_user' => $tasks->where('assigned_to_user_id', $user->id)->count(),
            'overdue_tasks' => $tasks->filter(function($task) use ($now) {
                return $task->due_on && Carbon::parse($task->due_on)->lt($now) && !in_array($task->status, ['done', 'deployed']);
            })->count(),
            'due_today' => $tasks->filter(function($task) use ($now) {
                return $task->due_on && Carbon::parse($task->due_on)->isToday();
            })->count(),
            'due_this_week' => $tasks->filter(function($task) use ($now) {
                return $task->due_on && Carbon::parse($task->due_on)->between($now, $now->copy()->endOfWeek());
            })->count(),
            'completed_tasks' => $tasks->whereIn('status', ['done', 'deployed'])->count(),
            'in_progress' => $tasks->where('status', 'in-progress')->count(),
            'unassigned' => $tasks->whereNull('assigned_to_user_id')->count(),
        ];
    }

    private function buildSystemPrompt($user, $userRole, $taskAnalytics = null)
    {
        // Handle marketplace context
        if ($taskAnalytics && isset($taskAnalytics['context']) && $taskAnalytics['context'] === 'marketplace') {
            $marketplaceRoleDescriptions = [
                'freelancer' => 'You are a freelancer in the marketplace. You can browse projects, create a profile, showcase your skills, set rates, manage availability, and communicate with potential clients through the chat system.',
                'client' => 'You are a client in the marketplace. You can post projects, browse freelancer profiles, view portfolios, check ratings, and communicate with potential freelancers through the chat system.',
                'user' => 'You are a user in the marketplace exploring the platform. You can discover freelancers, view projects, and learn about the collaboration platform.'
            ];

            $roleDescription = $marketplaceRoleDescriptions[$taskAnalytics['user_type']] ?? $marketplaceRoleDescriptions['user'];

            return <<<MARKETPLACE_PROMPT
You are an AI assistant for CollabTool's freelancer marketplace platform.
The user is currently in the marketplace context, not in a workspace.

**Marketplace Overview:**
- This is a freelancer-first SaaS platform with two main sections: Marketplace (discovery) and Workspace (execution)
- Marketplace: Where clients discover freelancers and freelancers showcase their skills
- Workspace: Where actual project collaboration happens after agreements are made

**User Context:**
{$roleDescription}

**Marketplace Features:**
- Freelancer profiles with portfolios, skills, rates, and availability
- Client profiles with company information and project history
- Project posting and discovery
- Real-time chat between clients and freelancers
- Skills-based search and filtering
- Rating and review system

**Help Topics:**
- How to create/update freelancer profile
- How to post projects as a client
- How to search for freelancers by skills
- How to use the chat system
- How to set rates and availability
- Portfolio management
- Marketplace navigation

Provide helpful guidance about using the marketplace features, best practices for freelancer-client collaboration, and platform navigation.
MARKETPLACE_PROMPT;
        }

        // Workspace context (original logic)
        $roleDescriptions = [
            'admin' => 'You are an admin with full access to create projects, manage users, create/edit tasks, and manage all aspects of the system.',
            'member' => 'You are a team member who can create tasks, assign tasks, comment, upload files, and collaborate on projects.',
            'client' => 'You are a client with read-only access. You can view tasks and progress but cannot create or edit tasks.'
        ];

        $roleDescription = $roleDescriptions[$userRole] ?? $roleDescriptions['member'];

        $analyticsContext = '';
        if ($taskAnalytics) {
            $analyticsContext = <<<ANALYTICS

**Current Task Statistics (Real-Time Data):**
- Total tasks in workspace: {$taskAnalytics['total_tasks']}
- Tasks assigned to you: {$taskAnalytics['assigned_to_user']}
- Overdue tasks: {$taskAnalytics['overdue_tasks']}
- Due today: {$taskAnalytics['due_today']}
- Due this week: {$taskAnalytics['due_this_week']}
- Completed tasks: {$taskAnalytics['completed_tasks']}
- In progress: {$taskAnalytics['in_progress']}
- Unassigned tasks: {$taskAnalytics['unassigned']}

When users ask about their tasks, overdue items, or statistics, you can reference these REAL numbers above.
ANALYTICS;
        }

        return <<<PROMPT
You are a CollabTool AI assistant. You ONLY help with questions related to the CollabTool platform. Your purpose is to assist users with CollabTool features, workflows, and system usage.
{$analyticsContext}

**Your Scope (CollabTool ONLY):**
- CollabTool features: projects, tasks, task groups, comments, files, time tracking
- CollabTool workflows: how to use the system, step-by-step instructions
- CollabTool troubleshooting: technical issues, error messages, system problems
- CollabTool user roles: admin, member, client permissions and capabilities
- CollabTool data: task counts, project statistics, user information (when asked)
- CollabTool marketplace: freelancers, projects, client interactions

**CollabTool System Overview:**
- This is a SaaS platform for managing projects, tasks, teams, and client collaboration
- Similar to ClickUp, Monday.com, or Asana
- Features: Projects, Tasks, Task Groups (Kanban columns), Comments, File Attachments, Time Tracking

**User Roles & Permissions:**
1. **Admin**: Full access - create projects, manage users, create/edit/delete tasks, assign tasks, manage everything
2. **Member**: Collaborative access - create tasks, assign tasks, comment, upload files, move tasks between statuses
3. **Client**: Read-only access - view tasks, view progress, view comments (cannot create/edit tasks)

**Current User:**
- Name: {$user->name}
- Email: {$user->email}
- Role: {$userRole}
- {$roleDescription}

**Task Workflow:**
1. Tasks belong to Projects and Task Groups (status columns like "To Do", "In Progress", "Done")
2. Tasks can be assigned to team members who are part of the project
3. Tasks have: title, description, assignee, due date, labels, comments, attachments
4. Users can drag tasks between columns to change status
5. Click a task to open detail drawer with full information

**Common User Questions:**

**Creating Tasks:**
- Admin and Members can create tasks by clicking "New Task" button or "Add task" in any column
- Fill in: Task title (required), description, assignee, due date
- Task automatically belongs to the current project and selected task group

**Assigning Tasks:**
- Only users who are members of the project can be assigned
- Select assignee from dropdown when creating/editing task
- Can leave unassigned

**Task Status:**
- Tasks are organized in columns (Task Groups) like: To Do, In Progress, Review, Done
- Drag and drop tasks between columns to change status
- Each project can have custom task groups

**Comments & Collaboration:**
- Click any task to open detail drawer
- Add comments in the comments section
- Upload files/attachments
- Tag team members with @mentions

**Permissions:**
- Clients cannot create, edit, or assign tasks (read-only)
- Members and Admins have full collaborative access
- All actions are project-based (users only see projects they're part of)

**Your Behavior:**
- ONLY answer questions about CollabTool features and usage
- For ANY unrelated topic, respond: "I can only help with CollabTool-related questions. Please ask me about projects, tasks, or other CollabTool features."
- Do not engage in general conversation about business, science, weather, entertainment, etc.
- Do not provide advice outside of CollabTool system usage
- Keep responses focused on CollabTool functionality
- Be helpful but strictly within CollabTool scope

**Important:**
- Keep responses concise (2-4 sentences usually)
- Use bullet points for multi-step instructions
- Be friendly but professional
- If you don't know something specific, admit it and suggest where they might find the answer

Now help the user with their question!
PROMPT;
    }

    private function getFallbackResponse($message, $user)
    {
        $lowerMessage = strtolower($message);
        $userRole = $this->getUserRole($user);
        $isMarketplace = !$user->workspaces()->exists();
        
        // Level 3 AI Assistant - Detect data requests
        if ($this->isDataRequest($lowerMessage)) {
            return $this->generateDataRequest($lowerMessage, $user, $userRole, $isMarketplace);
        }
        
        // Level 2 Context-Aware - Provide contextual guidance
        return $this->generateContextualResponse($lowerMessage, $user, $userRole, $isMarketplace);
    }
    
    private function isDataRequest($message)
    {
        $dataRequestPatterns = [
            'show me', 'get', 'list', 'how many', 'count', 'find all',
            'overdue tasks', 'my tasks', 'assigned to me', 'completed',
            'in progress', 'pending', 'statistics', 'analytics', 'metrics'
        ];
        
        foreach ($dataRequestPatterns as $pattern) {
            if (strpos($message, $pattern) !== false) {
                return true;
            }
        }
        
        return false;
    }
    
    private function generateDataRequest($message, $user, $userRole, $isMarketplace)
    {
        $request = [];
        
        // Task data requests
        if (strpos($message, 'task') !== false) {
            if (strpos($message, 'overdue') !== false) {
                $request = [
                    'action' => 'get_overdue_tasks',
                    'filters' => [
                        'workspace_id' => $this->getCurrentWorkspaceId($user),
                        'assigned_to' => $user->id
                    ]
                ];
            } elseif (strpos($message, 'my') !== false || strpos($message, 'assigned to me') !== false) {
                $request = [
                    'action' => 'get_my_tasks',
                    'filters' => [
                        'workspace_id' => $this->getCurrentWorkspaceId($user),
                        'assigned_to' => $user->id
                    ]
                ];
            } elseif (strpos($message, 'completed') !== false) {
                $request = [
                    'action' => 'get_completed_tasks',
                    'filters' => [
                        'workspace_id' => $this->getCurrentWorkspaceId($user),
                        'assigned_to' => $user->id
                    ]
                ];
            } else {
                $request = [
                    'action' => 'get_tasks',
                    'filters' => [
                        'workspace_id' => $this->getCurrentWorkspaceId($user)
                    ]
                ];
            }
        }
        
        // Project data requests
        elseif (strpos($message, 'project') !== false) {
            if (strpos($message, 'marketplace') !== false || strpos($message, 'post') !== false) {
                $request = [
                    'action' => 'get_marketplace_projects',
                    'filters' => []
                ];
            } else {
                $request = [
                    'action' => 'get_workspace_projects',
                    'filters' => [
                        'workspace_id' => $this->getCurrentWorkspaceId($user)
                    ]
                ];
            }
        }
        
        // Marketplace data requests
        elseif ($isMarketplace) {
            if (strpos($message, 'freelancer') !== false) {
                $request = [
                    'action' => 'get_freelancers',
                    'filters' => []
                ];
            } elseif (strpos($message, 'chat') !== false || strpos($message, 'message') !== false) {
                $request = [
                    'action' => 'get_chats',
                    'filters' => [
                        'user_id' => $user->id
                    ]
                ];
            }
        }
        
        // If we identified a specific data request
        if (!empty($request)) {
            return json_encode([
                'type' => 'data_request',
                'request' => $request,
                'message' => 'I need additional data to answer this.'
            ]);
        }
        
        // Generic data request
        return json_encode([
            'type' => 'data_request',
            'request' => [
                'action' => 'get_context_data',
                'context' => $isMarketplace ? 'marketplace' : 'workspace',
                'user_id' => $user->id,
                'workspace_id' => $this->getCurrentWorkspaceId($user)
            ],
            'message' => 'I need additional data to answer this.'
        ]);
    }
    
    private function generateContextualResponse($message, $user, $userRole, $isMarketplace)
    {
        // Level 2 Context-Aware responses with real context
        $context = $this->buildContextData($user, $userRole, $isMarketplace);
        
        return "I can help you navigate and use the platform. Based on your current context, you have access to " . 
               ($isMarketplace ? "marketplace features like profiles, project discovery, and chat" : "workspace features like tasks, projects, and team collaboration") . 
               ". For specific data about your tasks, projects, or marketplace items, please ask and I'll request that information for you.";
    }
    
    private function getCurrentWorkspaceId($user)
    {
        $workspace = $user->workspaces()->first();
        return $workspace ? $workspace->id : null;
    }
    
    private function buildContextData($user, $userRole, $isMarketplace)
    {
        $context = [
            'user_id' => $user->id,
            'user_role' => $userRole,
            'context' => $isMarketplace ? 'marketplace' : 'workspace',
            'usage_type' => $user->usage_type
        ];
        
        if (!$isMarketplace) {
            $context['workspace_id'] = $this->getCurrentWorkspaceId($user);
            $context['permissions'] = $this->getUserPermissions($userRole);
        }
        
        return $context;
    }
    
    private function getUserPermissions($userRole)
    {
        $permissions = [
            'admin' => ['create_projects', 'manage_users', 'create_tasks', 'assign_tasks', 'delete_tasks'],
            'member' => ['create_tasks', 'assign_tasks', 'comment', 'upload_files'],
            'client' => ['view_tasks', 'view_progress', 'comment']
        ];
        
        return $permissions[$userRole] ?? [];
    }

    /**
     * LEVEL 2 ARCHITECTURE
     * Handle simple data queries directly without AI
     * AI = Brain for guidance/explanations
     * Laravel = Database for facts/counts
     */
    private function handleDirectQuery($message, $user)
    {
        // Marketplace data queries
        if (str_contains($message, 'freelancer') && (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total'))) {
            $count = \App\Models\FreelancerProfile::count();
            return "There are currently **{$count} freelancers** available in the marketplace. You can browse them by visiting the Marketplace section.";
        }
        
        if (str_contains($message, 'project') && str_contains($message, 'marketplace') && (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total'))) {
            $count = \App\Models\ProjectPost::count();
            return "There are currently **{$count} projects** posted in the marketplace. Clients are actively looking for freelancers to help with these projects.";
        }
        
        // Workspace data queries
        $workspaceId = $this->getCurrentWorkspaceId($user);
        
        if ($workspaceId && str_contains($message, 'task') && 
            (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total'))) {
            
            // Overdue tasks
            if (str_contains($message, 'overdue')) {
                $count = Task::whereHas('project', function($q) use ($workspaceId) {
                        $q->where('workspace_id', $workspaceId);
                    })
                    ->where('assigned_to_user_id', $user->id)
                    ->where('due_on', '<', now())
                    ->whereNotIn('status', ['done', 'deployed'])
                    ->count();
                
                if ($count === 0) {
                    return "Great news! You have **no overdue tasks**. All your tasks are on track.";
                } else {
                    return "You have **{$count} overdue task(s)**. You can view them in your task board or dashboard.";
                }
            }
            
            // My tasks
            if (str_contains($message, 'my') || str_contains($message, 'assigned to me')) {
                $count = Task::whereHas('project', function($q) use ($workspaceId) {
                        $q->where('workspace_id', $workspaceId);
                    })
                    ->where('assigned_to_user_id', $user->id)
                    ->count();
                return "You have **{$count} tasks** assigned to you in this workspace.";
            }
            
            // Total tasks
            $count = Task::whereHas('project', function($q) use ($workspaceId) {
                    $q->where('workspace_id', $workspaceId);
                })->count();
            return "There are **{$count} tasks** total in this workspace.";
        }
        
        if ($workspaceId && str_contains($message, 'project') && (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total')) && !str_contains($message, 'marketplace')) {
            $count = Project::where('workspace_id', $workspaceId)->count();
            return "There are **{$count} projects** in your current workspace.";
        }
        
        // Team member queries
        if ($workspaceId && (str_contains($message, 'team') || str_contains($message, 'member') || str_contains($message, 'user')) && (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total'))) {
            $totalUsers = \App\Models\User::whereHas('workspaces', function($q) use ($workspaceId) {
                $q->where('workspace_id', $workspaceId);
            })->count();
            
            $adminCount = \App\Models\User::whereHas('workspaces', function($q) use ($workspaceId) {
                    $q->where('workspace_id', $workspaceId)->where('role', 'admin');
                })->count();
                
            $memberCount = \App\Models\User::whereHas('workspaces', function($q) use ($workspaceId) {
                    $q->where('workspace_id', $workspaceId)->where('role', 'member');
                })->count();
                
            $clientCount = \App\Models\User::whereHas('workspaces', function($q) use ($workspaceId) {
                    $q->where('workspace_id', $workspaceId)->where('role', 'client');
                })->count();
            
            return "There are **{$totalUsers} team members** in your workspace: **{$adminCount} admins**, **{$memberCount} members**, and **{$clientCount} clients**.";
        }
        
        // Chat/Messages - only for data queries
        if ((str_contains($message, 'chat') || str_contains($message, 'message')) && 
            (str_contains($message, 'how many') || str_contains($message, 'count') || str_contains($message, 'total') || str_contains($message, 'unread') || str_contains($message, 'new'))) {
            
            // Check for unread messages first
            if (str_contains($message, 'unread') || str_contains($message, 'new')) {
                $unreadCount = \App\Models\PreProjectChat::where(function($q) use ($user) {
                        $q->where('client_id', $user->id)
                          ->orWhere('freelancer_id', $user->id);
                    })
                    ->whereHas('messages', function($q) use ($user) {
                        $q->where('sender_id', '!=', $user->id)
                          ->whereNull('read_at');
                    })
                    ->count();
                
                if ($unreadCount === 0) {
                    return "You have **no unread messages**. Your inbox is clear!";
                } else {
                    return "You have **{$unreadCount} conversation(s)** with unread messages. Check your Messages section.";
                }
            }
            
            // Total chat conversations
            $totalChats = \App\Models\PreProjectChat::where(function($q) use ($user) {
                    $q->where('client_id', $user->id)
                      ->orWhere('freelancer_id', $user->id);
                })->count();
            
            $unreadCount = \App\Models\PreProjectChat::where(function($q) use ($user) {
                    $q->where('client_id', $user->id)
                      ->orWhere('freelancer_id', $user->id);
                })
                ->whereHas('messages', function($q) use ($user) {
                    $q->where('sender_id', '!=', $user->id)
                      ->whereNull('read_at');
                })
                ->count();
            
            if ($totalChats === 0) {
                return "You have **no chat conversations**. Start a conversation in the Marketplace to begin chatting!";
            } else {
                $readCount = $totalChats - $unreadCount;
                return "You have **{$totalChats} total chat conversations**: **{$readCount} read** and **{$unreadCount} with unread messages**.";
            }
        }
        
                
        // General help patterns - let AI handle these
        return null;
    }

    // Level 3 AI Assistant - Data Retrieval Methods
    
    public function getOverdueTasks(Request $request)
    {
        $user = $request->user();
        $workspaceId = $request->get('workspace_id');
        $assignedTo = $request->get('assigned_to', $user->id);
        
        $tasks = Task::whereHas('project', function($query) use ($workspaceId) {
                $query->where('workspace_id', $workspaceId);
            })
            ->where('assigned_to_user_id', $assignedTo)
            ->where('due_on', '<', now())
            ->whereNotIn('status', ['done', 'deployed'])
            ->with(['project', 'assignedUser'])
            ->get();
            
        return response()->json([
            'count' => $tasks->count(),
            'tasks' => $tasks->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'due_on' => $task->due_on,
                    'project' => $task->project->name,
                    'assigned_to' => $task->assignedUser->name,
                    'days_overdue' => now()->diffInDays($task->due_on)
                ];
            })
        ]);
    }
    
    public function getMyTasks(Request $request)
    {
        $user = $request->user();
        $workspaceId = $request->get('workspace_id');
        $assignedTo = $request->get('assigned_to', $user->id);
        
        $tasks = Task::whereHas('project', function($query) use ($workspaceId) {
                $query->where('workspace_id', $workspaceId);
            })
            ->where('assigned_to_user_id', $assignedTo)
            ->with(['project', 'assignedUser'])
            ->orderBy('due_on')
            ->get();
            
        return response()->json([
            'count' => $tasks->count(),
            'tasks' => $tasks->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'due_on' => $task->due_on,
                    'project' => $task->project->name,
                    'priority' => $task->priority ?? 'medium'
                ];
            })
        ]);
    }
    
    public function getCompletedTasks(Request $request)
    {
        $user = $request->user();
        $workspaceId = $request->get('workspace_id');
        $assignedTo = $request->get('assigned_to', $user->id);
        
        // Get workspace to determine user role
        $workspace = \App\Models\Workspace::find($workspaceId);
        $userRole = $workspace ? $workspace->getUserRole($user) : null;
        
        $query = Task::whereHas('project', function($query) use ($workspaceId) {
                $query->where('workspace_id', $workspaceId);
            })
            ->whereIn('status', ['done', 'deployed'])
            ->with(['project', 'assignedUser']);
        
        // Apply strict task-level permissions for members
        if ($userRole === 'member') {
            // Members can see:
            // 1. Unassigned tasks (assigned_to_user_id is null) in projects they're team members of
            // 2. Tasks assigned to them
            // 3. Tasks they created
            $query->where(function ($q) use ($user) {
                $q->whereNull('assigned_to_user_id') // Unassigned tasks
                    ->whereHas('project.teamMembers', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    })
                  ->orWhere('assigned_to_user_id', $user->id) // Assigned to them
                  ->orWhere('created_by_user_id', $user->id); // Created by them
            });
        } elseif ($userRole === 'admin') {
            // Admin can see all tasks, but if assigned_to filter is provided, respect it
            if ($assignedTo && $assignedTo != $user->id) {
                $query->where('assigned_to_user_id', $assignedTo);
            }
        } else {
            // For clients or other roles, filter by assigned_to
            $query->where('assigned_to_user_id', $assignedTo);
        }
        
        $tasks = $query->orderBy('updated_at', 'desc')
            ->limit(50)
            ->get();
            
        return response()->json([
            'count' => $tasks->count(),
            'tasks' => $tasks->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'completed_at' => $task->updated_at,
                    'project' => $task->project->name
                ];
            })
        ]);
    }
    
    public function getTasks(Request $request)
    {
        $user = $request->user();
        $workspaceId = $request->get('workspace_id');
        
        // Get workspace to determine user role
        $workspace = \App\Models\Workspace::find($workspaceId);
        $userRole = $workspace ? $workspace->getUserRole($user) : null;
        
        $query = Task::whereHas('project', function($query) use ($workspaceId) {
                $query->where('workspace_id', $workspaceId);
            })
            ->with(['project', 'assignedUser']);
        
        // Apply strict task-level permissions for members
        if ($userRole === 'member') {
            // Members can see:
            // 1. Unassigned tasks (assigned_to_user_id is null) in projects they're team members of
            // 2. Tasks assigned to them
            // 3. Tasks they created
            $query->where(function ($q) use ($user) {
                $q->whereNull('assigned_to_user_id') // Unassigned tasks
                    ->whereHas('project.teamMembers', function ($subQ) use ($user) {
                        $subQ->where('user_id', $user->id);
                    })
                  ->orWhere('assigned_to_user_id', $user->id) // Assigned to them
                  ->orWhere('created_by_user_id', $user->id); // Created by them
            });
        }
        // Admin and client can see all tasks (no filtering needed)
        
        $tasks = $query->orderBy('created_at', 'desc')
            ->limit(100)
            ->get();
            
        return response()->json([
            'count' => $tasks->count(),
            'tasks' => $tasks->map(function($task) {
                return [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'project' => $task->project->name,
                    'assigned_to' => $task->assignedUser?->name
                ];
            })
        ]);
    }
    
    public function getMarketplaceProjects(Request $request)
    {
        $projects = \App\Models\ProjectPost::with(['client.user'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
            
        return response()->json([
            'count' => $projects->count(),
            'projects' => $projects->map(function($project) {
                return [
                    'id' => $project->id,
                    'title' => $project->title,
                    'description' => substr($project->description, 0, 200) . '...',
                    'budget_min' => $project->budget_min,
                    'budget_max' => $project->budget_max,
                    'client' => $project->client->user->name,
                    'posted_at' => $project->created_at
                ];
            })
        ]);
    }
    
    public function getWorkspaceProjects(Request $request)
    {
        $user = $request->user();
        $workspaceId = $request->get('workspace_id');
        
        $projects = Project::where('workspace_id', $workspaceId)
            ->with(['owner'])
            ->orderBy('created_at', 'desc')
            ->get();
            
        return response()->json([
            'count' => $projects->count(),
            'projects' => $projects->map(function($project) {
                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'description' => substr($project->description, 0, 200) . '...',
                    'owner' => $project->owner->name,
                    'created_at' => $project->created_at
                ];
            })
        ]);
    }
    
    public function getFreelancers(Request $request)
    {
        $freelancers = \App\Models\FreelancerProfile::with(['user'])
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
            
        return response()->json([
            'count' => $freelancers->count(),
            'freelancers' => $freelancers->map(function($freelancer) {
                return [
                    'id' => $freelancer->id,
                    'name' => $freelancer->user->name,
                    'title' => $freelancer->title,
                    'rate_min' => $freelancer->rate_min,
                    'rate_max' => $freelancer->rate_max,
                    'availability' => $freelancer->availability,
                    'skills' => $freelancer->skills ?? []
                ];
            })
        ]);
    }
    
    public function getChats(Request $request)
    {
        $user = $request->user();
        $userId = $request->get('user_id', $user->id);
        
        $chats = \App\Models\PreProjectChat::where(function($query) use ($userId) {
                $query->where('client_id', $userId)
                      ->orWhere('freelancer_id', $userId);
            })
            ->with(['client', 'freelancer'])
            ->orderBy('last_message_at', 'desc')
            ->get();
            
        return response()->json([
            'count' => $chats->count(),
            'chats' => $chats->map(function($chat) use ($userId) {
                $otherUser = $chat->client_id === $userId ? $chat->freelancer : $chat->client;
                return [
                    'id' => $chat->id,
                    'other_user' => $otherUser->name,
                    'last_message_at' => $chat->last_message_at,
                    'unread_count' => $chat->messages()
                        ->where('sender_id', '!=', $userId)
                        ->whereNull('read_at')
                        ->count()
                ];
            })
        ]);
    }
}
