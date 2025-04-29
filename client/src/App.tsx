import { useState, useEffect } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import SelectionScreen from "@/pages/SelectionScreen";
import MatchScreen from "@/pages/MatchScreen";
import ResultScreen from "@/pages/ResultScreen";
import LeaderboardScreen from "@/pages/LeaderboardScreen";
import TitleBar from "@/components/TitleBar";
import AdminScreen from "@/pages/AdminScreen"; // Added import for AdminScreen

// Sound import
import { initSounds } from "@/assets/arcadeSounds";

function Router() {
  return (
    <div className="scanlines min-h-screen text-white flex flex-col items-center">
      <TitleBar />
      <Switch>
        <Route path="/" component={SelectionScreen} />
        <Route path="/match/:id" component={MatchScreen} />
        <Route path="/result/:id" component={ResultScreen} />
        <Route path="/leaderboard" component={LeaderboardScreen} />
        <Route path="/admin" component={AdminScreen} /> {/* Added admin route */}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  const [soundsLoaded, setSoundsLoaded] = useState(false);

  useEffect(() => {
    // Initialize sounds
    initSounds().then(() => {
      setSoundsLoaded(true);
    });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;