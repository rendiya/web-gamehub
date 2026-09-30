<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Game extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'genre',
        'screenshots',
        'system_requirements',
        'is_api_game',
        // 'original_price',
        // 'final_price',
        // 'discount_percent',
        // 'cover_image',
        // 'store_url',
        // 'is_free',
    ];

    protected $casts = [
        'screenshots' => 'array',
        'system_requirements' => 'array',
    ];

    public function prices(): HasMany
    {
        return $this->hasMany(Price::class);
    }

    public function platforms(): BelongsToMany
    {
        return $this->belongsToMany(Platform::class, 'prices')
            ->withPivot('current_price', 'currency', 'is_discounted', 'last_checked_at');
    }

    public function priceHistory(): HasMany
    {
        return $this->hasMany(PriceHistory::class);
    }
}
