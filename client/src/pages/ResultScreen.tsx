import React, { useRef, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Player, Match } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { PixelBorder } from '@/components/ui/pixel-border';
import { useToast } from '@/hooks/use-toast';
import { playSound } from '@/assets/arcadeSounds';
import html2canvas from 'html2canvas';

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

  // Get team players
  const westPlayer1 = getPlayer(matchData?.westPlayer1Id);
  const westPlayer2 = getPlayer(matchData?.westPlayer2Id);
  const eastPlayer1 = getPlayer(matchData?.eastPlayer1Id);
  const eastPlayer2 = getPlayer(matchData?.eastPlayer2Id);

  // Get final scores from last completed set
  const latestSet = sets?.find(set => set.isComplete);
  const finalWestScore = latestSet?.westScore || 0;
  const finalEastScore = latestSet?.eastScore || 0;

  // Handle share result
  const handleShareResult = async () => {
    if (!resultCardRef.current) return;

    setIsSharing(true);

    try {
      const canvas = await html2canvas(resultCardRef.current);
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => resolve(blob!), 'image/png');
      });
      
      const file = new File([blob], `volleyball-jam-result-${matchId}.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'Volleyball Jam Result',
          text: 'Check out my match result!'
        });
        
        playSound('select');
      } else {
        // Fallback for browsers that don't support sharing
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `volleyball-jam-result-${matchId}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: 'Image Saved',
          description: 'Match result image has been saved to your device.',
        });
      }
    } catch (error) {
      console.error('Error sharing result:', error);
      toast({
        title: 'Error',
        description: 'Failed to share result. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div id="result-screen" className="screen-container active-screen w-full max-w-6xl px-4">
      <div ref={resultCardRef} className="result-card bg-gray-900 border-4 border-[#FFD700] p-6 rounded-lg max-w-2xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="font-arcade text-2xl text-[#FFD700] mb-2">VOLLEYBALL JAM</h1>
          <h2 className="font-arcade text-xl mb-4">MATCH RESULT</h2>
          <div className="result-badge inline-block bg-[#FFD700] text-black font-arcade px-4 py-2 rounded">
            {finalWestScore > finalEastScore ? 'WEST WINS!' : 'EAST WINS!'}
          </div>
        </div>

        <div className="teams-display grid grid-cols-3 gap-4 items-center">
          <div className="west-team text-center">
            <div className="font-arcade text-[#FF4D4D] mb-2">WEST</div>
            <div className="score font-digital text-4xl text-[#FF4D4D] mb-4">{finalWestScore}</div>
            <div className="team-players flex justify-center space-x-2">
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

          <div className="vs font-arcade text-4xl text-center">VS</div>

          <div className="east-team text-center">
            <div className="font-arcade text-[#4169E1] mb-2">EAST</div>
            <div className="score font-digital text-4xl text-[#4169E1] mb-4">{finalEastScore}</div>
            <div className="team-players flex justify-center space-x-2">
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
          className="font-arcade px-6 py-3 bg-[#FFD700] text-black rounded mt-4 md:mt-0 hover:bg-opacity-80"
          onClick={() => navigate('/leaderboard')}
        >
          VIEW LEADERBOARD
        </Button>
      </div>
    </div>
  );
};

export default ResultScreen;