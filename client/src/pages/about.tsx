import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad, Heart, Shield, Server, Users, Zap } from 'lucide-react';

export default function About() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">About GameServers</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          The premier platform for discovering, sharing, and voting on gaming servers across multiple games.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-16">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Gamepad className="h-8 w-8 text-primary" />
            <CardTitle>Find Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Discover the best gaming servers across multiple games, with detailed information and live status updates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Server className="h-8 w-8 text-primary" />
            <CardTitle>Submit Servers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Add your own gaming server to our platform and reach thousands of potential players.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Heart className="h-8 w-8 text-primary" />
            <CardTitle>Vote and Support</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Vote for your favorite servers to help them gain visibility and show your support for the communities you love.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white rounded-lg shadow-md p-8 mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Our Mission</h2>
        <p className="text-lg text-gray-600 max-w-4xl mx-auto">
          At GameServers, we aim to connect gamers with thriving server communities. We believe in creating a transparent, 
          user-driven platform where players can discover the perfect server for their playstyle, and server owners can showcase 
          their communities to an engaged audience. Our goal is to foster connections between players and help gaming 
          communities grow.
        </p>
      </div>

      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Key Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Zap className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold">Real-Time Status</h3>
            </div>
            <p className="text-gray-600">
              See live player counts, maps, and server status through our Steam integration.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Users className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold">Community Voting</h3>
            </div>
            <p className="text-gray-600">
              Servers are ranked by user votes, ensuring quality rises to the top.
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex items-center mb-4">
              <Shield className="h-6 w-6 text-primary mr-3" />
              <h3 className="text-lg font-semibold">Verified Listings</h3>
            </div>
            <p className="text-gray-600">
              All servers are verified by our admin team to ensure quality and prevent spam.
            </p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Join Our Community</h2>
        <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
          GameServers is built by gamers, for gamers. Join us in creating the ultimate gaming server discovery platform.
        </p>
      </div>
    </div>
  );
}
