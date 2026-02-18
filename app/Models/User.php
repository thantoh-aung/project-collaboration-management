<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Auth\Passwords\CanResetPassword;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, CanResetPassword, HasRoles;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'job_title',
        'avatar',
        'phone',
        'rate',
        'google_id',
        'pending_workspace',
        'usage_type',
        'onboarding_completed',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var array
     */
    protected $appends = [
        'avatar_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'rate' => 'decimal:2',
            'archived_at' => 'datetime',
            'pending_workspace' => 'boolean',
            'onboarding_completed' => 'boolean',
        ];
    }

    /**
     * Get the workspaces that this user belongs to.
     */
    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_users')
            ->withPivot('role', 'permissions', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Get the workspace users for this user.
     */
    public function workspaceUsers(): HasMany
    {
        return $this->hasMany(WorkspaceUser::class);
    }

    /**
     * Get workspaces owned by this user.
     */
    public function ownedWorkspaces(): HasMany
    {
        return $this->hasMany(Workspace::class, 'owner_id');
    }

    /**
     * Get the current active workspace for the user.
     */
    public function currentWorkspace(): ?Workspace
    {
        return $this->workspaces()->first();
    }

    /**
     * Check if user is admin of a specific workspace.
     */
    public function isWorkspaceAdmin(Workspace $workspace): bool
    {
        return $this->workspaceUsers()
            ->where('workspace_id', $workspace->id)
            ->where('role', 'admin')
            ->exists();
    }

    /**
     * Get user's role in a specific workspace.
     */
    public function getWorkspaceRole(Workspace $workspace): ?string
    {
        $workspaceUser = $this->workspaceUsers()
            ->where('workspace_id', $workspace->id)
            ->first();

        return $workspaceUser?->role;
    }

    /**
     * Get the projects that the user has access to.
     */
    public function projects(): BelongsToMany
    {
        return $this->belongsToMany(Project::class, 'project_user_access')
            ->withTimestamps();
    }

    /**
     * Get the tasks that the user created.
     */
    public function createdTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'created_by_user_id');
    }

    /**
     * Get the tasks that the user is assigned to.
     */
    public function assignedTasks(): HasMany
    {
        return $this->hasMany(Task::class, 'assigned_to_user_id');
    }

    /**
     * Get the tasks that the user is subscribed to.
     */
    public function subscribedToTasks(): BelongsToMany
    {
        return $this->belongsToMany(Task::class, 'subscribe_task', 'user_id', 'task_id')
            ->withTimestamps();
    }

    /**
     * Get the client companies that the user belongs to.
     */
    public function clientCompanies(): BelongsToMany
    {
        return $this->belongsToMany(ClientCompany::class, 'client_company', 'client_id', 'client_company_id')
            ->withTimestamps();
    }

    /**
     * Get the time logs created by this user.
     */
    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    /**
     * Get the comments created by this user.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the invoices created by this user.
     */
    public function createdInvoices(): HasMany
    {
        return $this->hasMany(Invoice::class, 'created_by_user_id');
    }

    /**
     * Get the activities created by this user.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(Activity::class);
    }

    /**
     * Check if the user is an admin.
     */
    public function isAdmin(): bool
    {
        // Check Spatie role first (legacy)
        if ($this->hasRole('admin')) {
            return true;
        }

        // Check workspace-level admin role
        $workspaceId = session('current_workspace_id');
        if ($workspaceId) {
            return $this->workspaceUsers()
                ->where('workspace_id', $workspaceId)
                ->where('role', 'admin')
                ->exists();
        }

        return false;
    }

    /**
     * Get the freelancer profile.
     */
    public function freelancerProfile(): HasOne
    {
        return $this->hasOne(FreelancerProfile::class);
    }

    /**
     * Get the client profile.
     */
    public function clientProfile(): HasOne
    {
        return $this->hasOne(ClientProfile::class);
    }

    /**
     * Get pre-project chats as client.
     */
    public function clientChats(): HasMany
    {
        return $this->hasMany(PreProjectChat::class, 'client_id');
    }

    /**
     * Get pre-project chats as freelancer.
     */
    public function freelancerChats(): HasMany
    {
        return $this->hasMany(PreProjectChat::class, 'freelancer_id');
    }

    /**
     * Get all pre-project chats (as either client or freelancer).
     */
    public function preProjectChats()
    {
        return PreProjectChat::where('client_id', $this->id)
            ->orWhere('freelancer_id', $this->id);
    }

    /**
     * Get project posts (as client).
     */
    public function projectPosts(): HasMany
    {
        return $this->hasMany(ProjectPost::class);
    }

    /**
     * Get reviews received (as freelancer).
     */
    public function receivedReviews(): HasMany
    {
        return $this->hasMany(FreelancerReview::class, 'freelancer_id');
    }

    /**
     * Get reviews given (as client).
     */
    public function givenReviews(): HasMany
    {
        return $this->hasMany(FreelancerReview::class, 'client_id');
    }

    /**
     * Get the avatar URL with proper fallback.
     */
    public function getAvatarUrlAttribute(): string
    {
        if ($this->avatar) {
            // If avatar is already a full URL, return as is
            if (str_starts_with($this->avatar, 'http')) {
                return $this->avatar;
            }
            // If avatar already starts with '/storage/' or 'storage/', just convert to full URL
            if (str_starts_with($this->avatar, '/storage/') || str_starts_with($this->avatar, 'storage/')) {
                return url($this->avatar);
            }
            // If avatar is a relative path without 'storage/', add it and convert to full URL
            return url('storage/' . $this->avatar);
        }
        
        // Generate default avatar with initials
        $initials = collect(explode(' ', $this->name))
            ->map(fn($word) => strtoupper(substr($word, 0, 1)))
            ->take(2)
            ->join('');
        
        return "https://ui-avatars.com/api/?name=" . urlencode($initials) . "&color=7F9CF5&background=EBF4FF&size=128&bold=true";
    }

    /**
     * Check if the user has access to a specific project.
     */
    public function hasProjectAccess(Project $project): bool
    {
        // Admin users have access to all projects in the workspace
        if ($this->isAdmin()) {
            return true;
        }

        // Check workspace membership — members can access all projects in their workspace
        $workspaceId = session('current_workspace_id');
        if ($workspaceId && $project->workspace_id == $workspaceId) {
            $wsRole = $this->workspaceUsers()
                ->where('workspace_id', $workspaceId)
                ->value('role');
            if ($wsRole === 'member' || $wsRole === 'admin') {
                return true;
            }
        }

        // Check direct project access (for clients or explicit access)
        return $this->projects()->where('projects.id', $project->id)->exists();
    }
}
