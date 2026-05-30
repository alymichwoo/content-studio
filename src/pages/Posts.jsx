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
import { iconButtonClass, iconButtonDangerClass } from '../components/ui/iconButtonStyles'

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

function PostActions({ post, onMetrics, onEdit, onDuplicate, onArchive, onDelete, duplicatePending, archivePending }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={() => onMetrics(post)}
        className={iconButtonClass}
        aria-label={`Metrics for ${post.title}`}
      >
        <BarChart2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onEdit(post)}
        className={iconButtonClass}
        aria-label={`Edit ${post.title}`}
      >
        <Pencil className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => onDuplicate(post)}
        disabled={duplicatePending}
        className={`${iconButtonClass} disabled:opacity-50`}
        aria-label={`Duplicate ${post.title}`}
      >
        <Copy className="h-4 w-4" />
      </button>
      {!post.archived && (
        <button
          type="button"
          onClick={() => onArchive(post.id)}
          disabled={archivePending}
          className={`${iconButtonClass} disabled:opacity-50`}
          aria-label={`Archive ${post.title}`}
        >
          <Archive className="h-4 w-4" />
        </button>
      )}
      <button
        type="button"
        onClick={() => onDelete(post)}
        className={iconButtonDangerClass}
        aria-label={`Delete ${post.title}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

function PostPlatformIcons({ platforms }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5" aria-label="Platforms">
      {(platforms ?? []).map((platform) => (
        <span
          key={platform}
          title={PLATFORMS_BY_VALUE[platform]?.label}
          className="flex h-9 w-9 items-center justify-center rounded border border-slate/20 bg-cream md:h-7 md:w-7"
        >
          <PlatformIcon platform={platform} />
        </span>
      ))}
    </div>
  )
}

function CardField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
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
                className={post.archived ? 'opacity-60' : ''}
              >
                {/* Mobile: stacked label/value card */}
                <div className="space-y-3 px-4 py-4 md:hidden">
                  <CardField label="Title">
                    <p className="font-semibold text-charcoal">{post.title || 'Untitled'}</p>
                  </CardField>
                  {post.series && (
                    <CardField label="Series">
                      <p className="text-sm text-charcoal">{post.series}</p>
                    </CardField>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <CardField label="Pillar">
                      {pillar ? (
                        <Badge color={pillar.color}>{pillar.label}</Badge>
                      ) : (
                        <span className="text-sm text-slate">—</span>
                      )}
                    </CardField>
                    <CardField label="Status">
                      <div className="flex flex-wrap gap-1.5">
                        {status && (
                          <Badge color={STATUS_COLORS[post.status] ?? '#8E8E93'}>
                            {status.label}
                          </Badge>
                        )}
                        {post.archived && <Badge color="#8E8E93">Archived</Badge>}
                      </div>
                    </CardField>
                  </div>
                  <CardField label="Platforms">
                    {(post.platforms ?? []).length > 0 ? (
                      <PostPlatformIcons platforms={post.platforms} />
                    ) : (
                      <span className="text-sm text-slate">—</span>
                    )}
                  </CardField>
                  <div className="border-t border-slate/20 pt-3">
                    <PostActions
                      post={post}
                      onMetrics={setMetricsPost}
                      onEdit={openEdit}
                      onDuplicate={(p) => duplicatePost.mutate(p)}
                      onArchive={(id) => archivePost.mutate(id)}
                      onDelete={setDeleteTarget}
                      duplicatePending={duplicatePost.isPending}
                      archivePending={archivePost.isPending}
                    />
                  </div>
                </div>

                {/* Desktop: horizontal row */}
                <div
                  className={`hidden md:flex md:flex-wrap md:items-center md:gap-4 md:px-4 md:py-3 ${post.archived ? '' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-charcoal">{post.title || 'Untitled'}</p>
                    {post.series && (
                      <p className="truncate text-xs text-slate">{post.series}</p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {pillar && <Badge color={pillar.color}>{pillar.label}</Badge>}
                    {status && (
                      <Badge color={STATUS_COLORS[post.status] ?? '#8E8E93'}>
                        {status.label}
                      </Badge>
                    )}
                    {post.archived && <Badge color="#8E8E93">Archived</Badge>}
                  </div>

                  <PostPlatformIcons platforms={post.platforms} />

                  <PostActions
                    post={post}
                    onMetrics={setMetricsPost}
                    onEdit={openEdit}
                    onDuplicate={(p) => duplicatePost.mutate(p)}
                    onArchive={(id) => archivePost.mutate(id)}
                    onDelete={setDeleteTarget}
                    duplicatePending={duplicatePost.isPending}
                    archivePending={archivePost.isPending}
                  />
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

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Delete post"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} disabled={deletePost.isPending}>
              {deletePost.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-charcoal">
          Delete <span className="font-semibold">{deleteTarget?.title || 'this post'}</span>? This
          cannot be undone.
        </p>
      </Modal>
    </AppShell>
  )
}
