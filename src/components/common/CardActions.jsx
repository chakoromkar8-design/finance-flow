import { Pencil, Trash2 } from 'lucide-react'

// Edit / delete icon buttons shown in the corner of cards.
export default function CardActions({ onEdit, onDelete, label }) {
  const base = 'rounded-lg p-1.5 text-navy-400 focus-ring transition-colors'
  return (
    <div className="flex items-center gap-0.5">
      {onEdit && (
        <button type="button" onClick={onEdit} className={`${base} hover:text-brand-600`} aria-label={`Edit ${label}`}>
          <Pencil size={15} />
        </button>
      )}
      {onDelete && (
        <button type="button" onClick={onDelete} className={`${base} hover:text-expense-500`} aria-label={`Delete ${label}`}>
          <Trash2 size={15} />
        </button>
      )}
    </div>
  )
}
