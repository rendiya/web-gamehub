<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prices', function (Blueprint $table) {
            $table->decimal('original_price', 12, 2)->nullable()->after('current_price');
            $table->unsignedTinyInteger('discount_percentage')->nullable()->after('is_discounted');
        });
    }

    public function down(): void
    {
        Schema::table('prices', function (Blueprint $table) {
            $table->dropColumn(['original_price', 'discount_percentage']);
        });
    }
};