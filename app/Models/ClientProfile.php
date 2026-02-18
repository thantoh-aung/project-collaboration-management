<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClientProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'company_name',
        'industry',
        'country',
        'timezone',
        'website',
        'total_projects',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
