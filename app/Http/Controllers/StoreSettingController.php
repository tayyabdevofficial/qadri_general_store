<?php

namespace App\Http\Controllers;

use App\Models\StoreSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class StoreSettingController extends Controller
{
    public function index(): Response
    {
        $settings = StoreSetting::getSettings();

        return Inertia::render('settings/store', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request)
    {
        $settings = StoreSetting::getSettings();

        $validated = $request->validate([
            'store_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255',
            'address' => 'required|string',
            'currency_symbol' => 'required|string|max:10',
            'ntn_number' => 'nullable|string|max:50',
            'strn_number' => 'nullable|string|max:50',
            'receipt_footer' => 'nullable|string',
            'logo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        if ($request->hasFile('logo')) {
            if ($settings->logo_path && Storage::disk('public')->exists($settings->logo_path)) {
                Storage::disk('public')->delete($settings->logo_path);
            }
            $validated['logo_path'] = $request->file('logo')->store('settings', 'public');
        }

        $settings->update($validated);

        return redirect()->back()->with('success', 'Store settings updated successfully.');
    }
}
