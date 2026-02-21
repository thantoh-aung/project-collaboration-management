<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FreelancerCollaboration extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_one_id',
        'user_two_id',
        'status',
        'last_message_at',
    ];

    protected $casts = [
        'last_message_at' => 'datetime',
    ];

    public function userOne(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_one_id');
    }

    public function userTwo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_two_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(CollaborationMessage::class, 'collaboration_id');
    }

    public function getOtherParticipant(User $user): ?User
    {
        if ($this->user_one_id === $user->id) {
            return $this->userTwo;
        }
        if ($this->user_two_id === $user->id) {
            return $this->userOne;
        }
        return null;
    }

    public function isParticipant(User $user): bool
    {
        return $this->user_one_id === $user->id || $this->user_two_id === $user->id;
    }
}
