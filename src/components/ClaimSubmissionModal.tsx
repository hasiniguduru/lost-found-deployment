import React, { useState } from 'react';
import { X, ShieldCheck } from 'lucide-react';
import { ItemReport, claimsApi } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface ClaimSubmissionModalProps {
  item: ItemReport | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimSubmissionModal: React.FC<ClaimSubmissionModalProps> = ({
  item,
  onClose,
  onSuccess,
}) => {
  const { user, refreshNotifications } = useAuth();
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [proofDescription, setProofDescription] = useState('');
  const [serialOrIdNumber, setSerialOrIdNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setSubmitting(true);
    try {
      await claimsApi.createClaim({
        itemId: item.id,
        verificationAnswer,
        proofDescription,
        serialOrIdNumber,
      });
      await refreshNotifications();
      onSuccess();
      onClose();
    } catch (err: any) {
      if (err.response?.data?.fieldErrors) {
        setFieldErrors(err.response.data.fieldErrors);
      } else {
        setFieldErrors({
          general: err.response?.data?.message || 'Unable to submit ownership verification claim.',
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="bg-white border border-indigo-100 rounded-2xl max-w-lg w-full p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-indigo-600">
              {item.referenceCode} · {item.type === 'FOUND' ? 'Ownership Claim' : 'Finder Match'}
            </div>
            <h2 className="font-display text-lg font-bold text-slate-900 mt-0.5">
              Verify Ownership: {item.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="p-3.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs text-slate-700 space-y-1">
            <div className="font-semibold text-indigo-950">
              Claimant: {user?.fullName} ({user?.campusId})
            </div>
            <div>
              Submitted Collection Desk:{' '}
              <span className="font-semibold text-indigo-900">
                {item.hubName || 'Security Desk 1'}
              </span>
              {item.lockerBin ? ` · ${item.lockerBin}` : ''}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Verification Question
            </label>
            <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-xl text-xs font-medium text-amber-950 mb-2">
              {item.verificationQuestion}
            </div>
            <textarea
              rows={3}
              value={verificationAnswer}
              onChange={(e) => setVerificationAnswer(e.target.value)}
              placeholder="Write your answer to the verification question above..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.verificationAnswer && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.verificationAnswer}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Additional Proof of Ownership
            </label>
            <textarea
              rows={2}
              value={proofDescription}
              onChange={(e) => setProofDescription(e.target.value)}
              placeholder="Describe receipt, student ID match, serial number, or photo proof..."
              className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl focus:border-indigo-600"
            />
            {fieldErrors.proofDescription && (
              <p className="text-xs text-red-600 mt-1">{fieldErrors.proofDescription}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Serial Number or Student Tag (Optional)
            </label>
            <input
              type="text"
              value={serialOrIdNumber}
              onChange={(e) => setSerialOrIdNumber(e.target.value)}
              placeholder="e.g., H0YLP98204 or STU-2026-4819"
              className="w-full px-3.5 py-2 text-sm font-mono border border-slate-300 rounded-xl focus:border-indigo-600"
            />
          </div>

          {fieldErrors.general && (
            <p className="text-xs text-red-600">{fieldErrors.general}</p>
          )}

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 disabled:opacity-50 whitespace-nowrap shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Claim'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
