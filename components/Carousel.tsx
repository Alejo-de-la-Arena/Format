"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  type MotionValue,
  type PanInfo,
} from "motion/react";

export interface CarouselSlide {
  id: string;
  src: string;
  alt: string;
}

const GAP = 12;
const DRAG_BUFFER = 0;
const VELOCITY_THRESHOLD = 500;
const SPRING_OPTIONS = { type: "spring" as const, stiffness: 300, damping: 30 };

function CarouselSlideItem({
  item,
  index,
  itemWidth,
  trackItemOffset,
  x,
  transition,
}: {
  item: CarouselSlide;
  index: number;
  itemWidth: number;
  trackItemOffset: number;
  x: MotionValue<number>;
  transition: typeof SPRING_OPTIONS | { duration: number };
}) {
  const range = [
    -(index + 1) * trackItemOffset,
    -index * trackItemOffset,
    -(index - 1) * trackItemOffset,
  ];
  const rotateY = useTransform(x, range, [90, 0, -90], { clamp: false });

  return (
    <motion.div className="carousel-item" style={{ width: itemWidth, rotateY }} transition={transition}>
      <img src={item.src} alt={item.alt} loading="lazy" decoding="async" className="carousel-item-img" />
    </motion.div>
  );
}

/**
 * Carousel (React Bits, adaptado): drag/swipe + loop + indicadores, sin
 * texto ni íconos por slide — cada uno es sólo una foto en object-contain
 * (nunca recorta, mismo criterio del resto del sitio). El `baseWidth` fijo
 * del original se reemplaza por el ancho real del contenedor
 * (ResizeObserver), así ocupa el 100% de lo que le dé el layout en vez de
 * un px fijo.
 */
export default function Carousel({
  items,
  accent,
  autoplay = false,
  autoplayDelay = 4500,
  pauseOnHover = true,
  loop = true,
}: {
  items: CarouselSlide[];
  /** Accent de la Season activa, para el indicador seleccionado. */
  accent?: string;
  autoplay?: boolean;
  autoplayDelay?: number;
  pauseOnHover?: boolean;
  loop?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w) setContainerWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const itemWidth = containerWidth;
  const trackItemOffset = itemWidth + GAP;

  const itemsForRender = useMemo(() => {
    if (!loop || items.length <= 1) return items;
    return [items[items.length - 1], ...items, items[0]];
  }, [items, loop]);

  const [position, setPosition] = useState(loop && items.length > 1 ? 1 : 0);
  const x = useMotionValue(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isJumping, setIsJumping] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const effectiveLoop = loop && items.length > 1;

  useEffect(() => {
    if (!pauseOnHover || !containerRef.current) return;
    const el = containerRef.current;
    const onEnter = () => setIsHovered(true);
    const onLeave = () => setIsHovered(false);
    el.addEventListener("mouseenter", onEnter);
    el.addEventListener("mouseleave", onLeave);
    return () => {
      el.removeEventListener("mouseenter", onEnter);
      el.removeEventListener("mouseleave", onLeave);
    };
  }, [pauseOnHover]);

  useEffect(() => {
    if (!autoplay || itemsForRender.length <= 1) return;
    if (pauseOnHover && isHovered) return;
    const timer = setInterval(() => {
      setPosition((prev) => Math.min(prev + 1, itemsForRender.length - 1));
    }, autoplayDelay);
    return () => clearInterval(timer);
  }, [autoplay, autoplayDelay, isHovered, pauseOnHover, itemsForRender.length]);

  useEffect(() => {
    const start = effectiveLoop ? 1 : 0;
    setPosition(start);
    x.set(-start * trackItemOffset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, effectiveLoop, trackItemOffset]);

  const effectiveTransition = isJumping ? { duration: 0 } : SPRING_OPTIONS;

  function handleAnimationComplete() {
    if (!effectiveLoop) {
      setIsAnimating(false);
      return;
    }
    const lastCloneIndex = itemsForRender.length - 1;
    if (position === lastCloneIndex) {
      setIsJumping(true);
      setPosition(1);
      x.set(-1 * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    if (position === 0) {
      setIsJumping(true);
      setPosition(items.length);
      x.set(-items.length * trackItemOffset);
      requestAnimationFrame(() => {
        setIsJumping(false);
        setIsAnimating(false);
      });
      return;
    }
    setIsAnimating(false);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const { offset, velocity } = info;
    const direction =
      offset.x < -DRAG_BUFFER || velocity.x < -VELOCITY_THRESHOLD
        ? 1
        : offset.x > DRAG_BUFFER || velocity.x > VELOCITY_THRESHOLD
          ? -1
          : 0;
    if (direction === 0) return;
    setPosition((prev) => Math.max(0, Math.min(prev + direction, itemsForRender.length - 1)));
  }

  const dragProps = effectiveLoop
    ? {}
    : {
        dragConstraints: {
          left: -trackItemOffset * Math.max(itemsForRender.length - 1, 0),
          right: 0,
        },
      };

  const activeIndex =
    items.length === 0
      ? 0
      : effectiveLoop
        ? (position - 1 + items.length) % items.length
        : Math.min(position, items.length - 1);

  if (items.length === 0) return null;

  return (
    <div
      ref={containerRef}
      className="carousel-container"
      style={{ "--carousel-accent": accent } as CSSProperties}
    >
      <motion.div
        className="carousel-track"
        drag={isAnimating || itemWidth === 0 || items.length <= 1 ? false : "x"}
        {...dragProps}
        style={{
          gap: `${GAP}px`,
          perspective: 1000,
          perspectiveOrigin: `${position * trackItemOffset + itemWidth / 2}px 50%`,
          x,
        }}
        onDragEnd={handleDragEnd}
        animate={{ x: -(position * trackItemOffset) }}
        transition={effectiveTransition}
        onAnimationStart={() => setIsAnimating(true)}
        onAnimationComplete={handleAnimationComplete}
      >
        {itemsForRender.map((item, index) => (
          <CarouselSlideItem
            key={`${item.id}-${index}`}
            item={item}
            index={index}
            itemWidth={itemWidth}
            trackItemOffset={trackItemOffset}
            x={x}
            transition={effectiveTransition}
          />
        ))}
      </motion.div>
      {items.length > 1 && (
        <div className="carousel-indicators">
          {items.map((_, index) => (
            <motion.button
              type="button"
              key={index}
              className={`carousel-indicator ${activeIndex === index ? "active" : "inactive"}`}
              aria-label={`Ir a la foto ${index + 1}`}
              aria-current={activeIndex === index}
              animate={{ scale: activeIndex === index ? 1.2 : 1 }}
              onClick={() => setPosition(effectiveLoop ? index + 1 : index)}
              transition={{ duration: 0.15 }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
