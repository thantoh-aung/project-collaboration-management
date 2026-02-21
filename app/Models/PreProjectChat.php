<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PreProjectChat extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'freelancer_id',
        'status',
        'workspace_id',
        'last_message_at',
    ];

    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function freelancer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'freelancer_id');
    }

    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(PreProjectMessage::class, 'chat_id');
    }

    public function isParticipant(User $user): bool
    {
        return $this->client_id === $user->id || $this->freelancer_id === $user->id;
    }

    public function getOtherParticipant(User $user): ?User
    {
        if ($this->client_id === $user->id) {
            return $this->freelancer;
        }
        return $this->client;
    }

    /**
     * Get the project requests for this chat.
     */
    public function projectRequests(): HasMany
    {
        return $this->hasMany(ProjectRequest::class, 'chat_id');
    }

    /**
     * Get the chat deletions for this chat.
     */
    public function deletions(): HasMany
    {
        return $this->hasMany(ChatDeletion::class, 'chat_id');
    }

    /**
     * Check if a user has deleted this chat.
     */
    public function isDeletedByUser(User $user): bool
    {
        return $this->deletions()->where('user_id', $user->id)->exists();
    }
}
