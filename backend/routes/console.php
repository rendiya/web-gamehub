<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

/*
|--------------------------------------------------------------------------
| Scheduled Tasks
|--------------------------------------------------------------------------
| Game Hub sync: Laravel Scheduler + Queue untuk harga berkala (NFR Section 3).
| Dijadwalkan setiap 6 jam; Epic 2/3 implementasi penuh di Sprint 2/3.
*/
Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();

Schedule::command('games:fetch-deals')->everySixHours();
