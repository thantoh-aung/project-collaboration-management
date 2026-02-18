<?php

namespace App\Http\Controllers;

use App\Models\ClientCompany;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClientUserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ClientCompany::class);

        $request->validate([
            'client_company_id' => ['required', 'exists:client_companies,id'],
        ]);

        $clientCompany = ClientCompany::findOrFail($request->input('client_company_id'));
        $this->authorize('view', $clientCompany);

        $users = $clientCompany->clients()
            ->whereNull('archived_at')
            ->orderBy('name')
            ->get(['id', 'name', 'email', 'job_title']);

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('update', ClientCompany::class);

        $validated = $request->validate([
            'client_company_id' => ['required', 'exists:client_companies,id'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['exists:users,id'],
        ]);

        $clientCompany = ClientCompany::findOrFail($validated['client_company_id']);
        $this->authorize('update', $clientCompany);

        $clientCompany->clients()->syncWithoutDetaching($validated['user_ids']);

        return response()->json([
            'message' => 'Users assigned to client company successfully.',
            'users' => $clientCompany->clients()->whereIn('users.id', $validated['user_ids'])->get(['id', 'name', 'email']),
        ]);
    }

    public function destroy(Request $request, ClientCompany $clientCompany, User $user): JsonResponse
    {
        $this->authorize('update', $clientCompany);

        if (!$clientCompany->clients()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => 'User is not assigned to this client company.'], 404);
        }

        $clientCompany->clients()->detach($user->id);

        return response()->json(['message' => 'User unassigned from client company successfully.']);
    }
}
