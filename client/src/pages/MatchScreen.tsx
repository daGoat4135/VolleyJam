import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Player, Match, Set, GameLog, InsertGameLog, UpdateSet } from '@shared/schema';
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
  
  // Refs
  const logContainerRef = useRef<HTMLDivElement>(null);
  
  // Local state
  const [westScore, setWestScore] = useState(0);
  const [eastScore, setEastScore] = useState(0);
  const [setNumber, setSetNumber] = useState(1);
  const [westSets, setWestSets] = useState(0);
  const [eastSets, setEastSets] = useState(0);
  const [currentSetId, setCurrentSetId] = useState<number | null>(null);
  
  // Fetch match data
  const { data: matchData } = useQuery<Match>({
    queryKey: [`/api/matches/${matchId}`],
    enabled: matchId > 0,
  });
  
  // Fetch player data
  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
  // Fetch sets data
  const { data: sets, refetch: refetchSets } = useQuery<Set[]>({
    queryKey: [`/api/matches/${matchId}/sets`],
    enabled: matchId > 0,
  });
  
  // Fetch game logs
  const { data: logs, refetch: refetchLogs } = useQuery<GameLog[]>({
    queryKey: [`/api/matches/${matchId}/logs`],
    enabled: matchId > 0,
  });
  
  // Create a new set mutation
  const createSetMutation = useMutation({
    mutationFn: async (setData: { matchId: number, setNumber: number }) => {
      const response = await apiRequest('POST', '/api/sets', setData);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/sets`] });
      setCurrentSetId(data.id);
      setWestScore(0);
      setEastScore(0);
      addGameLog(`Set ${data.setNumber} started!`);
    },
  });
  
  // Update set mutation
  const updateSetMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: UpdateSet }) => {
      const response = await apiRequest('PATCH', `/api/sets/${id}`, data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/sets`] });
    },
  });
  
  // Add game log mutation
  const addGameLogMutation = useMutation({
    mutationFn: async (logData: InsertGameLog) => {
      const response = await apiRequest('POST', '/api/logs', logData);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}/logs`] });
      // Scroll to bottom of log
      if (logContainerRef.current) {
        logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
      }
    },
  });
  
  // Update match mutation
  const updateMatchMutation = useMutation({
    mutationFn: async (data: Partial<Match>) => {
      const response = await apiRequest('PATCH', `/api/matches/${matchId}`, data);
      return await response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/matches/${matchId}`] });
      // Navigate to result screen
      if (data.isComplete) {
        navigate(`/result/${matchId}`);
      }
    },
  });
  
  // Helper functions
  const addGameLog = (message: string) => {
    if (currentSetId && matchId) {
      addGameLogMutation.mutate({
        matchId,
        setId: currentSetId,
        message
      });
    }
  };
  
  const updateScore = (team: 'west' | 'east', action: 'add' | 'subtract') => {
    if (action === 'add') {
      if (team === 'west') {
        setWestScore(prev => prev + 1);
        addGameLog(`WEST scores a point! (${westScore + 1}-${eastScore})`);
      } else {
        setEastScore(prev => prev + 1);
        addGameLog(`EAST scores a point! (${westScore}-${eastScore + 1})`);
      }
      playSound('score');
    } else if (action === 'subtract') {
      if (team === 'west' && westScore > 0) {
        setWestScore(prev => prev - 1);
        addGameLog(`Point removed from WEST! (${westScore - 1}-${eastScore})`);
      } else if (team === 'east' && eastScore > 0) {
        setEastScore(prev => prev - 1);
        addGameLog(`Point removed from EAST! (${westScore}-${eastScore - 1})`);
      }
    }
  };
  
  const handleEndSet = () => {
    if (!currentSetId) return;
    
    // Determine winner
    const winningDivision = westScore > eastScore ? 'west' : 'east';
    
    // Update set
    updateSetMutation.mutate({
      id: currentSetId,
      data: {
        westScore,
        eastScore,
        winningDivision,
        isComplete: true
      }
    });
    
    // Update set counts
    if (winningDivision === 'west') {
      setWestSets(prev => prev + 1);
      addGameLog(`WEST wins set ${setNumber}! (${westScore}-${eastScore})`);
    } else {
      setEastSets(prev => prev + 1);
      addGameLog(`EAST wins set ${setNumber}! (${westScore}-${eastScore})`);
    }
    
    // Proceed to next set
    setSetNumber(prev => prev + 1);
    
    // Create a new set
    createSetMutation.mutate({
      matchId,
      setNumber: setNumber + 1
    });
    
    playSound('win');
  };
  
  const handleEndMatch = () => {
    if (!currentSetId) return;
    
    // End current set first
    const winningDivision = westScore > eastScore ? 'west' : 'east';
    
    // Update set
    updateSetMutation.mutate({
      id: currentSetId,
      data: {
        westScore,
        eastScore,
        winningDivision,
        isComplete: true
      }
    });
    
    // Update set counts for display
    if (winningDivision === 'west') {
      setWestSets(prev => prev + 1);
    } else {
      setEastSets(prev => prev + 1);
    }
    
    // Determine match winner (best of sets)
    const finalWinningDivision = (westSets + (winningDivision === 'west' ? 1 : 0)) > 
                                (eastSets + (winningDivision === 'east' ? 1 : 0)) 
                                ? 'west' : 'east';
    
    // Add final log
    addGameLog(`MATCH COMPLETE! ${finalWinningDivision.toUpperCase()} WINS!`);
    
    // Update match as complete
    updateMatchMutation.mutate({
      isComplete: true,
      winningDivision: finalWinningDivision,
      // MVP could be determined by another algorithm
      mvpPlayerId: finalWinningDivision === 'west' ? matchData?.westPlayer1Id : matchData?.eastPlayer1Id
    });
    
    playSound('win');
  };
  
  // Initialize first set
  useEffect(() => {
    if (sets && sets.length > 0) {
      // Find current active set
      const activeSet = sets.find(set => !set.isComplete);
      if (activeSet) {
        setCurrentSetId(activeSet.id);
        setWestScore(activeSet.westScore);
        setEastScore(activeSet.eastScore);
        setSetNumber(activeSet.setNumber);
      }
      
      // Count completed sets
      const completedSets = sets.filter(set => set.isComplete);
      const westWins = completedSets.filter(set => set.winningDivision === 'west').length;
      const eastWins = completedSets.filter(set => set.winningDivision === 'east').length;
      
      setWestSets(westWins);
      setEastSets(eastWins);
    }
  }, [sets]);
  
  // Auto-update set in database when scores change
  useEffect(() => {
    if (currentSetId && (westScore >= 21 || eastScore >= 21)) {
      toast({
        title: "Set Point!",
        description: `${westScore > eastScore ? 'WEST' : 'EAST'} has reached set point!`,
      });
    }
    
    // Debounce score updates to reduce API calls
    const debounce = setTimeout(() => {
      if (currentSetId) {
        updateSetMutation.mutate({
          id: currentSetId,
          data: {
            westScore,
            eastScore,
            isComplete: false
          }
        });
      }
    }, 500);
    
    return () => clearTimeout(debounce);
  }, [westScore, eastScore]);
  
  // Scroll to bottom of log when new log entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);
  
  // Get player details
  const getPlayer = (id: number | undefined) => {
    if (!id || !players) return null;
    return players.find(p => p.id === id);
  };
  
  // Get west team players
  const westPlayer1 = getPlayer(matchData?.westPlayer1Id);
  const westPlayer2 = getPlayer(matchData?.westPlayer2Id);
  
  // Get east team players
  const eastPlayer1 = getPlayer(matchData?.eastPlayer1Id);
  const eastPlayer2 = getPlayer(matchData?.eastPlayer2Id);
  
  return (
    <div id="match-screen" className="screen-container active-screen w-full max-w-6xl px-4">
      <div className="mb-6 text-center">
        <h2 className="font-arcade text-lg md:text-2xl mb-1">VOLLEYBALL MATCH</h2>
        <p className="font-digital text-sm text-gray-400">First to 21 points wins!</p>
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
            <div className="text-center font-digital text-5xl text-[#FF4D4D] mb-2" id="west-score">
              {westScore}
            </div>
            <div className="buttons grid grid-cols-2 gap-2">
              <Button
                className="score-btn font-arcade text-xs bg-[#4169E1] py-2 rounded hover:bg-opacity-80"
                onClick={() => updateScore('west', 'add')}
              >
                +1 POINT
              </Button>
              <Button
                className="score-btn font-arcade text-xs bg-gray-700 py-2 rounded hover:bg-opacity-80"
                onClick={() => updateScore('west', 'subtract')}
                disabled={westScore <= 0}
              >
                -1 POINT
              </Button>
            </div>
          </div>
        </div>
        
        {/* Center Score Panel */}
        <div className="score-panel flex flex-col items-center justify-center">
          <div className="vs-flash font-arcade text-5xl text-[#FFD700] mb-6">VS</div>
          
          <div className="match-controls">
            <div className="sets mb-6">
              <h4 className="font-arcade text-sm text-center mb-2">SETS</h4>
              <div className="sets-display grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="font-digital text-xl text-[#FF4D4D]">{westSets}</div>
                  <div className="font-arcade text-xs">WEST</div>
                </div>
                <div>
                  <div className="font-digital text-xl text-[#4169E1]">{eastSets}</div>
                  <div className="font-arcade text-xs">EAST</div>
                </div>
              </div>
            </div>
            
            <Button
              id="end-set-btn"
              className="font-arcade text-sm w-full px-4 py-2 bg-[#FFD700] text-black rounded mb-3 hover:bg-opacity-80"
              onClick={handleEndSet}
              disabled={westScore < 21 && eastScore < 21}
            >
              END SET
            </Button>
            
            <Button
              id="end-match-btn"
              className="font-arcade text-sm w-full px-4 py-2 bg-[#FF4D4D] text-white rounded hover:bg-opacity-80"
              onClick={handleEndMatch}
            >
              END MATCH
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
            <div className="text-center font-digital text-5xl text-[#4169E1] mb-2" id="east-score">
              {eastScore}
            </div>
            <div className="buttons grid grid-cols-2 gap-2">
              <Button
                className="score-btn font-arcade text-xs bg-[#FF4D4D] py-2 rounded hover:bg-opacity-80"
                onClick={() => updateScore('east', 'add')}
              >
                +1 POINT
              </Button>
              <Button
                className="score-btn font-arcade text-xs bg-gray-700 py-2 rounded hover:bg-opacity-80"
                onClick={() => updateScore('east', 'subtract')}
                disabled={eastScore <= 0}
              >
                -1 POINT
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Match Log */}
      <div className="match-log bg-black border border-gray-700 p-4 mb-6">
        <h3 className="font-arcade text-sm mb-3">MATCH LOG</h3>
        <div 
          ref={logContainerRef}
          className="log-entries font-digital text-sm text-gray-300 space-y-2 h-32 overflow-y-auto" 
          id="match-log"
        >
          {logs && logs.map((log) => (
            <div key={log.id} className="log-entry">• {log.message}</div>
          ))}
        </div>
      </div>
      
      <div className="flex justify-center">
        <Button
          id="back-to-selection"
          className="font-arcade px-6 py-2 bg-gray-700 text-white rounded hover:bg-opacity-80 transition-all"
          onClick={() => navigate('/')}
        >
          BACK TO SELECTION
        </Button>
      </div>
    </div>
  );
};

export default MatchScreen;
