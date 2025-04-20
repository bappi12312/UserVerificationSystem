import { Link, useLocation } from 'wouter';
import { useState, useEffect } from 'react';
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { UserProfile } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { Menu, X, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { queryClient } from '@/lib/queryClient';
import { apiRequest } from '@/lib/queryClient';
import { useMobile } from '@/hooks/use-mobile';
import { ThemeToggle } from './theme-toggle';

interface NavbarProps {
  user: UserProfile | null;
  setShowAuthModal: (show: boolean) => void;
  setAuthModalMode: (mode: 'login' | 'signup') => void;
  refetchUser: () => void;
}

export function Navbar({ user, setShowAuthModal, setAuthModalMode, refetchUser }: NavbarProps) {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isMobile = useMobile();
  const { toast } = useToast();

  // Close mobile menu on location change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogin = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  const handleSignup = () => {
    setAuthModalMode('signup');
    setShowAuthModal(true);
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      refetchUser();
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="bg-background border-b border-border shadow-sm fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/">
                <div className="flex items-center">
                  <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500 cursor-pointer">GameServers</span>
                  <span className="ml-1 text-xs px-2 py-0.5 bg-primary text-primary-foreground rounded-full font-semibold">BETA</span>
                </div>
              </Link>
            </div>
            <NavigationMenu className="hidden sm:flex">
              <NavigationMenuList className="gap-6">
                <NavigationMenuItem>
                  <Link href="/">
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      location === '/' && "bg-accent/50"
                    )}>
                      Home
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/servers">
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      location === '/servers' && "bg-accent/50"
                    )}>
                      Servers
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/add-server">
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      location === '/add-server' && "bg-accent/50"
                    )}>
                      Add Server
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <Link href="/about">
                    <NavigationMenuLink className={cn(
                      "group inline-flex h-9 w-max items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50",
                      location === '/about' && "bg-accent/50"
                    )}>
                      About
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-3">
            <ThemeToggle />
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2 font-medium">
                    {user.username}
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem>
                    <Link href="/my-servers" className="w-full flex">
                      <span>My Servers</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link href="/profile" className="w-full flex">
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <Link href="/admin-dashboard" className="w-full flex">
                          <span>Admin Dashboard</span>
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 dark:text-red-400 focus:text-red-500 dark:focus:text-red-400">
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={handleLogin} className="font-medium">
                  Log in
                </Button>
                <Button onClick={handleSignup} className="font-medium">
                  Sign up
                </Button>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <ThemeToggle />
            <Button variant="ghost" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} size="icon">
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="sm:hidden bg-background border-t border-border">
          <div className="pt-2 pb-3 space-y-1">
            <Link href="/">
              <span className={`${location === '/' 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground'
                } block pl-3 pr-4 py-2 border-l-4 text-base cursor-pointer transition-colors`}>
                Home
              </span>
            </Link>
            <Link href="/servers">
              <span className={`${location === '/servers' 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground'
                } block pl-3 pr-4 py-2 border-l-4 text-base cursor-pointer transition-colors`}>
                Servers
              </span>
            </Link>
            <Link href="/add-server">
              <span className={`${location === '/add-server' 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground'
                } block pl-3 pr-4 py-2 border-l-4 text-base cursor-pointer transition-colors`}>
                Add Server
              </span>
            </Link>
            <Link href="/about">
              <span className={`${location === '/about' 
                ? 'bg-primary/10 border-primary text-primary' 
                : 'border-transparent text-muted-foreground hover:bg-muted hover:border-muted-foreground hover:text-foreground'
                } block pl-3 pr-4 py-2 border-l-4 text-base cursor-pointer transition-colors`}>
                About
              </span>
            </Link>
          </div>
          <div className="pt-4 pb-3 border-t border-border">
            {user ? (
              <div className="space-y-2 px-4">
                <div className="py-2 px-3 text-sm font-medium text-muted-foreground mb-2">
                  Signed in as <span className="text-foreground">{user.username}</span>
                </div>
                <Link href="/my-servers">
                  <span className="block text-base text-foreground hover:bg-muted py-2 px-3 rounded-md cursor-pointer transition-colors">
                    My Servers
                  </span>
                </Link>
                <Link href="/profile">
                  <span className="block text-base text-foreground hover:bg-muted py-2 px-3 rounded-md cursor-pointer transition-colors">
                    Profile
                  </span>
                </Link>
                {user.isAdmin && (
                  <Link href="/admin-dashboard">
                    <span className="block text-base text-foreground hover:bg-muted py-2 px-3 rounded-md cursor-pointer transition-colors">
                      Admin Dashboard
                    </span>
                  </Link>
                )}
                <Button 
                  className="w-full mt-2" 
                  variant="destructive" 
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="px-4 space-y-2">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleLogin}
                >
                  Log in
                </Button>
                <Button
                  className="w-full"
                  onClick={handleSignup}
                >
                  Sign up
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
