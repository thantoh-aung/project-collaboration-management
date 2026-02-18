# Freelancer-First SaaS Collaboration Platform — Full Design Document

> **Flow:** Marketplace (discovery & negotiation) → Workspace (execution)
> **Inspired by:** Upwork + Slack + ClickUp/Jira

---

## Table of Contents

1. [User Flow](#1-user-flow)
2. [Database Schema](#2-database-schema)
3. [API Routes](#3-api-routes)
4. [Authorization & Permission Logic](#4-authorization--permission-logic)
5. [UI Layout Structure](#5-ui-layout-structure)

---

## 1. User Flow

### 1.1 Registration & Onboarding

```
[Landing Page]
      │
      ▼
[Sign Up] ── email + password
      │
      ▼
[Choose Usage Type]
      │
      ├── "Client"       → Complete Client Profile → Marketplace Home
      ├── "Freelancer"   → Complete Freelancer Profile → Marketplace Home
      └── "Team Member"  → Skip Marketplace → Pending (wait for workspace invite)
```

### 1.2 Marketplace Flow (Client → Freelancer)

```
[Client logs in]
      │
      ▼
[Marketplace Home] ── Browse / Search freelancers
      │
      ▼
[Freelancer Profile Page] ── View skills, portfolio, rate, availability
      │
      ▼
[Start Chat] ── 1:1 private negotiation channel
      │
      ▼
[Pre-Project Chat] ── Text + file upload, discuss scope/budget/timeline
      │
      ▼
[Agreement Reached] ── Freelancer clicks "Start Project"
      │
      ▼
[Workspace Created]
  ├── Freelancer → Owner role
  ├── Client → Client role
  └── Chat → archived (read-only), communication moves to workspace
```

### 1.3 Workspace Flow (Execution)

```
[Workspace Dashboard]
      │
      ├── [Projects] ── Create / manage projects (ClickUp-style boards)
      │     ├── Task Groups (columns)
      │     ├── Tasks (cards with drawer detail)
      │     ├── Attachments, Comments, Time Logs
      │     └── Invoices
      │
      ├── [Team] ── Owner invites team members
      │     └── Members get "member" role
      │
      ├── [Chat] ── Workspace-scoped messaging (future)
      │
      ├── [Reports] ── Time, billing, progress
      │
      └── [Settings] ── Workspace config (owner only)
```

### 1.4 Team Member Flow

```
[Team Member signs up] ── chooses "Team Member"
      │
      ▼
[Pending State] ── No marketplace access, waits for invite
      │
      ▼
[Receives Workspace Invite] ── email or join code
      │
      ▼
[Joins Workspace] ── Gets "member" role
      │
      ▼
[Workspace Dashboard] ── Works on assigned tasks
```

---

## 2. Database Schema

### 2.1 Existing Tables (NO CHANGES)

These tables remain untouched. The workspace/project/task system is reused as-is.

| Table | Purpose |
|---|---|
| `users` | Core user accounts |
| `workspaces` | Workspace containers |
| `workspace_users` | Workspace membership + roles |
| `workspace_invitations` | Workspace invites |
| `projects` | Projects within workspaces |
| `project_user_access` | Project-level team access |
| `tasks` | Tasks within projects |
| `task_groups` | Task board columns |
| `comments` | Task comments |
| `attachments` | Task file attachments |
| `time_logs` | Time tracking |
| `invoices` | Billing |
| `subtasks` | Subtasks (feature removed from UI but table exists) |
| `activities` | Activity log |
| `labels` | Task labels |
| `countries` | Country reference |
| `currencies` | Currency reference |
| `client_companies` | Client company entities |
| `owner_companies` | Owner company entities |
| `notifications` | In-app notifications |

### 2.2 New Tables

#### `user_types` (add column to `users` table)

```sql
-- Migration: add_usage_type_to_users_table
ALTER TABLE users ADD COLUMN usage_type ENUM('client', 'freelancer', 'team_member') NULL AFTER role;
ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE AFTER usage_type;
```

#### `freelancer_profiles`

```sql
CREATE TABLE freelancer_profiles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
    title           VARCHAR(255) NULL,          -- "Full-Stack Developer"
    bio             TEXT NULL,
    skills          JSON NULL,                  -- ["React", "Laravel", "Figma"]
    portfolio_links JSON NULL,                  -- [{"title": "...", "url": "..."}]
    rate_min        DECIMAL(10,2) NULL,
    rate_max        DECIMAL(10,2) NULL,
    rate_currency   VARCHAR(3) DEFAULT 'USD',
    availability    ENUM('available', 'limited', 'unavailable') DEFAULT 'available',
    country         VARCHAR(100) NULL,
    timezone        VARCHAR(100) NULL,
    status          ENUM('draft', 'published') DEFAULT 'draft',
    featured        BOOLEAN DEFAULT FALSE,
    total_projects  INT UNSIGNED DEFAULT 0,
    avg_rating      DECIMAL(3,2) DEFAULT 0.00,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_status (status),
    INDEX idx_availability (availability),
    INDEX idx_avg_rating (avg_rating)
);
```

#### `client_profiles`

```sql
CREATE TABLE client_profiles (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id         BIGINT UNSIGNED NOT NULL UNIQUE,
    company_name    VARCHAR(255) NULL,
    industry        VARCHAR(255) NULL,
    country         VARCHAR(100) NULL,
    timezone        VARCHAR(100) NULL,
    website         VARCHAR(500) NULL,
    total_projects  INT UNSIGNED DEFAULT 0,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

#### `pre_project_chats`

```sql
CREATE TABLE pre_project_chats (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    client_id       BIGINT UNSIGNED NOT NULL,
    freelancer_id   BIGINT UNSIGNED NOT NULL,
    status          ENUM('open', 'archived', 'converted_to_workspace') DEFAULT 'open',
    workspace_id    BIGINT UNSIGNED NULL,       -- Set when converted
    last_message_at TIMESTAMP NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE SET NULL,
    UNIQUE KEY unique_chat (client_id, freelancer_id),
    INDEX idx_status (status)
);
```

#### `pre_project_messages`

```sql
CREATE TABLE pre_project_messages (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    chat_id         BIGINT UNSIGNED NOT NULL,
    sender_id       BIGINT UNSIGNED NOT NULL,
    body            TEXT NOT NULL,
    type            ENUM('text', 'file') DEFAULT 'text',
    file_path       VARCHAR(500) NULL,
    file_name       VARCHAR(255) NULL,
    file_size       INT UNSIGNED NULL,
    read_at         TIMESTAMP NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (chat_id) REFERENCES pre_project_chats(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_chat_created (chat_id, created_at)
);
```

#### `freelancer_reviews`

```sql
CREATE TABLE freelancer_reviews (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    freelancer_id   BIGINT UNSIGNED NOT NULL,
    client_id       BIGINT UNSIGNED NOT NULL,
    workspace_id    BIGINT UNSIGNED NOT NULL,
    rating          TINYINT UNSIGNED NOT NULL,  -- 1-5
    comment         TEXT NULL,
    created_at      TIMESTAMP NULL,
    updated_at      TIMESTAMP NULL,

    FOREIGN KEY (freelancer_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    UNIQUE KEY unique_review (client_id, workspace_id)
);
```

### 2.3 Entity Relationship Summary

```
users
  ├── 1:1  freelancer_profiles
  ├── 1:1  client_profiles
  ├── 1:N  pre_project_chats (as client OR freelancer)
  ├── 1:N  pre_project_messages (as sender)
  ├── 1:N  freelancer_reviews (as freelancer OR client)
  ├── M:N  workspaces (via workspace_users)
  ├── M:N  projects (via project_user_access)
  ├── 1:N  tasks (created_by / assigned_to)
  └── 1:N  comments, time_logs, attachments

pre_project_chats
  ├── N:1  users (client)
  ├── N:1  users (freelancer)
  ├── 1:N  pre_project_messages
  └── 0:1  workspaces (when converted)

workspaces (EXISTING — no changes)
  ├── N:1  users (owner)
  ├── M:N  users (via workspace_users)
  ├── 1:N  projects
  └── 1:N  workspace_invitations
```

---

## 3. API Routes

### 3.1 Authentication (Existing — Minor Extension)

```
POST   /register                          # Extended: accepts usage_type
POST   /login                             # No change
GET    /logout                            # No change
```

### 3.2 Onboarding

```
GET    /onboarding/profile                # Show profile completion form based on usage_type
POST   /onboarding/profile                # Save profile (freelancer or client)
POST   /onboarding/skip                   # Team members skip to pending state
```

### 3.3 Marketplace (Public/Auth — NO workspace middleware)

```
# Freelancer Discovery
GET    /marketplace                        # Marketplace home — browse freelancers
GET    /marketplace/freelancers            # Search/filter freelancers (API)
GET    /marketplace/freelancers/{slug}     # Freelancer public profile page

# Freelancer Profile Management (own profile)
GET    /marketplace/profile                # View own freelancer profile
PUT    /marketplace/profile                # Update own freelancer profile
POST   /marketplace/profile/publish        # Set status to "published"
POST   /marketplace/profile/unpublish      # Set status to "draft"

# Client Profile Management (own profile)
GET    /marketplace/client-profile         # View own client profile
PUT    /marketplace/client-profile         # Update own client profile
```

### 3.4 Pre-Project Chat (Auth — NO workspace middleware)

```
# Chat Management
GET    /marketplace/chats                  # List all my chats
POST   /marketplace/chats                  # Start new chat (client → freelancer)
GET    /marketplace/chats/{chat}           # Get chat with messages
POST   /marketplace/chats/{chat}/messages  # Send message
POST   /marketplace/chats/{chat}/upload    # Upload file in chat
POST   /marketplace/chats/{chat}/archive   # Archive chat

# Convert to Workspace (Freelancer only)
POST   /marketplace/chats/{chat}/convert   # "Start Project" → creates workspace
```

### 3.5 Workspace Routes (Existing — NO changes)

All existing workspace, project, task, comment, attachment, invoice, time-log routes remain exactly as they are under `workspace.auth` middleware.

```
# Existing routes preserved:
GET    /dashboard
GET    /projects
GET    /projects/{project}/tasks
POST   /projects/{project}/tasks
PATCH  /tasks/{task}
DELETE /tasks/{task}
POST   /tasks/{task}/comments
POST   /tasks/{task}/attachments
# ... all other existing routes unchanged
```

### 3.6 Reviews (Auth — after workspace completion)

```
POST   /marketplace/reviews                # Client leaves review for freelancer
GET    /marketplace/freelancers/{slug}/reviews  # Public reviews on profile
```

### 3.7 Route Summary Table

| Domain | Middleware | Prefix | Purpose |
|---|---|---|---|
| Auth | `guest` | `/` | Login, Register |
| Onboarding | `auth` | `/onboarding` | Profile setup |
| Marketplace | `auth` | `/marketplace` | Discovery, profiles, chat |
| Workspace | `auth` + `workspace.auth` | `/` | Projects, tasks, billing |

---

## 4. Authorization & Permission Logic

### 4.1 Global Role Matrix

| Capability | Client | Freelancer | Team Member |
|---|---|---|---|
| Marketplace access | ✅ Browse + Chat | ✅ Profile + Chat | ❌ |
| Start chat | ✅ Initiates | ✅ Responds | ❌ |
| Create workspace | ❌ | ✅ (via "Start Project") | ❌ |
| Join workspace | ✅ (auto on convert) | ✅ (owner) | ✅ (via invite) |
| Public profile | ❌ | ✅ (when published) | ❌ |

### 4.2 Workspace Role Matrix

| Capability | Owner (Freelancer) | Member (Team) | Client (Observer) |
|---|---|---|---|
| Create projects | ✅ | ❌ | ❌ |
| Edit projects | ✅ | ❌ | ❌ |
| Delete projects | ✅ | ❌ | ❌ |
| Create tasks | ✅ | ✅ | ❌ |
| Assign tasks | ✅ | ❌ | ❌ |
| Change task priority | ✅ | ❌ | ❌ |
| Change task due date | ✅ | ❌ | ❌ |
| Update task status | ✅ | ✅ (own tasks) | ❌ |
| Upload attachments | ✅ | ✅ (own tasks) | ❌ |
| Delete attachments | ✅ | ✅ (own) | ❌ |
| Comment on tasks | ✅ | ✅ | ✅ |
| View tasks | ✅ | ✅ | ✅ (assigned projects) |
| Drag tasks (board) | ✅ | ✅ (own tasks) | ❌ |
| Invite members | ✅ | ❌ | ❌ |
| Invite clients | ✅ | ❌ | ❌ |
| Manage billing | ✅ | ❌ | ✅ (view only) |
| Workspace settings | ✅ | ❌ | ❌ |
| View reports | ✅ | ✅ (own data) | ✅ (project data) |
| Leave review | ❌ | ❌ | ✅ |

### 4.3 Marketplace Permission Logic

```php
// Middleware: EnsureMarketplaceAccess
class EnsureMarketplaceAccess
{
    public function handle($request, Closure $next)
    {
        $user = $request->user();

        // Team members cannot access marketplace
        if ($user->usage_type === 'team_member') {
            abort(403, 'Team members do not have marketplace access.');
        }

        return $next($request);
    }
}
```

### 4.4 Pre-Project Chat Permission Logic

```php
// Only clients can START a chat
// Both client and freelancer can SEND messages
// Only freelancer can CONVERT to workspace

class ChatPolicy
{
    public function create(User $user): bool
    {
        return $user->usage_type === 'client';
    }

    public function sendMessage(User $user, PreProjectChat $chat): bool
    {
        return $chat->client_id === $user->id || $chat->freelancer_id === $user->id;
    }

    public function convert(User $user, PreProjectChat $chat): bool
    {
        return $chat->freelancer_id === $user->id && $chat->status === 'open';
    }
}
```

### 4.5 Workspace Creation Logic (Convert Chat → Workspace)

```php
// Service: WorkspaceCreationService
class WorkspaceCreationService
{
    public function createFromChat(PreProjectChat $chat, string $workspaceName): Workspace
    {
        DB::transaction(function () use ($chat, $workspaceName, &$workspace) {
            // 1. Create workspace
            $workspace = Workspace::create([
                'name'      => $workspaceName,
                'slug'      => Workspace::generateSlug($workspaceName),
                'owner_id'  => $chat->freelancer_id,
                'join_code' => Workspace::generateJoinCode(),
                'is_active' => true,
            ]);

            // 2. Add freelancer as owner (admin)
            $workspace->addUser(
                User::find($chat->freelancer_id),
                'admin'
            );

            // 3. Add client as client role
            $workspace->addUser(
                User::find($chat->client_id),
                'client'
            );

            // 4. Mark chat as converted
            $chat->update([
                'status'       => 'converted_to_workspace',
                'workspace_id' => $workspace->id,
            ]);
        });

        return $workspace;
    }
}
```

### 4.6 Workspace Permission Enforcement (Existing — Enhanced)

The existing `workspace.auth` middleware and `WorkspaceUser` role system is reused. The `EnhancedTaskDetailDrawer` permission logic already implements:

```javascript
// Frontend permission checks (EnhancedTaskDetailDrawer.jsx)
const isAdmin = userRole === 'admin' || userRole === 'project_owner';
const isAssignedMember = localTask?.assigned_to_user_id === currentUserId;

const canReassign         = isAdmin;
const canChangePriority   = isAdmin;
const canChangeDueDate    = isAdmin;
const canUpdateStatus     = isAdmin || isAssignedMember;
const canUploadAttachments = isAdmin || isAssignedMember;
const canComment          = true; // All workspace members
```

### 4.7 Backend Policy Summary

```php
// TaskPolicy.php
class TaskPolicy
{
    public function update(User $user, Task $task): bool
    {
        $role = $this->getWorkspaceRole($user, $task);
        if ($role === 'admin') return true;
        if ($role === 'member' && $task->assigned_to_user_id === $user->id) return true;
        return false;
    }

    public function updateStatus(User $user, Task $task): bool
    {
        $role = $this->getWorkspaceRole($user, $task);
        if ($role === 'admin') return true;
        if ($role === 'member' && $task->assigned_to_user_id === $user->id) return true;
        return false;
    }

    public function comment(User $user, Task $task): bool
    {
        // All workspace members can comment
        return $this->getWorkspaceRole($user, $task) !== null;
    }

    public function view(User $user, Task $task): bool
    {
        $role = $this->getWorkspaceRole($user, $task);
        if ($role === 'admin' || $role === 'member') return true;
        // Clients can view tasks in projects they have access to
        if ($role === 'client') {
            return $task->project->teamMembers()
                ->where('users.id', $user->id)
                ->exists();
        }
        return false;
    }
}
```

---

## 5. UI Layout Structure

### 5.1 Layout Architecture

```
App
├── MarketplaceLayout          # For /marketplace/* routes
│   ├── MarketplaceNavbar      # Logo, Search, Profile, Messages
│   ├── <PageContent />        # Dynamic page content
│   └── MarketplaceFooter      # Links, copyright
│
├── WorkspaceLayout (MainLayout.jsx — EXISTING)
│   ├── TopBar                 # Workspace name, notifications, user menu
│   ├── Sidebar                # Projects, Tasks, Team, Billing, Settings
│   └── <PageContent />        # Dynamic page content
│
└── AuthLayout                 # For /login, /register, /onboarding
    └── <PageContent />        # Centered card layout
```

### 5.2 Marketplace Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  MarketplaceNavbar                                              │
│  ┌──────┐  ┌─────────────────────┐  ┌────┐ ┌────┐ ┌─────────┐ │
│  │ Logo │  │ Search freelancers  │  │Chat│ │Bell│ │ Profile ▼│ │
│  └──────┘  └─────────────────────┘  └────┘ └────┘ └─────────┘ │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Page Content Area                                              │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Marketplace Home / Search Results / Profile / Chat      │   │
│  │                                                          │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │   │
│  │  │Freelancer│ │Freelancer│ │Freelancer│ │Freelancer│   │   │
│  │  │  Card    │ │  Card    │ │  Card    │ │  Card    │   │   │
│  │  │          │ │          │ │          │ │          │   │   │
│  │  │ Photo    │ │ Photo    │ │ Photo    │ │ Photo    │   │   │
│  │  │ Title    │ │ Title    │ │ Title    │ │ Title    │   │   │
│  │  │ Skills   │ │ Skills   │ │ Skills   │ │ Skills   │   │   │
│  │  │ Rate     │ │ Rate     │ │ Rate     │ │ Rate     │   │   │
│  │  │ Rating ★ │ │ Rating ★ │ │ Rating ★ │ │ Rating ★ │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  MarketplaceFooter                                              │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Marketplace Pages

#### 5.3.1 Marketplace Home (`/marketplace`)

```
┌─────────────────────────────────────────────────────────┐
│  Hero Section                                           │
│  ┌───────────────────────────────────────────────────┐  │
│  │  bg-gradient-to-r from-indigo-600 to-purple-600   │  │
│  │                                                   │  │
│  │  "Find the perfect freelancer"                    │  │
│  │  [Search bar with skill/keyword input]            │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Filter Bar                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │ [Skills ▼] [Rate Range ▼] [Availability ▼]       │  │
│  │ [Country ▼] [Rating ▼] [Sort: Relevance ▼]       │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Results Grid (responsive 1-4 columns)                  │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐          │
│  │ Freelancer │ │ Freelancer │ │ Freelancer │          │
│  │ Card       │ │ Card       │ │ Card       │          │
│  └────────────┘ └────────────┘ └────────────┘          │
│                                                         │
│  [Load More / Pagination]                               │
└─────────────────────────────────────────────────────────┘
```

#### 5.3.2 Freelancer Profile Page (`/marketplace/freelancers/{slug}`)

```
┌─────────────────────────────────────────────────────────┐
│  Profile Header                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ┌─────┐                                         │  │
│  │  │Photo│  Name                                    │  │
│  │  │     │  Title                                   │  │
│  │  └─────┘  ★★★★☆ (4.2) · 12 projects              │  │
│  │           🟢 Available · $50-80/hr                │  │
│  │           📍 Country · Timezone                    │  │
│  │                                                   │  │
│  │  [Contact Freelancer]  ← gradient indigo button   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────┐ ┌───────────────────────────┐  │
│  │  About              │ │  Skills                   │  │
│  │  Bio text...        │ │  [React] [Laravel] [UI]   │  │
│  │                     │ │                           │  │
│  │  Portfolio           │ │  Availability             │  │
│  │  • Link 1           │ │  🟢 Available              │  │
│  │  • Link 2           │ │                           │  │
│  └─────────────────────┘ └───────────────────────────┘  │
│                                                         │
│  Reviews Section                                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ★★★★★  "Great work!"  — Client Name, 2 days ago │  │
│  │  ★★★★☆  "Good comm..."  — Client Name, 1 week    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

#### 5.3.3 Pre-Project Chat Page (`/marketplace/chats/{chat}`)

```
┌─────────────────────────────────────────────────────────┐
│  Chat Header                                            │
│  ┌───────────────────────────────────────────────────┐  │
│  │  ← Back   [Photo] Freelancer Name   [Start Project]│ │
│  │                                      (freelancer   │  │
│  │                                       only button) │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Messages Area (scrollable)                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [Avatar] Client: "Hi, I need a React developer"  │  │
│  │                                                   │  │
│  │           Freelancer: "Sure, what's the scope?"   │  │
│  │                                      [Avatar]     │  │
│  │                                                   │  │
│  │  [Avatar] Client: "E-commerce platform..."        │  │
│  │           [attached: requirements.pdf]             │  │
│  │                                                   │  │
│  │           Freelancer: "I can do this for $X"      │  │
│  │                                      [Avatar]     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Input Area                                             │
│  ┌───────────────────────────────────────────────────┐  │
│  │  [📎] [Type a message...                ] [Send]  │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Workspace Layout (EXISTING — No Changes)

The existing `MainLayout.jsx` with sidebar navigation is preserved exactly as-is:

```
┌──────────────────────────────────────────────────────────┐
│  TopBar (Logo, Workspace Switcher, Notifications, User)  │
├────────────┬─────────────────────────────────────────────┤
│  Sidebar   │  Page Content                               │
│            │                                             │
│  Dashboard │  ┌─────────────────────────────────────┐    │
│  Projects  │  │  Project Board / Task Drawer / etc  │    │
│  Tasks     │  │                                     │    │
│  Team      │  │  (ClickUp-style task management)    │    │
│  Clients   │  │                                     │    │
│  Billing   │  └─────────────────────────────────────┘    │
│  Reports   │                                             │
│  Settings  │                                             │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### 5.5 Design System Tokens

```css
/* Primary Actions */
.btn-primary {
    @apply bg-gradient-to-r from-indigo-600 to-purple-600
           hover:from-indigo-700 hover:to-purple-700
           shadow-lg shadow-indigo-500/30
           text-white font-medium rounded-lg;
}

/* Success States */
.badge-success {
    @apply bg-gradient-to-r from-emerald-500 to-green-500
           shadow-sm shadow-emerald-500/20
           text-white rounded-full;
}

/* Warning States */
.badge-warning {
    @apply bg-gradient-to-r from-yellow-500 to-amber-500
           shadow-sm shadow-yellow-500/20
           text-white rounded-full;
}

/* Danger States */
.badge-danger {
    @apply bg-gradient-to-r from-red-500 to-rose-500
           shadow-sm shadow-red-500/20
           text-white rounded-full;
}

/* Page Headers */
.page-title {
    @apply text-3xl font-bold
           bg-gradient-to-r from-indigo-600 to-purple-600
           bg-clip-text text-transparent;
}

/* Cards */
.card {
    @apply bg-white rounded-xl border border-gray-200
           shadow-sm hover:shadow-lg hover:shadow-indigo-500/10
           hover:border-indigo-200 transition-all duration-200;
}

/* No glassmorphism — solid backgrounds only */
.dropdown {
    @apply bg-white border border-gray-300 shadow-xl rounded-lg;
}
```

### 5.6 Frontend File Structure (New Files)

```
resources/js/
├── Layouts/
│   ├── MainLayout.jsx              # EXISTING — workspace layout
│   └── MarketplaceLayout.jsx       # NEW — marketplace layout
│
├── Pages/
│   ├── Auth/
│   │   ├── Login.jsx               # EXISTING
│   │   ├── Register.jsx            # MODIFIED — add usage_type selection
│   │   └── ...
│   │
│   ├── Onboarding/
│   │   ├── Wizard.jsx              # EXISTING
│   │   ├── FreelancerProfile.jsx   # NEW — freelancer profile setup
│   │   └── ClientProfile.jsx       # NEW — client profile setup
│   │
│   ├── Marketplace/
│   │   ├── Home.jsx                # NEW — marketplace home + search
│   │   ├── FreelancerProfile.jsx   # NEW — public freelancer profile
│   │   ├── MyProfile.jsx           # NEW — edit own profile
│   │   ├── ChatList.jsx            # NEW — list of pre-project chats
│   │   └── Chat.jsx                # NEW — single chat conversation
│   │
│   ├── Dashboard/                  # EXISTING
│   ├── Projects/                   # EXISTING
│   ├── Tasks/                      # EXISTING
│   └── ...                         # All existing pages unchanged
│
├── Components/
│   ├── Marketplace/
│   │   ├── FreelancerCard.jsx      # NEW — freelancer grid card
│   │   ├── SearchFilters.jsx       # NEW — filter bar
│   │   ├── SkillBadge.jsx          # NEW — skill tag
│   │   ├── RatingStars.jsx         # NEW — star rating display
│   │   ├── ChatBubble.jsx          # NEW — chat message bubble
│   │   └── StartProjectModal.jsx   # NEW — "Start Project" confirmation
│   │
│   ├── EnhancedTaskDetailDrawer.jsx  # EXISTING
│   └── ...                           # All existing components unchanged
│
├── Context/
│   ├── WorkspaceContext.jsx        # EXISTING
│   └── MarketplaceContext.jsx      # NEW — marketplace state
```

---

## Summary of Changes vs Existing System

### What Changes

| Area | Change |
|---|---|
| `users` table | Add `usage_type` and `onboarding_completed` columns |
| `Register.jsx` | Add usage type selection step |
| New migrations | 5 new tables (profiles, chats, messages, reviews) |
| New routes | `/marketplace/*` and `/onboarding/*` routes |
| New layout | `MarketplaceLayout.jsx` |
| New pages | ~6 new marketplace pages |
| New components | ~7 new marketplace components |
| New models | `FreelancerProfile`, `ClientProfile`, `PreProjectChat`, `PreProjectMessage`, `FreelancerReview` |
| New controllers | `MarketplaceController`, `PreProjectChatController`, `FreelancerProfileController`, `ClientProfileController`, `ReviewController` |
| New middleware | `EnsureMarketplaceAccess` |
| New policies | `ChatPolicy` |
| New service | `WorkspaceCreationService` |

### What Does NOT Change

| Area | Status |
|---|---|
| Workspace system | ✅ Untouched |
| Project system | ✅ Untouched |
| Task system | ✅ Untouched |
| Task groups / board | ✅ Untouched |
| Comments | ✅ Untouched |
| Attachments | ✅ Untouched |
| Time logs | ✅ Untouched |
| Invoices | ✅ Untouched |
| MainLayout.jsx | ✅ Untouched |
| EnhancedTaskDetailDrawer | ✅ Untouched |
| All existing routes | ✅ Untouched |
| All existing middleware | ✅ Untouched |
| Workspace roles (admin/member/client) | ✅ Untouched |
