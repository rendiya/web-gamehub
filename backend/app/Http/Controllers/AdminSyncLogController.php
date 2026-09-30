<?php

namespace App\Http\Controllers;

use App\Http\Resources\SyncLogResource;
use App\Models\SyncLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminSyncLogController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $logs = SyncLog::with('platform')
            ->latest('started_at')
            ->paginate($request->validate([
                'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            ])['per_page'] ?? 20);

        return SyncLogResource::collection($logs);
    }
}
