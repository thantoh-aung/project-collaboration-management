<?php

namespace App\Http\Controllers;

use App\Models\ClientCompany;
use App\Models\Country;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ClientCompanyController extends Controller
{
    public function workspaceIndex(Request $request)
    {
        $user = Auth::user();
        $workspace = $request->attributes->get('currentWorkspace');
        $userRole = $request->attributes->get('userRole');

        if (!$workspace) {
            return Inertia::render('Clients/Index', [
                'clients' => [],
                'auth' => ['user' => $user],
                'message' => 'Please join a workspace to view clients.'
            ]);
        }

        // Filter clients by workspace (if workspace_id column exists)
        // For now, show all non-archived clients
        $query = ClientCompany::whereNull('archived_at')
            ->with(['country:id,name', 'currency:id,name,code']);

        // Apply search if provided
        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $clients = $query->orderBy('name')->paginate(20);

        return Inertia::render('Clients/Index', [
            'clients' => $clients,
            'auth' => [
                'user' => $user,
                'current_workspace' => $workspace,
                'user_role' => $userRole
            ]
        ]);
    }
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', ClientCompany::class);

        $query = ClientCompany::query()->whereNull('archived_at');

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('city', 'like', "%{$search}%");
            });
        }

        $companies = $query->with(['country:id,name', 'currency:id,name,code'])
            ->orderBy('name')
            ->paginate(20);

        return response()->json($companies);
    }

    public function create(): JsonResponse
    {
        $this->authorize('create', ClientCompany::class);

        $countries = Country::orderBy('name')->pluck('name', 'id');
        $currencies = Currency::orderBy('name')->pluck('name', 'id');

        return response()->json([
            'countries' => $countries,
            'currencies' => $currencies,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', ClientCompany::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'web' => ['nullable', 'url', 'max:255'],
            'iban' => ['nullable', 'string', 'max:34'],
            'swift' => ['nullable', 'string', 'max:11'],
            'business_id' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:255'],
            'vat' => ['nullable', 'string', 'max:255'],
        ]);

        $company = ClientCompany::create($validated);

        return response()->json([
            'message' => 'Client company created successfully.',
            'company' => $company->load(['country:id,name', 'currency:id,name,code']),
        ], 201);
    }

    public function edit(ClientCompany $clientCompany): JsonResponse
    {
        $this->authorize('update', $clientCompany);

        $countries = Country::orderBy('name')->pluck('name', 'id');
        $currencies = Currency::orderBy('name')->pluck('name', 'id');

        return response()->json([
            'company' => $clientCompany->load(['country:id,name', 'currency:id,name,code']),
            'countries' => $countries,
            'currencies' => $currencies,
        ]);
    }

    public function update(Request $request, ClientCompany $clientCompany): JsonResponse
    {
        $this->authorize('update', $clientCompany);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'city' => ['nullable', 'string', 'max:255'],
            'country_id' => ['nullable', 'exists:countries,id'],
            'currency_id' => ['nullable', 'exists:currencies,id'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'web' => ['nullable', 'url', 'max:255'],
            'iban' => ['nullable', 'string', 'max:34'],
            'swift' => ['nullable', 'string', 'max:11'],
            'business_id' => ['nullable', 'string', 'max:255'],
            'tax_id' => ['nullable', 'string', 'max:255'],
            'vat' => ['nullable', 'string', 'max:255'],
        ]);

        $clientCompany->update($validated);

        return response()->json([
            'message' => 'Client company updated successfully.',
            'company' => $clientCompany->load(['country:id,name', 'currency:id,name,code']),
        ]);
    }

    public function destroy(ClientCompany $clientCompany): JsonResponse
    {
        $this->authorize('archive', $clientCompany);

        $clientCompany->update(['archived_at' => now()]);

        return response()->json(['message' => 'Client company archived successfully.']);
    }

    public function restore(ClientCompany $clientCompany): JsonResponse
    {
        $this->authorize('restore', $clientCompany);

        $clientCompany->update(['archived_at' => null]);

        return response()->json(['message' => 'Client company restored successfully.']);
    }
}
