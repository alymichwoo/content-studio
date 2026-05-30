import { useMemo, useState } from 'react'
import { ChevronRight, Pencil, Plus, Trash2 } from 'lucide-react'
import AppShell from '../components/layout/AppShell'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import BrandForm from '../components/partnerships/BrandForm'
import CampaignForm from '../components/partnerships/CampaignForm'
import DeliverableForm from '../components/partnerships/DeliverableForm'
import DeliverableProgress from '../components/partnerships/DeliverableProgress'
import {
  useBrands,
  useDeleteBrand,
} from '../hooks/useBrands'
import {
  useCampaigns,
  useDeleteCampaign,
} from '../hooks/useCampaigns'
import {
  useDeliverables,
  usePostsForDeliverables,
  useDeleteDeliverable,
} from '../hooks/useDeliverables'
import {
  BRAND_STATUSES_BY_VALUE,
  CAMPAIGN_STATUSES_BY_VALUE,
  PAYMENT_STATUSES_BY_VALUE,
} from '../lib/constants'
import { iconButtonClass, iconButtonDangerClass } from '../components/ui/iconButtonStyles'

const BRAND_STATUS_COLORS = {
  prospect: '#8E8E93',
  active: '#1D9E75',
  past: '#378ADD',
}

const CAMPAIGN_STATUS_COLORS = {
  pitching: '#8E8E93',
  negotiating: '#EF9F27',
  active: '#1D9E75',
  delivered: '#378ADD',
  wrapped: '#7F77DD',
}

function CardField({ label, children }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-slate">{label}</p>
      <div className="mt-1">{children}</div>
    </div>
  )
}

export default function Partnerships() {
  const [selectedBrandId, setSelectedBrandId] = useState(null)
  const [selectedCampaignId, setSelectedCampaignId] = useState(null)

  const [brandFormOpen, setBrandFormOpen] = useState(false)
  const [editingBrand, setEditingBrand] = useState(null)
  const [deleteBrandTarget, setDeleteBrandTarget] = useState(null)

  const [campaignFormOpen, setCampaignFormOpen] = useState(false)
  const [editingCampaign, setEditingCampaign] = useState(null)
  const [deleteCampaignTarget, setDeleteCampaignTarget] = useState(null)

  const [deliverableFormOpen, setDeliverableFormOpen] = useState(false)
  const [editingDeliverable, setEditingDeliverable] = useState(null)
  const [deleteDeliverableTarget, setDeleteDeliverableTarget] = useState(null)

  const { data: brands = [], isLoading: brandsLoading, error: brandsError } = useBrands()
  const { data: campaigns = [], isLoading: campaignsLoading } = useCampaigns(selectedBrandId)
  const { data: deliverables = [], isLoading: deliverablesLoading } =
    useDeliverables(selectedCampaignId)

  const deliverableIds = useMemo(() => deliverables.map((d) => d.id), [deliverables])
  const { data: linkedPosts = [] } = usePostsForDeliverables(deliverableIds)

  const postsByDeliverable = useMemo(() => {
    const map = {}
    for (const post of linkedPosts) {
      if (!post.deliverable_id) continue
      if (!map[post.deliverable_id]) map[post.deliverable_id] = []
      map[post.deliverable_id].push(post)
    }
    return map
  }, [linkedPosts])

  const deleteBrand = useDeleteBrand()
  const deleteCampaign = useDeleteCampaign()
  const deleteDeliverable = useDeleteDeliverable()

  const selectedBrand = brands.find((b) => b.id === selectedBrandId) ?? null
  const selectedCampaign = campaigns.find((c) => c.id === selectedCampaignId) ?? null

  function selectBrand(brandId) {
    setSelectedBrandId(brandId)
    setSelectedCampaignId(null)
  }

  function selectCampaign(campaignId) {
    setSelectedCampaignId(campaignId)
  }

  function openNewBrand() {
    setEditingBrand(null)
    setBrandFormOpen(true)
  }

  function openEditBrand(brand) {
    setEditingBrand(brand)
    setBrandFormOpen(true)
  }

  function closeBrandForm() {
    setBrandFormOpen(false)
    setEditingBrand(null)
  }

  function openNewCampaign() {
    setEditingCampaign(null)
    setCampaignFormOpen(true)
  }

  function openEditCampaign(campaign) {
    setEditingCampaign(campaign)
    setCampaignFormOpen(true)
  }

  function closeCampaignForm() {
    setCampaignFormOpen(false)
    setEditingCampaign(null)
  }

  function openNewDeliverable() {
    setEditingDeliverable(null)
    setDeliverableFormOpen(true)
  }

  function openEditDeliverable(deliverable) {
    setEditingDeliverable(deliverable)
    setDeliverableFormOpen(true)
  }

  function closeDeliverableForm() {
    setDeliverableFormOpen(false)
    setEditingDeliverable(null)
  }

  async function handleDeleteBrand() {
    if (!deleteBrandTarget) return
    await deleteBrand.mutateAsync(deleteBrandTarget.id)
    if (selectedBrandId === deleteBrandTarget.id) {
      setSelectedBrandId(null)
      setSelectedCampaignId(null)
    }
    setDeleteBrandTarget(null)
  }

  async function handleDeleteCampaign() {
    if (!deleteCampaignTarget) return
    await deleteCampaign.mutateAsync(deleteCampaignTarget.id)
    if (selectedCampaignId === deleteCampaignTarget.id) {
      setSelectedCampaignId(null)
    }
    setDeleteCampaignTarget(null)
  }

  async function handleDeleteDeliverable() {
    if (!deleteDeliverableTarget) return
    await deleteDeliverable.mutateAsync(deleteDeliverableTarget.id)
    setDeleteDeliverableTarget(null)
  }

  return (
    <AppShell title="Partnerships">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-charcoal">
            Partnerships
          </h2>
          <p className="mt-1 text-sm text-slate">Brands, campaigns, and deliverables</p>
        </div>
        <Button onClick={openNewBrand}>
          <Plus className="mr-1.5 h-4 w-4" aria-hidden="true" />
          New brand
        </Button>
      </div>

      {brandsLoading && <p className="mt-8 text-sm text-slate">Loading brands…</p>}

      {brandsError && (
        <div
          className="mt-8 rounded border border-coral/40 bg-coral/10 px-4 py-3 text-sm text-coral"
          role="alert"
        >
          {brandsError.message}
        </div>
      )}

      {!brandsLoading && !brandsError && brands.length === 0 && (
        <div className="mt-8 rounded-lg border border-dashed border-slate/30 px-6 py-12 text-center">
          <p className="text-sm text-slate">No brands yet. Add your first partnership.</p>
        </div>
      )}

      {!brandsLoading && brands.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Brands */}
          <section className="lg:col-span-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate">Brands</p>
            <ul className="divide-y divide-slate/20 rounded-lg border border-slate/20 bg-cream">
              {brands.map((brand) => {
                const statusMeta = BRAND_STATUSES_BY_VALUE[brand.status]
                const isSelected = brand.id === selectedBrandId

                return (
                  <li key={brand.id}>
                    {/* Mobile: stacked card */}
                    <div
                      className={`space-y-3 px-4 py-4 md:hidden ${isSelected ? 'bg-charcoal/5' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => selectBrand(brand.id)}
                          className="min-w-0 flex-1 text-left"
                        >
                          <CardField label="Brand">
                            <p className="font-semibold text-charcoal">{brand.name}</p>
                          </CardField>
                        </button>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditBrand(brand)}
                            className={iconButtonClass}
                            aria-label={`Edit ${brand.name}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteBrandTarget(brand)}
                            className={iconButtonDangerClass}
                            aria-label={`Delete ${brand.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                      <CardField label="Status">
                        {statusMeta ? (
                          <Badge color={BRAND_STATUS_COLORS[brand.status] ?? '#8E8E93'}>
                            {statusMeta.label}
                          </Badge>
                        ) : (
                          <span className="text-sm text-slate">—</span>
                        )}
                      </CardField>
                    </div>

                    {/* Desktop: horizontal row */}
                    <div
                      className={`hidden items-center gap-2 px-3 py-3 md:flex ${isSelected ? 'bg-charcoal/5' : ''}`}
                    >
                      <button
                        type="button"
                        onClick={() => selectBrand(brand.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <ChevronRight
                          className={`h-4 w-4 shrink-0 text-slate transition ${isSelected ? 'rotate-90' : ''}`}
                          aria-hidden="true"
                        />
                        <span className="truncate font-semibold text-charcoal">{brand.name}</span>
                        {statusMeta && (
                          <Badge color={BRAND_STATUS_COLORS[brand.status] ?? '#8E8E93'}>
                            {statusMeta.label}
                          </Badge>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditBrand(brand)}
                        className={iconButtonClass}
                        aria-label={`Edit ${brand.name}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteBrandTarget(brand)}
                        className={iconButtonDangerClass}
                        aria-label={`Delete ${brand.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {/* Campaigns */}
          <section className="lg:col-span-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate">
                {selectedBrand ? `${selectedBrand.name} — Campaigns` : 'Campaigns'}
              </p>
              {selectedBrand && (
                <Button size="sm" onClick={openNewCampaign}>
                  Add
                </Button>
              )}
            </div>

            {!selectedBrand && (
              <div className="rounded-lg border border-dashed border-slate/30 px-4 py-8 text-center">
                <p className="text-sm text-slate">Select a brand to view campaigns</p>
              </div>
            )}

            {selectedBrand && campaignsLoading && (
              <p className="text-sm text-slate">Loading campaigns…</p>
            )}

            {selectedBrand && !campaignsLoading && campaigns.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate/30 px-4 py-8 text-center">
                <p className="text-sm text-slate">No campaigns for this brand yet.</p>
              </div>
            )}

            {selectedBrand && campaigns.length > 0 && (
              <ul className="divide-y divide-slate/20 rounded-lg border border-slate/20 bg-cream">
                {campaigns.map((campaign) => {
                  const statusMeta = CAMPAIGN_STATUSES_BY_VALUE[campaign.status]
                  const paymentMeta = PAYMENT_STATUSES_BY_VALUE[campaign.payment_status]
                  const isSelected = campaign.id === selectedCampaignId

                  return (
                    <li key={campaign.id}>
                      {/* Mobile: stacked card */}
                      <div className={`space-y-3 px-4 py-4 md:hidden ${isSelected ? 'bg-charcoal/5' : ''}`}>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => selectCampaign(campaign.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <CardField label="Campaign">
                              <p className="font-semibold text-charcoal">{campaign.title}</p>
                            </CardField>
                          </button>
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditCampaign(campaign)}
                              className={iconButtonClass}
                              aria-label={`Edit ${campaign.title}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteCampaignTarget(campaign)}
                              className={iconButtonDangerClass}
                              aria-label={`Delete ${campaign.title}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <CardField label="Status">
                          <div className="flex flex-wrap gap-1.5">
                            {statusMeta && (
                              <Badge color={CAMPAIGN_STATUS_COLORS[campaign.status] ?? '#8E8E93'}>
                                {statusMeta.label}
                              </Badge>
                            )}
                            {paymentMeta && (
                              <Badge
                                color={campaign.payment_status === 'paid' ? '#1D9E75' : '#EF9F27'}
                              >
                                {paymentMeta.label}
                              </Badge>
                            )}
                            {campaign.disclosure_required && (
                              <Badge color="#FF5733">Disclosure</Badge>
                            )}
                          </div>
                        </CardField>
                        {(campaign.start_date || campaign.end_date) && (
                          <CardField label="Dates">
                            <p className="text-sm text-charcoal">
                              {campaign.start_date ?? '—'} → {campaign.end_date ?? '—'}
                            </p>
                          </CardField>
                        )}
                      </div>

                      {/* Desktop: horizontal row */}
                      <div className={`hidden px-3 py-3 md:block ${isSelected ? 'bg-charcoal/5' : ''}`}>
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() => selectCampaign(campaign.id)}
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="font-semibold text-charcoal">{campaign.title}</p>
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {statusMeta && (
                                <Badge
                                  color={CAMPAIGN_STATUS_COLORS[campaign.status] ?? '#8E8E93'}
                                >
                                  {statusMeta.label}
                                </Badge>
                              )}
                              {paymentMeta && (
                                <Badge
                                  color={
                                    campaign.payment_status === 'paid' ? '#1D9E75' : '#EF9F27'
                                  }
                                >
                                  {paymentMeta.label}
                                </Badge>
                              )}
                              {campaign.disclosure_required && (
                                <Badge color="#FF5733">Disclosure</Badge>
                              )}
                            </div>
                            {(campaign.start_date || campaign.end_date) && (
                              <p className="mt-1 text-xs text-slate">
                                {campaign.start_date ?? '—'} → {campaign.end_date ?? '—'}
                              </p>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditCampaign(campaign)}
                            className={iconButtonClass}
                            aria-label={`Edit ${campaign.title}`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteCampaignTarget(campaign)}
                            className={iconButtonDangerClass}
                            aria-label={`Delete ${campaign.title}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </section>

          {/* Deliverables */}
          <section className="lg:col-span-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-xs font-bold uppercase tracking-wider text-slate">
                {selectedCampaign ? `${selectedCampaign.title} — Deliverables` : 'Deliverables'}
              </p>
              {selectedCampaign && (
                <Button size="sm" onClick={openNewDeliverable}>
                  Add
                </Button>
              )}
            </div>

            {!selectedCampaign && (
              <div className="rounded-lg border border-dashed border-slate/30 px-4 py-8 text-center">
                <p className="text-sm text-slate">Select a campaign to view deliverables</p>
              </div>
            )}

            {selectedCampaign && deliverablesLoading && (
              <p className="text-sm text-slate">Loading deliverables…</p>
            )}

            {selectedCampaign && !deliverablesLoading && deliverables.length === 0 && (
              <div className="rounded-lg border border-dashed border-slate/30 px-4 py-8 text-center">
                <p className="text-sm text-slate">No deliverables yet for this campaign.</p>
              </div>
            )}

            {selectedCampaign && deliverables.length > 0 && (
              <ul className="space-y-3">
                {deliverables.map((deliverable) => (
                  <li key={deliverable.id}>
                    <DeliverableProgress
                      deliverable={deliverable}
                      linkedPosts={postsByDeliverable[deliverable.id] ?? []}
                      onEdit={() => openEditDeliverable(deliverable)}
                      onDelete={() => setDeleteDeliverableTarget(deliverable)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}

      <BrandForm open={brandFormOpen} onClose={closeBrandForm} brand={editingBrand} />

      <CampaignForm
        open={campaignFormOpen}
        onClose={closeCampaignForm}
        campaign={editingCampaign}
        brandId={selectedBrandId}
      />

      <DeliverableForm
        open={deliverableFormOpen}
        onClose={closeDeliverableForm}
        deliverable={editingDeliverable}
        campaignId={selectedCampaignId}
      />

      <Modal
        open={Boolean(deleteBrandTarget)}
        onClose={() => setDeleteBrandTarget(null)}
        title="Delete brand"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteBrandTarget(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteBrand} disabled={deleteBrand.isPending}>
              {deleteBrand.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-charcoal">
          Delete <span className="font-semibold">{deleteBrandTarget?.name}</span>? All campaigns
          and deliverables under this brand will also be removed.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleteCampaignTarget)}
        onClose={() => setDeleteCampaignTarget(null)}
        title="Delete campaign"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteCampaignTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCampaign}
              disabled={deleteCampaign.isPending}
            >
              {deleteCampaign.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-charcoal">
          Delete <span className="font-semibold">{deleteCampaignTarget?.title}</span>? All
          deliverables under this campaign will also be removed.
        </p>
      </Modal>

      <Modal
        open={Boolean(deleteDeliverableTarget)}
        onClose={() => setDeleteDeliverableTarget(null)}
        title="Delete deliverable"
        size="sm"
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="ghost" onClick={() => setDeleteDeliverableTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteDeliverable}
              disabled={deleteDeliverable.isPending}
            >
              {deleteDeliverable.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-charcoal">
          Delete this deliverable? Linked posts will be unlinked, not deleted.
        </p>
      </Modal>
    </AppShell>
  )
}
