import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Player, Match } from '@shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { playSound } from '@/assets/arcadeSounds';
import { Button } from '@/components/ui/button';
import { PixelBorder } from '@/components/ui/pixel-border';
import { useToast } from '@/hooks/use-toast';

const MatchScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/match/:id');
  const matchId = parseInt(params?.id || '0');
  const { toast } = useToast();

  const logContainerRef = useRef<HTMLDivElement>(null);

  const [westScore, setWestScore] = useState(0);
  const [eastScore, setEastScore] = useState(0);

  // Fetch match data
  const { data: matchData } = useQuery<Match>({
    queryKey: [`/api/matches/${matchId}`],
    enabled: matchId > 0,
  });

  // Fetch player data
  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });

  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async (data: Partial<Match>) => {
      const response = await apiRequest('PATCH', `/api/matches/${matchId}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}`] });
      if (data.isComplete) {
        navigate(`/result/${matchId}`);
      }
    },
  });

  // Helper functions
  const getPlayer = (id: number | undefined) => {
    if (!id || !players) return null;
    return players.find(p => p.id === id);
  };

  

  const handleEndGame = () => {
    const winningDivision = westScore > eastScore ? 'west' : 'east';

    // Update match as complete
    updateMatchMutation.mutate({
      isComplete: true,
      winningDivision,
      westScore,
      eastScore,
      // MVP could be determined by another algorithm
      mvpPlayerId: winningDivision === 'west' ? matchData?.westPlayer1Id : matchData?.eastPlayer1Id
    });

    playSound('win');
  };

  // Check for win condition
  useEffect(() => {
    const scoreDiff = Math.abs(westScore - eastScore);
    const hasWinner = (westScore >= 21 || eastScore >= 21) && scoreDiff >= 2;

    if (hasWinner) {
      toast({
        title: "Game Point!",
        description: `${westScore > eastScore ? 'WEST' : 'EAST'} wins! Click 'END GAME' to continue.`,
      });
    }
  }, [westScore, eastScore]);

  // Get team players
  const westPlayer1 = getPlayer(matchData?.westPlayer1Id);
  const westPlayer2 = getPlayer(matchData?.westPlayer2Id);
  const eastPlayer1 = getPlayer(matchData?.eastPlayer1Id);
  const eastPlayer2 = getPlayer(matchData?.eastPlayer2Id);

  return (
    <div id="match-screen" className="screen-container active-screen w-full max-w-6xl px-4">
      <div className="mb-6 text-center">
        <h2 className="font-arcade text-lg md:text-2xl mb-1">VOLLEYBALL GAME</h2>
        <p className="font-digital text-sm text-gray-400">First to 21 points (win by 2)</p>
      </div>

      <div className="match-display grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* West Team */}
        <div className="team-panel bg-gradient-to-b from-gray-900 to-black border-2 border-[#FF4D4D] p-4">
          <h3 className="font-arcade text-center mb-4 text-[#FF4D4D]">WEST TEAM</h3>

          <div className="team-players grid grid-cols-2 gap-2 mb-4">
            {westPlayer1 && (
              <div className="player flex flex-col items-center">
                <PixelBorder>
                  <img src={westPlayer1.avatarUrl} alt={westPlayer1.name} className="w-20 h-20 object-cover mb-2" />
                </PixelBorder>
                <div className="text-center font-arcade text-xs">{westPlayer1.name}</div>
              </div>
            )}

            {westPlayer2 && (
              <div className="player flex flex-col items-center">
                <PixelBorder>
                  <img src={westPlayer2.avatarUrl} alt={westPlayer2.name} className="w-20 h-20 object-cover mb-2" />
                </PixelBorder>
                <div className="text-center font-arcade text-xs">{westPlayer2.name}</div>
              </div>
            )}
          </div>

          <div className="score-display">
            <div className="text-center mb-2">
              <Input
                type="number"
                min="0"
                value={westScore}
                onChange={(e) => setWestScore(parseInt(e.target.value) || 0)}
                className="font-digital text-4xl text-center text-[#FF4D4D] w-32 mx-auto"
              />
            </div>
          </div>
        </div>

        {/* Center Score Panel */}
        <div className="score-panel flex flex-col items-center justify-center">
          <div className="vs-flash font-arcade text-5xl text-[#FFD700] mb-6">VS</div>

          <div className="match-controls">
            <Button
              id="end-game-btn"
              className="font-arcade text-sm w-full px-4 py-2 bg-[#FFD700] text-black rounded mb-3 hover:bg-opacity-80"
              onClick={handleEndGame}
              disabled={(westScore < 21 && eastScore < 21) || Math.abs(westScore - eastScore) < 2}
            >
              END GAME
            </Button>

            <Button
              id="back-to-selection"
              className="font-arcade text-sm w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-opacity-80"
              onClick={() => navigate('/')}
            >
              BACK TO SELECTION
            </Button>
          </div>
        </div>

        {/* East Team */}
        <div className="team-panel bg-gradient-to-b from-gray-900 to-black border-2 border-[#4169E1] p-4">
          <h3 className="font-arcade text-center mb-4 text-[#4169E1]">EAST TEAM</h3>

          <div className="team-players grid grid-cols-2 gap-2 mb-4">
            {eastPlayer1 && (
              <div className="player flex flex-col items-center">
                <PixelBorder>
                  <img src={eastPlayer1.avatarUrl} alt={eastPlayer1.name} className="w-20 h-20 object-cover mb-2" />
                </PixelBorder>
                <div className="text-center font-arcade text-xs">{eastPlayer1.name}</div>
              </div>
            )}

            {eastPlayer2 && (
              <div className="player flex flex-col items-center">
                <PixelBorder>
                  <img src={eastPlayer2.avatarUrl} alt={eastPlayer2.name} className="w-20 h-20 object-cover mb-2" />
                </PixelBorder>
                <div className="text-center font-arcade text-xs">{eastPlayer2.name}</div>
              </div>
            )}
          </div>

          <div className="score-display">
            <div className="text-center mb-2">
              <Input
                type="number"
                min="0"
                value={eastScore}
                onChange={(e) => setEastScore(parseInt(e.target.value) || 0)}
                className="font-digital text-4xl text-center text-[#4169E1] w-32 mx-auto"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchScreen;