import { useEffect, useState } from "react";

interface ConfettiProps {
  trigger: boolean;
}

export const Confetti = ({ trigger }: ConfettiProps) => {
  const [pieces, setPieces] = useState<Array<{ id: number; left: number; delay: number; duration: number }>>([]);

  useEffect(() => {
    if (trigger) {
      const newPieces = Array.from({ length: 20 }, (_, i) => ({
        id: Date.now() + i,
        left: Math.random() * 100,
        delay: Math.random() * 0.3,
        duration: 1 + Math.random() * 0.5
      }));
      
      setPieces(newPieces);

      setTimeout(() => {
        setPieces([]);
      }, 2000);
    }
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[100]">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute top-0 w-2 h-2 bg-primary rounded-full animate-confetti"
          style={{
            left: `${piece.left}%`,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
    </div>
  );
};
