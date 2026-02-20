<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
// use JoelButcher\Archivable\Archivable;
use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Auditable as AuditableTrait;

class Project extends Model implements Auditable
{
    use HasFactory, /*Archivable,*/ AuditableTrait;

    protected $fillable = [
        'name',
        'description',
        'workspace_id',
        'created_by',
        'client_id',
        'client_company_id',
        'start_date',
        'due_date',
        'budget',
        'status',
        'priority',
        'progress',
        'default_pricing_type',
        'rate',
    ];

    /**
     * Model boot method for validation and automatic system group creation
     */
    protected static function boot()
    {
        parent::boot();

        // Create system groups when project is created
        static::created(function ($project) {
            TaskGroup::createSystemGroups($project->id);
        });

        // Validate start date before saving
        static::saving(function ($project) {
            if ($project->start_date) {
                $today = now()->toDateString();
                $originalStartDate = $project->getOriginal('start_date')?->toDateString();
                
                // Only validate if this is a new project or start date is being changed
                if (!$project->exists || $project->start_date->toDateString() !== $originalStartDate) {
                    // For new projects, always prevent past dates
                    if (!$project->exists && $project->start_date->toDateString() < $today) {
                        throw new \Illuminate\Validation\ValidationException([
                            'start_date' => 'Project start date must be today or later.'
                        ]);
                    }
                    
                    // For existing projects, prevent changing to past date (unless admin editing historical data)
                    if ($project->exists && $project->start_date->toDateString() < $today && $project->start_date->toDateString() !== $originalStartDate) {
                        // This is a safety net - controller should handle this logic
                        \Log::warning('Attempted to set project start date to past date', [
                            'project_id' => $project->id,
                            'new_start_date' => $project->start_date,
                            'original_start_date' => $originalStartDate,
                            'today' => $today
                        ]);
                    }
                }
            }
        });
    }

    protected function casts(): array
    {
        return [
            'rate' => 'decimal:2',
            'budget' => 'decimal:2',
            'start_date' => 'date',
            'due_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Get the workspace that this project belongs to.
     */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /**
     * Get the client company that this project belongs to.
     */
    public function clientCompany(): BelongsTo
    {
        return $this->belongsTo(ClientCompany::class);
    }

    /**
     * Get the team members for this project.
     */
    public function teamMembers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'project_user_access')
            ->withTimestamps()
            ->withPivot('role');
    }

    /**
     * Get the users that have access to the project (alias for teamMembers).
     */
    public function users(): BelongsToMany
    {
        return $this->teamMembers();
    }

    /**
     * Alias for teamMembers to match common naming conventions.
     */
    public function members(): BelongsToMany
    {
        return $this->teamMembers();
    }

    /**
     * Get the task groups for this project.
     */
    public function taskGroups(): HasMany
    {
        return $this->hasMany(TaskGroup::class);
    }

    /**
     * Get the tasks for this project.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
