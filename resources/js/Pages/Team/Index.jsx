import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import UserProfileLink from '@/Components/UserProfileLink';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, Calendar, Mail } from 'lucide-react';

export default function TeamIndex({ team, auth, message }) {
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-[rgba(79,70,229,0.08)] text-[#4F46E5]',
      member: 'bg-blue-50 text-blue-600',
      client: 'bg-emerald-50 text-emerald-600',
    };
    return colors[role] || 'bg-[#F1F5F9] text-[#64748B]';
  };

  return (
    <>
      <Head title="Team" />

      <MainLayout title="Team">
        <div className="max-w-7xl mx-auto">
          {message ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-[#CBD5E1]" />
              <h3 className="mt-2 text-sm font-medium text-[#0F172A]">{message}</h3>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0F172A]">Team Members</h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Manage and view team members in {auth?.current_workspace?.name}
                </p>
              </div>

              {team.length > 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <TableHead className="font-semibold text-[#64748B]">Member</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Role</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Permissions</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.map((member) => (
                        <TableRow key={member.id} className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          <TableCell>
                            <UserProfileLink userId={member.id}>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={member.avatar_url} alt={member.name} />
                                  <AvatarFallback className="bg-[#4F46E5] text-white text-xs">
                                    {member.name?.charAt(0)?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-[#0F172A] hover:text-[#4F46E5] transition-colors">
                                    {member.name}
                                  </p>
                                  <p className="text-sm text-[#64748B]">
                                    {member.email}
                                  </p>
                                </div>
                              </div>
                            </UserProfileLink>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(member.workspace_role)}>
                              {member.workspace_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {member.global_roles && member.global_roles.length > 0 ? (
                                member.global_roles.map((role) => (
                                  <Badge key={role} variant="outline" className="text-xs text-[#64748B] border-[#E2E8F0]">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-[#94A3B8]">
                                  {member.workspace_role === 'admin' ? 'All Access' :
                                    member.workspace_role === 'member' ? 'Read, Write' :
                                      'None'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-[#64748B]">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              {new Date(member.created_at).toLocaleDateString()}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="mx-auto h-12 w-12 text-[#CBD5E1]" />
                  <h3 className="mt-2 text-sm font-medium text-[#0F172A]">No team members</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    Get started by inviting team members to your workspace.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </MainLayout>
    </>
  );
}
