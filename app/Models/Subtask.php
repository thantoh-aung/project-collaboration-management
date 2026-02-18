<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Subtask extends Model
{
    use HasFactory;

    protected $fillable = [
        'task_id',
        'parent_id',
        'name',
        'description',
        'completed',
        'assigned_to_user_id',
        'created_by_user_id',
        'due_at',
        'completed_at',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'due_at' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /**
     * Get the parent task that owns the subtask.
     */
    public function task(): BelongsTo
    {
        return $this->belongsTo(Task::class);
    }

    /**
     * Get the parent subtask.
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Subtask::class, 'parent_id');
    }

    /**
     * Get the child subtasks.
     */
    public function children(): HasMany
    {
        return $this->hasMany(Subtask::class, 'parent_id');
    }

    /**
     * Get the user assigned to this subtask.
     */
    public function assignedToUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    /**
     * Get the user who created this subtask.
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Mark the subtask as completed.
     */
    public function markAsCompleted(): void
    {
        $this->completed = true;
        $this->completed_at = now();
        $this->save();
    }

    /**
     * Mark the subtask as incomplete.
     */
    public function markAsIncomplete(): void
    {
        $this->completed = false;
        $this->completed_at = null;
        $this->save();
    }

    /**
     * Scope to get only completed subtasks.
     */
    public function scopeCompleted($query)
    {
        return $query->where('completed', true);
    }

    /**
     * Scope to get only incomplete subtasks.
     */
    public function scopeIncomplete($query)
    {
        return $query->where('completed', false);
    }

    /**
     * Scope to get root subtasks (no parent).
     */
    public function scopeRoot($query)
    {
        return $query->whereNull('parent_id');
    }

    /**
     * Get all descendants (nested subtasks).
     */
    public function descendants()
    {
        return $this->children()->with('descendants');
    }
}
