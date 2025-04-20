import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getCurrentUser, UserProfile } from "./lib/auth";
import { Navbar } from "./components/layout/navbar";
import { Footer } from "./components/layout/footer";
import { AuthModal } from "./components/layout/auth-modal";

// Pages
import Home from "@/pages/home";
import ServersPage from "@/pages/servers";
import ServerDetails from "@/pages/server-details";
import AddServer from "@/pages/add-server";
import AdminDashboard from "@/pages/admin-dashboard";
import VerifyEmail from "@/pages/verify-email";
import About from "@/pages/about";
import NotFound from "@/pages/not-found";

function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  // Fetch current user
  const fetchUser = async () => {
    setUserLoading(true);
    try {
      const userData = await getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Error fetching user:", error);
      setUser(null);
    } finally {
      setUserLoading(false);
    }
  };

  // Fetch user on component mount
  useEffect(() => {
    fetchUser();
  }, []);

  // Handler for login required actions
  const handleLoginRequired = () => {
    setAuthModalMode('login');
    setShowAuthModal(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Navbar 
          user={user} 
          setShowAuthModal={setShowAuthModal} 
          setAuthModalMode={setAuthModalMode}
          refetchUser={fetchUser}
        />
        
        <main className="min-h-screen bg-gray-50">
          <Switch>
            <Route path="/" component={() => <Home onLoginRequired={handleLoginRequired} />} />
            <Route path="/servers" component={() => <ServersPage onLoginRequired={handleLoginRequired} />} />
            <Route path="/servers/:id" component={() => <ServerDetails user={user} onLoginRequired={handleLoginRequired} />} />
            <Route path="/add-server" component={() => <AddServer user={user} onLoginRequired={handleLoginRequired} />} />
            <Route path="/admin-dashboard" component={() => <AdminDashboard user={user} />} />
            <Route path="/verify-email" component={VerifyEmail} />
            <Route path="/about" component={About} />
            <Route component={NotFound} />
          </Switch>
        </main>
        
        <Footer />
        
        <AuthModal 
          show={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authModalMode}
          setMode={setAuthModalMode}
          onAuthenticated={fetchUser}
        />
        
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
