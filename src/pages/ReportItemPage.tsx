import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  Building2,
  ArrowRight,
  HelpCircle,
  MapPin,
  Upload,
  Image as ImageIcon,
  Trash2,
  ShieldCheck,
  Clock,
  PackageCheck,
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

const SAMPLE_PHOTOS = [
  {
    label: 'Laptop',
    url: '/images/item_macbook_pro.jpg',
  },
  {
    label: 'Earbuds & Keys',
    url: '/images/item_airpods_case.jpg',
  },
  {
    label: 'Calculator',
    url: '/images/item_graphing_calc.jpg',
  },
  {
    label: 'Water Bottle',
    url: '/images/item_insulated_bottle.jpg',
  },
  {
    label: 'Leather Wallet',
    url: '/images/item_leather_wallet.jpg',
  },
];

export const ReportItemPage: React.FC = () => {
  const { user, refreshNotifications } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const initialMode = searchParams.get('mode') === 'FOUND' ? 'FOUND' : 'LOST';
  const [reportType, setReportType] = useState<'LOST' | 'FOUND'>(initialMode);
  const [hubs, setHubs] = useState<CollectionHub[]>([]);
  const [myReportedItems, setMyReportedItems] = useState<ItemReport[]>([]);
  const [claimsByItemId, setClaimsByItemId] = useState<Record<string, OwnershipClaim[]>>({});
  const [myReportTab, setMyReportTab] = useState<'ALL' | 'LOST' | 'FOUND'>('ALL');

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemReport['category']>('Electronics');
  const [campusZone, setCampusZone] = useState<string>(CAMPUS_ZONES[0]);
  const [specificLocation, setSpecificLocation] = useState('');
  const [dateOccurred, setDateOccurred] = useState('2026-10-12 10:30');
  const [description, setDescription] = useState('');
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [verificationQuestion, setVerificationQuestion] = useState('');
  const [expectedVerificationHint, setExpectedVerificationHint] = useState('');
  const [hubId, setHubId] = useState('hub-sec-01');
  const [lockerBin, setLockerBin] = useState('');

  // Image upload state (remains empty unless the user explicitly uploads or selects a photo)
  const [imageUrl, setImageUrl] = useState<string>('');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [createdItem, setCreatedItem] = useState<ItemReport | null>(null);

  const loadMyReportsAndHubs = useCallback(async () => {
    const [hubList, allItems, allClaims] = await Promise.all([
      hubsApi.listHubs(),
      itemsApi.listItems(),
      claimsApi.listClaims(),
    ]);
    setHubs(hubList);
    if (hubList.length > 0) {
      setHubId((prev) =>
        hubList.some((h) => h.id === prev) ? prev : hubList[0].id
      );
    }

    const claimMap: Record<string, OwnershipClaim[]> = {};
    allClaims.forEach((c) => {
      if (!claimMap[c.itemId]) claimMap[c.itemId] = [];
      claimMap[c.itemId].push(c);
    });
    setClaimsByItemId(claimMap);

    if (user) {
      const mine = allItems.filter(
        (itm) =>
          itm.reportedByUserId === user.id ||
          (user.campusId &&
            itm.reportedByCampusId?.toLowerCase() === user.campusId.toLowerCase()) ||
          (user.fullName &&
            itm.reportedByName?.toLowerCase() === user.fullName.toLowerCase())
      );
      setMyReportedItems(mine);
    }
  }, [user]);

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    if (modeParam === 'FOUND' || modeParam === 'LOST') {
      setReportType(modeParam);
    }
  }, [searchParams]);

  useEffect(() => {
    loadMyReportsAndHubs();
  }, [loadMyReportsAndHubs]);

  const processSelectedFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Please select a valid image file (PNG, JPG, WEBP).',
      }));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setFieldErrors((prev) => ({
        ...prev,
        imageUrl: 'Image size must be under 10 MB.',
      }));
      return;
    }

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.imageUrl;
      return next;
    });

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const rawDataUrl = reader.result;
        const img = new Image();
        img.onload = () => {
          try {
            const maxWidth = 800;
            const maxHeight = 600;
            let width = img.width;
            let height = img.height;
            if (width > maxWidth || height > maxHeight) {
              const ratio = Math.min(maxWidth / width, maxHeight / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const compressed = canvas.toDataURL('image/jpeg', 0.72);
              setImageUrl(compressed);
              setUploadedFileName(file.name);
              return;
            }
          } catch {
            // Fallback to original data URL
          }
          setImageUrl(rawDataUrl);
          setUploadedFileName(file.name);
        };
        img.onerror = () => {
          setImageUrl(rawDataUrl);
          setUploadedFileName(file.name);
        };
        img.src = rawDataUrl;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleClearImage = () => {
    setImageUrl('');
    setUploadedFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      const created = await itemsApi.createItem({
        title,
        type: reportType,
        category,
        campusZone,
        specificLocation,
        dateOccurred,
        description,
        distinguishingFeatures,
        verificationQuestion,
        expectedVerificationHint,
        hubId: reportType === 'FOUND' ? hubId : undefined,
        lockerBin: reportType === 'FOUND' ? lockerBin : undefined,
        imageUrl: imageUrl.trim() ? imageUrl.trim() : '',
      });
      setCreatedItem(created);
      await refreshNotifications();
      await loadMyReportsAndHubs();
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setFieldErrors({
          general: err.response?.data?.message || 'Please check the required fields and try again.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getStepIndex = (item: ItemReport, itemClaims: OwnershipClaim[]) => {
    const hasApprovedClaim = itemClaims.some(
      (c) => c.status === 'APPROVED' || c.status === 'HANDED_OVER'
    );
    if (item.custodyStatus === 'RETURNED' || itemClaims.some((c) => c.status === 'HANDED_OVER')) {
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

  const filteredMyReports = myReportedItems.filter((itm) => {
    if (myReportTab === 'ALL') return true;
    return itm.type === myReportTab;
  });

  if (createdItem) {
    const selectedHubObj = hubs.find((h) => h.id === createdItem.hubId);
    return (
      <div className="max-w-2xl mx-auto bg-white border border-emerald-200 rounded-2xl p-8 shadow-md space-y-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <div className="text-xs font-semibold text-emerald-700">
              Report Confirmation · {createdItem.referenceCode}
            </div>
            <h1 className="font-display text-xl font-bold text-slate-900">
              {createdItem.type === 'FOUND'
                ? 'Found Item Registered & Submitted to Collection Desk'
                : 'Lost Item Report Published'}
            </h1>
          </div>
        </div>

        {/* Where the Found Item Has Been Submitted Banner */}
        {createdItem.type === 'FOUND' && (
          <div className="p-5 bg-teal-50 border-2 border-teal-300 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-teal-900 uppercase tracking-wider">
                <Building2 className="w-4 h-4 text-teal-600" />
                <span>Where This Found Item Has Been Submitted</span>
              </div>
              <span className="px-2.5 py-0.5 text-[11px] font-bold bg-teal-600 text-white rounded-md">
                IN CUSTODY AT DESK
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="p-3 bg-white rounded-xl border border-teal-200">
                <div className="text-[11px] text-slate-500">Submitted Collection Desk</div>
                <div className="text-sm font-bold text-teal-950 mt-0.5">
                  {createdItem.hubName || 'Security Desk 1'}
                </div>
                {selectedHubObj && (
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {selectedHubObj.roomLocation}
                  </div>
                )}
              </div>
              <div className="p-3 bg-white rounded-xl border border-teal-200">
                <div className="text-[11px] text-slate-500">Assigned Locker / Bin</div>
                <div className="text-sm font-mono font-bold text-teal-900 mt-0.5">
                  {createdItem.lockerBin || 'Bin S1-01'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Secured storage bin
                </div>
              </div>
              <div className="p-3 bg-white rounded-xl border border-teal-200">
                <div className="text-[11px] text-slate-500">Drop-Off Receipt Code</div>
                <div className="text-sm font-mono font-bold text-emerald-700 mt-0.5">
                  {createdItem.submissionReceiptCode}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Verified desk handover
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Uploaded Item Image Preview on Confirmation (Only if uploaded) */}
        {createdItem.imageUrl ? (
          <div className="aspect-16/9 max-h-56 w-full rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
            <ResilientImage
              src={createdItem.imageUrl}
              alt={createdItem.title}
              category={createdItem.category}
            />
          </div>
        ) : (
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span className="font-semibold">Item Photo</span>
            <span>No photo uploaded (none randomly assigned)</span>
          </div>
        )}

        <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <span className="text-slate-500">Tracking Number</span>
            <span className="font-mono font-bold text-indigo-700 tabular-nums">
              {createdItem.referenceCode}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <span className="text-slate-500">Report Type</span>
            <span
              className={`font-bold ${
                createdItem.type === 'LOST' ? 'text-amber-700' : 'text-emerald-700'
              }`}
            >
              {createdItem.type === 'LOST' ? 'LOST ITEM REPORT' : 'FOUND ITEM REPORT'}
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <span className="text-slate-500">Item & Category</span>
            <span className="font-semibold text-slate-900">
              {createdItem.title} ({createdItem.category})
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
            <span className="text-slate-500">Campus Location</span>
            <span className="font-medium text-slate-800">
              {createdItem.campusZone} · {createdItem.specificLocation}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Reported By</span>
            <span className="font-medium text-slate-800">
              {createdItem.reportedByName} ({createdItem.reportedByCampusId})
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => {
              setCreatedItem(null);
              setTitle('');
              setSpecificLocation('');
              setDescription('');
              setDistinguishingFeatures('');
              setVerificationQuestion('');
              setExpectedVerificationHint('');
              handleClearImage();
            }}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
          >
            Submit Another Report
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100"
          >
            Track Progress on Dashboard
          </button>
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
          >
            <span>Browse All Items</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Mode Selection Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => {
            setReportType('LOST');
            setFieldErrors({});
          }}
          className={`p-5 rounded-2xl border text-left transition-all ${
            reportType === 'LOST'
              ? 'bg-amber-50/90 border-amber-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-amber-200'
          }`}
        >
          <div className="text-xs font-bold text-amber-700">Option 1 · Item Owner</div>
          <div className="font-display text-lg font-bold text-slate-900 mt-0.5">
            I Lost Something on Campus
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Post an alert for a misplaced item so finders and security desks can match it.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            setReportType('FOUND');
            setFieldErrors({});
          }}
          className={`p-5 rounded-2xl border text-left transition-all ${
            reportType === 'FOUND'
              ? 'bg-emerald-50/90 border-emerald-400 shadow-sm'
              : 'bg-white border-slate-200 hover:border-emerald-200'
          }`}
        >
          <div className="text-xs font-bold text-emerald-700">Option 2 · Item Finder</div>
          <div className="font-display text-lg font-bold text-slate-900 mt-0.5">
            I Found an Item to Turn In
          </div>
          <p className="text-xs text-slate-600 mt-1">
            Log a found item, select which Collection Desk (Security Desk 1, Security Desk 2, or Administration Block) you submitted it to, and get a receipt.
          </p>
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6"
      >
        <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              {reportType === 'LOST' ? 'Lost Item Details' : 'Found Item & Desk Submission'}
            </h2>
            <p className="text-xs text-slate-500">
              Reporting as <span className="font-semibold text-slate-700">{user?.fullName}</span> ({user?.campusId})
            </p>
          </div>
        </div>

        {/* Section 1: Item & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              What item was {reportType === 'LOST' ? 'lost' : 'found'}? *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Space Black 14-inch MacBook Pro or Blue Lanyard with Keys"
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.title && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.title}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ItemReport['category'])}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:border-indigo-600"
            >
              <option value="Electronics">Electronics</option>
              <option value="Campus ID & Keys">Campus ID & Keys</option>
              <option value="Textbooks & Lab Gear">Textbooks & Lab Gear</option>
              <option value="Apparel & Bags">Apparel & Bags</option>
              <option value="Personal Accessories">Personal Accessories</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Date & Approximate Time *
            </label>
            <input
              type="text"
              value={dateOccurred}
              onChange={(e) => setDateOccurred(e.target.value)}
              placeholder="YYYY-MM-DD HH:mm"
              className="w-full px-3.5 py-2.5 text-sm font-mono border border-slate-300 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.dateOccurred && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.dateOccurred}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Campus Building / Zone *
            </label>
            <select
              value={campusZone}
              onChange={(e) => setCampusZone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:border-indigo-600"
            >
              {CAMPUS_ZONES.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Room or Exact Spot *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={specificLocation}
                onChange={(e) => setSpecificLocation(e.target.value)}
                placeholder="e.g., 3rd Floor Reading Room Table 12"
                className="w-full pl-9 pr-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
              />
            </div>
            {fieldErrors.specificLocation && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.specificLocation}</p>
            )}
          </div>
        </div>

        {/* Item Photo Upload Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-slate-800">
              Item Photo (Optional — Leave blank if you do not have a photo)
            </label>
            {imageUrl && (
              <button
                type="button"
                onClick={handleClearImage}
                className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Photo</span>
              </button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          {imageUrl ? (
            <div className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl flex flex-col sm:flex-row items-center gap-4">
              <div className="w-full sm:w-44 aspect-4/3 rounded-xl overflow-hidden border border-indigo-200 bg-white shrink-0">
                <ResilientImage src={imageUrl} alt={title || 'Uploaded item preview'} category={category} />
              </div>
              <div className="flex-1 space-y-2 text-center sm:text-left">
                <div className="text-xs font-bold text-indigo-950">
                  {uploadedFileName ? `Uploaded: ${uploadedFileName}` : 'Selected Item Photo Ready'}
                </div>
                <p className="text-xs text-slate-600">
                  This photo will appear on the Dashboard and Browse Lost & Found cards to help identify the item.
                </p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-white border border-indigo-200 rounded-lg hover:bg-indigo-50"
                  >
                    Change Photo
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer border-2 border-dashed rounded-2xl p-6 text-center transition-colors ${
                isDragging
                  ? 'border-indigo-600 bg-indigo-50/80'
                  : 'border-indigo-200 bg-indigo-50/30 hover:bg-indigo-50/60 hover:border-indigo-400'
              }`}
            >
              <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2.5">
                <Upload className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-900">
                Click to upload a photo or drag and drop here (Optional)
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                If you do not upload a photo, the report will show "No Photo Uploaded" instead of picking a random image.
              </p>
            </div>
          )}

          {/* Optional Sample Photo Picker */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500">
              <ImageIcon className="w-3.5 h-3.5 text-indigo-500" />
              <span>Optional sample photo:</span>
            </span>
            {SAMPLE_PHOTOS.map((sample) => (
              <button
                key={sample.label}
                type="button"
                onClick={() => {
                  setImageUrl(sample.url);
                  setUploadedFileName(`${sample.label} (Sample)`);
                }}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors ${
                  imageUrl === sample.url
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:text-indigo-700'
                }`}
              >
                {sample.label}
              </button>
            ))}
          </div>

          {fieldErrors.imageUrl && (
            <p className="text-xs text-red-600 mt-1">{fieldErrors.imageUrl}</p>
          )}
        </div>

        {/* Fixed Collection Hub Assignment (When Reporting a Found Item) */}
        {reportType === 'FOUND' && (
          <div className="p-5 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-teal-900">
              <Building2 className="w-4 h-4 text-teal-600" />
              <span>Where Are You Submitting This Found Item? *</span>
            </div>
            <p className="text-xs text-teal-800">
              Select the Collection Desk (Security Desk 1, Security Desk 2, or Administration Block) where this found item is submitted so the rightful owner knows where to pick it up.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-teal-950 mb-1">
                  Submitted Collection Desk *
                </label>
                <select
                  value={hubId}
                  onChange={(e) => setHubId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-teal-300 rounded-xl bg-white font-semibold text-slate-900"
                >
                  {hubs.map((hub) => (
                    <option key={hub.id} value={hub.id}>
                      {hub.name} ({hub.roomLocation})
                    </option>
                  ))}
                </select>
                {fieldErrors.hubId && (
                  <p className="text-xs text-red-600 mt-1">{fieldErrors.hubId}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-teal-950 mb-1">
                  Locker Bin (Optional — Auto-assigned if blank)
                </label>
                <input
                  type="text"
                  value={lockerBin}
                  onChange={(e) => setLockerBin(e.target.value)}
                  placeholder="e.g., Bin S1-15"
                  className="w-full px-3.5 py-2 text-xs font-mono border border-teal-300 rounded-xl bg-white"
                />
              </div>
            </div>
          </div>
        )}

        {/* Description & Distinguishing Marks */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Description *
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the brand, color, case, condition, and any helpful details..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.description && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.description}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1.5">
              Special Markings, Stickers, or Keychain Tags
            </label>
            <input
              type="text"
              value={distinguishingFeatures}
              onChange={(e) => setDistinguishingFeatures(e.target.value)}
              placeholder="e.g., Robotics Club sticker on the cover, brass key tag 402..."
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
            />
          </div>
        </div>

        {/* Ownership Verification Challenge */}
        <div className="p-5 bg-indigo-50/60 border border-indigo-100 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950">
            <HelpCircle className="w-4 h-4 text-indigo-600" />
            <span>Ownership Verification Question</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Question to Verify the True Owner *
            </label>
            <p className="text-xs text-slate-500 mb-2">
              Ask a detail only the rightful owner can answer (such as lock-screen wallpaper, key stamp number, or name inside the cover).
            </p>
            <input
              type="text"
              value={verificationQuestion}
              onChange={(e) => setVerificationQuestion(e.target.value)}
              placeholder="e.g., What 3-digit number is stamped on the brass key?"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-indigo-200 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.verificationQuestion && (
              <p className="text-xs text-red-600 mt-1">
                {fieldErrors.verificationQuestion}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Expected Answer (Visible Only to Campus Security Officers)
            </label>
            <input
              type="text"
              value={expectedVerificationHint}
              onChange={(e) => setExpectedVerificationHint(e.target.value)}
              placeholder="e.g., Stamped 402"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-indigo-200 rounded-xl focus:border-indigo-600"
            />
          </div>
        </div>

        {fieldErrors.general && (
          <p className="text-xs text-red-600">{fieldErrors.general}</p>
        )}

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={() => navigate('/items')}
            className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-5 py-2.5 text-xs font-semibold text-white rounded-xl transition-colors shadow-xs disabled:opacity-50 whitespace-nowrap shrink-0 ${
              reportType === 'FOUND'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting
              ? 'Submitting...'
              : reportType === 'FOUND'
              ? 'Submit Found Item & Get Desk Receipt'
              : 'Post Lost Item Report'}
          </button>
        </div>
      </form>

      {/* My Reported Items (Lost & Found) & Live Verification Progress */}
      <section className="bg-white border border-indigo-100 rounded-2xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900">
              My Reported Items (Lost & Found) & Progress
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track items you have reported lost or found, see which Collection Desk found items were submitted to, and check if someone has verified an item as theirs.
            </p>
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-indigo-50 rounded-xl shrink-0">
            {[
              { id: 'ALL', label: `All (${myReportedItems.length})` },
              {
                id: 'LOST',
                label: `Lost (${myReportedItems.filter((i) => i.type === 'LOST').length})`,
              },
              {
                id: 'FOUND',
                label: `Found (${myReportedItems.filter((i) => i.type === 'FOUND').length})`,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMyReportTab(tab.id as 'ALL' | 'LOST' | 'FOUND')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  myReportTab === tab.id
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
          <div className="p-8 text-center bg-slate-50/70 rounded-xl border border-slate-200/70">
            <p className="text-xs font-semibold text-slate-700">
              You have no {myReportTab === 'ALL' ? '' : myReportTab.toLowerCase()} reported items yet.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Use the form above to report a lost or found item on campus.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
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
                  className="p-5 rounded-2xl border border-indigo-100 bg-slate-50/40 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-bold rounded-md ${
                          item.type === 'LOST'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.type === 'LOST' ? 'REPORTED LOST' : 'REPORTED FOUND'}
                      </span>
                      <span className="font-mono text-xs font-bold text-indigo-700">
                        {item.referenceCode}
                      </span>
                      <h3 className="font-display text-base font-bold text-slate-900">
                        {item.title}
                      </h3>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {item.dateOccurred}
                    </span>
                  </div>

                  {/* Submitted Location Banner for Found Items */}
                  {(item.type === 'FOUND' || item.hubName) && (
                    <div className="p-3 bg-teal-50/90 border border-teal-200 rounded-xl flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-teal-950">
                        <Building2 className="w-4 h-4 text-teal-600 shrink-0" />
                        <span>
                          Submitted to Collection Desk:{' '}
                          <strong className="text-teal-900">
                            {item.hubName || 'Security Desk 1'}
                          </strong>
                          {item.lockerBin ? ` · Locker ${item.lockerBin}` : ''}
                        </span>
                      </div>
                      {item.submissionReceiptCode && (
                        <span className="font-mono font-bold text-teal-800">
                          Receipt: {item.submissionReceiptCode}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 4-Step Progress Tracker */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    {[
                      { step: 1, label: '1. Item Reported' },
                      {
                        step: 2,
                        label: item.hubName
                          ? `2. At ${item.hubName}`
                          : '2. Desk Submission',
                      },
                      {
                        step: 3,
                        label: approvedClaim
                          ? '3. Verified as Theirs'
                          : pendingClaim
                          ? '3. Claim Under Review'
                          : '3. Ownership Verification',
                      },
                      { step: 4, label: '4. Returned to Owner' },
                    ].map((s) => {
                      const active = stepIdx >= s.step;
                      return (
                        <div
                          key={s.step}
                          className={`px-3 py-2 rounded-xl border font-semibold flex items-center gap-1.5 ${
                            active
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-slate-400 border-slate-200'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{s.label}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Verification Details Box */}
                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {approvedClaim ? (
                      <div className="flex items-start gap-2.5 text-emerald-900">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-emerald-800">
                            Verified as Theirs by {approvedClaim.claimantName} ({approvedClaim.claimantCampusId})
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            Pickup Pass Code:{' '}
                            <span className="font-mono font-bold text-indigo-700">
                              {approvedClaim.pickupPassCode}
                            </span>{' '}
                            · Collection Desk:{' '}
                            <span className="font-semibold">
                              {approvedClaim.collectionHubName || item.hubName || 'Security Desk 1'}
                            </span>
                            {approvedClaim.status === 'HANDED_OVER' ? ' · Collected by Owner' : ''}
                          </div>
                        </div>
                      </div>
                    ) : pendingClaim ? (
                      <div className="flex items-start gap-2.5 text-amber-900">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold text-amber-800">
                            Claim Submitted by {pendingClaim.claimantName} ({pendingClaim.claimantCampusId}) — Pending Verification
                          </div>
                          <div className="text-slate-600 mt-0.5">
                            Answer provided: "{pendingClaim.verificationAnswer}" · Awaiting verification approval
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-slate-600">
                        <PackageCheck className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>
                          <strong>Verification Status:</strong> No one has verified this item as theirs yet.
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => navigate('/claims')}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 whitespace-nowrap shrink-0"
                    >
                      View Verification Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};
