<?php

namespace App\Services;

use App\Models\PreProjectChat;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class WorkspaceCreationService
{
    public function createFromChat(PreProjectChat $chat, string $workspaceName): Workspace
    {
        $workspace = null;

        DB::transaction(function () use ($chat, $workspaceName, &$workspace) {
            // 1. Create workspace
            $workspace = Workspace::create([
                'name'      => $workspaceName,
                'slug'      => Workspace::generateSlug($workspaceName),
                'owner_id'  => $chat->freelancer_id,
                'is_active' => true,
            ]);

            // 2. Add freelancer as owner (admin)
            $workspace->addUser(
                User::find($chat->freelancer_id),
                'admin'
            );

            // 3. Add client as client role
            $workspace->addUser(
                User::find($chat->client_id),
                'client'
            );

            // 4. Mark chat as converted
            $chat->update([
                'status'       => 'converted_to_workspace',
                'workspace_id' => $workspace->id,
            ]);

            // 5. Recalculate freelancer's total projects count
            $freelancerProfile = \App\Models\FreelancerProfile::where('user_id', $chat->freelancer_id)->first();
            if ($freelancerProfile) {
                $freelancerProfile->recalculateProjectsCount();
            }
        });

        return $workspace;
    }
}
