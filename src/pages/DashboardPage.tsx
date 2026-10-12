import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  PackageSearch,
  Plus,
} from 'lucide-react';
import {
  ItemReport,
  OwnershipClaim,
  claimsApi,
  dashboardApi,
  itemsApi,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ResilientImage } from '../components/ResilientImage';
import { ClaimSubmissionModal } from '../components/ClaimSubmissionModal';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalReports: 0,
    lostCount: 0,
    foundCount: 0,
    inCustodyCount: 0,
    returnedCount: 0,
    pendingClaimsCount: 0,
    approvedPickupsCount: 0,
  });
  const [recentItems, setRecentItems] = useState<ItemReport[]>([]);
  const [allItems, setAllItems] = useState<ItemReport[]>([]);
  const [claimsByItemId, setClaimsByItemId] = useState<Record<string, OwnershipClaim[]>>({});
  const [myReportFilter, setMyReportFilter] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');
  const [selectedItemForClaim, setSelectedItemForClaim] = useState<ItemReport | null>(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [data, itemList, claimList] = await Promise.all([
        dashboardApi.getSummary(),
        itemsApi.listItems(),
        claimsApi.listClaims(),
      ]);
      setMetrics(data.metrics);
      setRecentItems(data.recentItems.slice(0, 3));
      setAllItems(itemList);

      const claimMap: Record<string, OwnershipClaim[]> = {};
      claimList.forEach((c) => {
        if (!claimMap[c.itemId]) claimMap[c.itemId] = [];
        claimMap[c.itemId].push(c);
      });
      setClaimsByItemId(claimMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard, user?.role]);

  const myReportedItems = allItems.filter(
    (itm) =>
      user &&
      (itm.reportedByUserId === user.id ||
        (user.campusId &&
          itm.reportedByCampusId?.toLowerCase() === user.campusId.toLowerCase()) ||
        (user.fullName &&
          itm.reportedByName?.toLowerCase() === user.fullName.toLowerCase()))
  );

  const myLostItems = myReportedItems.filter((i) => i.type === 'LOST');
  const myFoundItems = myReportedItems.filter((i) => i.type === 'FOUND');

  const filteredMyReports = myReportedItems.filter((i) => {
    if (myReportFilter === 'ALL') return true;
    return i.type === myReportFilter;
  });

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

  const getRoleWelcome = () => {
    if (user?.role === 'ADMIN_SECURITY') {
      return {
        greeting: `Welcome, ${user.fullName}`,
        subtitle: 'Campus Safety & Collection Desk Coordinator',
        description:
          'Review student ownership claims, issue pickup pass codes, and manage items stored at Security Desk 1, Security Desk 2, and Administration Block.',
      };
    }
    if (user?.role === 'FINDER') {
      return {
        greeting: `Welcome back, ${user.fullName}`,
        subtitle: 'Campus Finder & Community Reporter',
        description:
          'Found something on campus? Report the item here, submit it to Security Desk 1, Security Desk 2, or Administration Block, and track when the owner verifies it.',
      };
    }
    return {
      greeting: `Welcome back, ${user?.fullName || 'Student'}`,
      subtitle: `${user?.department || 'Campus Member'} · ID ${user?.campusId || ''}`,
      description:
        'Track items you have reported lost or found, see whether someone has verified your reported item as theirs, or browse items held at our 3 Collection Desks.',
    };
  };

  const welcome = getRoleWelcome();

  const formatStatusLabel = (status: ItemReport['custodyStatus']) => {
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

  return (
    <div className="space-y-8">
      {/* Colorful Hero Banner */}
      <section className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-700 text-white rounded-2xl p-7 sm:p-8 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <div className="text-xs font-semibold text-amber-300 tracking-wide">
            {welcome.subtitle}
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-white">
            {welcome.greeting}
          </h1>
          <p className="text-sm text-indigo-100 leading-relaxed">
            {welcome.description}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-indigo-950 bg-white rounded-xl hover:bg-indigo-50 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <Search className="w-4 h-4 text-indigo-600" />
            <span>Browse All Items</span>
          </button>
          <button
            type="button"
            onClick={() =>
              navigate(
                user?.role === 'FINDER'
                  ? '/report?mode=FOUND'
                  : user?.role === 'ADMIN_SECURITY'
                  ? '/claims'
                  : '/report?mode=LOST'
              )
            }
            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded-xl hover:bg-amber-300 transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <span>
              {user?.role === 'FINDER'
                ? 'Submit Found Item'
                : user?.role === 'ADMIN_SECURITY'
                ? 'Review Pending Claims'
                : 'Report Lost Item'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* 4 Colorful Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Total Campus Reports
            </div>
            <div className="font-mono text-3xl font-bold text-indigo-700 tabular-nums mt-2">
              {loading ? '—' : metrics.totalReports}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              {metrics.lostCount} Lost · {metrics.foundCount} Found
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <PackageSearch className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-teal-100 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              At Collection Desks
            </div>
            <div className="font-mono text-3xl font-bold text-teal-700 tabular-nums mt-2">
              {loading ? '—' : metrics.inCustodyCount}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              Security Desk 1 & 2 · Admin Block
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-amber-100 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Pending Verifications
            </div>
            <div className="font-mono text-3xl font-bold text-amber-600 tabular-nums mt-2">
              {loading ? '—' : metrics.pendingClaimsCount}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              {metrics.approvedPickupsCount} Verified & Pickup Ready
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white border border-emerald-100 rounded-2xl p-5 shadow-xs flex items-start justify-between">
          <div>
            <div className="text-xs font-semibold text-slate-500">
              Successfully Returned
            </div>
            <div className="font-mono text-3xl font-bold text-emerald-600 tabular-nums mt-2">
              {loading ? '—' : metrics.returnedCount}
            </div>
            <div className="text-xs text-slate-500 mt-1.5 font-medium">
              Verified Campus Owners
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* My Reported Items (Lost & Found) & Live Progress Tracker */}
      <section className="bg-white border border-indigo-100 rounded-2xl p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              My Reported Items (Lost & Found) & Verification Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              See all items you have reported lost or found, where found items were submitted, and whether somebody has verified an item as theirs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-indigo-50 rounded-xl shrink-0">
            {[
              { id: 'ALL', label: `All My Reports (${myReportedItems.length})` },
              { id: 'LOST', label: `My Lost Items (${myLostItems.length})` },
              { id: 'FOUND', label: `My Found Items (${myFoundItems.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMyReportFilter(tab.id as 'ALL' | 'LOST' | 'FOUND')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  myReportFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-indigo-800 hover:bg-white/70'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {filteredMyReports.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-slate-200/70 space-y-3">
            <div className="text-sm font-bold text-slate-800">
              No {myReportFilter === 'ALL' ? '' : myReportFilter.toLowerCase()} items reported under your account yet
            </div>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              When you report a lost item or submit a found item to Security Desk 1, Security Desk 2, or Administration Block, its live progress and verification status will appear right here.
            </p>
            <div className="flex items-center justify-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => navigate('/report?mode=LOST')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-amber-900 bg-amber-100 rounded-xl hover:bg-amber-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Lost Item</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/report?mode=FOUND')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Report Found Item</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredMyReports.map((item) => {
              const itemClaims = claimsByItemId[item.id] || [];
              const approvedClaim = itemClaims.find(
                (c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER'
              );
              const pendingClaim = itemClaims.find(
                (c) => c.status === 'PENDING_VERIFICATION'
              );
              const stepIdx = getStepIndex(item, itemClaims);

              return (
                <div
                  key={item.id}
                  className="p-5 rounded-2xl border border-indigo-100 bg-slate-50/50 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${
                              item.type === 'LOST'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {item.type === 'LOST' ? 'LOST ITEM REPORT' : 'FOUND ITEM REPORT'}
                          </span>
                          <span className="font-mono text-xs font-bold text-indigo-700">
                            {item.referenceCode}
                          </span>
                          <span className="text-xs text-slate-500">· {item.category}</span>
                        </div>
                        <h3 className="font-display text-base font-bold text-slate-900">
                          {item.title}
                        </h3>
                        <p className="text-xs text-slate-600">
                          Location: <span className="font-medium text-slate-800">{item.campusZone}</span> · {item.specificLocation}
                        </p>
                      </div>
                      <div className="w-20 h-16 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0">
                        <ResilientImage
                          src={item.imageUrl}
                          alt={item.title}
                          category={item.category}
                        />
                      </div>
                    </div>

                    {/* Where the Found Item Was Submitted */}
                    {(item.type === 'FOUND' || item.hubName) && (
                      <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-teal-950">
                          <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                          <span>
                            Submitted to:{' '}
                            <strong className="text-teal-900">
                              {item.hubName || 'Security Desk 1'}
                            </strong>
                            {item.lockerBin ? ` (${item.lockerBin})` : ''}
                          </span>
                        </div>
                        {item.submissionReceiptCode && (
                          <span className="font-mono font-bold text-teal-800">
                            Receipt: {item.submissionReceiptCode}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 4-Step Progress Bar */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
                      {[
                        { step: 1, label: '1. Reported' },
                        {
                          step: 2,
                          label: item.hubName ? `2. ${item.hubName}` : '2. At Desk',
                        },
                        {
                          step: 3,
                          label: approvedClaim
                            ? '3. Verified ✓'
                            : pendingClaim
                            ? '3. Claim Pending'
                            : '3. Verification',
                        },
                        { step: 4, label: '4. Returned' },
                      ].map((s) => {
                        const active = stepIdx >= s.step;
                        return (
                          <div
                            key={s.step}
                            className={`px-2.5 py-1.5 rounded-lg border font-semibold text-center truncate ${
                              active
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-slate-400 border-slate-200'
                            }`}
                          >
                            {s.label}
                          </div>
                        );
                      })}
                    </div>

                    {/* Verification Status Box */}
                    <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs">
                      {approvedClaim ? (
                        <div className="flex items-start gap-2 text-emerald-900">
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-emerald-800">
                              Verified as Theirs by {approvedClaim.claimantName} ({approvedClaim.claimantCampusId})
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              Pickup Pass:{' '}
                              <span className="font-mono font-bold text-indigo-700">
                                {approvedClaim.pickupPassCode}
                              </span>{' '}
                              · Pickup Desk:{' '}
                              <span className="font-semibold">
                                {approvedClaim.collectionHubName || item.hubName || 'Security Desk 1'}
                              </span>
                              {approvedClaim.status === 'HANDED_OVER'
                                ? ' · Collected by Owner'
                                : ' · Ready for Pickup'}
                            </div>
                          </div>
                        </div>
                      ) : pendingClaim ? (
                        <div className="flex items-start gap-2 text-amber-900">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-amber-800">
                              Claim Submitted by {pendingClaim.claimantName} ({pendingClaim.claimantCampusId}) — Awaiting Verification
                            </div>
                            <div className="text-slate-600 mt-0.5">
                              Submitted Answer: "{pendingClaim.verificationAnswer}"
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-600 flex items-center justify-between">
                          <span>
                            <strong>Verification Progress:</strong> No one has verified this item as theirs yet.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 text-xs">
                    <span className="text-slate-500 font-mono">{item.dateOccurred}</span>
                    <button
                      type="button"
                      onClick={() => navigate('/claims')}
                      className="font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Open Claims & Verification →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Action Modules */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <button
          type="button"
          onClick={() => navigate('/items')}
          className="text-left bg-gradient-to-br from-white to-indigo-50/60 border border-indigo-100 hover:border-indigo-300 rounded-2xl p-6 transition-all group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-4">
            <Search className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Search & Filter Items</span>
            <ArrowRight className="w-4 h-4 text-indigo-600 group-hover:translate-x-1 transition-transform" />
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Browse all lost and found reports by category, campus building, or filter by items you reported.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/hubs')}
          className="text-left bg-gradient-to-br from-white to-teal-50/60 border border-teal-100 hover:border-teal-300 rounded-2xl p-6 transition-all group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-4">
            <Building2 className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center justify-between">
            <span>3 Campus Collection Desks</span>
            <ArrowRight className="w-4 h-4 text-teal-600 group-hover:translate-x-1 transition-transform" />
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            View operating hours and locker bins at Security Desk 1, Security Desk 2, and Administration Block.
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('/claims')}
          className="text-left bg-gradient-to-br from-white to-amber-50/60 border border-amber-100 hover:border-amber-300 rounded-2xl p-6 transition-all group shadow-xs"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center mb-4">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-bold text-slate-900 flex items-center justify-between">
            <span>Ownership & Pickup Passes</span>
            <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
          </h2>
          <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
            Track ownership verification claims, approve matches, and view Pickup Pass Codes.
          </p>
        </button>
      </section>

      {/* Recently Reported Campus Items (Spacious 3-Card Row) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              Latest Campus Reports
            </h2>
            <p className="text-xs text-slate-500">
              Recent items reported lost or submitted at Security Desk 1, Security Desk 2, and Administration Block
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            <span>See All {metrics.totalReports} Items</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recentItems.map((item) => {
            const itemClaims = claimsByItemId[item.id] || [];
            const approvedClaim = itemClaims.find(
              (c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER'
            );
            return (
              <article
                key={item.id}
                className="bg-white border border-indigo-100 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="aspect-4/3 w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
                    <ResilientImage
                      src={item.imageUrl}
                      alt={item.title}
                      category={item.category}
                    />
                  </div>
                  <div className="p-5 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs">
                      <span
                        className={`font-bold ${
                          item.type === 'LOST' ? 'text-amber-600' : 'text-emerald-600'
                        }`}
                      >
                        {item.type}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-600 font-medium">{item.category}</span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="text-slate-500 truncate">{item.campusZone}</span>
                    </div>

                    <h3 className="font-display text-base font-bold text-slate-900 line-clamp-1">
                      {item.title}
                    </h3>

                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    {(item.type === 'FOUND' || item.hubName) && (
                      <div className="p-2.5 bg-teal-50/80 border border-teal-200 rounded-xl text-xs text-teal-950">
                        <span className="text-teal-700 font-semibold">Submitted Desk:</span>{' '}
                        <strong>{item.hubName || 'Security Desk 1'}</strong>
                        {item.lockerBin ? ` · ${item.lockerBin}` : ''}
                      </div>
                    )}

                    <div className="pt-1 text-xs text-slate-500">
                      <span className="font-semibold text-indigo-700">
                        {formatStatusLabel(item.custodyStatus)}
                      </span>
                      {approvedClaim && (
                        <div className="text-emerald-700 font-semibold mt-1">
                          ✓ Verified by {approvedClaim.claimantName} ({approvedClaim.claimantCampusId})
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 bg-indigo-50/40 border-t border-indigo-100/80 flex items-center justify-between gap-2">
                  <span className="text-xs font-mono text-slate-500 tabular-nums">
                    {item.referenceCode}
                  </span>
                  {item.custodyStatus !== 'RETURNED' && (
                    <button
                      type="button"
                      onClick={() => setSelectedItemForClaim(item)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
                    >
                      {item.type === 'FOUND' ? 'Claim This Item' : 'I Found This'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Ownership Claim Modal */}
      <ClaimSubmissionModal
        item={selectedItemForClaim}
        onClose={() => setSelectedItemForClaim(null)}
        onSuccess={loadDashboard}
      />
    </div>
  );
};
