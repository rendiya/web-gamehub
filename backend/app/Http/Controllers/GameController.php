<?php

namespace App\Http\Controllers;

use App\Http\Resources\GameDetailResource;
use App\Http\Resources\GameResource;
use App\Models\Game;
use App\Models\Platform;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class GameController extends Controller
{
    /**
     * GET /api/games
     * Daftar game dengan support: search, genre, platform, sort.
     * - search       : partial match pada title
     * - genre        : dapat berupa array (multi-genre) atau string
     * - platform     : nama platform (Steam, Epic Games, ...)
     * - sort         : price_asc | price_desc | discount | newest
     *
     * Semua parameter divalidasi & disanitasi (NFR Security).
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'genre' => ['nullable', 'array', 'max:20'],
            'genre.*' => ['string', 'max:60'],
            'platform' => ['nullable', 'string', 'max:60'],
            'min_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99'],
            'max_price' => ['nullable', 'numeric', 'min:0', 'max:9999999999.99', 'gte:min_price'],
            'sort' => ['nullable', 'string', 'in:price_asc,price_desc,discount,newest'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
            
        ]);

        $query = Game::where('is_api_game', true)
            ->whereHas('prices')
            ->with('prices.platform');

        // --- search (partial match) ---
        if (! empty($validated['search'])) {
            $search = $validated['search'];
            $query->where('title', 'like', "%{$search}%");
        }

        // --- filter genre (multi) ---
        if (! empty($validated['genre'])) {
            $genres = $validated['genre'];
            $query->where(function ($q) use ($genres) {
                foreach ($genres as $genre) {
                    // Genre cards use broad labels (e.g. Action), while stored
                    // values may be "Action RPG" or "Open World RPG".
                    $q->orWhere('genre', 'like', "%{$genre}%");
                }
            });
        }

        // --- filter platform ---
        if (! empty($validated['platform'])) {
            $platformName = $validated['platform'];
            $query->whereHas('prices.platform', function ($q) use ($platformName) {
                $q->where('name', $platformName);
            });
        }

        // --- filter rentang harga ---
        if (array_key_exists('min_price', $validated) || array_key_exists('max_price', $validated)) {
            $query->whereHas('prices', function ($q) use ($validated) {
                $q->when(array_key_exists('min_price', $validated), fn ($q) => $q->where('current_price', '>=', $validated['min_price']))
                    ->when(array_key_exists('max_price', $validated), fn ($q) => $q->where('current_price', '<=', $validated['max_price']));
            });
        }

        // --- sort ---
        $sort = $validated['sort'] ?? null;
        switch ($sort) {
            case 'price_asc':
                $query->withMin('prices as min_price', 'current_price')
                      ->orderBy('min_price', 'asc');
                break;
            case 'price_desc':
                $query->withMin('prices as min_price', 'current_price')
                      ->orderBy('min_price', 'desc');
                break;
            case 'discount':
                // Utamakan game yang memiliki price is_discounted true
                $query->withMin('prices as min_price', 'current_price')
                      ->orderByRaw('(select count(*) from prices where prices.game_id = games.id and prices.is_discounted = 1) desc')
                      ->orderBy('min_price', 'asc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        $perPage = $validated['per_page'] ?? 12;

        return GameResource::collection($query->paginate($perPage));
    }

    /**
     * GET /api/games/{id}
     * Detail lengkap game + harga per platform (Epic 1 / Epic 2).
     * Data diambil dari DB, bukan fetch API eksternal (AC Epic 1 point 2).
     * Jika game tidak ditemukan, kembalikan 404 (pesan "Game tidak ditemukan").
     */
    public function show(Request $request, $id)
    {
        $game = Game::with('prices.platform')->find($id);

        if (! $game) {
            return response()->json([
                'message' => 'Game tidak ditemukan',
            ], 404);
        }

        return new GameDetailResource($game);
    }
}
