<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Game Hub domain tables (Data Model Section 5).
 * platforms, games, prices, price_history, wishlists, sync_logs
 */
return new class extends Migration
{
    public function up(): void
    {
        // platforms — id, name (Steam, Epic, dst)
        Schema::create('platforms', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // games — id, title, description, genre, screenshots, system_requirements
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->text('description')->nullable();
            // $table->decimal('original_price', 12, 2)->nullable();
            // $table->decimal('final_price', 12, 2)->nullable();
            // $table->integer('discount_percent')->nullable();
            // $table->text('cover_image')->nullable();
            // $table->text('store_url');
            // $table->boolean('is_free')->default(false);
            $table->string('genre')->nullable();
            $table->json('screenshots')->nullable();
            $table->json('system_requirements')->nullable();
            $table->timestamps();

            // Performance/search: partial search on title, filter on genre
            $table->index('title');
            $table->index('genre');
        });

        // prices — id, game_id, platform_id, current_price, currency, is_discounted, last_checked_at
        Schema::create('prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->decimal('current_price', 12, 2);
            $table->string('currency', 8)->default('USD');
            $table->boolean('is_discounted')->default(false);
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();

            $table->unique(['game_id', 'platform_id']);
        });

        // price_history — id, game_id, platform_id, price, checked_at
        Schema::create('price_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('platform_id')->constrained()->onDelete('cascade');
            $table->decimal('price', 12, 2);
            $table->timestamp('checked_at');
            $table->timestamps();

            // NFR Scalability (Section 7): index on game_id + platform_id + checked_at
            // karena tabel tumbuh terus-menerus seiring waktu.
            $table->index(['game_id', 'platform_id', 'checked_at']);
        });

        // wishlists — id, user_id, game_id, created_at
        Schema::create('wishlists', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->timestamps();

            $table->unique(['user_id', 'game_id']);
        });

        // sync_logs — id, platform_id, status (success/failed), error_message, started_at, finished_at
        Schema::create('sync_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('platform_id')->nullable()->constrained()->onDelete('set null');
            $table->string('status'); // success | failed
            $table->text('error_message')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('finished_at')->nullable();
            $table->timestamps();

            $table->index(['platform_id', 'status', 'started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_logs');
        Schema::dropIfExists('wishlists');
        Schema::dropIfExists('price_history');
        Schema::dropIfExists('prices');
        Schema::dropIfExists('games');
        Schema::dropIfExists('platforms');
    }
};
