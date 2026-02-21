<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FreelancerProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'slug',
        'avatar',
        'title',
        'bio',
        'skills',
        'portfolio_links',
        'github_link',
        'linkedin_link',
        'website_link',
        'rate_min',
        'rate_max',
        'rate_currency',
        'availability',
        'country',
        'timezone',
        'cv_path',
        'status',
        'featured',
        'total_projects',
        'avg_rating',
    ];

    protected $appends = ['avatar_url'];

    protected function casts(): array
    {
        return [
            'skills' => 'array',
            'portfolio_links' => 'array',
            'rate_min' => 'decimal:2',
            'rate_max' => 'decimal:2',
            'avg_rating' => 'decimal:2',
            'featured' => 'boolean',
        ];
    }

    public function getAvatarUrlAttribute()
    {
        if ($this->avatar) {
            if (str_starts_with($this->avatar, 'http')) {
                return $this->avatar;
            }
            if (str_starts_with($this->avatar, '/storage/') || str_starts_with($this->avatar, 'storage/')) {
                return url($this->avatar);
            }
            return url('storage/' . $this->avatar);
        }
        return $this->user?->avatar_url;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(FreelancerReview::class, 'freelancer_id', 'user_id');
    }

    public function workspaces(): BelongsToMany
    {
        return $this->belongsToMany(Workspace::class, 'workspace_users', 'user_id', 'workspace_id', 'user_id', 'id');
    }

    public function scopePublished($query)
    {
        return $query->where('status', 'published');
    }

    public function scopeAvailable($query)
    {
        return $query->where('availability', '!=', 'unavailable');
    }

    public static function generateSlug(string $name): string
    {
        $slug = str()->slug($name);
        $original = $slug;
        $counter = 1;

        while (self::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    public function recalculateRating(): void
    {
        $avg = FreelancerReview::where('freelancer_id', $this->user_id)->avg('rating');
        $this->update(['avg_rating' => round($avg ?? 0, 2)]);
    }

    public function recalculateProjectsCount(): void
    {
        // Total Projects = Workspaces associated with an approved PreProjectChat where freelancer is the freelancer
        $count = \App\Models\PreProjectChat::where('freelancer_id', $this->user_id)
            ->where('status', 'converted_to_workspace')
            ->whereNotNull('workspace_id')
            ->count();
            
        $this->update(['total_projects' => $count]);
    }

    public function recalculateCollaborationsCount(): void
    {
        // Collaboration count = All workspaces the freelancer participated in (as admin or member)
        $count = \App\Models\Workspace::whereHas('users', function($q) {
            $q->where('users.id', $this->user_id);
        })->count();
        
        // We will store this in a temporary property or meta if we don't want to add a DB column,
        // but for now let's just make it available for the controller.
        $this->workspaces_count = $count;
    }
}

