import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { notificationsApi } from '../services/api';

export const NotificationsPage: React.FC = () => {
  const { notifications, unreadCount, refreshNotifications } = useAuth();
  const navigate = useNavigate();

  const handleMarkRead = async (id: string) => {
    await notificationsApi.markRead(id);
    await refreshNotifications();
  };

  const handleMarkAllRead = async () => {
    await notificationsApi.markAllRead();
    await refreshNotifications();
  };

  const formatCategoryText = (cat: string) => {
    switch (cat) {
      case 'PICKUP_READY':
        return 'Pickup Pass Ready';
      case 'CUSTODY_INTAKE':
        return 'Collection Desk Receipt';
      case 'VERIFICATION_UPDATE':
        return 'Ownership Verification';
      default:
        return 'Campus Match Alert';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900">
            Notifications & Pickup Alerts
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Updates on your reported items, ownership claims, and Pickup Pass Codes
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 whitespace-nowrap shrink-0"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white border border-indigo-100 rounded-2xl p-12 text-center">
          <Bell className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
          <h3 className="font-display text-base font-bold text-slate-900">
            You're All Caught Up
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Alerts appear here whenever lost items are matched, turned in at a desk, or approved for pickup.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-indigo-100 rounded-2xl divide-y divide-indigo-100/70 overflow-hidden shadow-xs">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                notif.isRead ? 'bg-white' : 'bg-indigo-50/40'
              }`}
            >
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-bold text-indigo-700">
                    {formatCategoryText(notif.category)}
                  </span>
                  <span aria-hidden="true" className="text-slate-300">
                    ·
                  </span>
                  <span className="font-mono text-slate-500 tabular-nums">
                    {new Date(notif.createdAt).toLocaleString()}
                  </span>
                  {notif.actionCode && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-mono font-bold text-emerald-700 tabular-nums">
                        Code: {notif.actionCode}
                      </span>
                    </>
                  )}
                  {!notif.isRead && (
                    <>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className="font-bold text-amber-600">New</span>
                    </>
                  )}
                </div>

                <h2 className="font-display text-sm font-bold text-slate-900">
                  {notif.title}
                </h2>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {notif.message}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(notif.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 whitespace-nowrap"
                  >
                    Mark Read
                  </button>
                )}
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      notif.category === 'PICKUP_READY' ||
                        notif.category === 'VERIFICATION_UPDATE'
                        ? '/claims'
                        : '/hubs'
                    )
                  }
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 whitespace-nowrap"
                >
                  <span>View Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
