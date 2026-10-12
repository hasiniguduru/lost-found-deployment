import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  CheckCircle2,
  ShieldCheck,
  PlusCircle,
  Search,
  Clock,
} from 'lucide-react';
import {
  CollectionHub,
  OwnershipClaim,
  claimsApi,
  hubsApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResilientImage } from '../components/ResilientImage';

export const CollectionHubsPage: React.FC = () => {
  const { user, refreshNotifications } = useAuth();
  const navigate = useNavigate();

  const [hubs, setHubs] = useState<CollectionHub[]>([]);
  const [approvedClaims, setApprovedClaims] = useState<OwnershipClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedHubId, setSelectedHubId] = useState<string>('ALL');
  const [pickupCodeSearch, setPickupCodeSearch] = useState<string>('');
  const [handoverProcessingId, setHandoverProcessingId] = useState<string | null>(null);

  const loadHubsAndPickups = useCallback(async () => {
    setLoading(true);
    try {
      const [hubList, claimList] = await Promise.all([
        hubsApi.listHubs(),
        claimsApi.listClaims(),
      ]);
      setHubs(hubList);
      setApprovedClaims(
        claimList.filter((c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER')
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHubsAndPickups();
  }, [loadHubsAndPickups]);

  const handleCompleteHandover = async (claimId: string) => {
    setHandoverProcessingId(claimId);
    try {
      await claimsApi.completeHandover(claimId);
      await refreshNotifications();
      await loadHubsAndPickups();
    } finally {
      setHandoverProcessingId(null);
    }
  };

  const visibleHubs =
    selectedHubId === 'ALL'
      ? hubs
      : hubs.filter((h) => h.id === selectedHubId);

  const filteredPickups = approvedClaims.filter((c) => {
    if (!pickupCodeSearch.trim()) return true;
    const q = pickupCodeSearch.trim().toLowerCase();
    return (
      (c.pickupPassCode && c.pickupPassCode.toLowerCase().includes(q)) ||
      c.claimantName.toLowerCase().includes(q) ||
      c.claimantCampusId.toLowerCase().includes(q) ||
      c.itemReferenceCode.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Fixed Campus Collection Desks
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Drop off found belongings or pick up verified lost items at Security Desk 1, Security Desk 2, or the Administration Block
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/report?mode=FOUND')}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-teal-600 rounded-xl hover:bg-teal-700 shadow-xs whitespace-nowrap shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Turn In a Found Item</span>
        </button>
      </div>

      {/* Desk Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-teal-50 border border-teal-100 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setSelectedHubId('ALL')}
          className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            selectedHubId === 'ALL'
              ? 'bg-teal-600 text-white shadow-xs'
              : 'text-teal-900 hover:bg-white/70'
          }`}
        >
          All 3 Collection Desks
        </button>
        {hubs.map((hub) => (
          <button
            key={hub.id}
            type="button"
            onClick={() => setSelectedHubId(hub.id)}
            className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              selectedHubId === hub.id
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-teal-900 hover:bg-white/70'
            }`}
          >
            {hub.name}
          </button>
        ))}
      </div>

      {/* Fixed Collection Hubs Grid */}
      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-64 bg-white border border-teal-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {visibleHubs.map((hub) => {
            const itemsInCustody = hub.custodyItems || [];
            return (
              <section
                key={hub.id}
                className="bg-white border border-teal-100 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between"
              >
                <div className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 mt-0.5">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-teal-700">
                          {hub.building}
                        </div>
                        <h2 className="font-display text-lg font-bold text-slate-900">
                          {hub.name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {hub.roomLocation} · {hub.contactExt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-mono text-lg font-bold text-teal-700 tabular-nums">
                        {hub.occupiedBins}/{hub.totalBins}
                      </div>
                      <div className="text-[11px] text-slate-500">Lockers Used</div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span>{hub.operatingHours}</span>
                    <span aria-hidden="true">·</span>
                    <span>Officer on Duty: <strong className="text-slate-800">{hub.dutyOfficer}</strong></span>
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-xs font-bold text-slate-800">
                      Items Currently Held at This Desk ({itemsInCustody.length})
                    </div>
                    {itemsInCustody.length === 0 ? (
                      <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500">
                        No items currently waiting at this desk.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                        {itemsInCustody.map((itm) => (
                          <div
                            key={itm.id}
                            className="p-3 flex items-center justify-between gap-3 text-xs hover:bg-teal-50/30"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100">
                                <ResilientImage
                                  src={itm.imageUrl}
                                  alt={itm.title}
                                  category={itm.category}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="font-semibold text-slate-900 truncate">
                                  {itm.title}
                                </div>
                                <div className="text-slate-500 font-mono tabular-nums">
                                  {itm.lockerBin || 'Locker Assigned'} · {itm.referenceCode}
                                </div>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                navigate(`/items?search=${encodeURIComponent(itm.referenceCode)}`)
                              }
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg whitespace-nowrap shrink-0"
                            >
                              View Item
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Fixed Collection Handover & Pickup Pass Check-Out */}
      <section className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-indigo-100 bg-indigo-50/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-bold text-slate-900">
              Pickup Pass Check-Out Desk
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Present your approved Pickup Pass Code and University ID to sign out your item
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-indigo-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={pickupCodeSearch}
              onChange={(e) => setPickupCodeSearch(e.target.value)}
              placeholder="Search Pickup Pass (PKP-...) or Name"
              className="w-full pl-9 pr-3 py-2 text-xs font-mono bg-white border border-indigo-200 rounded-xl focus:border-indigo-600"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-5">Pickup Pass Code</th>
                <th className="py-3.5 px-5">Verified Owner</th>
                <th className="py-3.5 px-5">Item</th>
                <th className="py-3.5 px-5">Collection Desk & Locker</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredPickups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No approved pickup passes matching your search.
                  </td>
                </tr>
              ) : (
                filteredPickups.map((claim) => (
                  <tr key={claim.id} className="hover:bg-indigo-50/30">
                    <td className="py-4 px-5 font-mono font-bold text-indigo-700 tabular-nums whitespace-nowrap">
                      {claim.pickupPassCode || 'PENDING'}
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">{claim.claimantName}</div>
                      <div className="font-mono text-slate-500 tabular-nums">
                        {claim.claimantCampusId}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-semibold text-slate-900">{claim.itemTitle}</div>
                      <div className="font-mono text-slate-500 tabular-nums">
                        {claim.itemReferenceCode}
                      </div>
                    </td>
                    <td className="py-4 px-5">
                      <div className="font-medium text-teal-800">
                        {claim.collectionHubName}
                      </div>
                      <div className="font-mono text-slate-500 tabular-nums">
                        {claim.lockerBin}
                      </div>
                    </td>
                    <td className="py-4 px-5 whitespace-nowrap">
                      {claim.status === 'HANDED_OVER' ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Collected by Owner</span>
                        </span>
                      ) : (
                        <span className="font-semibold text-amber-600">
                          Ready for Pickup
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right whitespace-nowrap">
                      {claim.status === 'APPROVED' ? (
                        <button
                          type="button"
                          disabled={handoverProcessingId === claim.id}
                          onClick={() => handleCompleteHandover(claim.id)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 whitespace-nowrap"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>
                            {handoverProcessingId === claim.id
                              ? 'Completing...'
                              : user?.role === 'ADMIN_SECURITY'
                              ? 'Confirm Desk Handover'
                              : 'Collect Item Now'}
                          </span>
                        </button>
                      ) : (
                        <span className="text-slate-400 font-medium">Completed</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
