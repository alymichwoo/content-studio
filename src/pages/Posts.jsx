import { useState } from 'react'
import { Video, Share2, Globe, Archive, Copy, Pencil, Trash2, BarChart2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import PostForm from '../components/posts/PostForm'
import MetricsModal from '../components/metrics/MetricsModal'
import {
  usePosts,
  useArchivePost,
  useDeletePost,
  useDuplicatePost,
} from '../hooks/usePosts'
import { PILLARS_BY_VALUE, PLATFORMS_BY_VALUE, STATUSES_BY_VALUE } from '../lib/constants'

const STATUS_COLORS = {
  idea: '#8E8E93',
  drafting: '#378ADD',
  ready: '#1D9E75',
  scheduled: '#7F77DD',
  posted: '#1C1C1E',
}

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

export default function Posts() {
  const [showArchived, setShowArchived] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingPost, setEditingPost] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [metricsPost, setMetricsPost] = useState(null)

  const { data: posts = [], isLoading, error } = usePosts({ includeArchived: showArchived })
  const archivePost = useArchivePost()
  const deletePost = useDeletePost()
  const duplicatePost = useDuplicatePost()

  function openCreate() {
    setEditingPost(null)
    setFormOpen(true)
  }

  function openEdit(post) {
    setEditingPost(post)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setEditingPost(null)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deletePost.mutateAsync(deleteTarget.id)
    setDeleteTarget(null)
  }

  return (
    <AppShell title="Posts">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">Posts</h2>
          <p className="mt-1 text-sm text-slate">Manage content across platforms</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-charcoal">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="rounded border-slate/30 text-coral focus:ring-coral"
            />
            Show archived
          </label>
          <Button onClick={openCreate}>New post</Button>
        </div>
      </div>

      {isLoading && (
        <p className="mt-8 text-sm text-slate">Loading posts…</p>
      )}

      {error && (
        <div
          className="mt-8 rounded border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
          role="alert"
        >
          {error.message}
        </div>
      )}

      {!isLoading && !error && posts.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate/30 px-6 py-12 text-center">
          <p className="text-sm text-slate">
            {showArchived ? 'No posts yet.' : 'No active posts. Create one or show archived.'}
          </p>
          {!showArchived && (
            <Button className="mt-4" onClick={openCreate}>
              New post
            </Button>
          )}
        </div>
      )}

      {!isLoading && posts.length > 0 && (
        <ul className="mt-6 divide-y divide-slate/20 rounded-lg border border-slate/20 bg-cream">
          {posts.map((post) => {
            const pillar = post.pillar ? PILLARS_BY_VALUE[post.pillar] : null
            const status = post.status ? STATUSES_BY_VALUE[post.status] : null

            return (
              <li
                key={post.id}
                className={`flex flex-wrap items-center gap-3 px-4 py-3 sm:gap-4 ${post.archived ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-charcoal">{post.title || 'Untitled'}</p>
                  {post.series && (
                    <p className="truncate text-xs text-slate">{post.series}</p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {pillar && (
                    <Badge color={pillar.color}>{pillar.label}</Badge>
                  )}
                  {status && (
                    <Badge color={STATUS_COLORS[post.status] ?? '#8E8E93'}>
                      {status.label}
                    </Badge>
                  )}
                  {post.archived && (
                    <Badge color="#8E8E93">Archived</Badge>
                  )}
                </div>

                <div className="flex items-center gap-1.5" aria-label="Platforms">
                  {(post.platforms ?? []).map((platform) => (
                    <span
                      key={platform}
                      title={PLATFORMS_BY_VALUE[platform]?.label}
                      className="flex h-7 w-7 items-center justify-center rounded border border-slate/20 bg-cream"
                    >
                      <PlatformIcon platform={platform} />
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setMetricsPost(post)}
                    className="rounded p-2 text-slate transition hover:bg-charcoal/5 hover:text-charcoal"
                    aria-label={`Metrics for ${post.title}`}
                  >
                    <BarChart2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEdit(post)}
                    className="rounded p-2 text-slate transition hover:bg-charcoal/5 hover:text-charcoal"
                    aria-label={`Edit ${post.title}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicatePost.mutate(post)}
                    disabled={duplicatePost.isPending}
                    className="rounded p-2 text-slate transition hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-50"
                    aria-label={`Duplicate ${post.title}`}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  {!post.archived && (
                    <button
                      type="button"
                      onClick={() => archivePost.mutate(post.id)}
                      disabled={archivePost.isPending}
                      className="rounded p-2 text-slate transition hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-50"
                      aria-label={`Archive ${post.title}`}
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(post)}
                    className="rounded p-2 text-slate transition hover:bg-coral/10 hover:text-coral"
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <PostForm open={formOpen} onClose={closeForm} post={editingPost} />

      <MetricsModal
        open={Boolean(metricsPost)}
        onClose={() => setMetricsPost(null)}
        post={metricsPost}
      />

      <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete post" size="sm">
        <p className="text-sm text-charcoal">
          Delete <span className="font-semibold">{deleteTarget?.title || 'this post'}</span>? This
          cannot be undone.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={deletePost.isPending}
          >
            {deletePost.isPending ? 'Deleting…' : 'Delete'}
          </Button>
        </div>
      </Modal>
    </AppShell>
  )
}
