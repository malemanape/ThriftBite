import { photoUrl } from '../api/client'
import type { ItemResponse } from '../api/types'
import { artFor } from '../lib/art'
import { peso, pickupLabel, untilLabel } from '../lib/format'
import { href, paths } from '../lib/route'

interface Props {
  item: ItemResponse
  now: number
  /** How many of this the buyer already has in their cart. */
  inCart: number | undefined
  /** False for store and admin accounts: they see the card without a button. */
  canReserve: boolean
  loggedIn: boolean
  adding: boolean
  onAdd: () => void
  /** How many live changes this listing has had; a new number replays the flash on its count. */
  flashes?: number
  /** Leave the store's name off, on the store's own page. */
  hideStore?: boolean
  /** Inside a store's row on Browse: the row already names the store and its pickup window. */
  inStoreRow?: boolean
}

/** One listing, as buyers see it on the browse page and on a store's page. */
export function DealCard({ item, now, inCart, canReserve, loggedIn, adding, onAdd, flashes = 0, hideStore = false, inStoreRow = false }: Props) {
  const closingSoon = new Date(item.pickupEnd).getTime() - now < 2 * 3600_000
  // A live update can take a listing off sale while it's on screen. It stays put
  // (nothing jumps under a finger about to tap) and goes at the next reload.
  const soldOut = item.status === 'SOLD_OUT' || (item.status === 'AVAILABLE' && item.quantity === 0)
  const gone = soldOut || item.status !== 'AVAILABLE'
  const art = artFor(item.art, item.name)

  return (
    <article className={`card deal${gone ? ' gone' : ''}`}>
      <div className={`photo shot art-bg-${art.tile}`}>
        {/* The name is right below, so the picture adds nothing for a screen reader. */}
        {item.photoId
          ? <img src={photoUrl(item.photoId, 'thumb')} alt="" loading="lazy" decoding="async" />
          : <img className="art" src={art.src} alt="" width={96} height={96} />}
        <span className="price-tag" aria-label={`${item.discountPercent}% off`}>−{item.discountPercent}%</span>
      </div>
      <div className="deal-body">
        {!hideStore && !inStoreRow && <a className="store" href={href(paths.store(item.storeSlug))}>{item.storeName}</a>}
        <h3>{item.name}</h3>
        {item.description && <p className="muted small">{item.description}</p>}
        <p className="spread">
          <span className="price">
            <strong className="num">{peso(item.price)}</strong>
            <s className="muted num small">{peso(item.originalPrice)}</s>
          </span>
          <span key={flashes} className={`tag${gone ? ' orange' : ''}${flashes ? ' flash' : ''}`}>
            {soldOut ? 'Sold out' : gone ? 'No longer on sale' : `${item.quantity} left`}
          </span>
        </p>
        {!inStoreRow && (
          <p className="when">
            {!gone && <><strong className={closingSoon ? 'soon' : undefined}>Closes in {untilLabel(item.pickupEnd, now)}</strong> · </>}
            <span className="muted">Pick up {pickupLabel(item.pickupStart, item.pickupEnd, now)}</span>
          </p>
        )}
        {canReserve && (
          <div className="btn-slot">
            {gone ? (
              <button type="button" className="btn" disabled>{soldOut ? 'Sold out' : 'Not on sale'}</button>
            ) : inCart ? (
              <a className="btn teal" href={href(paths.cart)}>In your cart ({inCart})</a>
            ) : (
              <button type="button" className="btn lime" onClick={onAdd} disabled={adding} aria-label={`Add ${item.name} to cart`}>
                {adding ? 'Adding…' : loggedIn ? 'Add to cart' : 'Log in to reserve'}
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  )
}
