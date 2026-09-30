<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use App\Models\Game;
use App\Models\Platform;
use App\Models\Price;

class FetchGameDeals extends Command
{
    // command untuk feth game
    protected $signature = 'games:fetch-deals';

    // 
    protected $description = 'Ambil data game ';


    public function handle()
    {
        $this->info('Memulai proses pengambilan data game');

        $this->fetchSteamDeals();
        $this->fetchCheapSharkDeals();

        $this->info('Proses pengambilan data gameselesai.');
    }

    private function fetchSteamDeals()
    {
        $this->info('Fetching data dari Steam...');

        try {
            $response = Http::acceptJson()
                ->withUserAgent('GameHub/1.0')
                ->retry(2, 500)
                ->timeout(20)
                ->get('https://store.steampowered.com/api/featuredcategories/', [
                    'cc' => 'id',
                ]);

            if ($response->successful()) {
                $specials = $response->json('specials.items');

                if (!is_array($specials)) {
                    $this->error('Respons Steam tidak berisi daftar specials yang valid.');
                    return;
                }

                $steam = Platform::firstOrCreate(['name' => 'Steam']);
                Price::where('platform_id', $steam->id)->delete();

                $count = 0;

                foreach ($specials as $item) {
                    $discount = (int) ($item['discount_percent'] ?? 0);

                    if ($discount > 0 && isset($item['id'], $item['name'], $item['original_price'], $item['final_price'])) {
                        $this->saveApiGame(
                            $item['name'],
                            'Steam',
                            (float) $item['original_price'] / 100,
                            (float) $item['final_price'] / 100,
                            $item['currency'] ?? 'IDR',
                            $discount,
                            $item['large_capsule_image'] ?? $item['header_image'] ?? null,
                        );
                        $count++;
                    }
                }
                $this->info("-> Berhasil menyimpan {$count} game dari Steam.");
            } else {
                $this->error('Gagal mengambil data dari Steam. Status HTTP: ' . $response->status());
            }
        } catch (\Exception $e) {
            $this->error('Gagal mengambil data dari Steam: ' . $e->getMessage());
        }
    }

    private function fetchCheapSharkDeals()
    {
        $this->info('Fetching data dari CheapShark (Steam & Epic Games)...');

        $stores = ['25' => 'Epic Games'];

        foreach ($stores as $storeId => $platformName) {
            try {
                $response = Http::acceptJson()
                    ->withUserAgent('GameHub/1.0')
                    ->retry(2, 500)
                    ->timeout(20)
                    ->get('https://www.cheapshark.com/api/1.0/deals', [
                        'storeID' => $storeId,
                        'pageSize' => 40,
                        'sortBy' => 'Savings',
                    ]);

                if (! $response->successful()) {
                    $this->error("Gagal mengambil data {$platformName} dari CheapShark. Status HTTP: " . $response->status());
                    continue;
                }

                $deals = $response->json();
                if (! is_array($deals)) {
                    $this->error("Respons CheapShark untuk {$platformName} tidak valid.");
                    continue;
                }

                $count = 0;
                foreach ($deals as $deal) {
                    if (! isset($deal['dealID'], $deal['title'], $deal['normalPrice'], $deal['salePrice'])) {
                        continue;
                    }

                    $originalPrice = (float) $deal['normalPrice'];
                    $currentPrice = (float) $deal['salePrice'];
                    $discount = $originalPrice > 0
                        ? (int) round(($originalPrice - $currentPrice) / $originalPrice * 100)
                        : 0;

                    $this->saveApiGame(
                        $deal['title'],
                        $platformName,
                        $originalPrice,
                        $currentPrice,
                        'USD',
                        $discount,
                        $deal['thumb'] ?? null,
                    );
                    $count++;
                }

                $this->info("-> Berhasil memproses {$count} data diskon dari {$platformName}.");
            } catch (\Exception $e) {
                $this->error("Gagal mengambil data CheapShark ({$platformName}): " . $e->getMessage());
            }
        }

        $totalInDb = Game::where('is_api_game', true)->count();
        $this->info("-> Total keseluruhan game API di DB sekarang: {$totalInDb}");
    }

    private function saveApiGame(
        string $title,
        string $platformName,
        float $originalPrice,
        float $currentPrice,
        string $currency,
        int $discountPercentage,
        ?string $image,
    ): void
    {
        $game = Game::firstOrNew(['title' => $title]);
        $game->description = $title;
        $game->is_api_game = true;
        if ($image) {
            $game->screenshots = [$image];
        }
        $game->save();

        $platform = Platform::firstOrCreate(['name' => $platformName]);
        Price::updateOrCreate(
            ['game_id' => $game->id, 'platform_id' => $platform->id],
            [
                'original_price' => $originalPrice,
                'current_price' => $currentPrice,
                'currency' => $currency,
                'is_discounted' => $discountPercentage > 0 && $currentPrice < $originalPrice,
                'discount_percentage' => $discountPercentage,
                'last_checked_at' => now(),
            ]
        );
    }
}