<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Models\Wishlist;
use App\Models\Game;

class WishlistController extends Controller
{
    /**
     * Epic 4 Story 2: GET /api/wishlists
     * AC: Ada halaman "Wishlist Saya" menampilkan semua game tersimpan, tiap item menampilkan harga saat ini & status diskon
     */
    public function index(Request $request): JsonResponse
    {
        $wishlists = Wishlist::with(['game.prices.platform'])
            ->where('user_id', $request->user()->id)
            ->latest()
            ->get();

        $data = $wishlists->map(function ($wishlist) {
            $game = $wishlist->game;
            $lowestPrice = $game->prices->sortBy('current_price')->first();

            return [
                'id' => $wishlist->id,
                'game_id' => $game->id,
                'game_title' => $game->title,
                'game_image' => $game->screenshots[0] ?? null,
                'lowest_price' => $lowestPrice?->current_price,
                'currency' => $lowestPrice?->currency ?? 'USD',
                'is_discounted' => $lowestPrice?->is_discounted ?? false,
                'platform' => $lowestPrice?->platform->name,
                'added_at' => $wishlist->created_at->toIso8601String(),
            ];
        });

        return response()->json(['data' => $data]);
    }

    /**
     * Epic 4 Story 1: POST /api/wishlists
     * AC: Ada tombol "Tambah ke Wishlist" di halaman detail/list game, sistem menyimpan game ke wishlist milik user yang login
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'game_id' => ['required', 'integer', 'exists:games,id'],
        ]);

        $gameId = $validated['game_id'];
        $userId = $request->user()->id;

        // Cek apakah sudah ada
        $existing = Wishlist::where('user_id', $userId)
            ->where('game_id', $gameId)
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'Game sudah ada di wishlist.',
                'wishlist_id' => $existing->id,
            ], 200);
        }

        $wishlist = Wishlist::create([
            'user_id' => $userId,
            'game_id' => $gameId,
        ]);

        return response()->json([
            'message' => 'Game ditambahkan ke wishlist.',
            'wishlist_id' => $wishlist->id,
        ], 201);
    }

    /**
     * Epic 4 Story 3: DELETE /api/wishlists/{id}
     * AC: Ada tombol hapus di halaman wishlist, game langsung hilang dari daftar tanpa reload manual
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $wishlist = Wishlist::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$wishlist) {
            return response()->json(['message' => 'Wishlist item tidak ditemukan atau bukan milik Anda.'], 404);
        }

        $wishlist->delete();

        return response()->json(['message' => 'Game dihapus dari wishlist.']);
    }

    /**
     * Helper: cek apakah game ada di wishlist user (untuk UI toggle button)
     */
    public function check(Request $request, int $gameId): JsonResponse
    {
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('game_id', $gameId)
            ->exists();

        return response()->json(['in_wishlist' => $exists]);
    }

    /**
     * DELETE /api/wishlists/game/{gameId}
     * Hapus wishlist by game_id (untuk toggle button di card)
     */
    public function destroyByGameId(Request $request, int $gameId): JsonResponse
    {
        $wishlist = Wishlist::where('user_id', $request->user()->id)
            ->where('game_id', $gameId)
            ->first();

        if (!$wishlist) {
            return response()->json(['message' => 'Game tidak ada di wishlist Anda.'], 404);
        }

        $wishlist->delete();

        return response()->json(['message' => 'Game dihapus dari wishlist.']);
    }
}
