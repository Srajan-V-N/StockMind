'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { TooltipPlacement } from '@/types/guided';

interface Position {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TooltipPosition {
  top: number;
  left: number;
}

export interface OverlayPositioningOptions {
  targetElementId: string | null;
  placement: TooltipPlacement;
  isActive: boolean;
  tooltipWidth: number;
  tooltipEstHeight?: number;
}

export function computeTooltipPosition(
  targetRect: Position,
  placement: TooltipPlacement,
  tooltipWidth: number,
  tooltipHeight: number
): TooltipPosition {
  const gap = 16;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom':
      top = targetRect.top + targetRect.height + gap;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'top':
      top = targetRect.top - tooltipHeight - gap;
      left = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
      break;
    case 'left':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left - tooltipWidth - gap;
      break;
    case 'right':
      top = targetRect.top + targetRect.height / 2 - tooltipHeight / 2;
      left = targetRect.left + targetRect.width + gap;
      break;
  }

  // Viewport clamping
  const padding = 16;
  const viewportW = window.innerWidth;
  const viewportH = window.innerHeight;

  if (left < padding) left = padding;
  if (left + tooltipWidth > viewportW - padding) left = viewportW - padding - tooltipWidth;
  if (top < padding) top = padding;
  if (top + tooltipHeight > viewportH - padding) top = viewportH - padding - tooltipHeight;

  return { top, left };
}

export function useOverlayPositioning({
  targetElementId,
  placement,
  isActive,
  tooltipWidth,
  tooltipEstHeight = 300,
}: OverlayPositioningOptions) {
  const [targetPos, setTargetPos] = useState<Position | null>(null);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>({ top: 0, left: 0 });
  const [targetFound, setTargetFound] = useState(true);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback(() => {
    if (!targetElementId) {
      setTargetFound(false);
      setTargetPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - tooltipEstHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
      });
      return;
    }

    const el = document.getElementById(targetElementId);
    if (!el) {
      setTargetFound(false);
      setTargetPos(null);
      setTooltipPos({
        top: window.innerHeight / 2 - tooltipEstHeight / 2,
        left: window.innerWidth / 2 - tooltipWidth / 2,
      });
      return;
    }

    setTargetFound(true);
    const rect = el.getBoundingClientRect();
    const pos: Position = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    setTargetPos(pos);

    const tooltipH = tooltipRef.current?.offsetHeight || tooltipEstHeight;
    setTooltipPos(computeTooltipPosition(pos, placement, tooltipWidth, tooltipH));
  }, [targetElementId, placement, tooltipWidth, tooltipEstHeight]);

  // Scroll target into view and update position
  useEffect(() => {
    if (!isActive) return;

    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(updatePosition, 400);
        return () => clearTimeout(timer);
      }
    }
    updatePosition();
  }, [targetElementId, isActive, updatePosition]);

  // Reposition on resize/scroll
  useEffect(() => {
    if (!isActive) return;

    const handleResize = () => updatePosition();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleResize, true);

    let observer: ResizeObserver | null = null;
    if (targetElementId) {
      const el = document.getElementById(targetElementId);
      if (el) {
        observer = new ResizeObserver(handleResize);
        observer.observe(el);
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleResize, true);
      observer?.disconnect();
    };
  }, [isActive, targetElementId, updatePosition]);

  // Recalculate after tooltip renders for accurate height
  useEffect(() => {
    if (tooltipRef.current && targetPos && targetElementId) {
      const tooltipH = tooltipRef.current.offsetHeight;
      setTooltipPos(computeTooltipPosition(targetPos, placement, tooltipWidth, tooltipH));
    }
  }, [targetPos, placement, tooltipWidth, targetElementId]);

  return { targetPos, tooltipPos, targetFound, tooltipRef };
}
