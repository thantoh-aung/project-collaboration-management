import { Head } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Mail, Shield, Calendar } from 'lucide-react';

export default function ClientsIndex({ clients, auth, message }) {
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
      <Head title="Clients" />
      
      <MainLayout title="Clients">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {message ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">{message}</h3>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Clients</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Client users in {auth?.current_workspace?.name}
                </p>
              </div>

              {clients.length > 0 ? (
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">Client</TableHead>
                        <TableHead className="font-semibold text-gray-900">Role</TableHead>
                        <TableHead className="font-semibold text-gray-900">Permissions</TableHead>
                        <TableHead className="font-semibold text-gray-900">Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage src={client.avatar_url} alt={client.name} />
                                <AvatarFallback>
                                  {client.name?.charAt(0)?.toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {client.name}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {client.email}
                                </p>
                              </div>
                            </div>
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
                                  <Badge key={role} variant="outline" className="text-xs">
                                    {role}
                                  </Badge>
                                ))
                              ) : (
                                <span className="text-sm text-gray-500">Read Only</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center text-sm text-gray-500">
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
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No clients</h3>
                  <p className="mt-1 text-sm text-gray-500">
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
