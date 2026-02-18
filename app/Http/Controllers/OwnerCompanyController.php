<?php

namespace App\Http\Controllers;

use App\Models\Country;
use App\Models\Currency;
use App\Models\OwnerCompany;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class OwnerCompanyController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', OwnerCompany::class);

        $query = OwnerCompany::query();

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
        $this->authorize('create', OwnerCompany::class);

        $countries = Country::orderBy('name')->pluck('name', 'id');
        $currencies = Currency::orderBy('name')->pluck('name', 'id');

        return response()->json([
            'countries' => $countries,
            'currencies' => $currencies,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', OwnerCompany::class);

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

        $company = OwnerCompany::create($validated);

        return response()->json([
            'message' => 'Owner company created successfully.',
            'company' => $company->load(['country:id,name', 'currency:id,name,code']),
        ], 201);
    }

    public function edit(OwnerCompany $ownerCompany): JsonResponse
    {
        $this->authorize('view', $ownerCompany);

        $countries = Country::orderBy('name')->pluck('name', 'id');
        $currencies = Currency::orderBy('name')->pluck('name', 'id');

        return response()->json([
            'company' => $ownerCompany->load(['country:id,name', 'currency:id,name,code']),
            'countries' => $countries,
            'currencies' => $currencies,
        ]);
    }

    public function update(Request $request, OwnerCompany $ownerCompany): JsonResponse
    {
        $this->authorize('update', $ownerCompany);

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

        $ownerCompany->update($validated);

        return response()->json([
            'message' => 'Owner company updated successfully.',
            'company' => $ownerCompany->load(['country:id,name', 'currency:id,name,code']),
        ]);
    }

    public function destroy(OwnerCompany $ownerCompany): JsonResponse
    {
        $this->authorize('delete', $ownerCompany);

        $ownerCompany->delete();

        return response()->json(['message' => 'Owner company deleted successfully.']);
    }
}
