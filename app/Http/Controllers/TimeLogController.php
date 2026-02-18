<?php

namespace App\Http\Controllers;

use App\Models\Task;
use App\Models\TimeLog;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TimeLogController extends Controller
{
    public function store(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);
        abort_unless($user->can('create', TimeLog::class), 403);

        $data = $request->validate([
            'minutes' => ['required', 'integer', 'min:0'],
            'description' => ['nullable', 'string'],
            'started_at' => ['nullable', 'date'],
            'stopped_at' => ['nullable', 'date'],
        ]);

        $timeLog = TimeLog::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'minutes' => $data['minutes'],
            'description' => $data['description'] ?? null,
            'started_at' => isset($data['started_at']) ? Carbon::parse($data['started_at']) : null,
            'stopped_at' => isset($data['stopped_at']) ? Carbon::parse($data['stopped_at']) : null,
        ]);

        return response()->json([
            'timeLog' => $timeLog,
        ], 201);
    }

    public function destroy(Request $request, TimeLog $timeLog)
    {
        $user = $request->user();

        abort_unless($user && $user->can('delete', $timeLog), 403);

        $timeLog->delete();

        return response()->json([
            'status' => 'ok',
        ]);
    }

    public function startTimer(Request $request, Task $task)
    {
        $user = $request->user();

        abort_unless($user && $user->can('view', $task), 403);
        abort_unless($user->can('create', TimeLog::class), 403);

        $running = TimeLog::query()
            ->where('task_id', $task->id)
            ->where('user_id', $user->id)
            ->whereNotNull('started_at')
            ->whereNull('stopped_at')
            ->first();

        if ($running) {
            return response()->json([
                'timeLog' => $running,
            ]);
        }

        $timeLog = TimeLog::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'minutes' => 0,
            'description' => null,
            'started_at' => now(),
            'stopped_at' => null,
        ]);

        return response()->json([
            'timeLog' => $timeLog,
        ], 201);
    }

    public function stopTimer(Request $request, TimeLog $timeLog)
    {
        $user = $request->user();

        abort_unless($user && $user->can('update', $timeLog), 403);

        if ($timeLog->started_at === null) {
            return response()->json([
                'message' => 'Timer was not started.',
            ], 422);
        }

        if ($timeLog->stopped_at !== null) {
            return response()->json([
                'timeLog' => $timeLog,
            ]);
        }

        $stoppedAt = now();
        $minutes = max(0, (int) $timeLog->started_at->diffInMinutes($stoppedAt));

        $timeLog->stopped_at = $stoppedAt;
        $timeLog->minutes = $minutes;
        $timeLog->save();

        return response()->json([
            'timeLog' => $timeLog,
        ]);
    }
}
