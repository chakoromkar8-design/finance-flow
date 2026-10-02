import Modal from './Modal.jsx'
import Button from './Button.jsx'

// A small "Are you sure?" popup used before deleting anything.
export default function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', busy = false, onConfirm, onCancel }) {
  return (
    <Modal open={open} onClose={busy ? () => {} : onCancel} title={title} size="sm">
      <p className="text-sm text-navy-600 dark:text-navy-300">{message}</p>
      <div className="flex gap-3 pt-5">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
        <Button type="button" variant="danger" className="flex-1" onClick={onConfirm} disabled={busy}>
          {busy ? 'Working…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
