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
use Spatie\EloquentSortable\Sortable;
use Spatie\EloquentSortable\SortableTrait;

class Task extends Model implements Auditable, Sortable
{
    use HasFactory, /*Archivable,*/ AuditableTrait, SortableTrait;
    protected static function boot()
    {
        parent::boot();

        static::saving(function ($task) {
            // Auto-set completed_at based on group name
            if ($task->isDirty('group_id') && $task->group_id) {
                $group = \App\Models\TaskGroup::find($task->group_id);
                if ($group && strtolower($group->name) === 'complete') {
                    $task->completed_at = $task->completed_at ?? now();
                } else if ($group) {
                    $task->completed_at = null;
                }
            }

            // Auto-set completed_at based on status
            if ($task->isDirty('status')) {
                if (in_array(strtolower($task->status), ['completed', 'done', 'deployed'])) {
                    $task->completed_at = $task->completed_at ?? now();
                } else if (in_array(strtolower($task->status), ['todo', 'in-progress', 'in-review', 'qa'])) {
                    $task->completed_at = null;
                }
            }
        });
    }

    public $sortable = [
        'order_column_name' => 'order_column',
        'sort_when_creating' => true,
    ];

    protected $fillable = [
        'project_id',
        'group_id',
        'created_by_user_id',
        'assigned_to_user_id',
        'invoice_id',
        'name',
        'number',
        'description',
        'status',
        'priority',
        'labels',
        'attachments',
        'subscribers',
        'due_on',
        'estimation',
        'time_estimate',
        'time_spent',
        'pricing_type',
        'fixed_price',
        'hidden_from_clients',
        'billable',
        'order_column',
        'assigned_at',
        'completed_at',
        'last_activity_at',
    ];

    protected function casts(): array
    {
        return [
            'due_on' => 'date',
            'fixed_price' => 'decimal:2',
            'hidden_from_clients' => 'boolean',
            'billable' => 'boolean',
            'assigned_at' => 'datetime',
            'completed_at' => 'datetime',
            'archived_at' => 'datetime',
            'last_activity_at' => 'datetime',
            'labels' => 'array',
            'attachments' => 'array',
            'subscribers' => 'array',
        ];
    }

    /**
     * Get the project that this task belongs to.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Get the task group that this task belongs to.
     */
    public function taskGroup(): BelongsTo
    {
        return $this->belongsTo(TaskGroup::class, 'group_id');
    }

    /**
     * Get the user that created this task.
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the user that this task is assigned to.
     */
    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * Get the invoice that this task belongs to.
     */
    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    /**
     * Get the users subscribed to this task.
     */
    public function subscribedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'subscribe_task', 'task_id', 'user_id')
            ->withTimestamps();
    }

    /**
     * Get the labels for this task.
     */
    public function labels(): BelongsToMany
    {
        return $this->belongsToMany(Label::class, 'task_label', 'task_id', 'label_id')
            ->withTimestamps();
    }

    /**
     * Get the attachments for this task.
     */
    public function attachments(): HasMany
    {
        return $this->hasMany(Attachment::class);
    }

    /**
     * Get the time logs for this task.
     */
    public function timeLogs(): HasMany
    {
        return $this->hasMany(TimeLog::class);
    }

    /**
     * Get the comments for this task.
     */
    public function comments(): HasMany
    {
        return $this->hasMany(Comment::class);
    }

    /**
     * Get the subtasks for this task.
     */
    public function subtasks(): HasMany
    {
        return $this->hasMany(Subtask::class);
    }

    /**
     * Get the root subtasks (no parent) for this task.
     */
    public function rootSubtasks(): HasMany
    {
        return $this->hasMany(Subtask::class)->whereNull('parent_id');
    }
}
