import React, { useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import { Player, Match, Set } from '@shared/schema';
import { ChromeText } from '@/components/ui/chrome-text';
import { PixelBorder } from '@/components/ui/pixel-border';
import { Button } from '@/components/ui/button';
import { playSound } from '@/assets/arcadeSounds';
import { useToast } from '@/hooks/use-toast';

const ResultScreen: React.FC = () => {
  const [, navigate] = useLocation();
  const [match, params] = useRoute<{ id: string }>('/result/:id');
  const matchId = parseInt(params?.id || '0');
  const { toast } = useToast();
  
  const resultCardRef = useRef<HTMLDivElement>(null);
  const [isSharing, setIsSharing] = useState(false);
  
  // Fetch match data
  const { data: matchData } = useQuery<Match>({
    queryKey: [`/api/matches/${matchId}`],
    enabled: matchId > 0,
  });
  
  // Fetch sets data
  const { data: sets } = useQuery<Set[]>({
    queryKey: [`/api/matches/${matchId}/sets`],
    enabled: matchId > 0,
  });
  
  // Fetch player data
  const { data: players } = useQuery<Player[]>({
    queryKey: ['/api/players'],
  });
  
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
  
  // Get MVP player
  const mvpPlayer = getPlayer(matchData?.mvpPlayerId);
  
  // Get final set scores
  const completedSets = sets?.filter(set => set.isComplete) || [];
  
  // Calculate final score from last completed set
  const latestSet = [...(completedSets || [])].sort((a, b) => b.setNumber - a.setNumber)[0];
  const finalWestScore = latestSet?.westScore || 0;
  const finalEastScore = latestSet?.eastScore || 0;
  
  // Handle share result
  const handleShareResult = async () => {
    if (!resultCardRef.current) return;
    
    setIsSharing(true);
    
    try {
      const canvas = await html2canvas(resultCardRef.current);
      const image = canvas.toDataURL('image/png');
      
      // Create a temporary link element and trigger download
      const link = document.createElement('a');
      link.href = image;
      link.download = `volleyball-jam-result-${matchId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: 'Image Generated',
        description: 'Match result image has been saved to your device.',
      });
      
      playSound('select');
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate result image. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  return (
    <div id="result-screen" className="screen-container active-screen w-full max-w-6xl px-4">
      <div className="mb-6 text-center">
        <h2 className="font-arcade text-2xl chrome-text mb-2">MATCH RESULT</h2>
        <div className="result-badge inline-block bg-[#FFD700] text-black font-arcade px-4 py-2 rounded animate-pulse-glow">
          {matchData?.winningDivision === 'west' ? 'WEST WINS!' : 'EAST WINS!'}
        </div>
      </div>
      
      <div ref={resultCardRef} className="result-card bg-gradient-to-b from-gray-900 to-black border-4 border-[#FFD700] p-6 mb-8">
        <div className="final-score grid grid-cols-3 items-center mb-8">
          <div className="west-team text-center">
            <div className="team-name font-arcade text-[#FF4D4D] mb-2">WEST</div>
            <div className="team-score font-digital text-6xl text-[#FF4D4D]">{finalWestScore}</div>
            <div className="team-players flex justify-center space-x-2 mt-3">
              {westPlayer1 && (
                <PixelBorder>
                  <img src={westPlayer1.avatarUrl} alt={westPlayer1.name} className="w-12 h-12 object-cover" />
                </PixelBorder>
              )}
              {westPlayer2 && (
                <PixelBorder>
                  <img src={westPlayer2.avatarUrl} alt={westPlayer2.name} className="w-12 h-12 object-cover" />
                </PixelBorder>
              )}
            </div>
          </div>
          
          <div className="vs text-center">
            <div className="font-arcade text-4xl text-[#FFD700] vs-flash">VS</div>
          </div>
          
          <div className="east-team text-center">
            <div className="team-name font-arcade text-[#4169E1] mb-2">EAST</div>
            <div className="team-score font-digital text-6xl text-[#4169E1]">{finalEastScore}</div>
            <div className="team-players flex justify-center space-x-2 mt-3">
              {eastPlayer1 && (
                <PixelBorder>
                  <img src={eastPlayer1.avatarUrl} alt={eastPlayer1.name} className="w-12 h-12 object-cover" />
                </PixelBorder>
              )}
              {eastPlayer2 && (
                <PixelBorder>
                  <img src={eastPlayer2.avatarUrl} alt={eastPlayer2.name} className="w-12 h-12 object-cover" />
                </PixelBorder>
              )}
            </div>
          </div>
        </div>
        
        <div className="match-stats">
          <h3 className="font-arcade text-center text-[#FFD700] mb-4">MATCH STATS</h3>
          
          <div className="stats-grid grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="sets">
              <h4 className="font-arcade text-sm mb-2">SETS SUMMARY</h4>
              <div className="bg-black p-2">
                {completedSets.map((set) => (
                  <div key={set.id} className="font-digital text-sm grid grid-cols-3 mb-1">
                    <div>Set {set.setNumber}</div>
                    <div className="text-[#FF4D4D]">{set.westScore}</div>
                    <div className="text-[#4169E1]">{set.eastScore}</div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="mvp">
              <h4 className="font-arcade text-sm mb-2">MATCH MVP</h4>
              {mvpPlayer ? (
                <div className="mvp-display flex items-center bg-black p-2">
                  <PixelBorder>
                    <img src={mvpPlayer.avatarUrl} alt={mvpPlayer.name} className="w-16 h-16 object-cover mr-3" />
                  </PixelBorder>
                  <div>
                    <div className="font-arcade text-[#FFD700] text-sm">{mvpPlayer.name}</div>
                    <div className="font-digital text-xs text-gray-400">Speed: {mvpPlayer.speed}</div>
                    <div className="font-digital text-xs text-gray-400">Power: {mvpPlayer.power}</div>
                  </div>
                </div>
              ) : (
                <div className="mvp-display bg-black p-2 text-center font-arcade text-xs text-gray-500">
                  NO MVP SELECTED
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <div className="action-buttons flex flex-col md:flex-row justify-center space-y-4 md:space-y-0 md:space-x-6">
        <Button
          id="share-result"
          className="font-arcade px-6 py-3 bg-[#4169E1] text-white rounded hover:bg-opacity-80"
          onClick={handleShareResult}
          disabled={isSharing}
        >
          {isSharing ? 'GENERATING...' : 'SHARE RESULT'}
        </Button>
        <Button
          id="new-match"
          className="font-arcade px-6 py-3 bg-[#FF4D4D] text-white rounded hover:bg-opacity-80"
          onClick={() => navigate('/')}
        >
          NEW MATCH
        </Button>
        <Button
          id="view-leaderboard"
          className="font-arcade px-6 py-3 bg-[#FFD700] text-black rounded hover:bg-opacity-80"
          onClick={() => navigate('/leaderboard')}
        >
          VIEW LEADERBOARD
        </Button>
      </div>
    </div>
  );
};

export default ResultScreen;
