<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameDetailResource extends JsonResource
{
    /**
     * Transform game menjadi payload detail lengkap:
     * deskripsi, screenshot, requirement sistem, dan harga per platform
     * (AC Epic 1 detail + Epic 2 perbandingan harga).
     */
    public function toArray(Request $request): array
    {
        $prices = $this->prices->sortBy('current_price');
        $currency = $prices->contains('currency', 'IDR') ? 'IDR' : $prices->first()?->currency;
        $lowest = $prices->where('currency', $currency)->first();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'genre' => $this->genre,
            'screenshots' => $this->screenshots,
            'system_requirements' => $this->system_requirements,
            'prices' => $prices->map(fn ($p) => [
                'platform' => $p->platform?->name,
                'current_price' => (float) $p->current_price,
                'original_price' => $p->original_price === null ? null : (float) $p->original_price,
                'currency' => $p->currency,
                'is_discounted' => $p->is_discounted,
                'discount_percentage' => $p->discount_percentage,
                'last_checked_at' => $p->last_checked_at,
                'is_lowest' => (bool) $lowest?->is($p),
            ])->values(),
            'lowest_price' => $lowest ? (float) $lowest->current_price : null,
            'lowest_price_platform' => $lowest?->platform?->name,
            'lowest_price_currency' => $lowest?->currency,
            'last_checked_at' => optional($prices->last())->last_checked_at,
        ];
    }
}
