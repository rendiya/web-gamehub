<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * CheapShark API Service
 * Doc: https://apidocs.cheapshark.com/
 * Free aggregator untuk Steam, Epic Games, GOG, dll
 */
class CheapSharkApiService
{
    private const BASE_URL = 'https://www.cheapshark.com/api/1.0';
    private const TIMEOUT = 30;
    private const USER_AGENT = 'GameHub/1.0 (github.com/hancokro911/gamehub)';

    /**
     * Get list of deals (games on sale)
     * @param int $pageSize Max 60
     * @param int $pageNumber Starting from 0
     * @return array
     */
    public function getDeals(int $pageSize = 60, int $pageNumber = 0): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(self::BASE_URL . '/deals', [
                    'pageSize' => min($pageSize, 60),
                    'pageNumber' => $pageNumber,
                    'sortBy' => 'Recent', // Recent, Deal Rating, Title, Savings, Price, Metacritic, Reviews, Release, Store
                ]);

            if ($response->failed()) {
                Log::warning('CheapShark API deals failed', ['status' => $response->status()]);
                return [];
            }

            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('CheapShark API exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get game details by CheapShark gameID
     * @param string $gameID
     * @return array|null
     */
    public function getGameDetails(string $gameID): ?array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(self::BASE_URL . '/games', [
                    'id' => $gameID,
                ]);

            if ($response->failed()) {
                return null;
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('CheapShark game details exception', ['gameID' => $gameID, 'error' => $e->getMessage()]);
            return null;
        }
    }

    /**
     * Search games by title
     * @param string $title
     * @param int $limit
     * @return array
     */
    public function searchGames(string $title, int $limit = 60): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(self::BASE_URL . '/games', [
                    'title' => $title,
                    'limit' => min($limit, 60),
                ]);

            if ($response->failed()) {
                return [];
            }

            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('CheapShark search exception', ['title' => $title, 'error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Get list of stores/platforms
     * @return array
     */
    public function getStores(): array
    {
        try {
            $response = Http::timeout(self::TIMEOUT)
                ->withHeaders(['User-Agent' => self::USER_AGENT])
                ->get(self::BASE_URL . '/stores');

            if ($response->failed()) {
                return [];
            }

            return $response->json() ?? [];
        } catch (\Exception $e) {
            Log::error('CheapShark stores exception', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Pilih image yang lebih layak untuk card/detail.
     * Thumbnail CheapShark 117h tetap dipakai sebagai fallback terakhir.
     */
    public function getPreferredImage(array $deal, ?array $details = null): ?string
    {
        $steamAppId = $details['info']['steamAppID'] ?? null;
        if ($steamAppId) {
            // library_hero.jpg jauh lebih besar daripada header.jpg (cocok untuk hero/detail).
            return "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/{$steamAppId}/library_hero.jpg";
        }

        $thumb = $deal['thumb'] ?? null;
        if (!$thumb) {
            return null;
        }

        // Beberapa CDN GOG menyediakan ukuran lebih besar dengan pola nama ini.
        return str_replace('product_tile_117h.webp', 'product_tile_500h.webp', $thumb);
    }

    /**
     * Normalize deal data ke format Game Hub
     * @param array $deal Raw deal dari CheapShark API
     * @return array
     */
    public function normalizeDeal(array $deal): array
    {
        return [
            'external_id' => $deal['gameID'] ?? null,
            'title' => $deal['title'] ?? 'Unknown Game',
            'normal_price' => floatval($deal['normalPrice'] ?? 0),
            'sale_price' => floatval($deal['salePrice'] ?? 0),
            'savings' => floatval($deal['savings'] ?? 0),
            'is_on_sale' => ($deal['salePrice'] ?? 0) < ($deal['normalPrice'] ?? 0),
            'store_id' => $deal['storeID'] ?? null,
            'thumb_url' => $deal['thumb'] ?? null,
            'metacritic_score' => intval($deal['metacriticScore'] ?? 0),
            'steam_rating' => intval($deal['steamRatingPercent'] ?? 0),
            'deal_rating' => floatval($deal['dealRating'] ?? 0),
        ];
    }
}
