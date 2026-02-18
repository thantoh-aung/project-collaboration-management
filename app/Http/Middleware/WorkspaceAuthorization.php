<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Workspace;
use Symfony\Component\HttpFoundation\Response;

class WorkspaceAuthorization
{
    private function wantsJson(Request $request): bool
    {
        return $request->expectsJson()
            || $request->wantsJson()
            || $request->is('api/*');
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();
        
        if (!$user) {
            if ($this->wantsJson($request)) {
                return response()->json(['error' => 'Unauthenticated'], 401);
            }

            return redirect()->route('login');
        }

        // Get workspace from request (route parameter, query parameter, or session)
        $workspaceId = $request->route('workspace') 
            ?? $request->query('workspace_id') 
            ?? session('current_workspace_id');

        if ($workspaceId instanceof Workspace) {
            $workspaceId = $workspaceId->id;
        }

        if (!$workspaceId) {
            if ($this->wantsJson($request)) {
                return response()->json(['error' => 'No workspace selected'], 400);
            }

            return redirect()->route('workspaces.select')
                ->with('error', 'Please select a workspace to continue.');
        }

        // Find the workspace
        $workspace = Workspace::find($workspaceId);
        
        if (!$workspace) {
            if ($this->wantsJson($request)) {
                return response()->json(['error' => 'Workspace not found'], 404);
            }

            return redirect()->route('workspaces.select')
                ->with('error', 'Workspace not found.');
        }

        // Check if user belongs to this workspace
        if (!$workspace->hasUser($user)) {
            if ($this->wantsJson($request)) {
                return response()->json(['error' => 'You do not have access to this workspace'], 403);
            }

            // Return 403 instead of redirecting for unauthorized access
            abort(403, 'You do not have access to this workspace.');
        }

        session(['current_workspace_id' => $workspace->id]);

        // Share workspace with the request
        $request->merge(['workspace_id' => $workspace->id]);
        $userRole = $workspace->getUserRole($user);

        $request->attributes->set('currentWorkspace', $workspace);
        $request->attributes->set('userRole', $userRole);

        $request->attributes->set('workspace', $workspace);
        $request->attributes->set('user_role', $userRole);

        return $next($request);
    }
}
