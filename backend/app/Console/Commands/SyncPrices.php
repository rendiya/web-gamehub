<?php

namespace App\Console\Commands;

use App\Jobs\SyncPlatformPrices;
use App\Models\Platform;
use Illuminate\Console\Command;

class SyncPrices extends Command
{
    protected $signature = 'app:sync-prices {--platform= : Nama platform tertentu, mis. Steam}';

    protected $description = 'Dispatch sync harga game ke Laravel Queue.';

    public function handle(): int
    {
        $platformFilter = $this->option('platform');
        $platforms = Platform::query()
            ->when($platformFilter, fn ($q) => $q->where('name', $platformFilter))
            ->get();

        if ($platforms->isEmpty()) {
            $this->warn('Tidak ada platform untuk disinkronkan.');
            return self::SUCCESS;
        }

        foreach ($platforms as $platform) {
            SyncPlatformPrices::dispatch($platform->id);
            $this->info("Platform [{$platform->name}] -> job dispatched");
        }

        return self::SUCCESS;
    }
}
