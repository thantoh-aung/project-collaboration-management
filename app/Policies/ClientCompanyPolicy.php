<?php

namespace App\Policies;

use App\Models\ClientCompany;
use App\Models\User;

class ClientCompanyPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('client-companies.view');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, ClientCompany $clientCompany): bool
    {
        // Admin can view all client companies
        if ($user->hasRole('admin')) {
            return true;
        }

        // Check permission
        if (!$user->can('client-companies.view')) {
            return false;
        }

        // Clients can only view their own company
        if ($user->hasRole('client')) {
            return $user->clientCompanies()->where('client_companies.id', $clientCompany->id)->exists();
        }

        return true;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->can('client-companies.create');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, ClientCompany $clientCompany): bool
    {
        // Admin can update all client companies
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('client-companies.edit');
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, ClientCompany $clientCompany): bool
    {
        // Only admin can delete client companies
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('client-companies.delete');
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, ClientCompany $clientCompany): bool
    {
        // Only admin can restore client companies
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can archive the model.
     */
    public function archive(User $user, ClientCompany $clientCompany): bool
    {
        // Only admin can archive client companies
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('client-companies.delete');
    }
}
