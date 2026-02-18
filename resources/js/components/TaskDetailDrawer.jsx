import { X, User, Calendar, Tag, Paperclip, MessageSquare, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/Context/WorkspaceContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export default function TaskDetailDrawer({ task, open, onClose, onUpdate }) {
    const { userRole } = useWorkspace();
    const isReadOnly = userRole === 'client';

    if (!task) return null;

    return (
        <div className={cn(
            "fixed inset-y-0 right-0 z-50 w-full sm:w-[600px] bg-white shadow-2xl transform transition-transform duration-300 ease-in-out overflow-hidden flex flex-col",
            open ? "translate-x-0" : "translate-x-full"
        )}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold">Task Details</h2>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="h-8 w-8"
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
                <div className="p-6 space-y-6">
                    {/* Task Name */}
                    <div>
                        {isReadOnly ? (
                            <h3 className="text-2xl font-semibold">{task.name}</h3>
                        ) : (
                            <Input
                                value={task.name}
                                onChange={(e) => onUpdate?.({ ...task, name: e.target.value })}
                                className="text-2xl font-semibold border-0 px-0 focus-visible:ring-0"
                                placeholder="Task name"
                            />
                        )}
                    </div>

                    {/* Meta Information */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Assigned To */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-2">
                                <User className="h-4 w-4 inline mr-1" />
                                Assigned To
                            </label>
                            {task.assigned_to_user ? (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs">
                                            {task.assigned_to_user.name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm">{task.assigned_to_user.name}</span>
                                </div>
                            ) : (
                                <span className="text-sm text-muted-foreground">Unassigned</span>
                            )}
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-2">
                                <Calendar className="h-4 w-4 inline mr-1" />
                                Due Date
                            </label>
                            {task.due_on ? (
                                <span className="text-sm">{new Date(task.due_on).toLocaleDateString()}</span>
                            ) : (
                                <span className="text-sm text-muted-foreground">No due date</span>
                            )}
                        </div>
                    </div>

                    {/* Labels */}
                    {task.labels && task.labels.length > 0 && (
                        <div>
                            <label className="text-sm font-medium text-muted-foreground block mb-2">
                                <Tag className="h-4 w-4 inline mr-1" />
                                Labels
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {task.labels.map((label) => (
                                    <Badge key={label.id} variant="secondary">
                                        {label.name}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">
                            Description
                        </label>
                        {isReadOnly ? (
                            <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {task.description || 'No description provided'}
                            </div>
                        ) : (
                            <Textarea
                                value={task.description || ''}
                                onChange={(e) => onUpdate?.({ ...task, description: e.target.value })}
                                placeholder="Add a description..."
                                rows={6}
                                className="resize-none"
                            />
                        )}
                    </div>

                    {/* Attachments */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">
                            <Paperclip className="h-4 w-4 inline mr-1" />
                            Attachments ({task.attachments?.length || 0})
                        </label>

                        {task.attachments && task.attachments.length > 0 ? (
                            <div className="space-y-2">
                                {task.attachments.map((attachment) => (
                                    <div
                                        key={attachment.id}
                                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <Paperclip className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <span className="text-sm truncate">{attachment.file_name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm" asChild>
                                                <a href={attachment.file_url} target="_blank" rel="noopener noreferrer">
                                                    View
                                                </a>
                                            </Button>
                                            {!isReadOnly && (
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">No attachments</p>
                        )}

                        {!isReadOnly && (
                            <Button variant="outline" size="sm" className="mt-2 w-full">
                                <Paperclip className="h-4 w-4 mr-2" />
                                Upload Attachment
                            </Button>
                        )}
                    </div>

                    {/* Comments */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground block mb-2">
                            <MessageSquare className="h-4 w-4 inline mr-1" />
                            Comments ({task.comments?.length || 0})
                        </label>

                        {/* Comments List */}
                        <div className="space-y-4">
                            {task.comments && task.comments.length > 0 ? (
                                task.comments.map((comment) => (
                                    <div key={comment.id} className="flex gap-3">
                                        <Avatar className="h-8 w-8 flex-shrink-0">
                                            <AvatarFallback className="text-xs">
                                                {comment.user?.name?.charAt(0) || 'U'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-sm">{comment.user?.name || 'Unknown'}</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(comment.created_at).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700">{comment.body}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground">No comments yet</p>
                            )}
                        </div>

                        {/* Add Comment */}
                        {!isReadOnly && (
                            <div className="mt-4">
                                <Textarea
                                    placeholder="Add a comment..."
                                    rows={3}
                                    className="resize-none mb-2"
                                />
                                <Button size="sm">Post Comment</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Footer Actions (for non-readonly) */}
            {!isReadOnly && (
                <div className="border-t px-6 py-4 bg-gray-50">
                    <div className="flex items-center justify-between">
                        <Button variant="destructive" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete Task
                        </Button>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button size="sm" onClick={() => {
                                // Save changes
                                onClose();
                            }}>
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Overlay backdrop */}
            {open && (
                <div
                    className="fixed inset-0 bg-black/50 -z-10"
                    onClick={onClose}
                />
            )}
        </div>
    );
}
