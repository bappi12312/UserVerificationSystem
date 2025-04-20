import { ServerWithVotes } from '@/lib/steam';
import { ServerCard } from './server-card';

interface ServerListProps {
  servers: ServerWithVotes[];
  isFeatured?: boolean;
  onLoginRequired: () => void;
  refetch?: () => void;
}

export function ServerList({ servers, isFeatured, onLoginRequired, refetch }: ServerListProps) {
  if (!servers || servers.length === 0) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">No servers found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {servers.map((server) => (
        <ServerCard 
          key={server.id} 
          server={server} 
          isFeatured={isFeatured} 
          onLoginRequired={onLoginRequired}
          refetch={refetch}
        />
      ))}
    </div>
  );
}
