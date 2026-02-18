<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;

class TaskGroup extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'name',
        'type',
        'position',
        'archived_at',
    ];

    protected function casts(): array
    {
        return [
            'archived_at' => 'datetime',
        ];
    }

    // System group constants
    const SYSTEM_GROUPS = [
        'to_do' => ['name' => 'To Do', 'position' => 1],
        'in_progress' => ['name' => 'In Progress', 'position' => 2],
        'complete' => ['name' => 'Complete', 'position' => 999],
    ];

    const TYPE_SYSTEM = 'system';
    const TYPE_CUSTOM = 'custom';

    /**
     * Get the project that this task group belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the tasks in this group.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'group_id');
    }

    /**
     * Scope to get groups ordered by position.
     */
    public function scopeOrdered(Builder $query): Builder
    {
        return $query->orderBy('position');
    }

    /**
     * Scope to get system groups only.
     */
    public function scopeSystem(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_SYSTEM);
    }

    /**
     * Scope to get custom groups only.
     */
    public function scopeCustom(Builder $query): Builder
    {
        return $query->where('type', self::TYPE_CUSTOM);
    }

    /**
     * Check if this is a system group.
     */
    public function isSystem(): bool
    {
        return $this->type === self::TYPE_SYSTEM;
    }

    /**
     * Check if this is a custom group.
     */
    public function isCustom(): bool
    {
        return $this->type === self::TYPE_CUSTOM;
    }

    /**
     * Check if this group can be deleted.
     */
    public function canBeDeleted(): bool
    {
        return $this->isCustom();
    }

    /**
     * Check if this group can be renamed.
     */
    public function canBeRenamed(): bool
    {
        return $this->isCustom();
    }

    /**
     * Check if this group can be moved.
     */
    public function canBeMoved(): bool
    {
        return $this->isCustom();
    }

    /**
     * Get the next available position for a custom group.
     */
    public static function getNextCustomPosition(int $projectId): int
    {
        // Get the highest position before Complete (position < 999)
        $maxPosition = static::where('project_id', $projectId)
            ->where('position', '<', 999)
            ->max('position') ?? 2; // Default to 2 (after In Progress)

        return $maxPosition + 1;
    }

    /**
     * Create system groups for a project.
     */
    public static function createSystemGroups(int $projectId): void
    {
        // Check if system groups already exist
        $existingSystemGroups = static::where('project_id', $projectId)
            ->where('type', self::TYPE_SYSTEM)
            ->count();
            
        if ($existingSystemGroups > 0) {
            // System groups already exist, don't create duplicates
            return;
        }
        
        foreach (self::SYSTEM_GROUPS as $key => $groupData) {
            static::create([
                'project_id' => $projectId,
                'name' => $groupData['name'],
                'type' => self::TYPE_SYSTEM,
                'position' => $groupData['position'],
            ]);
        }
    }

    /**
     * Insert a custom group at the correct position (between In Progress and Complete).
     */
    public static function createCustomGroup(int $projectId, string $name): self
    {
        $position = static::getNextCustomPosition($projectId);
        
        return static::create([
            'project_id' => $projectId,
            'name' => $name,
            'type' => self::TYPE_CUSTOM,
            'position' => $position,
        ]);
    }

    /**
     * Validate group movement rules.
     */
    public static function validateMovement(int $projectId, array $newPositions): array
    {
        $errors = [];
        
        // Get all groups for the project
        $groups = static::where('project_id', $projectId)->get()->keyBy('id');
        
        foreach ($newPositions as $groupId => $newPosition) {
            $group = $groups->get($groupId);
            
            if (!$group) {
                $errors[$groupId] = 'Group not found';
                continue;
            }
            
            // System groups cannot be moved
            if ($group->isSystem()) {
                $errors[$groupId] = 'System groups cannot be moved';
                continue;
            }
            
            // Custom groups cannot be moved before position 2 (after In Progress)
            if ($newPosition <= 2) {
                $errors[$groupId] = 'Custom groups cannot be moved before "In Progress"';
                continue;
            }
            
            // Custom groups cannot be moved at or after position 999 (Complete)
            if ($newPosition >= 999) {
                $errors[$groupId] = 'Custom groups cannot be moved after "Complete"';
                continue;
            }
        }
        
        return $errors;
    }

    /**
     * Reorder groups with validation.
     */
    public static function reorderGroups(int $projectId, array $newPositions): array
    {
        $errors = static::validateMovement($projectId, $newPositions);
        
        if (!empty($errors)) {
            return ['success' => false, 'errors' => $errors];
        }
        
        // Update positions
        foreach ($newPositions as $groupId => $newPosition) {
            static::where('id', $groupId)->update(['position' => $newPosition]);
        }
        
        return ['success' => true];
    }
}
