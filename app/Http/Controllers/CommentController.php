<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use App\Models\Task;
use App\Models\User;
use App\Services\NotificationService;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);

        $comments = Comment::query()
            ->where('task_id', $task->id)
            ->with(['user:id,name,avatar'])
            ->latest()
            ->get();

        return response()->json([
            'comments' => $comments,
        ]);
    }

    public function store(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);
        abort_unless($user->can('create', Comment::class), 403);

        $data = $request->validate([
            'body' => ['required', 'string'],
        ]);

        $comment = Comment::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'body' => $data['body'],
        ]);

        $mentionedUsers = $this->extractMentionedUsers($data['body']);

        // Trigger notification
        NotificationService::commentAdded($task, $user, $data['body']);

        return response()->json([
            'comment' => $comment->load(['user:id,name,avatar']),
            'mentions' => $mentionedUsers,
        ], 201);
    }

    protected function extractMentionedUsers(string $body): array
    {
        preg_match_all('/@([A-Za-z0-9_\.\-]+)/', $body, $matches);

        $names = array_values(array_unique($matches[1] ?? []));
        if (count($names) === 0) {
            return [];
        }

        $users = User::query()
            ->whereIn('name', $names)
            ->get(['id', 'name', 'email', 'avatar']);

        return $users->toArray();
    }
}
