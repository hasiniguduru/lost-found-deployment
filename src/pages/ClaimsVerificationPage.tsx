import React, { useEffect, useState, useCallback } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import {
  ItemReport,
  OwnershipClaim,
  claimsApi,
  itemsApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export const ClaimsVerificationPage: React.FC = () => {
  const { user, refreshNotifications } = useAuth();
  const [claims, setClaims] = useState<OwnershipClaim[]>([]);
  const [itemsMap, setItemsMap] = useState<Record<string, ItemReport>>({});
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [remarksByClaim, setRemarksByClaim] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadClaimsData = useCallback(async () => {
    setLoading(true);
    try {
      const [claimList, itemList] = await Promise.all([
        claimsApi.listClaims(),
        itemsApi.listItems(),
      ]);
      setClaims(claimList);
      const map: Record<string, ItemReport> = {};
      itemList.forEach((itm) => {
        map[itm.id] = itm;
      });
      setItemsMap(map);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClaimsData();
  }, [loadClaimsData]);

  const handleDecision = async (claimId: string, decision: 'APPROVED' | 'REJECTED') => {
    setProcessingId(claimId);
    try {
      const remarks =
        remarksByClaim[claimId] ||
        (decision === 'APPROVED'
          ? 'Verification answer and student ID matched. Approved for collection desk pickup.'
          : 'Submitted details did not match item verification record.');
      await claimsApi.verifyClaim(claimId, decision, remarks);
      await refreshNotifications();
      await loadClaimsData();
    } finally {
      setProcessingId(null);
    }
  };

  const handleHandover = async (claimId: string) => {
    setProcessingId(claimId);
    try {
      await claimsApi.completeHandover(claimId);
      await refreshNotifications();
      await loadClaimsData();
    } finally {
      setProcessingId(null);
    }
  };

  const filteredClaims = claims.filter((c) => {
    if (statusFilter === 'ALL') return true;
    return c.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Ownership Verification & Pickup Passes
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review ownership answers, approve claims to generate Pickup Pass Codes, and track item collection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-indigo-50 border border-indigo-100 rounded-xl shrink-0">
          {[
            { value: 'ALL', label: 'All Claims' },
            { value: 'PENDING_VERIFICATION', label: 'Pending Review' },
            { value: 'APPROVED', label: 'Pickup Ready' },
            { value: 'HANDED_OVER', label: 'Collected' },
            { value: 'REJECTED', label: 'Declined' },
          ].map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                statusFilter === tab.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-indigo-800 hover:bg-white/70'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Claims Cards */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 bg-white border border-indigo-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredClaims.length === 0 ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-12 text-center">
          <h3 className="font-display text-base font-bold text-slate-900">
            No Claims in This View
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Switch the filter tab above or claim an item from the Browse Lost & Found page.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {filteredClaims.map((claim) => {
            const linkedItem = itemsMap[claim.itemId];
            return (
              <article
                key={claim.id}
                className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-xs space-y-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 font-mono tabular-nums">
                      <span className="font-bold text-indigo-700">{claim.claimCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>Item {claim.itemReferenceCode}</span>
                      <span aria-hidden="true">·</span>
                      <span>Submitted {new Date(claim.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h2 className="font-display text-lg font-bold text-slate-900">
                      {claim.itemTitle}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-bold shrink-0">
                    {claim.status === 'PENDING_VERIFICATION' && (
                      <span className="inline-flex items-center gap-1.5 text-amber-600">
                        <Clock className="w-4 h-4" />
                        <span>Awaiting Verification</span>
                      </span>
                    )}
                    {claim.status === 'APPROVED' && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Approved · Pickup Pass {claim.pickupPassCode}</span>
                      </span>
                    )}
                    {claim.status === 'HANDED_OVER' && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-700">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>Collected by Owner</span>
                      </span>
                    )}
                    {claim.status === 'REJECTED' && (
                      <span className="inline-flex items-center gap-1.5 text-rose-600">
                        <XCircle className="w-4 h-4" />
                        <span>Claim Declined</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Comparison Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
                  <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-2.5">
                    <div className="font-bold text-amber-950">
                      Security Verification Question & Location
                    </div>
                    <div>
                      <span className="text-slate-600">Question: </span>
                      <span className="text-slate-900 font-semibold">
                        {linkedItem?.verificationQuestion ||
                          'Provide identifying serial number or key stamp number'}
                      </span>
                    </div>
                    {(user?.role === 'ADMIN_SECURITY' || user?.role === 'FINDER') &&
                      linkedItem?.expectedVerificationHint && (
                        <div>
                          <span className="text-slate-600">Expected Answer: </span>
                          <span className="font-mono text-indigo-900 font-bold">
                            {linkedItem.expectedVerificationHint}
                          </span>
                        </div>
                      )}
                    <div className="flex items-center gap-1.5 pt-1 text-teal-900">
                      <Building2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                      <span>
                        Submitted Collection Desk:{' '}
                        <strong>
                          {claim.collectionHubName || linkedItem?.hubName || 'Security Desk 1'}
                        </strong>{' '}
                        ({claim.lockerBin || linkedItem?.lockerBin || 'Bin S1-09'})
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2.5">
                    <div className="font-bold text-indigo-950">
                      Claimant Answer & Proof of Ownership
                    </div>
                    <div>
                      <span className="text-slate-500">Claimant: </span>
                      <span className="text-slate-900 font-semibold">{claim.claimantName}</span> ·{' '}
                      <span className="font-mono tabular-nums text-indigo-700">
                        {claim.claimantCampusId}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Submitted Answer: </span>
                      <span className="text-slate-900 font-semibold">
                        "{claim.verificationAnswer}"
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500">Supporting Proof: </span>
                      <span className="text-slate-800">{claim.proofDescription}</span>
                    </div>
                    <div className="font-mono tabular-nums text-slate-600">
                      Serial / ID Tag: {claim.serialOrIdNumber}
                    </div>
                  </div>
                </div>

                {/* Action Footer */}
                {claim.status === 'PENDING_VERIFICATION' ? (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                    <input
                      type="text"
                      value={remarksByClaim[claim.id] || ''}
                      onChange={(e) =>
                        setRemarksByClaim((prev) => ({
                          ...prev,
                          [claim.id]: e.target.value,
                        }))
                      }
                      placeholder="Add verification note or pickup instructions..."
                      className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-indigo-600"
                    />
                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={processingId === claim.id}
                        onClick={() => handleDecision(claim.id, 'REJECTED')}
                        className="px-4 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 whitespace-nowrap shrink-0"
                      >
                        Decline Claim
                      </button>
                      <button
                        type="button"
                        disabled={processingId === claim.id}
                        onClick={() => handleDecision(claim.id, 'APPROVED')}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-xs whitespace-nowrap shrink-0"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve & Issue Pickup Pass</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="text-slate-600">
                      <span className="font-semibold text-slate-900">
                        Verified by {claim.reviewedByOfficer || 'Campus Security'}:
                      </span>{' '}
                      {claim.officerRemarks}
                    </div>

                    {claim.status === 'APPROVED' && (
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="font-mono font-bold text-indigo-700 tabular-nums">
                          Pickup Pass: {claim.pickupPassCode}
                        </span>
                        <button
                          type="button"
                          disabled={processingId === claim.id}
                          onClick={() => handleHandover(claim.id)}
                          className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 whitespace-nowrap shrink-0"
                        >
                          Confirm Item Collected
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
