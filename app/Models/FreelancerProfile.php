<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
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
        'status',
        'featured',
        'total_projects',
        'avg_rating',
    ];

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

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(FreelancerReview::class, 'freelancer_id', 'user_id');
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
}
