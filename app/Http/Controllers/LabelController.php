<?php

namespace App\Http\Controllers;

use App\Models\Label;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class LabelController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Label::class);

        $query = Label::query();

        if ($request->filled('search')) {
            $search = $request->input('search');
            $query->where('name', 'like', "%{$search}%");
        }

        $labels = $query->withCount('tasks')->orderBy('name')->paginate(20);

        return response()->json($labels);
    }

    public function create(): JsonResponse
    {
        $this->authorize('create', Label::class);

        return response()->json([]);
    }

    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Label::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:labels,name'],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $label = Label::create($validated);

        return response()->json([
            'message' => 'Label created successfully.',
            'label' => $label,
        ], 201);
    }

    public function edit(Label $label): JsonResponse
    {
        $this->authorize('view', $label);

        return response()->json([
            'label' => $label,
        ]);
    }

    public function update(Request $request, Label $label): JsonResponse
    {
        $this->authorize('update', $label);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:labels,name,' . $label->id],
            'color' => ['required', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
        ]);

        $label->update($validated);

        return response()->json([
            'message' => 'Label updated successfully.',
            'label' => $label,
        ]);
    }

    public function destroy(Label $label): JsonResponse
    {
        $this->authorize('delete', $label);

        $label->delete();

        return response()->json(['message' => 'Label deleted successfully.']);
    }
}
