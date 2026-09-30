<?php

use App\Http\Controllers\AdminSyncLogController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\GameController;
use App\Http\Controllers\PlatformController;
use App\Http\Controllers\WishlistController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| Game Hub — backend-mediated API (Section 6 Kontrak API).
| Semua route publik diberi rate limit untuk mencegah abuse (NFR Security).
*/

Route::middleware('throttle:60,1')->group(function () {
    Route::post('/auth/login', [AuthController::class, 'login']);

    // Epic 0 / Epic 1
    Route::get('/games', [GameController::class, 'index']);
    Route::get('/games/{id}', [GameController::class, 'show']);

    // Daftar platform & genre untuk dropdown filter UI
    Route::get('/platforms', [PlatformController::class, 'index']);

    // Epic 5: hanya admin yang dapat melihat audit sync.
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {
        Route::get('/sync-logs', [AdminSyncLogController::class, 'index']);
    });

    Route::post('/auth/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

    // Epic 4: Wishlist (auth required)
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/wishlists', [WishlistController::class, 'index']);
        Route::post('/wishlists', [WishlistController::class, 'store']);
        Route::delete('/wishlists/{id}', [WishlistController::class, 'destroy']);
        Route::get('/wishlists/check/{gameId}', [WishlistController::class, 'check']);
        Route::delete('/wishlists/game/{gameId}', [WishlistController::class, 'destroyByGameId']);
    });
});
