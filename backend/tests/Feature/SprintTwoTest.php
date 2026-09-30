<?php

namespace Tests\Feature;

use App\Models\Game;
use App\Models\Platform;
use App\Models\Price;
use App\Models\SyncLog;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SprintTwoTest extends TestCase
{
    use RefreshDatabase;

    public function test_games_can_be_filtered_by_price_range(): void
    {
        $platform = Platform::create(['name' => 'Steam']);
        $cheap = Game::create(['title' => 'Cheap Game', 'genre' => 'Action', 'is_api_game' => true]);
        $expensive = Game::create(['title' => 'Expensive Game', 'genre' => 'Action', 'is_api_game' => true]);
        Price::create(['game_id' => $cheap->id, 'platform_id' => $platform->id, 'current_price' => 9.99, 'currency' => 'USD']);
        Price::create(['game_id' => $expensive->id, 'platform_id' => $platform->id, 'current_price' => 59.99, 'currency' => 'USD']);

        $response = $this->getJson('/api/games?min_price=5&max_price=20');

        $response->assertOk()->assertJsonPath('meta.total', 1);
        $response->assertJsonPath('data.0.title', 'Cheap Game');
    }

    public function test_deal_fetch_command_imports_steam_and_epic_api_games(): void
    {
        Game::create(['title' => 'Seeded Demo Game']);

        Http::fake(function ($request) {
            if (str_contains($request->url(), 'featuredcategories')) {
                return Http::response([
                    'specials' => [
                        'items' => [[
                            'id' => 123,
                            'name' => 'Steam API Game',
                            'discount_percent' => 25,
                            'original_price' => 1999,
                            'final_price' => 1499,
                            'currency' => 'IDR',
                            'large_capsule_image' => 'https://example.com/steam.jpg',
                        ]],
                    ],
                ]);
            }

            if (str_contains($request->url(), 'cheapshark')) {
                parse_str((string) parse_url($request->url(), PHP_URL_QUERY), $query);

                return Http::response(($query['storeID'] ?? null) === '25' ? [[
                    'dealID' => 'epic-deal-1',
                    'title' => 'Epic API Game',
                    'salePrice' => '4.99',
                    'normalPrice' => '9.99',
                    'savings' => '50.0',
                    'thumb' => 'https://example.com/epic.jpg',
                ]] : []);
            }

            return Http::response([], 404);
        });

        Artisan::call('games:fetch-deals');

        $this->assertDatabaseHas('games', ['title' => 'Steam API Game', 'is_api_game' => true]);
        $this->assertDatabaseHas('games', ['title' => 'Epic API Game', 'is_api_game' => true]);
        $this->assertDatabaseHas('prices', [
            'current_price' => 14.99,
            'original_price' => 19.99,
            'currency' => 'IDR',
            'discount_percentage' => 25,
        ]);
        $this->assertDatabaseHas('prices', [
            'current_price' => 4.99,
            'original_price' => 9.99,
            'currency' => 'USD',
            'discount_percentage' => 50,
        ]);

        $response = $this->getJson('/api/games');
        $response->assertOk()->assertJsonPath('meta.total', 2);
        $this->assertNotContains('Seeded Demo Game', collect($response->json('data'))->pluck('title'));
    }

    public function test_admin_can_view_sync_logs_but_regular_user_cannot(): void
    {
        $platform = Platform::create(['name' => 'Steam']);
        SyncLog::create([
            'platform_id' => $platform->id,
            'status' => 'failed',
            'error_message' => 'API unavailable',
            'started_at' => now(),
        ]);

        Sanctum::actingAs(User::factory()->create(['role' => 'user']));
        $this->getJson('/api/admin/sync-logs')->assertForbidden();

        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->getJson('/api/admin/sync-logs')
            ->assertOk()
            ->assertJsonPath('data.0.status', 'failed')
            ->assertJsonPath('data.0.error_message', 'API unavailable');
    }
}
