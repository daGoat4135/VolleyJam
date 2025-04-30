import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Player, InsertMatch } from '@shared/schema';
import { playSound } from '@/assets/arcadeSounds';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import TeamSection from '@/components/TeamSection';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const SelectionScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  
  // Player selection state
  const [selectedWestPlayers, setSelectedWestPlayers] = useState<Player[]>([]);
  const [selectedEastPlayers, setSelectedEastPlayers] = useState<Player[]>([]);
  
  // Fetch all players data
  const { data: allPlayers = [], isLoading: isLoadingPlayers } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Handle player selection
  const handleWestPlayerSelect = (player: Player) => {
    if (selectedWestPlayers.some(p => p.id === player.id)) {
      setSelectedWestPlayers(selectedWestPlayers.filter(p => p.id !== player.id));
    } else if (selectedWestPlayers.length < 2) {
      setSelectedWestPlayers([...selectedWestPlayers, player]);
    } else {
      // Replace the first player if already have 2 selected
      setSelectedWestPlayers([selectedWestPlayers[1], player]);
      playSound('select');
    }
  };
  
  const handleEastPlayerSelect = (player: Player) => {
    if (selectedEastPlayers.some(p => p.id === player.id)) {
      setSelectedEastPlayers(selectedEastPlayers.filter(p => p.id !== player.id));
    } else if (selectedEastPlayers.length < 2) {
      setSelectedEastPlayers([...selectedEastPlayers, player]);
    } else {
      // Replace the first player if already have 2 selected
      setSelectedEastPlayers([selectedEastPlayers[1], player]);
      playSound('select');
    }
  };
  
  // Create match mutation
  const createMatchMutation = useMutation({
    mutationFn: async (matchData: InsertMatch) => {
      const response = await apiRequest('POST', '/api/matches', matchData);
      return await response.json();
    },
    onSuccess: (newMatch) => {
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      playSound('gameStart');
      navigate(`/match/${newMatch.id}`);
    },
    onError: (error) => {
      console.error('Failed to create match:', error);
      playSound('error');
      toast({
        title: 'Error',
        description: 'Failed to create match. Please try again.',
        variant: 'destructive',
      });
    }
  });
  
  // Start match handler
  const handleStartMatch = () => {
    if (selectedWestPlayers.length !== 2 || selectedEastPlayers.length !== 2) {
      playSound('error');
      toast({
        title: 'Selection Incomplete',
        description: 'Please select 2 players from each division.',
        variant: 'destructive',
      });
      return;
    }
    
    // Create new match
    const matchData: InsertMatch = {
      westPlayer1Id: selectedWestPlayers[0].id,
      westPlayer2Id: selectedWestPlayers[1].id,
      eastPlayer1Id: selectedEastPlayers[0].id,
      eastPlayer2Id: selectedEastPlayers[1].id,
    };
    
    createMatchMutation.mutate(matchData);
  };
  
  return (
    <div id="selection-screen" className="screen-container active-screen w-full max-w-6xl px-4">
      <div className="mb-6 text-center">
        <Button
          onClick={() => navigate('/leaderboard')}
          className="font-arcade mb-6 bg-[#FFD700] text-black hover:bg-opacity-80"
        >
          VIEW LEADERBOARD
        </Button>
        <h2 className="font-arcade text-lg md:text-2xl mb-1">SELECT YOUR PLAYERS</h2>
        <p className="font-digital text-sm text-gray-400">Choose 2 players from each side</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team 1 */}
        <TeamSection
          division="west"
          players={allPlayers}
          selectedPlayers={selectedWestPlayers}
          onPlayerSelect={handleWestPlayerSelect}
        />
      </div>
      
      {/* VS Section */}
      <div className="vs-section flex justify-center my-4">
        <div className="vs-flash font-arcade text-4xl md:text-6xl text-[#FFD700]">VS</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Team 2 */}
        <TeamSection
          division="east"
          players={allPlayers}
          selectedPlayers={selectedEastPlayers}
          onPlayerSelect={handleEastPlayerSelect}
        />
      </div>
      
      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleStartMatch}
          disabled={selectedWestPlayers.length !== 2 || selectedEastPlayers.length !== 2 || createMatchMutation.isPending}
          className="font-arcade px-8 py-3 bg-[#FFD700] text-black rounded hover:bg-opacity-80 transition-all duration-300 animate-pulse-glow"
        >
          {createMatchMutation.isPending ? 'LOADING...' : 'START MATCH'}
        </Button>
      </div>
    </div>
  );
};

export default SelectionScreen;
