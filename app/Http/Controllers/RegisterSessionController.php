<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\RegisterSession;
use Illuminate\Http\Request;

class RegisterSessionController extends Controller
{
    public function openSession(Request $request)
    {
        $validated = $request->validate([
            'opening_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $userId = $request->user()->id;
        $existing = RegisterSession::getActiveSession($userId);

        if ($existing) {
            return redirect()->back()->with('error', 'You already have an active register session open.');
        }

        RegisterSession::create([
            'user_id' => $userId,
            'opened_at' => now(),
            'opening_cash' => $validated['opening_cash'],
            'status' => 'open',
            'notes' => $validated['notes'] ?? null,
        ]);

        return redirect()->back()->with('success', 'Register session opened successfully.');
    }

    public function closeSession(Request $request, RegisterSession $session)
    {
        $validated = $request->validate([
            'closing_cash' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $cashSales = Order::where('register_session_id', $session->id)
            ->whereHas('paymentMethod', fn($q) => $q->where('type', 'cash'))
            ->sum('paid_amount');

        $openingCash = (float) $session->opening_cash;
        $expectedCash = $openingCash + (float) $cashSales;
        $actualCash = (float) $validated['closing_cash'];
        $discrepancy = $actualCash - $expectedCash;

        $session->update([
            'closed_at' => now(),
            'closing_cash' => $actualCash,
            'expected_cash' => $expectedCash,
            'discrepancy' => $discrepancy,
            'status' => 'closed',
            'notes' => $validated['notes'] ?? $session->notes,
        ]);

        return redirect()->back()->with('success', 'Register session closed successfully.');
    }
}
