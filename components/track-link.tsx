"use client";

import Link from "next/link";
import { forwardRef, type ComponentPropsWithoutRef, type MouseEvent } from "react";
import { track } from "@/lib/analytics/track";
import type { PlausibleEvent, PlausibleEventProps } from "@/lib/analytics/events";

export type NextLinkProps = ComponentPropsWithoutRef<typeof Link>;

export type TrackLinkProps = NextLinkProps & {
  event: PlausibleEvent;
  eventProps?: PlausibleEventProps;
};

/**
 * Drop-in replacement for `next/link` that fires a Plausible event on click
 * before navigating. All other props pass through unchanged.
 */
export const TrackLink = forwardRef<HTMLAnchorElement, TrackLinkProps>(function TrackLink(
  { event, eventProps, onClick, ...rest },
  ref,
) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    try {
      track(event, eventProps);
    } catch {
      // Never block navigation on a tracking failure.
    }
    onClick?.(e);
  };

  return <Link ref={ref} onClick={handleClick} {...rest} />;
});

export default TrackLink;
