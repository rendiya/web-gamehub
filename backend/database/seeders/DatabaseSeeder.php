<?php

namespace Database\Seeders;

use App\Models\Game;
use App\Models\Platform;
use App\Models\Price;
use App\Models\PriceHistory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo data.
     *
     * Data awal ini memastikan UI & API tetap dapat didemo meskipun
     * Steam Web API / CheapShark API sedang offline (NFR Graceful Degradation).
     */
    public function run(): void
    {
        // ---- Platforms ----
        $steam = Platform::updateOrCreate(['name' => 'Steam']);
        $epic = Platform::updateOrCreate(['name' => 'Epic Games']);
        $gog = Platform::updateOrCreate(['name' => 'GOG']);

        // ---- Admin & demo user (Sanctum auth, Epic 4/5 prasyarat) ----
        User::updateOrCreate(
            ['email' => 'admin@gamehub.test'],
            ['name' => 'Admin Game Hub', 'password' => 'password', 'role' => 'admin']
        );
        User::updateOrCreate(
            ['email' => 'user@gamehub.test'],
            ['name' => 'User Demo', 'password' => 'password', 'role' => 'user']
        );

        // ---- Games demo (genre beragam agar filter berfungsi) ----
        $gamesData = [
            [
                'title' => 'Elden Ring',
                'description' => 'Game action RPG open-world karya FromSoftware. Jelajahi Lands Between yang luas dan penuh bahaya.',
                'genre' => 'Action RPG',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1245620/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows 10', 'cpu' => 'Intel i5-8400', 'ram' => '12 GB', 'gpu' => 'Nvidia GTX 1060'],
                    'recommended' => ['os' => 'Windows 11', 'cpu' => 'Intel i7-8700K', 'ram' => '16 GB', 'gpu' => 'Nvidia GTX 1070'],
                ],
            ],
            [
                'title' => 'Hades II',
                'description' => 'Roguelike dungeon crawler dari Supergiant Games, sekuel dari Hades yang memenangkan banyak penghargaan.',
                'genre' => 'Roguelike',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1145350/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows 10', 'cpu' => 'Dual Core 2.4GHz', 'ram' => '8 GB', 'gpu' => 'GTX 950'],
                    'recommended' => ['os' => 'Windows 10', 'cpu' => 'Quad Core 2.4GHz', 'ram' => '16 GB', 'gpu' => 'GTX 1060'],
                ],
            ],
            [
                'title' => 'Cyberpunk 2077',
                'description' => 'Open-world RPG berlatar Night City karya CD Projekt Red.',
                'genre' => 'Open World RPG',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1091500/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows 10', 'cpu' => 'Intel i5-3570K', 'ram' => '8 GB', 'gpu' => 'GTX 780'],
                    'recommended' => ['os' => 'Windows 10', 'cpu' => 'Intel i7-4790', 'ram' => '16 GB', 'gpu' => 'GTX 1060'],
                ],
            ],
            [
                'title' => 'Stardew Valley',
                'description' => 'Farming simulator santai dengan elemen RPG dan sosial.',
                'genre' => 'Simulation',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/413150/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows Vista', 'cpu' => '2GHz', 'ram' => '2 GB', 'gpu' => '256MB VRAM'],
                    'recommended' => ['os' => 'Windows 10', 'cpu' => '2.5GHz', 'ram' => '4 GB', 'gpu' => '1GB VRAM'],
                ],
            ],
            [
                'title' => 'Baldur\'s Gate 3',
                'description' => 'CRPG epik berbasis D&D 5e dari Larian Studios.',
                'genre' => 'CRPG',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/1086940/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows 10', 'cpu' => 'Intel i5-4690', 'ram' => '8 GB', 'gpu' => 'GTX 970'],
                    'recommended' => ['os' => 'Windows 10', 'cpu' => 'Intel i7-8700', 'ram' => '16 GB', 'gpu' => 'RTX 2060'],
                ],
            ],
            [
                'title' => 'Hollow Knight',
                'description' => 'Metroidvania bergaya hand-drawn yang atmosferik.',
                'genre' => 'Metroidvania',
                'screenshots' => ['https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/367520/library_hero.jpg'],
                'system_requirements' => [
                    'minimum' => ['os' => 'Windows 7', 'cpu' => 'Dual Core', 'ram' => '4 GB', 'gpu' => '512MB VRAM'],
                    'recommended' => ['os' => 'Windows 10', 'cpu' => 'Quad Core', 'ram' => '8 GB', 'gpu' => '1GB VRAM'],
                ],
            ],
        ];

        // Harga dasar per platform (USD, referensi)
        $pricesSeed = [
            // [game index, platform name, current_price, is_discounted]
            [0, 'Steam', 59.99, false],
            [0, 'Epic Games', 59.99, true],
            [1, 'Steam', 29.99, true],
            [1, 'Epic Games', 29.99, false],
            [2, 'Steam', 59.99, true],
            [2, 'GOG', 49.99, false],
            [3, 'Steam', 14.99, false],
            [3, 'GOG', 9.99, true],
            [4, 'Steam', 59.99, false],
            [4, 'GOG', 55.99, false],
            [5, 'Steam', 14.99, true],
            [5, 'GOG', 12.49, false],
        ];

        $now = Carbon::now();

        foreach ($gamesData as $i => $gData) {
            $game = Game::updateOrCreate(
                ['title' => $gData['title']],
                [
                    'description' => $gData['description'],
                    'genre' => $gData['genre'],
                    'screenshots' => $gData['screenshots'],
                    'system_requirements' => $gData['system_requirements'],
                ]
            );

            foreach ($pricesSeed as [$gIdx, $platformName, $price, $discounted]) {
                if ($gIdx !== $i) {
                    continue;
                }
                $platform = Platform::where('name', $platformName)->first();
                $base = $discounted ? $price * 1.4 : $price; // harga normal tersirat
                $current = $price;

                $priceRow = Price::updateOrCreate(
                    ['game_id' => $game->id, 'platform_id' => $platform->id],
                    [
                        'current_price' => $current,
                        'currency' => 'USD',
                        'is_discounted' => $discounted,
                        'last_checked_at' => $now,
                    ]
                );

                // price_history: beberapa titik data untuk grafik (Epic 3 prasyarat)
                $daysAgo = [30, 20, 10, 5, 2];
                foreach ($daysAgo as $d) {
                    // fluktuasi kecil di sekitar harga
                    $histPrice = round($base * (1 - ($d === 2 ? 0.12 : ($d % 3) * 0.03)), 2);
                    PriceHistory::updateOrCreate(
                        [
                            'game_id' => $game->id,
                            'platform_id' => $platform->id,
                            'checked_at' => $now->copy()->subDays($d),
                        ],
                        ['price' => $histPrice]
                    );
                }
            }
        }
    }
}
