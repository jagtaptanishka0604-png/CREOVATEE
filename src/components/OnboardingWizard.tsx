import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Upload } from 'lucide-react';
import type { UserRecord } from '../types';
import { NICHES, PLATFORMS } from '../data/demoData';
import { uploadFile } from '../lib/api';
import { addSocialAccount, saveBrandProfile, saveCreatorProfile, updateUserRecord } from '../lib/firestoreService';
import { CreovateLogo, SafeImage } from './UIPrimitives';

interface OnboardingWizardProps {
  user: UserRecord;
  onComplete: () => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

export function OnboardingWizard({ user, onComplete, onToast }: OnboardingWizardProps) {
  const isBrand = user.role === 'brand';
  const totalSteps = 3;
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Brand fields
  const [brandName, setBrandName] = useState(user.name || '');
  const [industry, setIndustry] = useState(NICHES[0]);
  const [brandDesc, setBrandDesc] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState(user.photoUrl || '');
  const [brandLocation, setBrandLocation] = useState('');
  const [contactName, setContactName] = useState(user.name || '');

  // Creator fields
  const [fullName, setFullName] = useState(user.name || '');
  const [username, setUsername] = useState(
    (user.name || 'creator').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'creator'
  );
  const [photoUrl, setPhotoUrl] = useState(user.photoUrl || '');
  const [bio, setBio] = useState('');
  const [creatorLocation, setCreatorLocation] = useState('');
  const [niche, setNiche] = useState(NICHES[0]);
  const [skillsInput, setSkillsInput] = useState('Short-Form Video, Storytelling, Photography');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Instagram', 'YouTube']);
  const [socialHandle, setSocialHandle] = useState('@' + username);
  const [socialUrl, setSocialUrl] = useState('https://instagram.com/');
  const [followersCount, setFollowersCount] = useState('25000');
  const [engagementRate, setEngagementRate] = useState('5.2');
  const [collaborationRate, setCollaborationRate] = useState('1200');
  const [preferences, setPreferences] = useState('Sponsored reels, product launches, and long-term ambassadorships.');

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const handleImageUpload = async (file: File | undefined, target: 'logo' | 'avatar') => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadFile(file);
      if (target === 'logo') setLogoUrl(res.url);
      else setPhotoUrl(res.url);
      onToast('success', 'Image uploaded', res.originalName);
    } catch (err) {
      onToast('error', 'Upload failed', err instanceof Error ? err.message : 'Unable to upload file.');
    } finally {
      setUploading(false);
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      if (isBrand) {
        if (!brandName.trim()) {
          onToast('error', 'Brand name required');
          setSaving(false);
          return;
        }
        await saveBrandProfile(
          user.uid,
          {
            brandName: brandName.trim(),
            description: brandDesc.trim() || `${brandName.trim()} creator marketing studio.`,
            industry,
            website: website.trim(),
            logoUrl: logoUrl.trim(),
            location: brandLocation.trim() || 'Remote',
            contactName: contactName.trim() || user.name,
          },
          false
        );
      } else {
        const cleanSkills = skillsInput
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 10);
        await saveCreatorProfile(
          user.uid,
          {
            fullName: fullName.trim() || user.name,
            username: username.trim().replace(/[^a-zA-Z0-9_.-]/g, '') || `creator_${user.uid.slice(0, 5)}`,
            photoUrl: photoUrl.trim(),
            bio: bio.trim() || `${niche} creator collaborating with modern brands.`,
            location: creatorLocation.trim() || 'Global',
            niche,
            skills: cleanSkills.length > 0 ? cleanSkills : ['Content Creation'],
            platforms: selectedPlatforms.length > 0 ? selectedPlatforms : ['Instagram'],
            followersCount: Number(followersCount) || 0,
            engagementRate: Number(engagementRate) || 0,
            collaborationRate: Number(collaborationRate) || 0,
            preferences: preferences.trim(),
          },
          false
        );

        if (socialHandle.trim() && selectedPlatforms[0]) {
          await addSocialAccount(user.uid, {
            platform: selectedPlatforms[0],
            handle: socialHandle.trim(),
            url: socialUrl.trim() || 'https://instagram.com',
            followers: Number(followersCount) || 0,
            engagementRate: Number(engagementRate) || 0,
          });
        }
      }

      await updateUserRecord(user.uid, {
        name: isBrand ? contactName.trim() || brandName.trim() : fullName.trim() || user.name,
        photoUrl: isBrand ? logoUrl.trim() : photoUrl.trim(),
        onboardingComplete: true,
      });

      onToast('success', 'Workspace configured', isBrand ? 'Welcome to Brand Studio!' : 'Welcome to Creator Hub!');
      onComplete();
    } catch (err) {
      onToast('error', 'Could not complete onboarding', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const progressPct = Math.round((step / totalSteps) * 100);

  return (
    <div className="min-h-screen bg-[#FAF9FC] dark:bg-[#0B0814] flex flex-col justify-center py-12 px-4">
      <div className="max-w-2xl w-full mx-auto bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl p-6 sm:p-10 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-6">
          <CreovateLogo />
          <span className="text-xs font-mono tabular-nums text-[#6D28D9] dark:text-[#C4B5FD] font-semibold">
            Step {step} of {totalSteps} · {progressPct}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="h-1.5 w-full rounded-full bg-[#EFEAF9] dark:bg-[#1F1738] overflow-hidden mb-8">
          <div
            className="h-full bg-gradient-to-r from-[#6D28D9] to-[#3B82F6] transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        <h1 className="text-2xl font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-1">
          {isBrand ? 'Configure Your Brand Studio' : 'Build Your Creator Hub Identity'}
        </h1>
        <p className="text-sm text-[#58506E] dark:text-[#A89EC4] mb-7">
          {isBrand
            ? 'Give creators clear context about your brand, industry, and collaboration focus.'
            : 'Help brands discover your niche, audience reach, and preferred partnership formats.'}
        </p>

        {/* BRAND STEPS */}
        {isBrand && step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <SafeImage src={logoUrl} alt="Brand logo" className="w-16 h-16 rounded-xl object-cover border border-[#E6E1F2] dark:border-[#241C3B]" />
              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D8CFF0] dark:border-[#2E244D] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload Brand Logo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], 'logo')}
                  />
                </label>
                <p className="text-[11px] text-[#786E91] mt-1">JPG, PNG, or WEBP up to 15 MB.</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Brand Name *</label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g., Kora Acoustics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {isBrand && step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Company Description</label>
              <textarea
                rows={4}
                value={brandDesc}
                onChange={(e) => setBrandDesc(e.target.value)}
                placeholder="Share what your brand builds, your aesthetic values, and what makes partnerships with your team rewarding."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Website URL</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://yourbrand.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          </div>
        )}

        {isBrand && step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Headquarters / Location</label>
              <input
                type="text"
                value={brandLocation}
                onChange={(e) => setBrandLocation(e.target.value)}
                placeholder="San Francisco, CA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Primary Contact Name</label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Partnerships Lead"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          </div>
        )}

        {/* CREATOR STEPS */}
        {!isBrand && step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <SafeImage src={photoUrl} alt="Profile avatar" className="w-16 h-16 rounded-xl object-cover border border-[#E6E1F2] dark:border-[#241C3B]" />
              <div>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#D8CFF0] dark:border-[#2E244D] text-xs font-semibold cursor-pointer hover:border-[#6D28D9]">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload Profile Photo'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload(e.target.files?.[0], 'avatar')}
                  />
                </label>
                <p className="text-[11px] text-[#786E91] mt-1">Clear editorial portrait recommended.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Full Name *</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Username *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ariachen.studio"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Location</label>
              <input
                type="text"
                value={creatorLocation}
                onChange={(e) => setCreatorLocation(e.target.value)}
                placeholder="Los Angeles, CA"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Creator Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Summarize your storytelling style, audience demographics, and favorite partnership formats."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          </div>
        )}

        {!isBrand && step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5">Primary Content Niche</label>
              <select
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              >
                {NICHES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Skills (comma separated)</label>
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-2">Active Social Platforms</label>
              <div className="flex flex-wrap gap-2">
                {PLATFORMS.map((p) => {
                  const active = selectedPlatforms.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        active
                          ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                          : 'bg-[#FAF9FC] dark:bg-[#1B1433] border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!isBrand && step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Primary Social Handle</label>
                <input
                  type="text"
                  value={socialHandle}
                  onChange={(e) => setSocialHandle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Social Profile URL</label>
                <input
                  type="url"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">Total Followers</label>
                <input
                  type="number"
                  min={0}
                  value={followersCount}
                  onChange={(e) => setFollowersCount(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Engagement %</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={100}
                  value={engagementRate}
                  onChange={(e) => setEngagementRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Starting Rate ($)</label>
                <input
                  type="number"
                  min={0}
                  value={collaborationRate}
                  onChange={(e) => setCollaborationRate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5">Collaboration Preferences</label>
              <textarea
                rows={2}
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="mt-8 pt-5 border-t border-[#EFEBF7] dark:border-[#211938] flex items-center justify-between">
          <button
            type="button"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-sm font-semibold disabled:opacity-40"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(totalSteps, s + 1))}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={handleFinish}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'Saving Profile...' : 'Complete Setup'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
