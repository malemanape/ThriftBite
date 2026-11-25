import buns from '../assets/art/buns.svg'
import croissant from '../assets/art/croissant.svg'
import cup from '../assets/art/cup.svg'
import loaf from '../assets/art/loaf.svg'
import longBread from '../assets/art/long-bread.svg'
import riceBowl from '../assets/art/rice-bowl.svg'
import rolls from '../assets/art/rolls.svg'
import swirl from '../assets/art/swirl.svg'
import vegBowl from '../assets/art/veg-bowl.svg'

/** ThriftBite's food drawings, for a listing without a photo. Same names as the backend's Item.ART. */
export type ArtName = 'rice-bowl' | 'veg-bowl' | 'cup' | 'buns' | 'swirl' | 'long-bread' | 'rolls' | 'loaf' | 'croissant'

export interface Art {
  name: ArtName
  /** What a store owner sees when choosing one. */
  label: string
  src: string
  /** The colour of the tile behind it: a class from index.css. */
  tile: 'yolk' | 'mint' | 'pink' | 'lilac'
}

export const arts: Art[] = [
  { name: 'rice-bowl', label: 'Rice meal', src: riceBowl, tile: 'yolk' },
  { name: 'veg-bowl', label: 'Vegetables', src: vegBowl, tile: 'mint' },
  { name: 'cup', label: 'Drink or taho', src: cup, tile: 'pink' },
  { name: 'buns', label: 'Buns', src: buns, tile: 'yolk' },
  { name: 'swirl', label: 'Ensaymada', src: swirl, tile: 'lilac' },
  { name: 'long-bread', label: 'Long bread', src: longBread, tile: 'pink' },
  { name: 'rolls', label: 'Rolls', src: rolls, tile: 'yolk' },
  { name: 'loaf', label: 'Loaf or cake', src: loaf, tile: 'mint' },
  { name: 'croissant', label: 'Pastry', src: croissant, tile: 'lilac' },
]

const byName = new Map(arts.map((art) => [art.name, art]))

/** Words in a listing's name that point to a drawing, for listings whose store didn't pick one. */
const hints: [RegExp, ArtName][] = [
  [/taho|coffee|tea|juice|shake|drink|milk|cup/i, 'cup'],
  [/ensaymada|ensaimada|ube|swirl|donut|doughnut/i, 'swirl'],
  [/croissant|pastry|empanada|turnover|puff/i, 'croissant'],
  [/loaf|banana bread|cake|brownie|bibingka|puto/i, 'loaf'],
  [/spanish|baguette|stick|pan de coco|monay/i, 'long-bread'],
  [/roll|cheese|mamon/i, 'rolls'],
  [/pandesal|pan de sal|bun|bread|ensaladang|siopao|pastries/i, 'buns'],
  [/pinakbet|vegetable|gulay|salad|chopsuey|tray|laing|ginisang/i, 'veg-bowl'],
]

/** The drawing to show: the store's pick, else a guess from the name, else a rice meal. */
export function artFor(chosen: string | null | undefined, name: string): Art {
  const picked = chosen ? byName.get(chosen as ArtName) : undefined
  if (picked) return picked
  const hint = hints.find(([pattern]) => pattern.test(name))
  return byName.get(hint ? hint[1] : 'rice-bowl')!
}
