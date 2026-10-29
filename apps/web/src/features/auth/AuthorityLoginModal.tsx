import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { User } from '../../types';
import { Shield, KeyRound, Building, UserCheck, X, CheckCircle2, Lock, ChevronRight } from 'lucide-react';

interface AuthorityLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onLoginSuccess: (user: User, token: string) => void;
}

export const AuthorityLoginModal: React.FC<AuthorityLoginModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onLoginSuccess,
}) => {
  const [accounts, setAccounts] = useState<User[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [password, setPassword] = useState<string>('pradhikaran2026');

  useEffect(() => {
    if (isOpen) {
      api.getAuthAccounts()
        .then(list => {
          setAccounts(list);
          if (list.length > 0 && !selectedEmail) {
            setSelectedEmail(list[0].email);
          }
        })
        .catch(err => console.error('Failed to load authority accounts:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = async (emailToUse?: string) => {
    const targetEmail = emailToUse || selectedEmail;
    if (!targetEmail) return;

    setLoading(true);
    try {
      const res = await api.login(targetEmail);
      localStorage.setItem('dt_auth_token', res.token);
      localStorage.setItem('dt_auth_user', JSON.stringify(res.user));
      onLoginSuccess(res.user, res.token);
      onClose();
    } catch (err) {
      console.error('Login error:', err);
      alert('Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-900/60 to-slate-900 border-b border-slate-800 p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-wide text-white">
                Municipal Authority & Government Portal
              </h2>
              <p className="text-xs text-slate-400">
                Pimpri-Chinchwad Municipal Corporation (PCMC) & PCCOE Jurisdiction
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex flex-col gap-5">
          <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 border border-slate-800 p-3 rounded-lg">
            Authorized municipal officers and campus estate authorities have elevated privileges to update civic defect progress, reclassify infrastructure criticality, issue maintenance work orders, and conduct storm simulation runs in their study jurisdiction.
          </p>

          {/* Quick Jurisdictional Profiles */}
          <div className="flex flex-col gap-2.5">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" /> Select Jurisdictional Authority Profile
            </label>

            <div className="flex flex-col gap-2">
              {accounts.map(acc => {
                const isSelected = selectedEmail === acc.email;
                const isCurrent = currentUser?.id === acc.id;

                return (
                  <div
                    key={acc.id}
                    onClick={() => setSelectedEmail(acc.email)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-blue-950/50 border-blue-500/80 ring-1 ring-blue-500/50'
                        : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800/80 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs mt-0.5 ${
                          acc.role === 'AUTHORITY_ADMIN'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : acc.role === 'CAMPUS_AUTHORITY'
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-slate-700/40 text-slate-400 border border-slate-600/40'
                        }`}
                      >
                        {acc.role === 'AUTHORITY_ADMIN' ? 'PCMC' : acc.role === 'CAMPUS_AUTHORITY' ? 'PCCOE' : 'PUB'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-white">{acc.displayName}</span>
                          {isCurrent && (
                            <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-1.5 py-0.2 rounded font-mono">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-blue-300/90 font-medium">{acc.designation}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                          <span>{acc.department}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300">{acc.badgeNumber}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          Jurisdiction: <span className="text-slate-400">{acc.jurisdiction}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={loading}
                      onClick={e => {
                        e.stopPropagation();
                        handleLogin(acc.email);
                      }}
                      className="ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1 shadow-sm flex-shrink-0"
                    >
                      <span>Sign In</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Demonstration Password Notice */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-3 flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Demo Security: All authority profiles pre-authorized with role session JWT</span>
            </div>
            <span className="font-mono text-[11px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded">
              Pass: pradhikaran2026
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Role-Based Access Control (RBAC) Active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
            >
              Cancel
            </button>
            <button
              disabled={loading || !selectedEmail}
              onClick={() => handleLogin()}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-medium transition shadow-md disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : 'Sign In as Selected Authority'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
