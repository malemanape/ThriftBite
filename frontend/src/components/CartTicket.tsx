import type { ReactNode } from 'react'
import { href, paths } from '../lib/route'

/** The cart, as a pickup ticket stuck to the bottom of the screen. */
export function CartTicket({ summary, total }: { summary: ReactNode; total: string }) {
  return (
    <div className="cart-bar">
      <div className="ticket-bar">
        <p><strong>{summary}</strong> Pay {total} at pickup.</p>
        <span className="tear" aria-hidden="true" />
        <a className="btn lime" href={href(paths.cart)}>Review cart</a>
      </div>
    </div>
  )
}
