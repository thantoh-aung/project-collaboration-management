<?php

namespace App\Http\Controllers;

use App\Models\Attachment;
use App\Models\Task;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AttachmentController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $task), 403);

        $data = $request->validate([
            'file' => ['required', 'file', 'max:20480'],
        ]);

        $file = $data['file'];

        $storedPath = $file->store("attachments/{$task->id}", 'public');

        $attachment = Attachment::create([
            'task_id' => $task->id,
            'filename' => $file->getClientOriginalName(),
            'path' => $storedPath,
            'size' => $file->getSize(),
            'mime_type' => $file->getClientMimeType(),
        ]);

        // Trigger notification
        NotificationService::attachmentAdded($task, $user, $file->getClientOriginalName());

        return response()->json([
            'attachment' => $attachment,
        ], 201);
    }

    public function destroy(Request $request, Attachment $attachment)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $attachment->task), 403);

        if ($attachment->path) {
            Storage::disk('public')->delete($attachment->path);
        }

        $attachment->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }
}
