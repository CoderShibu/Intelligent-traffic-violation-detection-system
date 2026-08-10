import { useEffect, useRef, useState } from "react";

/** Animates from 0 to `value` over `duration` ms. */
export function CountUp({ value, duration = 900, format = (n: number) => n.toLocaleString("en-IN") }: {
  value: number; duration?: number; format?: (n: number) => string;
}) {
  const [n, setN] = useState(0);
  const start = useRef<number | null>(null);
  const fromRef = useRef(0);
  const target = value;

  useEffect(() => {
    fromRef.current = n;
    start.current = null;
    let raf = 0;
    const tick = (t: number) => {
      if (start.current === null) start.current = t;
      const p = Math.min(1, (t - start.current) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return <>{format(n)}</>;
}
