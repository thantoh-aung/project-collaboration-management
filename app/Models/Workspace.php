<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Workspace extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo',
        'color',
        'owner_id',
        'is_active',
        'settings',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'settings' => 'array',
            'created_at' => 'datetime',
            'updated_at' => 'datetime',
        ];
    }

    /**
     * Get the owner of the workspace.
     */
    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the users that belong to this workspace.
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'workspace_users')
            ->withPivot('role', 'permissions', 'joined_at')
            ->withTimestamps();
    }

    /**
     * Get the workspace users with their roles.
     */
    public function workspaceUsers(): HasMany
    {
        return $this->hasMany(WorkspaceUser::class);
    }

    /**
     * Get the invitations for this workspace.
     */
    public function invitations(): HasMany
    {
        return $this->hasMany(WorkspaceInvitation::class);
    }

    /**
     * Get the projects for this workspace.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * Check if a user is a member of this workspace.
     */
    public function hasUser(User $user): bool
    {
        return $this->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Get the role of a user in this workspace.
     */
    public function getUserRole(User $user): ?string
    {
        $workspaceUser = $this->workspaceUsers()
            ->where('user_id', $user->id)
            ->first();

        return $workspaceUser?->role;
    }

    /**
     * Check if a user is an admin of this workspace.
     */
    public function isUserAdmin(User $user): bool
    {
        return $this->getUserRole($user) === 'admin';
    }

    /**
     * Add a user to the workspace.
     */
    public function addUser(User $user, string $role = 'member', array $permissions = []): void
    {
        if ($this->users()->where('users.id', $user->id)->exists()) {
            $this->users()->updateExistingPivot($user->id, [
                'role' => $role,
                'permissions' => empty($permissions) ? null : $permissions,
            ]);
            return;
        }

        $this->users()->attach($user->id, [
            'role' => $role,
            'permissions' => empty($permissions) ? null : $permissions,
            'joined_at' => now(),
        ]);
    }

    /**
     * Remove a user from the workspace.
     */
    public function removeUser(User $user): void
    {
        $this->users()->detach($user->id);
    }

    
    /**
     * Generate a unique slug.
     */
    public static function generateSlug(string $name): string
    {
        $slug = str()->slug($name);
        $originalSlug = $slug;
        $counter = 1;

        while (self::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
