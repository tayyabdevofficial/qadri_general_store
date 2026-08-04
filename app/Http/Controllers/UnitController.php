<?php

namespace App\Http\Controllers;

use App\Models\Unit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $units = Unit::query()
            ->withCount('products')
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('short_name', 'like', "%{$search}%");
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('units/index', [
            'units' => $units,
            'filters' => ['search' => $search],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:20',
            'allow_decimal' => 'boolean',
            'is_variable_price' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        Unit::create($validated);

        return redirect()->back()->with('success', 'Unit created successfully.');
    }

    public function update(Request $request, Unit $unit)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'short_name' => 'required|string|max:20',
            'allow_decimal' => 'boolean',
            'is_variable_price' => 'boolean',
            'status' => 'required|in:active,inactive',
        ]);

        $unit->update($validated);

        return redirect()->back()->with('success', 'Unit updated successfully.');
    }

    public function destroy(Unit $unit)
    {
        if ($unit->products()->count() > 0) {
            return redirect()->back()->with('error', 'Cannot delete unit associated with products.');
        }

        $unit->delete();

        return redirect()->back()->with('success', 'Unit deleted successfully.');
    }
}
