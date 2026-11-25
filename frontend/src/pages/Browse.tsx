import { useCallback, useState, type FormEvent } from 'react'
import { api } from '../api/client'
import type { ItemResponse } from '../api/types'
import thryxFull from '../assets/thryx-full.png'
import { DealCard } from '../components/DealCard'
import { LiveBadge } from '../components/LiveBadge'
import { DealSkeletons, Empty, ProblemPanel } from '../components/States'
import { peso, pickupLabel, plural, untilLabel } from '../lib/format'
import { href, paths } from '../lib/route'
import { gap } from '../lib/style'
import { useCart } from '../lib/useCart'
import { useLiveStock } from '../lib/useLiveStock'
import { useLoad, useNow } from '../lib/useLoad'

type Sort = 'closing' | 'discount'
type View = 'store' | 'all'

const VIEW_KEY = 'thriftbite-browse-view'

function savedView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'all' ? 'all' : 'store'
  } catch {
    return 'store'
  }
}

interface StoreRow {
  storeId: string
  storeName: string
  storeSlug: string
  items: ItemResponse[]
  /** The listing whose pickup ends first: the row's closing time. */
  first: ItemResponse
  /** Every listing in the row has the same pickup window, so the cards needn't repeat it. */
  oneWindow: boolean
}

/** Groups the sorted deals by store, keeping the order: a store's row sits where its first deal would. */
function byStore(items: ItemResponse[]): StoreRow[] {
  const rows = new Map<string, StoreRow>()
  for (const item of items) {
    const row = rows.get(item.storeId)
    if (row) {
      row.items.push(item)
      if (item.pickupEnd < row.first.pickupEnd) row.first = item
    } else {
      rows.set(item.storeId, { storeId: item.storeId, storeName: item.storeName, storeSlug: item.storeSlug, items: [item], first: item, oneWindow: true })
    }
  }
  for (const row of rows.values()) {
    row.oneWindow = row.items.every((i) => i.pickupStart === row.first.pickupStart && i.pickupEnd === row.first.pickupEnd)
  }
  return [...rows.values()]
}

export function Browse() {
  const now = useNow()
  const [typed, setTyped] = useState('')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>('closing')
  const [view, setViewState] = useState<View>(savedView)
  const { cart, inCart, canReserve, loggedIn, adding, problem, add } = useCart()

  const deals = useLoad(useCallback(() => api.browse(query), [query]))
  // Live: when someone reserves a listing on screen, its count changes in place.
  const mutateDeals = deals.mutate
  const changes = useLiveStock(deals.data?.content,
    useCallback((change) => mutateDeals((page) => ({ ...page, content: change(page.content) })), [mutateDeals]),
    deals.reload)

  const items = [...(deals.data?.content ?? [])].sort((a, b) =>
    sort === 'discount' ? b.discountPercent - a.discountPercent : a.pickupEnd.localeCompare(b.pickupEnd))
  const rows = byStore(items)

  const setView = (next: View) => {
    setViewState(next)
    try { localStorage.setItem(VIEW_KEY, next) } catch { /* storage blocked: it still applies for this visit */ }
  }
  const changeSort = (next: Sort) => {
    setSort(next)
    // The biggest discounts read best side by side, not split up by store.
    if (next === 'discount') setView('all')
  }

  const search = (e: FormEvent) => {
    e.preventDefault()
    setQuery(typed.trim())
  }

  // Thryx points out the store that stops pickups next.
  const next = [...items].filter((i) => i.status === 'AVAILABLE' && i.quantity > 0 && new Date(i.pickupEnd).getTime() > now)
    .sort((a, b) => a.pickupEnd.localeCompare(b.pickupEnd))[0]

  const cartCount = cart?.lines.length ?? 0
  const stores = new Set(cart?.lines.map((line) => line.storeId)).size
  const card = (item: ItemResponse, row?: StoreRow) => (
    <DealCard key={item.id} item={item} now={now} inCart={inCart.get(item.id)} canReserve={canReserve}
      loggedIn={loggedIn} adding={adding === item.id} onAdd={() => add(item)} flashes={changes[item.id]}
      hideStore={row !== undefined} inStoreRow={row?.oneWindow} />
  )

  return (
    <div className="stack" style={gap(24)}>
      <section className="browse-head">
        <div className="stack" style={gap(16)}>
          <h1>Tonight’s surplus, saved before closing.</h1>
          <p className="lead">
            End-of-day food from Baguio bakeries and carinderias, at a portion of the usual price.
            Reserve it now and pick it up tonight.
          </p>
          <form role="search" className="search" onSubmit={search}>
            <label htmlFor="q" className="sr">Search food or a store</label>
            <input id="q" className="input grow" type="search" maxLength={120} placeholder="Pandesal, adobo, a store…"
              value={typed} onChange={(e) => setTyped(e.target.value)} />
            <button type="submit" className="btn lime">Search</button>
          </form>
        </div>
        <div className="thryx-says hide-phone">
          <img src={thryxFull} alt="" width={300} height={294} />
          {next && (
            <p>{next.storeName} stops pickups in <strong>{untilLabel(next.pickupEnd, now)}</strong>.</p>
          )}
        </div>
      </section>

      <div className="toolbar">
        <p className="count-line" aria-live="polite">
          {deals.data && (query
            ? `${plural(deals.data.totalElements, 'deal')} for “${query}”`
            : `${plural(deals.data.totalElements, 'deal')} you can still pick up tonight`)}
        </p>
        <div className="wrap-row">
          <div className="segmented" role="group" aria-label="Show deals">
            <button type="button" className="chip" aria-pressed={view === 'store'} onClick={() => setView('store')}>By store</button>
            <button type="button" className="chip" aria-pressed={view === 'all'} onClick={() => setView('all')}>All deals</button>
          </div>
          <LiveBadge what="Stock counts" />
          <span className="row" style={gap(10)}>
            <label htmlFor="sort" style={{ fontWeight: 600 }}>Sort</label>
            <select id="sort" className="input" style={{ width: 190, height: 44 }} value={sort}
              onChange={(e) => changeSort(e.target.value as Sort)}>
              <option value="closing">Closing soonest</option>
              <option value="discount">Biggest discount</option>
            </select>
          </span>
        </div>
      </div>

      {problem && <p role="alert" className="err">{problem}</p>}

      {deals.error ? <ProblemPanel error={deals.error} onRetry={deals.reload} />
        : !deals.data ? <DealSkeletons />
        : items.length === 0 ? (
          query ? (
            <Empty title={`Nothing matches “${query}” right now`}
              action={<button type="button" className="btn" onClick={() => { setTyped(''); setQuery('') }}>Show all deals</button>}>
              Try a shorter word, like “bread” or a store’s name.
            </Empty>
          ) : (
            <Empty title="Tonight’s food is all spoken for."
              action={<a className="btn" href={href(paths.reservations)}>See your reservations</a>}>
              Every pickup window has closed. Stores usually post between 3:00 and 4:00 PM, so check back tomorrow afternoon.
            </Empty>
          )
        ) : view === 'store' ? (
          <>
            <h2 className="sr">Deals by store, {sort === 'closing' ? 'pickup closing soonest first' : 'biggest discount first'}</h2>
            <div className="shelves">
              {rows.map((row, i) => {
                const open = new Date(row.first.pickupEnd).getTime() > now
                const soon = open && new Date(row.first.pickupEnd).getTime() - now < 2 * 3600_000
                return (
                  <section key={row.storeId} className={`shelf${i === 0 && sort === 'closing' ? ' next' : ''}`} aria-labelledby={`row-${row.storeId}`}>
                    <div className="shelf-info">
                      <h2 id={`row-${row.storeId}`}><a href={href(paths.store(row.storeSlug))}>{row.storeName}</a></h2>
                      {row.oneWindow && <p>Pick up {pickupLabel(row.first.pickupStart, row.first.pickupEnd, now)}</p>}
                      {open && <p className={`closes${soon ? ' soon' : ''}`}>Closes in {untilLabel(row.first.pickupEnd, now)}</p>}
                      <p className="muted small">{plural(row.items.length, 'deal')}</p>
                    </div>
                    <div className="deals">{row.items.map((item) => card(item, row))}</div>
                  </section>
                )
              })}
            </div>
          </>
        ) : (
          <>
            <h2 className="sr">Deals, {sort === 'closing' ? 'pickup closing soonest first' : 'biggest discount first'}</h2>
            <div className="deals">{items.map((item) => card(item))}</div>
          </>
        )}

      {cartCount > 0 && (
        <div className="cart-bar">
          <div className="ticket-bar">
            <p><strong>{plural(cartCount, 'item')} from {plural(stores, 'store')}.</strong>{' '}
              Pay {peso(cart?.total ?? 0)} at pickup.</p>
            <span className="tear" aria-hidden="true" />
            <a className="btn lime" href={href(paths.cart)}>Review cart</a>
          </div>
        </div>
      )}
    </div>
  )
}
