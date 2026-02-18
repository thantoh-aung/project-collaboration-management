import { useState } from 'react';
import { useForm } from '@inertiajs/react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Send, 
  Copy, 
  Check, 
  AlertCircle,
  Crown,
  User,
  Users
} from 'lucide-react';

export default function InviteMemberModal({ workspaceId, onClose, onSuccess }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [loading, setLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const roleOptions = [
    {
      value: 'admin',
      label: 'Admin',
      description: 'Full access to workspace settings and members',
      icon: <Crown className="w-4 h-4" />,
      color: 'bg-purple-100 text-purple-800'
    },
    {
      value: 'member',
      label: 'Member',
      description: 'Can create and manage projects and tasks',
      icon: <User className="w-4 h-4" />,
      color: 'bg-blue-100 text-blue-800'
    },
    {
      value: 'client',
      label: 'Client',
      description: 'View-only access to specific projects',
      icon: <Users className="w-4 h-4" />,
      color: 'bg-green-100 text-green-800'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
        },
        body: JSON.stringify({
          email,
          role
        })
      });

      const data = await response.json();

      if (response.ok) {
        setInviteLink(data.invite_link);
        setShowSuccess(true);
        onSuccess?.();
      } else {
        setErrors(data.errors || { email: 'Failed to send invitation' });
      }
    } catch (error) {
      setErrors({ email: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    // TODO: Show toast notification
  };

  const resetForm = () => {
    setEmail('');
    setRole('member');
    setErrors({});
    setShowSuccess(false);
    setInviteLink('');
    setLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const selectedRole = roleOptions.find(r => r.value === role);

  return (
    <DialogContent className="sm:max-w-md">
      {!showSuccess ? (
        <>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Send an invitation to join your workspace
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              {errors.email && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={setRole} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((roleOption) => (
                    <SelectItem key={roleOption.value} value={roleOption.value}>
                      <div className="flex items-center gap-2">
                        {roleOption.icon}
                        <div>
                          <div className="font-medium">{roleOption.label}</div>
                          <div className="text-sm text-gray-500">{roleOption.description}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedRole && (
                <div className="mt-2">
                  <Badge className={selectedRole.color}>
                    <span className="flex items-center gap-1">
                      {selectedRole.icon}
                      {selectedRole.label}
                    </span>
                  </Badge>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Invitation
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </>
      ) : (
        <>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              Invitation Sent!
            </DialogTitle>
            <DialogDescription>
              The invitation has been sent to {email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-800">
                <Check className="w-5 h-5" />
                <span className="font-medium">Invitation sent successfully</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                The user will receive an email with the invitation link.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={inviteLink}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyInviteLink}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                You can also share this link directly with the user.
              </p>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                The invitation will expire in 7 days.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleClose}>
              Done
            </Button>
            <Button variant="outline" onClick={resetForm}>
              Invite Another Member
            </Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}
