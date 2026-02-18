<?php

namespace App\Policies;

use App\Models\OwnerCompany;
use App\Models\User;

class OwnerCompanyPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('owner-companies.view');
    }

    public function view(User $user, OwnerCompany $ownerCompany): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('owner-companies.view');
    }

    public function create(User $user): bool
    {
        return $user->can('owner-companies.create');
    }

    public function update(User $user, OwnerCompany $ownerCompany): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('owner-companies.edit');
    }

    public function delete(User $user, OwnerCompany $ownerCompany): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $user->can('owner-companies.delete');
    }
}
