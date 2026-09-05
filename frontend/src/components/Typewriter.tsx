import { useEffect, useState } from 'react';

export const SAMPLE_PROMPTS = [
  'Send 1 SUI to Nathan for frontend work',
  'Lock 2 SUI in escrow for website design',
  'Transfer 0.05 SUI to 0xaa0b190...bb8d',
  'Release escrow payment to Nicole',
  'Swap 10 SUI to USDC on Sui',
  'Check my wallet balance on Sui Testnet',
];

export function useTypewriter({
  words,
  typingSpeed = 75,     // Slower typing
  deletingSpeed = 25,   // Faster deleting (~3x speed of typing)
  pauseTime = 1800,     // Pause when complete word is typed
}: {
  words: string[];
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (words.length === 0) return;

    if (isPaused) {
      const timeout = setTimeout(() => {
        setIsPaused(false);
        setIsDeleting(true);
      }, pauseTime);
      return () => clearTimeout(timeout);
    }

    if (isDeleting) {
      if (subIndex === 0) {
        setIsDeleting(false);
        setIndex((prev) => (prev + 1) % words.length);
        return;
      }
      const timeout = setTimeout(() => {
        setSubIndex((prev) => prev - 1);
      }, deletingSpeed);
      return () => clearTimeout(timeout);
    } else {
      if (subIndex === words[index].length) {
        setIsPaused(true);
        return;
      }
      const timeout = setTimeout(() => {
        setSubIndex((prev) => prev + 1);
      }, typingSpeed);
      return () => clearTimeout(timeout);
    }
  }, [subIndex, isDeleting, isPaused, index, words, typingSpeed, deletingSpeed, pauseTime]);

  const text = words[index] ? words[index].substring(0, subIndex) : '';

  return { text, isDeleting };
}

export function TypewriterText({
  words = SAMPLE_PROMPTS,
  className = '',
  cursorClassName = '',
  typingSpeed = 75,
  deletingSpeed = 25,
  pauseTime = 1800,
}: {
  words?: string[];
  className?: string;
  cursorClassName?: string;
  typingSpeed?: number;
  deletingSpeed?: number;
  pauseTime?: number;
}) {
  const { text } = useTypewriter({ words, typingSpeed, deletingSpeed, pauseTime });

  return (
    <span className={`inline-flex items-center ${className}`}>
      <span>{text}</span>
      <span
        className={`inline-block w-[2px] h-[1.15em] bg-[var(--color-sui)] ml-0.5 align-middle animate-pulse ${cursorClassName}`}
        aria-hidden="true"
      />
    </span>
  );
}
