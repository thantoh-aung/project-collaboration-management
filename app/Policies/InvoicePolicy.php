<?php

namespace App\Policies;

use App\Models\Invoice;
use App\Models\User;

class InvoicePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('invoices.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Invoice $invoice): bool
    {
        // Admin can view all invoices
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('invoices.view')) {
            return false;
        }

        // Clients can only view invoices for their company
        if ($user->hasRole('client')) {
            return $user->clientCompanies()->where('client_companies.id', $invoice->client_company_id)->exists();
        }

        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('invoices.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Invoice $invoice): bool
    {
        // Admin can update all invoices
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('invoices.edit')) {
            return false;
        }

        // Manager can only edit invoices they created or for their projects
        if ($user->hasRole('manager')) {
            return $invoice->created_by_user_id === $user->id;
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Invoice $invoice): bool
    {
        // Only admin can delete invoices
        return $user->hasRole('admin') && $user->can('invoices.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Invoice $invoice): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('invoices.edit');
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, Invoice $invoice): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('invoices.delete');
    }
}
