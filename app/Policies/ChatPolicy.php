<?php

namespace App\Policies;

use App\Models\PreProjectChat;
use App\Models\User;

class ChatPolicy
{
    public function create(User $user): bool
    {
        return $user->usage_type === 'client';
    }

    public function view(User $user, PreProjectChat $chat): bool
    {
        return $chat->isParticipant($user);
    }

    public function sendMessage(User $user, PreProjectChat $chat): bool
    {
        return $chat->isParticipant($user) && $chat->status === 'open';
    }

    public function convert(User $user, PreProjectChat $chat): bool
    {
        return $chat->freelancer_id === $user->id && $chat->status === 'open';
    }

    public function archive(User $user, PreProjectChat $chat): bool
    {
        return $chat->isParticipant($user) && $chat->status === 'open';
    }
}
