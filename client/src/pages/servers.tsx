import { useState } from 'react';
import { ServerList } from '@/components/servers/server-list';
import { ServerSearchFilters } from '@/components/servers/server-search-filters';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getServers, ServerFilters } from '@/lib/steam';
import { Pagination } from '@/components/ui/pagination';

interface ServersPageProps {
  onLoginRequired: () => void;
}

export default function ServersPage({ onLoginRequired }: ServersPageProps) {
  const [filters, setFilters] = useState<ServerFilters>({
    sort: 'votes',
    page: 1,
    limit: 9
  });

  // Servers query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/servers', filters],
    queryFn: () => getServers(filters)
  });

  const handleFilterChange = (newFilters: Partial<ServerFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Browse Servers</h1>
      
      {/* Search and Filters */}
      <ServerSearchFilters onFilterChange={handleFilterChange} defaultFilters={filters} />

      {/* Server List */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(9)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-56"></CardContent>
            </Card>
          ))}
        </div>
      ) : isError ? (
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error loading servers
          </CardContent>
        </Card>
      ) : data?.servers.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            No servers found matching your criteria
          </CardContent>
        </Card>
      ) : (
        <>
          <ServerList 
            servers={data?.servers || []} 
            onLoginRequired={onLoginRequired}
            refetch={refetch}
          />
          
          {/* Pagination */}
          {data && data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={filters.page || 1}
                totalPages={data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
