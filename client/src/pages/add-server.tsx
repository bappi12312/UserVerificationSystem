import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { insertServerSchema } from '@shared/schema';
import { submitServer } from '@/lib/steam';
import { getGames } from '@/lib/steam';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '@/lib/auth';
import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Create a schema with validation
const addServerSchema = insertServerSchema.extend({
  port: z.coerce.number().int().min(1).max(65535),
});

type FormValues = z.infer<typeof addServerSchema>;

interface AddServerProps {
  user: UserProfile | null;
  onLoginRequired: () => void;
}

export default function AddServer({ user, onLoginRequired }: AddServerProps) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(addServerSchema),
    defaultValues: {
      name: '',
      description: '',
      game: '',
      ip: '',
      port: 27015,
      region: '',
    }
  });

  // Fetch games
  const { data: games = [] } = useQuery({
    queryKey: ['/api/servers/games/list'],
    queryFn: getGames
  });

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    if (!user) {
      onLoginRequired();
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await submitServer(data);
      toast({
        title: "Server Submitted",
        description: "Your server has been submitted and is pending approval.",
      });

      // Redirect to server page
      navigate(`/servers/${result.id}`);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to submit server. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Authentication Required</AlertTitle>
          <AlertDescription>
            You need to be logged in to add a server.
          </AlertDescription>
        </Alert>
        <Button onClick={onLoginRequired}>Log In</Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Your Server</CardTitle>
          <CardDescription>
            Fill out the form below to submit your gaming server for listing.
            Submissions are reviewed before being listed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Server Name</Label>
                <Input
                  id="name"
                  placeholder="e.g. Competitive CS2 EU Server"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your server features, rules, etc."
                  className="min-h-[100px]"
                  {...form.register('description')}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="game">Game</Label>
                  <Select
                    onValueChange={(value) => form.setValue('game', value)}
                    defaultValue={form.getValues('game')}
                  >
                    <SelectTrigger id="game">
                      <SelectValue placeholder="Select Game" />
                    </SelectTrigger>
                    <SelectContent>
                      {games.map((game) => (
                        <SelectItem key={game.id} value={game.shortName}>
                          {game.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {form.formState.errors.game && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.game.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="region">Region</Label>
                  <Select
                    onValueChange={(value) => form.setValue('region', value)}
                    defaultValue={form.getValues('region')}
                  >
                    <SelectTrigger id="region">
                      <SelectValue placeholder="Select Region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="na-east">North America (East)</SelectItem>
                      <SelectItem value="na-central">North America (Central)</SelectItem>
                      <SelectItem value="na-west">North America (West)</SelectItem>
                      <SelectItem value="eu-west">Europe (West)</SelectItem>
                      <SelectItem value="eu-central">Europe (Central)</SelectItem>
                      <SelectItem value="eu-north">Europe (North)</SelectItem>
                      <SelectItem value="asia-east">Asia (East)</SelectItem>
                      <SelectItem value="asia-south">Asia (South)</SelectItem>
                      <SelectItem value="sa-east">South America</SelectItem>
                      <SelectItem value="oce">Oceania</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.region && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.region.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="ip">Server IP/Hostname</Label>
                  <Input
                    id="ip"
                    placeholder="e.g. 123.456.789.0 or myserver.com"
                    {...form.register('ip')}
                  />
                  {form.formState.errors.ip && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.ip.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="port">Server Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="e.g. 27015"
                    {...form.register('port', { valueAsNumber: true })}
                  />
                  {form.formState.errors.port && (
                    <p className="text-sm text-red-500 mt-1">
                      {form.formState.errors.port.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Important</AlertTitle>
                <AlertDescription>
                  By submitting your server, you confirm that you own or have permission to list this server.
                  All submissions are reviewed for approval before being publicly listed.
                </AlertDescription>
              </Alert>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Server"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
