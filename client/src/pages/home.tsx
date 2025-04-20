import { useState } from 'react';
import { Link } from 'wouter';
import { ServerList } from '@/components/servers/server-list';
import { ServerSearchFilters } from '@/components/servers/server-search-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { getFeaturedServers, getServers, ServerFilters } from '@/lib/steam';
import { Pagination } from '@/components/ui/pagination';

interface HomeProps {
  onLoginRequired: () => void;
}

export default function Home({ onLoginRequired }: HomeProps) {
  const [filters, setFilters] = useState<ServerFilters>({
    sort: 'votes',
    page: 1,
    limit: 6
  });

  // Featured servers query
  const featuredServersQuery = useQuery({
    queryKey: ['/api/servers/featured'],
    queryFn: getFeaturedServers
  });

  // Top servers query
  const topServersQuery = useQuery({
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
      {/* Hero Section */}
      <Card className="mb-8">
        <CardContent className="px-4 py-5 sm:p-6 md:flex md:items-center md:justify-between">
          <div className="md:w-0 md:flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Find the Best Gaming Servers
            </h2>
            <p className="mt-1 text-gray-500">
              Browse, vote, and submit your favorite gaming servers across multiple games
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <Link href="/add-server">
              <Button>
                Add Your Server
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Search and Filters */}
      <ServerSearchFilters onFilterChange={handleFilterChange} />

      {/* Featured Servers */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Featured Servers</h2>
      {featuredServersQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-56"></CardContent>
            </Card>
          ))}
        </div>
      ) : featuredServersQuery.isError ? (
        <Card className="mb-8">
          <CardContent className="p-6 text-center text-red-500">
            Error loading featured servers
          </CardContent>
        </Card>
      ) : (
        <div className="mb-8">
          <ServerList 
            servers={featuredServersQuery.data} 
            isFeatured={true} 
            onLoginRequired={onLoginRequired}
            refetch={featuredServersQuery.refetch}
          />
        </div>
      )}

      {/* Top Servers */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Top Servers</h2>
      {topServersQuery.isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-56"></CardContent>
            </Card>
          ))}
        </div>
      ) : topServersQuery.isError ? (
        <Card>
          <CardContent className="p-6 text-center text-red-500">
            Error loading servers
          </CardContent>
        </Card>
      ) : (
        <>
          <ServerList 
            servers={topServersQuery.data?.servers || []} 
            onLoginRequired={onLoginRequired}
            refetch={topServersQuery.refetch}
          />
          
          {/* Pagination */}
          {topServersQuery.data && topServersQuery.data.pagination.totalPages > 1 && (
            <div className="mt-8 flex justify-center">
              <Pagination
                currentPage={filters.page || 1}
                totalPages={topServersQuery.data.pagination.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
