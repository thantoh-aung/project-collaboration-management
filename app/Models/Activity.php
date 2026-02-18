<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'activity_capable_type',
        'activity_capable_id',
        'user_id',
        'description',
    ];

    /**
     * Get the parent activity capable model (polymorphic).
     */
    public function activityCapable(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * Get the user that created this activity.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
