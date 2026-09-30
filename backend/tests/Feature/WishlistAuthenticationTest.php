<?php

namespace Tests\Feature;

use Tests\TestCase;

class WishlistAuthenticationTest extends TestCase
{
    public function test_unauthenticated_wishlist_request_returns_json_401_without_accept_header(): void
    {
        $response = $this->withHeaders(['Accept' => '*/*'])
            ->post('/api/wishlists', ['game_id' => 1]);

        $response->assertUnauthorized()
            ->assertHeader('content-type', 'application/json')
            ->assertJson(['message' => 'Unauthenticated.']);
    }
}