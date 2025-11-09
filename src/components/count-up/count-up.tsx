import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { useCallback, useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  direction?: 'up' | 'down';
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
  animateOnChange?: boolean; // If true, re-animate whenever 'to' changes
}

const CountUp: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = 'up',
  delay = 0,
  duration = 2,
  className = '',
  startWhen = true,
  separator = '',
  onStart,
  onEnd,
  animateOnChange = false,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const initialValue = animateOnChange ? to : (direction === 'down' ? to : from);
  const motionValue = useMotionValue(initialValue);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, {
    damping,
    stiffness,
  });
  const isInView = useInView(ref, { once: !animateOnChange, margin: '0px' });
  const previousToRef = useRef<number>(to);
  const hasInitializedRef = useRef<boolean>(false);

  const getDecimalPlaces = (num: number): number => {
    const str = num.toString();
    if (str.includes('.')) {
      const decimals = str.split('.')[1];
      if (parseInt(decimals) !== 0) {
        return decimals.length;
      }
    }
    return 0;
  };

  const maxDecimals = Math.max(getDecimalPlaces(from), getDecimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formattedNumber = Intl.NumberFormat('en-US', options).format(latest);
      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator]
  );

  // Initialize the display value
  useEffect(() => {
    if (ref.current && !hasInitializedRef.current) {
      ref.current.textContent = formatValue(animateOnChange ? to : (direction === 'down' ? to : from));
      if (animateOnChange) {
        motionValue.set(to);
        previousToRef.current = to;
        hasInitializedRef.current = true;
      }
    }
  }, [from, to, direction, formatValue, animateOnChange, motionValue]);

  useEffect(() => {
    // If animateOnChange is true, trigger animation whenever 'to' changes
    if (animateOnChange) {
      // Skip initial render if not initialized yet
      if (!hasInitializedRef.current) {
        return;
      }

      // Only animate if value actually changed
      if (previousToRef.current !== to && startWhen) {
        if (typeof onStart === 'function') onStart();

        // Get current value from motionValue (which should be the previous 'to')
        const currentValue = motionValue.get();
        
        const timeoutId = setTimeout(() => {
          motionValue.set(to);
          previousToRef.current = to;
        }, delay * 1000);

        const durationTimeoutId = setTimeout(
          () => {
            if (typeof onEnd === 'function') onEnd();
          },
          delay * 1000 + duration * 1000
        );

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(durationTimeoutId);
        };
      }
    } else {
      // Original behavior: animate once when in view
      if (isInView && startWhen) {
        if (typeof onStart === 'function') onStart();

        const timeoutId = setTimeout(() => {
          motionValue.set(direction === 'down' ? from : to);
        }, delay * 1000);

        const durationTimeoutId = setTimeout(
          () => {
            if (typeof onEnd === 'function') onEnd();
          },
          delay * 1000 + duration * 1000
        );

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(durationTimeoutId);
        };
      }
    }
  }, [isInView, startWhen, motionValue, direction, from, to, delay, onStart, onEnd, duration, animateOnChange]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
};

export default CountUp;

