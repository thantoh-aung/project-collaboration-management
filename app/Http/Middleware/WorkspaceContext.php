<?php

namespace App\Http\Middleware;

use App\Models\Workspace;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class WorkspaceContext
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        if (!$user) {
            return $next($request);
        }

        // Resolve workspace from route parameter, query parameter, or session
        $workspaceId = $request->route('workspace')
            ?? $request->query('workspace_id')
            ?? session('current_workspace_id');

        if ($workspaceId instanceof Workspace) {
            $workspaceId = $workspaceId->id;
        }

        // Allow workspace switching via URL parameter
        if ($request->has('workspace_id')) {
            $requestedWorkspaceId = $request->get('workspace_id');

            if ($user->workspaces()
                ->whereHas('workspaceUsers', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->where('workspaces.id', $requestedWorkspaceId)
                ->exists()
            ) {
                $workspaceId = $requestedWorkspaceId;
                session(['current_workspace_id' => $workspaceId]);
            }
        }

        // If no workspace in session, try to get first workspace
        if (!$workspaceId) {
            $firstWorkspace = $user->workspaces()
                ->whereHas('workspaceUsers', function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                })
                ->first();
            if ($firstWorkspace) {
                $workspaceId = $firstWorkspace->id;
                session(['current_workspace_id' => $workspaceId]);
            }
        }

        // Set workspace context
        if ($workspaceId) {
            $workspace = Workspace::find($workspaceId);
            if ($workspace && $workspace->hasUser($user)) {
                session(['current_workspace_id' => $workspace->id]);

                // Add workspace to request for controllers to use
                $request->merge(['workspace_id' => $workspaceId]);
                
                // Share workspace with all views
                view()->share('currentWorkspace', $workspace);
                view()->share('userRole', $workspace->getUserRole($user));
                
                // Store in request attributes for easy access
                $request->attributes->set('currentWorkspace', $workspace);
                $request->attributes->set('userRole', $workspace->getUserRole($user));

                // Legacy aliases
                $request->attributes->set('workspace', $workspace);
                $request->attributes->set('user_role', $workspace->getUserRole($user));
                
                // Log workspace context for debugging
                \Log::info('Workspace context set', [
                    'user_id' => $user->id,
                    'workspace_id' => $workspace->id,
                    'workspace_name' => $workspace->name,
                    'user_role' => $workspace->getUserRole($user),
                    'session_workspace_id' => session('current_workspace_id')
                ]);
            } else {
                // Invalid workspace - clear session
                session()->forget('current_workspace_id');
                \Log::warning('Invalid workspace in session, cleared', [
                    'user_id' => $user->id,
                    'invalid_workspace_id' => $workspaceId
                ]);
            }
        }

        return $next($request);
    }
}
