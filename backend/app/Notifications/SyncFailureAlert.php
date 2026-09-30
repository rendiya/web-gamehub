<?php

namespace App\Notifications;

use App\Models\SyncLog;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SyncFailureAlert extends Notification
{
    use Queueable;

    public function __construct(
        public SyncLog $syncLog,
        public int $consecutiveFailures
    ) {
    }

    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    public function toDatabase(object $notifiable): array
    {
        $platform = $this->syncLog->platform->name ?? 'Unknown';

        return [
            'platform' => $platform,
            'consecutiveFailures' => $this->consecutiveFailures,
            'error' => $this->syncLog->error_message,
            'sync_log_id' => $this->syncLog->id,
            'timestamp' => $this->syncLog->finished_at?->toIso8601String(),
        ];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $platform = $this->syncLog->platform->name ?? 'Unknown';

        return (new MailMessage)
            ->error()
            ->subject("[Game Hub] Sync Gagal: {$platform} ({$this->consecutiveFailures}x berturut-turut)")
            ->greeting("Alert: Price Sync Failure")
            ->line("Sync data harga dari **{$platform}** gagal {$this->consecutiveFailures}x berturut-turut.")
            ->line("**Error:** {$this->syncLog->error_message}")
            ->line("**Waktu:** {$this->syncLog->finished_at?->format('d M Y H:i:s')}")
            ->action('Lihat Sync Logs', url('/admin'))
            ->line('Periksa konfigurasi API eksternal atau koneksi jaringan.');
    }
}
