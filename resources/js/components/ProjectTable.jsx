import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  Plus,
  Search,
  Filter,
  FolderOpen,
  Calendar,
  Users,
  DollarSign
} from 'lucide-react';

const ProjectTable = ({ projects = [], auth, pagination = null, filters = {} }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearch = (value) => {
    setSearchTerm(value);
    router.get(
      route('projects.index'),
      { ...filters, search: value, page: 1 },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleDelete = (projectId) => {
    if (confirm('Are you sure you want to delete this project?')) {
      router.delete(route('projects.destroy', projectId), {
        onSuccess: () => {
          // Project deleted successfully
        },
        onError: (errors) => {
          console.error('Error deleting project:', errors);
        }
      });
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      'completed': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      'on_hold': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      'archived': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No projects found</h3>
        <p className="text-muted-foreground text-center mb-6 max-w-md">
          {searchTerm ? 'No projects match your search criteria.' : 'Get started by creating your first project.'}
        </p>
        <Button asChild>
          <Link href={route('projects.create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
        <Button asChild>
          <Link href={route('projects.create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Project
          </Link>
        </Button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-card border rounded-lg p-4 space-y-4">
          <h4 className="font-medium">Filter Projects</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select 
                className="w-full p-2 border rounded-md"
                onChange={(e) => router.get(
                  route('projects.index'),
                  { ...filters, status: e.target.value, page: 1 },
                  { preserveState: true }
                )}
                value={filters.status || ''}
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="on_hold">On Hold</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="font-semibold">Project</TableHead>
                <TableHead className="font-semibold">Client</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Budget</TableHead>
                <TableHead className="font-semibold">Progress</TableHead>
                <TableHead className="font-semibold">Due Date</TableHead>
                <TableHead className="font-semibold">Team</TableHead>
                <TableHead className="text-right font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((project) => (
                <TableRow 
                  key={project.id}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                  onClick={() => router.visit(`/projects/${project.id}/tasks`)}
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{project.name}</span>
                      {project.description && (
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {project.description}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-foreground">{project.client_company?.name || 'No Client'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={cn(getStatusColor(project.status))}>
                      {project.status?.replace('_', ' ') || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 text-muted-foreground mr-1" />
                      <span className="font-medium">{formatCurrency(project.budget)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-10 text-right">
                        {project.progress || 0}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-1" />
                      <span>{formatDate(project.due_date)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {/* Team Members (Admin/Member) */}
                      {project.team_members && project.team_members.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {project.team_members.slice(0, 2).map((member, index) => (
                            <div
                              key={`team-${index}`}
                              className="w-6 h-6 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-xs font-medium text-blue-700"
                              title={`${member.name} (${member.pivot?.role || 'member'})`}
                            >
                              {member.name?.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {project.team_members.length > 2 && (
                            <div className="w-6 h-6 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-xs font-medium text-blue-600">
                              +{project.team_members.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Clients */}
                      {project.clients && project.clients.length > 0 && (
                        <div className="flex items-center space-x-1">
                          {project.clients.slice(0, 2).map((client, index) => (
                            <div
                              key={`client-${index}`}
                              className="w-6 h-6 rounded-full bg-green-100 border border-green-200 flex items-center justify-center text-xs font-medium text-green-700"
                              title={`${client.name} (client)`}
                            >
                              {client.name?.charAt(0).toUpperCase()}
                            </div>
                          ))}
                          {project.clients.length > 2 && (
                            <div className="w-6 h-6 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-xs font-medium text-green-600">
                              +{project.clients.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Empty state */}
                      {(!project.team_members || project.team_members.length === 0) && 
                       (!project.clients || project.clients.length === 0) && (
                        <div className="flex items-center text-muted-foreground text-sm">
                          <Users className="h-4 w-4 mr-1" />
                          No members
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${project.id}/tasks`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        {(auth.user?.role === 'admin' || auth.user?.role === 'manager') && (
                          <>
                            <DropdownMenuItem asChild>
                              <Link href={route('projects.edit', project.id)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Project
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(project.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.last_page > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {pagination.from} to {pagination.to} of {pagination.total} projects
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.get(
                route('projects.index'),
                { ...filters, page: pagination.current_page - 1 },
                { preserveState: true }
              )}
              disabled={pagination.current_page === 1}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.current_page} of {pagination.last_page}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.get(
                route('projects.index'),
                { ...filters, page: pagination.current_page + 1 },
                { preserveState: true }
              )}
              disabled={pagination.current_page === pagination.last_page}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectTable;
