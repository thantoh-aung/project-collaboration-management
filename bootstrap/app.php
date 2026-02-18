<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\WorkspaceContext::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\HandleExpiredTokens::class,
        ]);
        
        $middleware->alias([
            'workspace.auth' => \App\Http\Middleware\WorkspaceAuthorization::class,
            'marketplace.access' => \App\Http\Middleware\EnsureMarketplaceAccess::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
