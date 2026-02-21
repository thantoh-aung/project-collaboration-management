import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import UserProfileLink from '@/Components/UserProfileLink';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Mail, Shield, Calendar } from 'lucide-react';

export default function ClientsIndex({ clients, auth, message }) {
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
      <Head title="Clients" />

      <MainLayout title="Clients">
        <div className="max-w-7xl mx-auto">
          {message ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-[#CBD5E1]" />
              <h3 className="mt-2 text-sm font-medium text-[#0F172A]">{message}</h3>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#0F172A]">Clients</h1>
                <p className="mt-1 text-sm text-[#64748B]">
                  Client users in {auth?.current_workspace?.name}
                </p>
              </div>

              {clients.length > 0 ? (
                <div className="bg-white border border-[#E2E8F0] rounded-[10px] overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                        <TableHead className="font-semibold text-[#64748B]">Client</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Role</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Permissions</TableHead>
                        <TableHead className="font-semibold text-[#64748B]">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-[#F8FAFC] border-b border-[#E2E8F0]">
                          <TableCell>
                            <UserProfileLink userId={client.id}>
                              <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={client.avatar_url} alt={client.name} />
                                  <AvatarFallback className="bg-[#4F46E5] text-white text-xs">
                                    {client.name?.charAt(0)?.toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium text-[#0F172A] hover:text-[#4F46E5] transition-colors">
                                    {client.name}
                                  </p>
                                  <p className="text-sm text-[#64748B]">
                                    {client.email}
                                  </p>
                                </div>
                              </div>
                            </UserProfileLink>
                          </TableCell>
                          <TableCell>
                            <Badge className={getRoleBadgeColor(client.workspace_role)}>
                              {client.workspace_role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {client.global_roles && client.global_roles.length > 0 ? (
                                client.global_roles.map((role) => (
                                  <Badge key={role} variant="outline" className="text-xs text-[#64748B] border-[#E2E8F0]">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-[#94A3B8]">Read Only</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-[#64748B]">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              {new Date(client.created_at).toLocaleDateString()}
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
                  <h3 className="mt-2 text-sm font-medium text-[#0F172A]">No clients</h3>
                  <p className="mt-1 text-sm text-[#64748B]">
                    No client accounts have been added to this workspace yet.
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
