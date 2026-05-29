import { useState } from 'react'
import {
  Video,
  Share2,
  Globe,
  Pencil,
  Trash2,
  ChevronRight,
  ArrowUpRight,
} from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Input from '../components/ui/Input'
import Textarea from '../components/ui/Textarea'
import MultiSelect from '../components/ui/MultiSelect'
import Select from '../components/ui/Select'
import Modal from '../components/ui/Modal'
import PostForm from '../components/posts/PostForm'
import {
  useIdeas,
  useCreateIdea,
  useUpdateIdea,
  useDeleteIdea,
} from '../hooks/useIdeas'
import {
  IDEA_STATUSES,
  IDEA_STATUSES_BY_VALUE,
  PLATFORMS,
  PLATFORMS_BY_VALUE,
} from '../lib/constants'

const ALL_OPTION = { value: null, label: 'All' }

const STATUS_COLORS = {
  raw: '#8E8E93',
  fleshed_out: '#378ADD',
  assigned: '#1D9E75',
}

const STATUS_FLOW = ['raw', 'fleshed_out', 'assigned']

function PlatformIcon({ platform }) {
  const className = 'h-4 w-4 text-charcoal'
  switch (platform) {
    case 'instagram':
      return <Share2 className={className} aria-label="Instagram" />
    case 'linkedin':
      return <Globe className={className} aria-label="LinkedIn" />
    case 'tiktok':
      return <Video className={className} aria-label="TikTok" />
    default:
      return null
  }
}

function IdeaEditModal({ idea, open, onClose, onSave, isSaving }) {
  return (
    <Modal open={open} onClose={onClose} title="Edit idea" size="md">
      {idea && (
        <IdeaEditForm
          key={idea.id}
          idea={idea}
          onClose={onClose}
          onSave={onSave}
          isSaving={isSaving}
        />
      )}
    </Modal>
  )
}

function IdeaEditForm({ idea, onClose, onSave, isSaving }) {
  const [title, setTitle] = useState(idea?.title ?? '')
  const [notes, setNotes] = useState(idea?.notes ?? '')
  const [platforms, setPlatforms] = useState(idea?.platforms ?? [])

  function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title: title.trim(), notes: notes.trim() || null, platforms })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        id="edit-title"
        label="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <Textarea
        id="edit-notes"
        label="Notes"
        rows={4}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
      />
      <MultiSelect
        id="edit-platforms"
        label="Platforms"
        value={platforms}
        onChange={setPlatforms}
        options={PLATFORMS}
      />
      <div className="flex justify-end gap-3 border-t border-slate/20 pt-4">
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving || !title.trim()}>
          {isSaving ? 'Saving…' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}

export default function Ideas() {
  const [captureTitle, setCaptureTitle] = useState('')
  const [captureNotes, setCaptureNotes] = useState('')
  const [capturePlatforms, setCapturePlatforms] = useState([])

  const [statusFilter, setStatusFilter] = useState(null)
  const [platformFilter, setPlatformFilter] = useState(null)
  const [sortOrder, setSortOrder] = useState('newest')

  const [editingIdea, setEditingIdea] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [promoteIdea, setPromoteIdea] = useState(null)
  const [postFormOpen, setPostFormOpen] = useState(false)

  const { data: ideas = [], isLoading, error } = useIdeas({
    status: statusFilter ?? undefined,
    platform: platformFilter ?? undefined,
    sortOrder,
  })

  const createIdea = useCreateIdea()
  const updateIdea = useUpdateIdea()
  const deleteIdea = useDeleteIdea()

  async function handleCapture(e) {
    e.preventDefault()
    if (!captureTitle.trim()) return
    await createIdea.mutateAsync({
      title: captureTitle.trim(),
      notes: captureNotes.trim() || null,
      platforms: capturePlatforms,
    })
    setCaptureTitle('')
    setCaptureNotes('')
    setCapturePlatforms([])
  }

  function advanceStatus(idea) {
    const idx = STATUS_FLOW.indexOf(idea.status)
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return
    updateIdea.mutate({ id: idea.id, status: STATUS_FLOW[idx + 1] })
  }

  function openPromote(idea) {
    setPromoteIdea(idea)
    setPostFormOpen(true)
  }

  function closePostForm() {
    setPostFormOpen(false)
    setPromoteIdea(null)
  }

  async function handlePromoteSuccess() {
    if (promoteIdea) {
      await updateIdea.mutateAsync({ id: promoteIdea.id, status: 'assigned' })
    }
  }

  async function handleEditSave(updates) {
    if (!editingIdea) return
    await updateIdea.mutateAsync({ id: editingIdea.id, ...updates })
    setEditingIdea(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteIdea.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  const promotePost = promoteIdea
    ? {
        title: promoteIdea.title,
        notes: promoteIdea.notes ?? '',
        platforms: promoteIdea.platforms ?? [],
        status: 'idea',
      }
    : null

  return (
    <AppShell title="Ideas">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">Ideas</h2>
        <p className="mt-1 text-sm text-slate">Capture sparks before they become posts</p>
      </div>

      {/* Quick capture */}
      <form
        onSubmit={handleCapture}
        className="mt-6 rounded-lg border border-slate/20 bg-cream p-4"
      >
        <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate">Quick capture</p>
        <div className="space-y-3">
          <Input
            id="capture-title"
            label="Title"
            placeholder="What's the idea?"
            value={captureTitle}
            onChange={(e) => setCaptureTitle(e.target.value)}
          />
          <Textarea
            id="capture-notes"
            label="Notes"
            rows={2}
            placeholder="Angles, hooks, context…"
            value={captureNotes}
            onChange={(e) => setCaptureNotes(e.target.value)}
          />
          <MultiSelect
            id="capture-platforms"
            label="Platforms"
            value={capturePlatforms}
            onChange={setCapturePlatforms}
            options={PLATFORMS}
          />
          <div className="flex justify-end pt-1">
            <Button type="submit" disabled={createIdea.isPending || !captureTitle.trim()}>
              {createIdea.isPending ? 'Adding…' : 'Add'}
            </Button>
          </div>
        </div>
      </form>

      {/* Filters & sort */}
      <div className="mt-6 flex flex-wrap items-end gap-4">
        <Select
          id="ideas-status-filter"
          label="Status"
          value={statusFilter}
          onChange={setStatusFilter}
          options={[ALL_OPTION, ...IDEA_STATUSES]}
          className="w-44"
        />
        <Select
          id="ideas-platform-filter"
          label="Platform"
          value={platformFilter}
          onChange={setPlatformFilter}
          options={[ALL_OPTION, ...PLATFORMS]}
          className="w-44"
        />
        <Select
          id="ideas-sort"
          label="Sort"
          value={sortOrder}
          onChange={setSortOrder}
          options={[
            { value: 'newest', label: 'Newest first' },
            { value: 'oldest', label: 'Oldest first' },
          ]}
          className="w-44"
        />
      </div>

      {isLoading && <p className="mt-8 text-sm text-slate">Loading ideas…</p>}

      {error && (
        <div
          className="mt-8 rounded border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {!isLoading && !error && ideas.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate/30 px-6 py-12 text-center">
          <p className="text-sm text-slate">No ideas yet. Capture one above.</p>
        </div>
      )}

      {!isLoading && ideas.length > 0 && (
        <ul className="mt-6 divide-y divide-slate/20 rounded-lg border border-slate/20 bg-cream">
          {ideas.map((idea) => {
            const statusMeta = IDEA_STATUSES_BY_VALUE[idea.status]
            const canAdvance =
              idea.status !== 'assigned' &&
              STATUS_FLOW.indexOf(idea.status) < STATUS_FLOW.length - 1

            return (
              <li
                key={idea.id}
                className="flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-charcoal">{idea.title}</p>
                  {idea.notes && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-slate">{idea.notes}</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5" aria-label="Platforms">
                  {(idea.platforms ?? []).length === 0 ? (
                    <span className="text-xs text-slate">Any platform</span>
                  ) : (
                    idea.platforms.map((platform) => (
                      <span
                        key={platform}
                        title={PLATFORMS_BY_VALUE[platform]?.label}
                        className="flex h-7 w-7 items-center justify-center rounded border border-slate/20 bg-cream"
                      >
                        <PlatformIcon platform={platform} />
                      </span>
                    ))
                  )}
                </div>

                {statusMeta && (
                  <Badge color={STATUS_COLORS[idea.status] ?? '#8E8E93'}>
                    {statusMeta.label}
                  </Badge>
                )}

                <div className="flex items-center gap-1">
                  {canAdvance && (
                    <button
                      type="button"
                      onClick={() => advanceStatus(idea)}
                      disabled={updateIdea.isPending}
                      className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-slate transition hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-50"
                      title={`Move to ${IDEA_STATUSES_BY_VALUE[STATUS_FLOW[STATUS_FLOW.indexOf(idea.status) + 1]]?.label}`}
                    >
                      <ChevronRight className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {IDEA_STATUSES_BY_VALUE[STATUS_FLOW[STATUS_FLOW.indexOf(idea.status) + 1]]?.label}
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => openPromote(idea)}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-bold uppercase tracking-wider text-coral transition hover:bg-coral/10"
                    title="Promote to calendar"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    <span className="hidden sm:inline">Promote</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIdea(idea)}
                    className="rounded p-2 text-slate transition hover:bg-charcoal/5 hover:text-charcoal"
                    aria-label={`Edit ${idea.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(idea)}
                    className="rounded p-2 text-slate transition hover:bg-coral/10 hover:text-coral"
                    aria-label={`Delete ${idea.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <IdeaEditModal
        idea={editingIdea}
        open={Boolean(editingIdea)}
        onClose={() => setEditingIdea(null)}
        onSave={handleEditSave}
        isSaving={updateIdea.isPending}
      />

      <PostForm
        open={postFormOpen}
        onClose={closePostForm}
        post={promotePost}
        onSuccess={handlePromoteSuccess}
      />

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete idea"
        size="sm"
      >
        <p className="text-sm text-charcoal">
          Delete <span className="font-semibold">{deleteTarget?.title || 'this idea'}</span>? This
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleteIdea.isPending}>
            {deleteIdea.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
