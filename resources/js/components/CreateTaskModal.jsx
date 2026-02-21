import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function CreateTaskModal({
  open,
  onClose,
  projectId,
  groupId,
  projectMembers = [],
  onSuccess
}) {

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    description: '',
    assigned_to_user_id: '',
    group_id: groupId || '',
    due_on: '',
    project_id: projectId,
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    post(`/projects/${projectId}/tasks`, {
      preserveScroll: true,
      onSuccess: () => {
        reset();
        onClose();
        if (onSuccess) onSuccess();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-white max-h-[90vh] overflow-y-auto border border-[#E2E8F0]">
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
          <DialogDescription>
            Add a new task to your project. Fill in the details below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Task Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter task title..."
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              className={errors.name ? 'border-red-500' : ''}
              autoFocus
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add task description..."
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              rows={3}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assign To</Label>
            <Select
              value={data.assigned_to_user_id?.toString()}
              onValueChange={(value) => setData('assigned_to_user_id', value)}
            >
              <SelectTrigger className={errors.assigned_to_user_id ? 'border-red-500' : ''}>
                <SelectValue placeholder="Select team member..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {projectMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assigned_to_user_id && (
              <p className="text-sm text-red-500">{errors.assigned_to_user_id}</p>
            )}
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_on">Due Date</Label>
            <Input
              id="due_on"
              type="date"
              value={data.due_on}
              onChange={(e) => setData('due_on', e.target.value)}
              className={errors.due_on ? 'border-red-500' : ''}
            />
            {errors.due_on && (
              <p className="text-sm text-red-500">{errors.due_on}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={processing}>
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
