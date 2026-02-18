<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Invoice extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_company_id',
        'created_by_user_id',
        'number',
        'status',
        'type',
        'amount',
        'amount_with_tax',
        'hourly_rate',
        'tax_rate',
        'due_date',
        'note',
        'filename',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'amount_with_tax' => 'decimal:2',
            'hourly_rate' => 'decimal:2',
            'tax_rate' => 'decimal:2',
            'due_date' => 'date',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Get the client company that this invoice belongs to.
     */
    public function clientCompany(): BelongsTo
    {
        return $this->belongsTo(ClientCompany::class);
    }

    /**
     * Get the user that created this invoice.
     */
    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the tasks associated with this invoice.
     */
    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class);
    }
}
