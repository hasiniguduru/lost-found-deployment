import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Search,
  RotateCcw,
  ShieldCheck,
  Building2,
  Plus,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import {
  CAMPUS_ZONES,
  CollectionHub,
  ItemReport,
  OwnershipClaim,
  claimsApi,
  hubsApi,
  itemsApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResilientImage } from '../components/ResilientImage';
import { ClaimSubmissionModal } from '../components/ClaimSubmissionModal';

export const ItemRegistryPage: React.FC = () => {
  const { user, refreshNotifications } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [items, setItems] = useState<ItemReport[]>([]);
  const [hubs, setHubs] = useState<CollectionHub[]>([]);
  const [claimsByItemId, setClaimsByItemId] = useState<Record<string, OwnershipClaim[]>>({});
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [campusZoneFilter, setCampusZoneFilter] = useState<string>('ALL');
  const [hubFilter, setHubFilter] = useState<string>('ALL');
  const [custodyFilter, setCustodyFilter] = useState<string>('ALL');

  const [selectedItemForClaim, setSelectedItemForClaim] = useState<ItemReport | null>(null);
  const [intakeItem, setIntakeItem] = useState<ItemReport | null>(null);
  const [selectedIntakeHubId, setSelectedIntakeHubId] = useState<string>('hub-sec-01');
  const [selectedIntakeBin, setSelectedIntakeBin] = useState<string>('Bin S1-10');
  const [intakeSubmitting, setIntakeSubmitting] = useState(false);

  const isMyReport = useCallback(
    (itm: ItemReport) => {
      if (!user) return false;
      return (
        itm.reportedByUserId === user.id ||
        (Boolean(user.campusId) &&
          itm.reportedByCampusId?.toLowerCase() === user.campusId.toLowerCase()) ||
        (Boolean(user.fullName) &&
          itm.reportedByName?.toLowerCase() === user.fullName.toLowerCase())
      );
    },
    [user]
  );

  const fetchRegistry = useCallback(async () => {
    setLoading(true);
    try {
      const apiTypeParam =
        typeFilter === 'LOST' || typeFilter === 'MY_LOST'
          ? 'LOST'
          : typeFilter === 'FOUND' || typeFilter === 'MY_FOUND'
          ? 'FOUND'
          : 'ALL';

      const [fetchedItems, fetchedHubs, fetchedClaims] = await Promise.all([
        itemsApi.listItems({
          type: apiTypeParam,
          category: categoryFilter,
          campusZone: campusZoneFilter,
          hubId: hubFilter,
          custodyStatus: custodyFilter,
          search: searchQuery,
        }),
        hubsApi.listHubs(),
        claimsApi.listClaims(),
      ]);

      const claimMap: Record<string, OwnershipClaim[]> = {};
      fetchedClaims.forEach((c) => {
        if (!claimMap[c.itemId]) claimMap[c.itemId] = [];
        claimMap[c.itemId].push(c);
      });
      setClaimsByItemId(claimMap);

      let filtered = fetchedItems;
      if (
        typeFilter === 'MY_ALL' ||
        typeFilter === 'MY_LOST' ||
        typeFilter === 'MY_FOUND'
      ) {
        filtered = fetchedItems.filter((itm) => isMyReport(itm));
      }

      setItems(filtered);
      setHubs(fetchedHubs);
    } finally {
      setLoading(false);
    }
  }, [
    typeFilter,
    categoryFilter,
    campusZoneFilter,
    hubFilter,
    custodyFilter,
    searchQuery,
    isMyReport,
  ]);

  useEffect(() => {
    fetchRegistry();
  }, [fetchRegistry]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
    setCampusZoneFilter('ALL');
    setHubFilter('ALL');
    setCustodyFilter('ALL');
  };

  const handleConfirmCustodyIntake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intakeItem) return;
    setIntakeSubmitting(true);
    try {
      await itemsApi.confirmCustodyIntake(
        intakeItem.id,
        selectedIntakeHubId,
        selectedIntakeBin
      );
      await refreshNotifications();
      setIntakeItem(null);
      await fetchRegistry();
    } finally {
      setIntakeSubmitting(false);
    }
  };

  const categories = [
    'ALL',
    'Electronics',
    'Campus ID & Keys',
    'Textbooks & Lab Gear',
    'Apparel & Bags',
    'Personal Accessories',
  ];

  const campusZones = ['ALL', ...CAMPUS_ZONES];

  const formatCustodyText = (status: ItemReport['custodyStatus']) => {
    switch (status) {
      case 'REPORTED':
        return 'Reported Missing';
      case 'AWAITING_SUBMISSION':
        return 'Awaiting Desk Drop-off';
      case 'IN_CUSTODY':
        return 'Submitted at Collection Desk';
      case 'CLAIM_APPROVED':
        return 'Verified as Theirs · Ready for Pickup';
      case 'RETURNED':
        return 'Returned to Owner';
    }
  };

  const getStepIndex = (item: ItemReport, itemClaims: OwnershipClaim[]) => {
    const hasApprovedClaim = itemClaims.some(
      (c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER'
    );
    if (
      item.custodyStatus === 'RETURNED' ||
      itemClaims.some((c) => c.status === 'HANDED_OVER')
    ) {
      return 4;
    }
    if (item.custodyStatus === 'CLAIM_APPROVED' || hasApprovedClaim) {
      return 3;
    }
    if (item.custodyStatus === 'IN_CUSTODY' || Boolean(item.hubName)) {
      return 2;
    }
    return 1;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Browse Lost & Found Items
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Search across campus buildings, view items you reported (lost or found), and check verification progress across Security Desk 1, Security Desk 2, and Administration Block
          </p>
        </div>
      </div>

      {/* Colorful Filter Bar */}
      <section className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-indigo-50 rounded-xl">
            {[
              { value: 'ALL', label: 'All Items' },
              { value: 'LOST', label: 'Lost Items' },
              { value: 'FOUND', label: 'Found Items' },
              { value: 'MY_ALL', label: 'My Reported Items' },
              { value: 'MY_LOST', label: 'My Lost Reports' },
              { value: 'MY_FOUND', label: 'My Found Reports' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setTypeFilter(tab.value)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                  typeFilter === tab.value
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-800 hover:bg-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name, tracking code, or building..."
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-indigo-200 rounded-xl focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-100">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'ALL' ? 'All Categories' : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Campus Building / Zone
            </label>
            <select
              value={campusZoneFilter}
              onChange={(e) => setCampusZoneFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800"
            >
              {campusZones.map((zone) => (
                <option key={zone} value={zone}>
                  {zone === 'ALL' ? 'All Campus Zones' : zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Collection Desk
            </label>
            <select
              value={hubFilter}
              onChange={(e) => setHubFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800"
            >
              <option value="ALL">All 3 Collection Desks</option>
              {hubs.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">
              Item Progress / Status
            </label>
            <div className="flex items-center gap-2">
              <select
                value={custodyFilter}
                onChange={(e) => setCustodyFilter(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="REPORTED">Reported Missing</option>
                <option value="IN_CUSTODY">Submitted at Collection Desk</option>
                <option value="CLAIM_APPROVED">Verified · Ready for Pickup</option>
                <option value="RETURNED">Returned to Owner</option>
              </select>
              <button
                type="button"
                onClick={handleResetFilters}
                title="Reset filters"
                className="p-2 text-indigo-600 hover:bg-indigo-50 border border-indigo-200 rounded-xl bg-white"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Item Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-80 bg-white border border-indigo-100 rounded-2xl p-4 animate-pulse"
            />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-12 text-center max-w-lg mx-auto my-6">
          <h3 className="font-display text-base font-bold text-slate-900">
            No Matching Items Found
          </h3>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            No lost or found items matched your current search filters. Try resetting the filters or report a new item.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
            >
              Reset Filters
            </button>
            <button
              type="button"
              onClick={() => navigate('/report')}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              <span>Report an Item</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const itemClaims = claimsByItemId[item.id] || [];
            const approvedClaim = itemClaims.find(
              (c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER'
            );
            const pendingClaim = itemClaims.find(
              (c) => c.status === 'PENDING_VERIFICATION'
            );
            const stepIdx = getStepIndex(item, itemClaims);
            const reportedByMe = isMyReport(item);

            return (
              <article
                key={item.id}
                className="bg-white border border-indigo-100 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="aspect-4/3 w-full bg-slate-100 border-b border-slate-100 overflow-hidden relative">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                    />
                    {reportedByMe && (
                      <span className="absolute top-3 right-3 px-2.5 py-1 text-[11px] font-bold bg-indigo-600 text-white rounded-lg shadow-xs">
                        Reported by You
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-3">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          item.type === 'LOST'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span className="font-mono tabular-nums text-indigo-700 font-medium">
                        {item.referenceCode}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600">{item.category}</span>
                    </div>

                    <h2 className="font-display text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h2>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {/* Where the Found Item Was Submitted */}
                    {(item.type === 'FOUND' || item.hubName) && (
                      <div className="p-3 bg-teal-50/90 border border-teal-200 rounded-xl text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-teal-950">
                          <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                          <span>
                            Submitted to: {item.hubName || 'Security Desk 1'}
                          </span>
                        </div>
                        <div className="text-teal-800 flex items-center justify-between">
                          <span>
                            Locker Bin:{' '}
                            <strong className="font-mono">
                              {item.lockerBin || 'Bin S1-01'}
                            </strong>
                          </span>
                          {item.submissionReceiptCode && (
                            <span className="font-mono text-[11px] font-semibold">
                              {item.submissionReceiptCode}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 4-Step Item Progress Bar */}
                    <div className="grid grid-cols-4 gap-1 text-[10px]">
                      {[
                        { step: 1, label: 'Reported' },
                        { step: 2, label: 'At Desk' },
                        { step: 3, label: 'Verified' },
                        { step: 4, label: 'Returned' },
                      ].map((s) => {
                        const active = stepIdx >= s.step;
                        return (
                          <div
                            key={s.step}
                            className={`py-1 px-1.5 rounded-md font-bold text-center truncate border ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-slate-50 text-slate-400 border-slate-200'
                            }`}
                          >
                            {s.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification Status & Details */}
                    <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-1.5">
                      <div>
                        <span className="text-slate-400">Location:</span>{' '}
                        <span className="text-slate-800 font-medium">{item.campusZone}</span> ·{' '}
                        <span>{item.specificLocation}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Reported By:</span>{' '}
                        <span className="text-slate-800 font-medium">
                          {item.reportedByName} ({item.reportedByCampusId})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>{' '}
                        <span className="text-indigo-700 font-semibold">
                          {formatCustodyText(item.custodyStatus)}
                        </span>
                      </div>

                      {approvedClaim ? (
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-0.5 mt-1">
                          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>
                              Verified as Theirs: {approvedClaim.claimantName} ({approvedClaim.claimantCampusId})
                            </span>
                          </div>
                          <div className="text-[11px] text-emerald-800">
                            Pickup Pass: <strong className="font-mono">{approvedClaim.pickupPassCode}</strong> · Desk:{' '}
                            <strong>{approvedClaim.collectionHubName || item.hubName || 'Security Desk 1'}</strong>
                          </div>
                        </div>
                      ) : pendingClaim ? (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-950 space-y-0.5 mt-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-800">
                            <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              Claim Submitted by {pendingClaim.claimantName} ({pendingClaim.claimantCampusId})
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-800">
                            Awaiting verification review
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500">
                          Verification: No ownership claim verified yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-indigo-50/40 border-t border-indigo-100/80 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-mono tabular-nums truncate">
                    {item.dateOccurred}
                  </span>

                  <div className="flex items-center gap-2 shrink-0">
                    {(user?.role === 'ADMIN_SECURITY' || user?.role === 'FINDER') &&
                      item.custodyStatus === 'REPORTED' && (
                        <button
                          type="button"
                          onClick={() => {
                            setIntakeItem(item);
                            setSelectedIntakeHubId(item.hubId || 'hub-sec-01');
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg hover:bg-teal-100 whitespace-nowrap shrink-0"
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span>Check In at Desk</span>
                        </button>
                      )}

                    {item.custodyStatus !== 'RETURNED' && (
                      <button
                        type="button"
                        onClick={() => setSelectedItemForClaim(item)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 whitespace-nowrap shrink-0"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>
                          {item.type === 'FOUND' ? 'Claim Ownership' : 'I Found This'}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <ClaimSubmissionModal
        item={selectedItemForClaim}
        onClose={() => setSelectedItemForClaim(null)}
        onSuccess={fetchRegistry}
      />

      {intakeItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="bg-white border border-indigo-100 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="font-display text-lg font-bold text-slate-900">
              Submit Item to Campus Collection Desk
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Assign <span className="font-semibold">{intakeItem.title}</span> to Security Desk 1, Security Desk 2, or Administration Block.
            </p>
            <form onSubmit={handleConfirmCustodyIntake} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Collection Desk Location
                </label>
                <select
                  value={selectedIntakeHubId}
                  onChange={(e) => setSelectedIntakeHubId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white"
                >
                  {hubs.map((h) => (
                    <option key={h.id} value={h.id}>
                      {h.name} ({h.roomLocation})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-800 mb-1">
                  Locker / Bin Number
                </label>
                <input
                  type="text"
                  value={selectedIntakeBin}
                  onChange={(e) => setSelectedIntakeBin(e.target.value)}
                  placeholder="e.g., Bin S1-14"
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-xl"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIntakeItem(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={intakeSubmitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700"
                >
                  {intakeSubmitting ? 'Saving...' : 'Confirm Desk Drop-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
