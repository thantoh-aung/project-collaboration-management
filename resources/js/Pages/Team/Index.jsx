import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Shield, Calendar, Mail } from 'lucide-react';

export default function TeamIndex({ team, auth, message }) {
  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      member: 'bg-blue-100 text-blue-800',
      client: 'bg-green-100 text-green-800',
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <>
      <Head title="Team" />

      <MainLayout title="Team">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Team Members</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage and view team members in {auth?.current_workspace?.name}
                </p>
              </div>

              {team.length > 0 ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Member</TableHead>
                        <TableHead className="font-semibold text-gray-900">Role</TableHead>
                        <TableHead className="font-semibold text-gray-900">Permissions</TableHead>
                        <TableHead className="font-semibold text-gray-900">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {team.map((member) => (
                        <TableRow key={member.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={member.avatar_url} alt={member.name} />
                                <AvatarFallback>
                                  {member.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {member.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {member.email}
                                </p>
                              </div>
                            </div>
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
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {member.workspace_role === 'admin' ? 'All Access' : 
                                   member.workspace_role === 'member' ? 'Read, Write' : 
                                   'None'}
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
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
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                  <p className="mt-1 text-sm text-gray-500">
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
