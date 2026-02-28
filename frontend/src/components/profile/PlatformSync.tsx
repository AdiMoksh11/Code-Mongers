"use client";
import React, { useMemo, useRef, useState, useEffect } from "react";
import api from "@/utils/axios";
import toast from "react-hot-toast";

export type PlatformKey = "coursera" | "udemy" | "nptel" | "edx" | "linkedinLearning" | "google";

export interface PlatformSyncData {
  profileUrl: string;
  isConnected: boolean;
  lastSyncAt?: string;
  verified?: boolean;
}

export default function PlatformSync({
  platformSync,
  onConnectPlatform,
  onDisconnectPlatform,
}: {
  platformSync: Record<string, PlatformSyncData>;
  onConnectPlatform: (platform: PlatformKey, profileUrl: string) => Promise<void>;
  onDisconnectPlatform: (platform: PlatformKey) => Promise<void>;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<PlatformKey | null>(null);
  const [profileUrl, setProfileUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [challengeToken, setChallengeToken] = useState<string | null>(null);
  const [challengeExpiry, setChallengeExpiry] = useState<string | null>(null);
  const [step, setStep] = useState<'enter-url' | 'challenge'>("enter-url");
  const menuRef = useRef<HTMLDivElement | null>(null);

  const platforms = useMemo(
    () => [
      { key: "coursera" as PlatformKey, name: "Coursera", emoji: "🎓", enabled: true },
      { key: "udemy" as PlatformKey, name: "Udemy", emoji: "📚", enabled: false },
      { key: "nptel" as PlatformKey, name: "NPTEL", emoji: "🏛️", enabled: false },
      { key: "edx" as PlatformKey, name: "edX", emoji: "🎯", enabled: false },
      { key: "linkedinLearning" as PlatformKey, name: "LinkedIn Learning", emoji: "💼", enabled: false },
      { key: "google" as PlatformKey, name: "Google", emoji: "🔍", enabled: false },
    ],
    []
  );

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  const connected = platforms.filter((p) => platformSync?.[p.key]?.isConnected);

  const openConnect = (key: PlatformKey, enabled: boolean) => {
    if (!enabled) return; // coming soon
    setSelectedPlatform(key);
    setProfileUrl(platformSync?.[key]?.profileUrl || "");
    setChallengeToken(null);
    setChallengeExpiry(null);
    setStep('enter-url');
  };

  const submitConnect = async () => {
    if (!selectedPlatform) return;
    if (!profileUrl || !/^https?:\/\//i.test(profileUrl)) {
      alert("Please enter a valid URL starting with http or https");
      return;
    }
    setIsSubmitting(true);
    try {
      // For Coursera, first request a challenge token; verification will be a second action
      if (selectedPlatform === 'coursera') {
        const { data } = await api.post(`/api/platforms/coursera/challenge`, { profileUrl: profileUrl.trim() });
        if (!data?.success) throw new Error(data?.message || 'Failed to create challenge');
        setChallengeToken(data.data.token);
        setChallengeExpiry(data.data.expiresAt);
        setStep('challenge');
        toast.success('Token generated. Update your Coursera display name, then click Verify.');
      } else {
        await onConnectPlatform(selectedPlatform, profileUrl.trim());
        setSelectedPlatform(null);
        setProfileUrl("");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start verification';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyChallenge = async () => {
    if (!selectedPlatform || selectedPlatform !== 'coursera') return;
    setIsSubmitting(true);
    try {
      const { data } = await api.post(`/api/platforms/coursera/verify`, { profileUrl: profileUrl.trim() });
      if (!data?.success) throw new Error(data?.message || 'Verification failed');
      // Success: close and reset
      setSelectedPlatform(null);
      setProfileUrl("");
      setChallengeToken(null);
      setChallengeExpiry(null);
      setStep('enter-url');
      toast.success('Coursera verified and connected');
      // Ask parent to refresh user data (without overwriting verified flag)
      await onConnectPlatform('coursera', profileUrl.trim());
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Verification failed';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-10">
      <h3 className="text-lg font-semibold mb-1">Platform Sync</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Connect your learning platforms to sync certificates and achievements. Only Coursera is supported for now.
      </p>

      {connected.length > 0 && (
        <div className="space-y-3 mb-6">
          {connected.map((p) => {
            const data = platformSync[p.key];
            return (
              <div key={p.key} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>{p.emoji}</span>
                  <div>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">
                      {data?.verified ? (
                        <span className="text-green-600 dark:text-green-400 font-medium">Verified</span>
                      ) : (
                        <span className="text-yellow-700 dark:text-yellow-400 font-medium">Unverified</span>
                      )}
                      {data?.lastSyncAt ? ` • Last sync: ${new Date(data.lastSyncAt).toLocaleDateString()}` : ""}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onDisconnectPlatform(p.key)}
                  className="px-3 py-1.5 text-sm rounded-md bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20"
                >
                  Disconnect
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="relative inline-block" ref={menuRef}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white font-medium shadow"
        >
          Connect Platform
        </button>

        {menuOpen && (
          <div className="absolute z-10 mt-2 w-64 rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-lg overflow-hidden">
            {platforms.map((p) => (
              <button
                key={p.key}
                type="button"
                onClick={() => {
                  openConnect(p.key, p.enabled);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-gray-900 ${
                  p.enabled ? "" : "opacity-60 cursor-not-allowed"
                }`}
              >
                <span className="text-lg" aria-hidden>{p.emoji}</span>
                <div>
                  <div className="font-medium">{p.name}</div>
                  <div className="text-xs text-gray-500">{p.enabled ? "Available" : "Coming soon"}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedPlatform && (
        <div className="fixed inset-0 z-20 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6">
            <div className="mb-4">
              <h4 className="text-lg font-semibold mb-1">Connect {platforms.find((p) => p.key === selectedPlatform)?.name}</h4>
              <p className="text-sm text-gray-500">{selectedPlatform==='coursera' ? (step==='enter-url' ? 'Enter your public profile URL to get a verification token.' : 'Change your Coursera display name to the token below, then click Verify.') : 'Enter your public profile URL for this platform.'}</p>
            </div>
            <div className="space-y-4">
              {step==='enter-url' && (
                <>
                  <div>
                    <label className="block text-sm mb-1">Profile URL</label>
                    <input
                      type="url"
                      required
                      placeholder={`https://...`}
                      value={profileUrl}
                      onChange={(e) => setProfileUrl(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          submitConnect();
                        }
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => setSelectedPlatform(null)} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={submitConnect}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-600 text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Generating..." : "Get Token"}
                    </button>
                  </div>
                </>
              )}

              {step==='challenge' && (
                <>
                  <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
                    <div className="text-xs text-yellow-800 dark:text-yellow-300 mb-1">Step 1</div>
                    <div className="text-sm">Temporarily set your Coursera display name to:</div>
                    <div className="mt-2 text-center text-lg font-mono font-semibold select-all">{challengeToken}</div>
                    {challengeExpiry && (
                      <div className="mt-2 text-xs text-gray-500">Token expires at {new Date(challengeExpiry).toLocaleTimeString()}</div>
                    )}
                  </div>
                  <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div className="text-xs text-green-800 dark:text-green-300 mb-1">Step 2</div>
                    <div className="text-sm">Once updated on Coursera, click Verify below. You can revert your display name afterwards.</div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button type="button" onClick={() => { setSelectedPlatform(null); setStep('enter-url'); }} className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800">
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={verifyChallenge}
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-60"
                    >
                      {isSubmitting ? "Verifying..." : "Verify"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
