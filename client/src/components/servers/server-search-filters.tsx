import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { getGames } from '@/lib/steam';
import { useQuery } from '@tanstack/react-query';
import { debounce } from '@/lib/utils';

interface ServerFilters {
  search?: string;
  game?: string;
  region?: string;
  status?: string;
  sort?: string;
}

interface ServerSearchFiltersProps {
  onFilterChange: (filters: ServerFilters) => void;
  defaultFilters?: ServerFilters;
}

export function ServerSearchFilters({ onFilterChange, defaultFilters }: ServerSearchFiltersProps) {
  const [filters, setFilters] = useState<ServerFilters>(defaultFilters || {
    search: '',
    game: 'all_games',
    region: 'all_regions',
    status: 'all_servers',
    sort: 'votes'
  });
  
  // Fetch games list
  const { data: games = [] } = useQuery({
    queryKey: ['/api/servers/games/list'],
    queryFn: getGames
  });
  
  // Update filters and notify parent component
  const updateFilters = (newFilters: Partial<ServerFilters>) => {
    const processedFilters = { ...newFilters };
    
    // Convert UI-specific values back to empty strings for API calls
    if (processedFilters.game === 'all_games') processedFilters.game = '';
    if (processedFilters.region === 'all_regions') processedFilters.region = '';
    if (processedFilters.status === 'all_servers') processedFilters.status = '';
    
    const updatedFilters = { ...filters, ...processedFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };
  
  // Debounce search input to prevent too many requests
  const debouncedSearchHandler = debounce((value: string) => {
    updateFilters({ search: value });
  }, 300);
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    debouncedSearchHandler(value);
  };
  
  // Apply default filters on initial load
  useEffect(() => {
    if (defaultFilters) {
      const uiFilters = { ...defaultFilters };
      
      // Convert empty strings to UI-specific values
      if (uiFilters.game === '') uiFilters.game = 'all_games';
      if (uiFilters.region === '') uiFilters.region = 'all_regions';
      if (uiFilters.status === '') uiFilters.status = 'all_servers';
      
      setFilters(uiFilters);
    }
  }, [defaultFilters]);

  return (
    <Card className="mb-8">
      <CardContent className="p-6">
        <div className="md:flex md:items-center mb-4">
          <div className="md:flex-1">
            <Label htmlFor="search" className="sr-only">Search</Label>
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <Input 
                type="text" 
                id="search" 
                placeholder="Search servers by name, IP, or game..." 
                className="pl-10" 
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          <div>
            <Label htmlFor="game">Game</Label>
            <Select 
              value={filters.game} 
              onValueChange={(value) => updateFilters({ game: value })}
            >
              <SelectTrigger id="game">
                <SelectValue placeholder="All Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_games">All Games</SelectItem>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.shortName}>{game.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="region">Region</Label>
            <Select 
              value={filters.region} 
              onValueChange={(value) => updateFilters({ region: value })}
            >
              <SelectTrigger id="region">
                <SelectValue placeholder="All Regions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_regions">All Regions</SelectItem>
                <SelectItem value="na">North America</SelectItem>
                <SelectItem value="eu">Europe</SelectItem>
                <SelectItem value="asia">Asia</SelectItem>
                <SelectItem value="sa">South America</SelectItem>
                <SelectItem value="oce">Oceania</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="sort">Sort By</Label>
            <Select 
              value={filters.sort} 
              onValueChange={(value) => updateFilters({ sort: value })}
            >
              <SelectTrigger id="sort">
                <SelectValue placeholder="Most Votes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="votes">Most Votes</SelectItem>
                <SelectItem value="players">Most Players</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => updateFilters({ status: value })}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="All Servers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all_servers">All Servers</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="featured">Featured</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
