import { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface TypingTextProps {
  text: string;
  speed?: number; // ms per character
}

const TypingText: React.FC<TypingTextProps> = ({ text, speed = 50 }) => {
  const [displayed, setDisplayed] = useState('');
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    setDisplayed('');
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, [text]);

  useEffect(() => {
    let i = 0;
    const len = text.length;

    const tick = () => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i < len) {
        timerRef.current = window.setTimeout(tick, speed);
      }
    };

    timerRef.current = window.setTimeout(tick, speed);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [text, speed]);

  return <span>{displayed}</span>;
};

export default TypingText;
