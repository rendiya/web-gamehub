<?php

namespace App\Jobs;

use App\Models\Platform;
use App\Models\SyncLog;
use App\Models\User;
use App\Notifications\SyncFailureAlert;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;
use Throwable;

class SyncPlatformPrices implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 2;
    public int $backoff = 60;

    public function __construct(public int $platformId)
    {
    }

    public function handle(): void
    {
        $platform = Platform::findOrFail($this->platformId);
        $startedAt = Carbon::now();

        try {
            $cheapShark = app(\App\Services\CheapSharkApiService::class);
            
            // Fetch deals dari CheapShark API
            $deals = $cheapShark->getDeals(pageSize: 20, pageNumber: 0);
            
            if (empty($deals)) {
                throw new \Exception('No deals returned from CheapShark API');
            }

            $gamesProcessed = 0;
            foreach ($deals as $deal) {
                $normalized = $cheapShark->normalizeDeal($deal);
                
                // Fetch detail game untuk deskripsi & screenshot yang lebih lengkap
                $gameDetails = null;
                if (!empty($normalized['external_id'])) {
                    $gameDetails = $cheapShark->getGameDetails($normalized['external_id']);
                }
                
                // Extract info lebih lengkap.
                // CheapShark detail kadang tidak punya steamAppID, jadi gunakan
                // thumb dari deal sebagai fallback agar card tidak tampil inisial.
                $description = $normalized['title'];
                $screenshots = [];
                
                $preferredImage = $cheapShark->getPreferredImage($deal, $gameDetails);
                if ($preferredImage) {
                    $screenshots = [$preferredImage];
                }
                
                if ($gameDetails) {
                    $info = $gameDetails['info'] ?? [];
                    $description = $info['title'] ?? $normalized['title'];
                }
                
                // Jangan menghapus image lama jika API kali ini tidak mengirim image.
                $existingGame = \App\Models\Game::where('title', $normalized['title'])->first();
                $imagePayload = !empty($screenshots)
                    ? $screenshots
                    : ($existingGame?->screenshots);
                
                // Update atau create game + price
                $game = \App\Models\Game::updateOrCreate(
                    ['title' => $normalized['title']],
                    [
                        'description' => $description,
                        'genre' => 'Various',
                        'screenshots' => $imagePayload,
                    ]
                );

                // Update price
                \App\Models\Price::updateOrCreate(
                    ['game_id' => $game->id, 'platform_id' => $platform->id],
                    [
                        'current_price' => $normalized['sale_price'] > 0 ? $normalized['sale_price'] : $normalized['normal_price'],
                        'currency' => 'USD',
                        'is_discounted' => $normalized['is_on_sale'],
                        'last_checked_at' => Carbon::now(),
                    ]
                );

                // Save to price_history
                \App\Models\PriceHistory::create([
                    'game_id' => $game->id,
                    'platform_id' => $platform->id,
                    'price' => $normalized['sale_price'] > 0 ? $normalized['sale_price'] : $normalized['normal_price'],
                    'checked_at' => Carbon::now(),
                ]);

                $gamesProcessed++;
            }

            // Success log
            $log = SyncLog::create([
                'platform_id' => $platform->id,
                'status' => 'success',
                'error_message' => "Successfully synced {$gamesProcessed} games from CheapShark API",
                'started_at' => $startedAt,
                'finished_at' => Carbon::now(),
            ]);

            logger()->info('Game Hub price sync completed', [
                'platform' => $platform->name,
                'games_processed' => $gamesProcessed,
                'sync_log_id' => $log->id,
            ]);

        } catch (\Exception $e) {
            // Failed log
            $log = SyncLog::create([
                'platform_id' => $platform->id,
                'status' => 'failed',
                'error_message' => $e->getMessage(),
                'started_at' => $startedAt,
                'finished_at' => Carbon::now(),
            ]);

            logger()->error('Game Hub price sync failed', [
                'platform' => $platform->name,
                'error' => $e->getMessage(),
                'sync_log_id' => $log->id,
            ]);

            // Epic 5 Story 2: Check consecutive failures dan kirim alert ke admin
            $this->checkConsecutiveFailuresAndAlert($platform, $log);
            
            throw $e;
        }
    }

    public function failed(Throwable $exception): void
    {
        $log = SyncLog::create([
            'platform_id' => $this->platformId,
            'status' => 'failed',
            'error_message' => $exception->getMessage(),
            'started_at' => Carbon::now(),
            'finished_at' => Carbon::now(),
        ]);

        // Epic 5 Story 2: Check consecutive failures saat job failed
        $platform = Platform::find($this->platformId);
        if ($platform) {
            $this->checkConsecutiveFailuresAndAlert($platform, $log);
        }
    }

    /**
     * Epic 5 Story 2: Cek consecutive failures dan kirim notifikasi ke admin
     * AC: Notifikasi (email) terkirim ke admin saat job sync gagal berturut-turut melewati batas ambang (mis. 2x)
     */
    private function checkConsecutiveFailuresAndAlert(Platform $platform, SyncLog $currentLog): void
    {
        // Hitung consecutive failures: ambil 2 log terakhir untuk platform ini
        $recentLogs = SyncLog::where('platform_id', $platform->id)
            ->orderByDesc('finished_at')
            ->limit(2)
            ->get();

        // Jika 2 log terakhir semuanya failed, kirim alert
        if ($recentLogs->count() === 2 && $recentLogs->every(fn($log) => $log->status === 'failed')) {
            // Kirim notifikasi ke semua admin
            $admins = User::where('role', 'admin')->get();
            
            foreach ($admins as $admin) {
                $admin->notify(new SyncFailureAlert($currentLog, 2));
            }

            logger()->info('Sync failure alert sent to admins', [
                'platform' => $platform->name,
                'consecutive_failures' => 2,
                'sync_log_id' => $currentLog->id,
            ]);
        }
    }
}
