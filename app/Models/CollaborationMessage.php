<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CollaborationMessage extends Model
{
    use HasFactory;

    protected $fillable = [
        'collaboration_id',
        'sender_id',
        'body',
        'type',
        'file_path',
        'file_name',
        'file_size',
        'read_at',
    ];

    protected $casts = [
        'read_at' => 'datetime',
    ];

    public function collaboration(): BelongsTo
    {
        return $this->belongsTo(FreelancerCollaboration::class, 'collaboration_id');
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }
}
