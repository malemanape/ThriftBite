import { arts, artFor } from '../lib/art'

/**
 * Lets a store pick the drawing buyers see when a listing has no photo.
 * Until they pick, the drawing follows the food's name.
 */
export function ArtPicker({ value, name, onChange }: { value: string | null; name: string; onChange: (art: string | null) => void }) {
  const guess = artFor(null, name).name
  return (
    <fieldset className="stack" style={{ border: 0, margin: 0, padding: 0, ['--gap' as string]: '8px' }}>
      <legend style={{ fontWeight: 600, marginBottom: 8 }}>Drawing, when there’s no photo</legend>
      <div className="art-picker">
        {arts.map((art) => (
          <label key={art.name} className="art-option">
            <input type="radio" name="listing-art" className="sr" value={art.name}
              checked={(value ?? guess) === art.name} onChange={() => onChange(art.name)} />
            <img src={art.src} alt="" width={52} height={52} />
            {art.label}
          </label>
        ))}
      </div>
      <span className="hint">{value ? 'Buyers see this until you add a photo.' : 'Picked from the food’s name. Choose another if it fits better.'}</span>
    </fieldset>
  )
}
