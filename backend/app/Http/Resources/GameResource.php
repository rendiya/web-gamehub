<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GameResource extends JsonResource
{
    /**
     * Transform game menjadi payload ringkas untuk daftar/listing.
     * Menyertakan harga termurah + platform pemilik harga termurah
     * serta atribut update timestamp (untuk label "Data diperbarui").
     */
    public function toArray(Request $request): array
    {
        $prices = $this->prices;
        $currency = $prices->contains('currency', 'IDR') ? 'IDR' : $prices->first()?->currency;
        $lowest = $prices->where('currency', $currency)->sortBy('current_price')->first();

        return [
            'id' => $this->id,
            'title' => $this->title,
            'genre' => $this->genre,
            'description' => $this->description,
            'screenshots' => $this->screenshots,
            'lowest_price' => $lowest ? (float) $lowest->current_price : null,
            'lowest_price_original' => $lowest?->original_price === null ? null : (float) $lowest->original_price,
            'lowest_price_discount_percentage' => $lowest?->discount_percentage,
            'lowest_price_platform' => $lowest?->platform?->name,
            'lowest_price_currency' => $lowest?->currency,
            'lowest_price_discounted' => $lowest?->is_discounted ?? false,
            'last_checked_at' => optional($this->prices->sortByDesc('last_checked_at')->first())->last_checked_at,
            'platforms_count' => $this->prices->count(),
        ];
    }
}
