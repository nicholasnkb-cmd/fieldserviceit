'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackMarketingEvent, type MarketingEvent } from '../../lib/analytics';

type Props = ComponentProps<typeof Link> & {
  eventName: MarketingEvent;
  eventLabel: string;
  eventLocation: string;
};

export function TrackedLink({
  eventName,
  eventLabel,
  eventLocation,
  onClick,
  ...props
}: Props) {
  return (
    <Link
      {...props}
      onClick={(event) => {
        trackMarketingEvent(eventName, {
          label: eventLabel,
          location: eventLocation,
          destination: String(props.href),
        });
        onClick?.(event);
      }}
    />
  );
}
