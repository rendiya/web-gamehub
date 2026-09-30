<?php

namespace App\Http\Controllers;

use App\Models\Game;
use App\Models\Platform;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlatformController extends Controller
{
    /**
     * GET /api/platforms
     * Daftar platform yang tersedia + daftar genre (untuk dropdown filter UI).
     */
    public function index(Request $request): JsonResponse
    {
        $platforms = Platform::orderBy('name')->pluck('name');
        $genres = Game::query()->whereNotNull('genre')->distinct()->orderBy('genre')->pluck('genre');

        // payload suport kedua: query ?type=platform atau ?type=genre untuk efisiensi
        $type = $request->query('type');
        if ($type === 'genre') {
            return response()->json(['data' => $genres]);
        }
        if ($type === 'platform') {
            return response()->json(['data' => $platforms]);
        }

        return response()->json([
            'platforms' => $platforms,
            'genres' => $genres,
        ]);
    }
}
