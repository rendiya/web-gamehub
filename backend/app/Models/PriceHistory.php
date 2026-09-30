<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PriceHistory extends Model
{
    use HasFactory;

    // Data Model Section 5 menetapkan tabel singular `price_history`.
    protected $table = 'price_history';

    protected $fillable = [
        'game_id',
        'platform_id',
        'price',
        'checked_at',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'checked_at' => 'datetime',
    ];

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }
}
