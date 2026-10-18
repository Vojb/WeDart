import { useInView, useMotionValue, useSpring } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useStore } from "../../store/useStore";

interface CountUpProps {
  to: number;
  from?: number;
  direction?: "up" | "down";
  delay?: number;
  duration?: number;
  className?: string;
  startWhen?: boolean;
  separator?: string;
  onStart?: () => void;
  onEnd?: () => void;
  animateOnChange?: boolean;
}

const decimalPlaces = (num: number): number => {
  const str = num.toString();
  if (str.includes(".")) {
    const decimals = str.split(".")[1];
    if (parseInt(decimals, 10) !== 0) {
      return decimals.length;
    }
  }
  return 0;
};

const formatCount = (
  value: number,
  from: number,
  to: number,
  separator: string,
) => {
  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));
  const formattedNumber = Intl.NumberFormat("en-US", {
    useGrouping: !!separator,
    minimumFractionDigits: maxDecimals > 0 ? maxDecimals : 0,
    maximumFractionDigits: maxDecimals > 0 ? maxDecimals : 0,
  }).format(value);
  return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
};

const CountUpStatic: React.FC<CountUpProps> = ({
  to,
  from = 0,
  separator = "",
  className = "",
}) => {
  return <span className={className}>{formatCount(to, from, to, separator)}</span>;
};

const CountUpAnimated: React.FC<CountUpProps> = ({
  to,
  from = 0,
  direction = "up",
  delay = 0,
  duration = 2,
  className = "",
  startWhen = true,
  separator = "",
  onStart,
  onEnd,
  animateOnChange = false,
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const initialValue = animateOnChange ? to : direction === "down" ? to : from;
  const motionValue = useMotionValue(initialValue);
  const springConfig = useMemo(
    () => ({
      damping: 20 + 40 * (1 / duration),
      stiffness: 100 * (1 / duration),
    }),
    [duration],
  );
  const springValue = useSpring(motionValue, springConfig);
  const isInView = useInView(ref, { once: !animateOnChange, margin: "0px" });
  const previousToRef = useRef<number>(to);
  const hasInitializedRef = useRef<boolean>(false);

  const maxDecimals = Math.max(decimalPlaces(from), decimalPlaces(to));

  const formatValue = useCallback(
    (latest: number) => {
      const hasDecimals = maxDecimals > 0;
      const options: Intl.NumberFormatOptions = {
        useGrouping: !!separator,
        minimumFractionDigits: hasDecimals ? maxDecimals : 0,
        maximumFractionDigits: hasDecimals ? maxDecimals : 0,
      };
      const formattedNumber = Intl.NumberFormat("en-US", options).format(latest);
      return separator ? formattedNumber.replace(/,/g, separator) : formattedNumber;
    },
    [maxDecimals, separator],
  );

  useEffect(() => {
    if (ref.current && !hasInitializedRef.current) {
      ref.current.textContent = formatValue(
        animateOnChange ? to : direction === "down" ? to : from,
      );
      if (animateOnChange) {
        motionValue.set(to);
        previousToRef.current = to;
        hasInitializedRef.current = true;
      }
    }
  }, [from, to, direction, formatValue, animateOnChange, motionValue]);

  useEffect(() => {
    if (animateOnChange) {
      if (!hasInitializedRef.current) {
        return;
      }

      if (previousToRef.current !== to && startWhen) {
        if (typeof onStart === "function") onStart();

        const timeoutId = setTimeout(() => {
          motionValue.set(to);
          previousToRef.current = to;
        }, delay * 1000);

        const durationTimeoutId = setTimeout(
          () => {
            if (typeof onEnd === "function") onEnd();
          },
          delay * 1000 + duration * 1000,
        );

        return () => {
          clearTimeout(timeoutId);
          clearTimeout(durationTimeoutId);
        };
      }
    } else if (isInView && startWhen) {
      if (typeof onStart === "function") onStart();

      const timeoutId = setTimeout(() => {
        motionValue.set(direction === "down" ? from : to);
      }, delay * 1000);

      const durationTimeoutId = setTimeout(
        () => {
          if (typeof onEnd === "function") onEnd();
        },
        delay * 1000 + duration * 1000,
      );

      return () => {
        clearTimeout(timeoutId);
        clearTimeout(durationTimeoutId);
      };
    }
  }, [
    isInView,
    startWhen,
    motionValue,
    direction,
    from,
    to,
    delay,
    onStart,
    onEnd,
    duration,
    animateOnChange,
  ]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest: number) => {
      if (ref.current) {
        ref.current.textContent = formatValue(latest);
      }
    });

    return () => unsubscribe();
  }, [springValue, formatValue]);

  return <span className={className} ref={ref} />;
};

const CountUp: React.FC<CountUpProps> = (props) => {
  const performanceMode = useStore((state) => state.performanceMode);
  if (performanceMode) {
    return <CountUpStatic {...props} />;
  }
  return <CountUpAnimated {...props} />;
};

export default CountUp;
