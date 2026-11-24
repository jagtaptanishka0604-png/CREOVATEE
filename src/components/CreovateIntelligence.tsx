import React, { useEffect, useState } from 'react';
import { Sparkles, Users, FileText, ClipboardList, UserCheck, Lightbulb, AlertCircle, Copy, Check } from 'lucide-react';
import type { Campaign, CreatorProfile, PortfolioItem } from '../types';
import {
  aiAssistCreatorProfile,
  aiCollabSuggestions,
  aiGenerateCampaignBrief,
  aiGenerateCampaignDescription,
  aiMatchCreators,
  checkAiStatus,
  type CampaignBriefResult,
  type CampaignDescriptionResult,
  type CollabSuggestionsResult,
  type CreatorMatchResult,
  type CreatorProfileAssistResult,
} from '../lib/api';
import { NICHES, PLATFORMS } from '../data/demoData';
import { AiSourceLabel } from './UIPrimitives';

interface CreovateIntelligenceProps {
  role: 'brand' | 'creator';
  brandName?: string;
  creators: CreatorProfile[];
  campaigns: Campaign[];
  creatorProfile?: CreatorProfile | null;
  portfolioItems?: PortfolioItem[];
  onApplyBio?: (bio: string) => void;
  onInviteCreator?: (creator: CreatorProfile) => void;
  onToast: (type: 'success' | 'error' | 'info', title: string, description?: string) => void;
}

type ToolKey = 'match' | 'description' | 'brief' | 'profile' | 'suggestions';

export function CreovateIntelligence({
  role,
  brandName = 'Your Brand',
  creators,
  campaigns,
  creatorProfile,
  portfolioItems = [],
  onApplyBio,
  onInviteCreator,
  onToast,
}: CreovateIntelligenceProps) {
  const [available, setAvailable] = useState<boolean | null>(null);
  const [activeTool, setActiveTool] = useState<ToolKey>(role === 'brand' ? 'match' : 'profile');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copied, setCopied] = useState(false);

  // Inputs
  const [niche, setNiche] = useState(creatorProfile?.niche || NICHES[0]);
  const [budget, setBudget] = useState('10000');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['YouTube', 'Instagram']);
  const [title, setTitle] = useState('');
  const [objectives, setObjectives] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [bioDraft, setBioDraft] = useState(creatorProfile?.bio || '');

  // Results
  const [matchResult, setMatchResult] = useState<CreatorMatchResult | null>(null);
  const [descResult, setDescResult] = useState<CampaignDescriptionResult | null>(null);
  const [briefResult, setBriefResult] = useState<CampaignBriefResult | null>(null);
  const [profileResult, setProfileResult] = useState<CreatorProfileAssistResult | null>(null);
  const [suggestResult, setSuggestResult] = useState<CollabSuggestionsResult | null>(null);

  useEffect(() => {
    void checkAiStatus().then((res) => setAvailable(res.available));
  }, []);

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  };

  const copyText = (text: string) => {
    void navigator.clipboard.writeText(text);
    setCopied(true);
    onToast('success', 'Copied to clipboard');
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      if (activeTool === 'match') {
        const res = await aiMatchCreators({
          niche,
          budget: Number(budget) || 5000,
          platforms: selectedPlatforms,
          objectives: objectives || 'High-engagement launch campaign',
          creators: creators.slice(0, 15).map((c) => ({
            id: c.id,
            fullName: c.fullName,
            niche: c.niche,
            platforms: c.platforms,
            followersCount: c.followersCount,
            engagementRate: c.engagementRate,
            collaborationRate: c.collaborationRate,
            bio: c.bio,
          })),
        });
        setMatchResult(res);
      } else if (activeTool === 'description') {
        const res = await aiGenerateCampaignDescription({
          brandName,
          title: title || 'New Product Launch',
          niche,
          objectives: objectives || 'Build awareness and pre-orders',
          targetAudience: targetAudience || 'Modern digital creators and early adopters',
        });
        setDescResult(res);
      } else if (activeTool === 'brief') {
        const res = await aiGenerateCampaignBrief({
          title: title || 'Creator Campaign Brief',
          niche,
          objectives: objectives || 'Drive authentic storytelling and conversions',
          platforms: selectedPlatforms,
          budget: Number(budget) || 8000,
        });
        setBriefResult(res);
      } else if (activeTool === 'profile') {
        const res = await aiAssistCreatorProfile({
          fullName: creatorProfile?.fullName || 'Creator',
          niche: creatorProfile?.niche || niche,
          bio: bioDraft || creatorProfile?.bio || 'Digital creator sharing visual stories.',
          skills: creatorProfile?.skills || ['Video Production', 'Storytelling'],
          portfolioSummary: portfolioItems.map((p) => `${p.title} (${p.category})`).join('; ') || 'Visual portfolio projects',
        });
        setProfileResult(res);
      } else if (activeTool === 'suggestions') {
        const contextSummary =
          role === 'brand'
            ? `Brand: ${brandName}. Available creator niches: ${Array.from(new Set(creators.map((c) => c.niche))).join(', ')}. Active campaigns: ${campaigns.slice(0, 4).map((c) => c.title).join(', ')}.`
            : `Creator: ${creatorProfile?.fullName || 'Creator'} in ${creatorProfile?.niche || niche}. Open campaigns: ${campaigns.slice(0, 5).map((c) => `${c.title} by ${c.brandName} ($${c.budget})`).join('; ')}.`;
        const res = await aiCollabSuggestions({ role, contextSummary });
        setSuggestResult(res);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to reach CREOVATE Intelligence.');
    } finally {
      setLoading(false);
    }
  };

  const tools: { key: ToolKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'match', label: 'Smart Creator Matching', icon: Users },
    { key: 'description', label: 'Description Generator', icon: FileText },
    { key: 'brief', label: 'Campaign Brief Assistant', icon: ClipboardList },
    { key: 'profile', label: 'Creator Profile Assistant', icon: UserCheck },
    { key: 'suggestions', label: 'Collaboration Suggestions', icon: Lightbulb },
  ];

  return (
    <div className="space-y-6">
      <div className="p-6 rounded-2xl bg-gradient-to-r from-[#150D2E] via-[#1E1242] to-[#17204A] text-white border border-[#2F215E]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C4B5FD] mb-2">
              <Sparkles className="w-4 h-4" />
              <span>CREOVATE INTELLIGENCE</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              AI-assisted strategy, matching, and creative briefs
            </h2>
            <p className="text-sm text-[#D5CCE8] mt-1 max-w-2xl">
              Generate tailored creator shortlists, campaign copy, structured briefs, and profile refinements. AI outputs are always clearly distinguished from verified platform metrics.
            </p>
          </div>
          {available === false && (
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/15 border border-amber-400/30 text-xs text-amber-200 max-w-xs">
              AI service is currently offline (API key not configured). Core platform workflows remain fully operational.
            </div>
          )}
        </div>
      </div>

      {/* Tool Selector */}
      <div className="flex flex-wrap gap-2">
        {tools.map((t) => {
          const Icon = t.icon;
          const active = activeTool === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setActiveTool(t.key);
                setErrorMsg('');
              }}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-colors whitespace-nowrap ${
                active
                  ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                  : 'bg-white dark:bg-[#130E24] border-[#E6E1F2] dark:border-[#241C3B] text-[#4E4663] dark:text-[#C4B8E3] hover:border-[#6D28D9]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-sm text-rose-700 dark:text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Form */}
        <form
          onSubmit={handleRun}
          className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-4 h-fit"
        >
          <h3 className="text-base font-bold">{tools.find((t) => t.key === activeTool)?.label}</h3>

          {(activeTool === 'description' || activeTool === 'brief') && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Campaign Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Spring Acoustic Headphones Drop"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          )}

          {activeTool !== 'suggestions' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Content Niche</label>
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
          )}

          {(activeTool === 'match' || activeTool === 'brief') && (
            <>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Budget (USD)</label>
                <input
                  type="number"
                  min={0}
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm font-mono tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">Target Platforms</label>
                <div className="flex flex-wrap gap-1.5">
                  {PLATFORMS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePlatform(p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                        selectedPlatforms.includes(p)
                          ? 'bg-[#6D28D9] text-white border-[#6D28D9]'
                          : 'border-[#E6E1F2] dark:border-[#241C3B] text-[#58506E] dark:text-[#A89EC4]'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {activeTool === 'description' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Target Audience</label>
              <input
                type="text"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                placeholder="Design-conscious remote creators aged 24-38"
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          )}

          {(activeTool === 'match' || activeTool === 'description' || activeTool === 'brief') && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Campaign Objectives</label>
              <textarea
                rows={3}
                value={objectives}
                onChange={(e) => setObjectives(e.target.value)}
                placeholder="Describe conversion goals, product angles, or launch milestones..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          )}

          {activeTool === 'profile' && (
            <div>
              <label className="block text-xs font-semibold mb-1.5">Current Bio to Enhance</label>
              <textarea
                rows={4}
                value={bioDraft}
                onChange={(e) => setBioDraft(e.target.value)}
                placeholder="Paste your current creator bio or key talking points..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] bg-[#FAF9FC] dark:bg-[#1B1433] text-sm"
              />
            </div>
          )}

          {activeTool === 'suggestions' && (
            <p className="text-xs text-[#58506E] dark:text-[#A89EC4] leading-relaxed">
              Analyzes available creators ({creators.length}) and live campaigns ({campaigns.length}) on CREOVATE to propose 3 concrete partnership concepts tailored for your {role} workspace.
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{loading ? 'Generating with Gemini...' : 'Generate Recommendations'}</span>
          </button>
        </form>

        {/* Results Panel */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] space-y-5">
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EFEBF7] dark:border-[#211938]">
            <h3 className="text-base font-bold">Intelligence Output</h3>
            <AiSourceLabel />
          </div>

          {loading ? (
            <div className="space-y-3 py-6">
              <div className="h-5 w-2/3 rounded bg-[#EFEAF9] dark:bg-[#1B1433] animate-pulse" />
              <div className="h-24 rounded-xl bg-[#EFEAF9] dark:bg-[#1B1433] animate-pulse" />
              <div className="h-24 rounded-xl bg-[#EFEAF9] dark:bg-[#1B1433] animate-pulse" />
            </div>
          ) : (
            <>
              {activeTool === 'match' && matchResult && (
                <div className="space-y-4">
                  <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{matchResult.summary}</p>
                  <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938] border-t border-[#EFEBF7] dark:border-[#211938]">
                    {matchResult.recommendations?.map((rec, i) => {
                      const matchedObj = creators.find((c) => c.id === rec.creatorId);
                      return (
                        <div key={i} className="py-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-[#110D1F] dark:text-[#F4F2FA]">
                              0{i + 1}. {rec.creatorName}
                            </p>
                            <p className="text-xs text-[#504766] dark:text-[#B5ABD0]">{rec.fitSummary}</p>
                            <p className="text-xs text-[#6D28D9] dark:text-[#C4B5FD]">
                              Angle: {rec.suggestedAngle} · {rec.budgetAlignment}
                            </p>
                          </div>
                          {matchedObj && onInviteCreator && (
                            <button
                              type="button"
                              onClick={() => onInviteCreator(matchedObj)}
                              className="px-3.5 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-xs font-semibold whitespace-nowrap shrink-0"
                            >
                              Invite Creator
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTool === 'description' && descResult && (
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-[#110D1F] dark:text-[#F4F2FA] leading-relaxed whitespace-pre-wrap">
                      {descResult.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => copyText(descResult.description)}
                      className="p-2 rounded-lg border border-[#E6E1F2] dark:border-[#241C3B] hover:border-[#6D28D9] shrink-0"
                      aria-label="Copy description"
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {descResult.messagingAngles?.length > 0 && (
                    <div>
                      <p className="text-xs font-bold mb-1.5">Messaging Angles</p>
                      <ul className="list-disc pl-5 text-xs text-[#504766] dark:text-[#B5ABD0] space-y-1">
                        {descResult.messagingAngles.map((a, idx) => (
                          <li key={idx}>{a}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD]">
                    Suggested CTA: {descResult.callToAction}
                  </p>
                </div>
              )}

              {activeTool === 'brief' && briefResult && (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-bold mb-1.5">Recommended Deliverables</p>
                    <ul className="list-disc pl-5 text-xs text-[#504766] dark:text-[#B5ABD0] space-y-1">
                      {briefResult.deliverables?.map((d, idx) => (
                        <li key={idx}>{d}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-bold mb-1">Creative Instructions</p>
                    <p className="text-xs text-[#504766] dark:text-[#B5ABD0] leading-relaxed">
                      {briefResult.instructions}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#EFEBF7] dark:border-[#211938]">
                    <div>
                      <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">Creative Do&apos;s</p>
                      <ul className="list-disc pl-4 text-xs text-[#504766] dark:text-[#B5ABD0] space-y-1">
                        {briefResult.creativeDos?.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400 mb-1">Creative Don&apos;ts</p>
                      <ul className="list-disc pl-4 text-xs text-[#504766] dark:text-[#B5ABD0] space-y-1">
                        {briefResult.creativeDonts?.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {activeTool === 'profile' && profileResult && (
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-xs font-bold">Upgraded Creator Bio</p>
                      {onApplyBio && (
                        <button
                          type="button"
                          onClick={() => onApplyBio(profileResult.improvedBio)}
                          className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline"
                        >
                          Apply to My Profile
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-[#110D1F] dark:text-[#F4F2FA] leading-relaxed p-4 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1433]">
                      {profileResult.improvedBio}
                    </p>
                  </div>
                  <p className="text-xs text-[#504766] dark:text-[#B5ABD0]">
                    <strong className="text-[#110D1F] dark:text-[#F4F2FA]">Brand Pitch Line: </strong>
                    {profileResult.suggestedPitchLine}
                  </p>
                  <p className="text-xs text-[#504766] dark:text-[#B5ABD0]">
                    <strong className="text-[#110D1F] dark:text-[#F4F2FA]">Portfolio Tip: </strong>
                    {profileResult.portfolioTip}
                  </p>
                  {profileResult.profileChecklist?.length > 0 && (
                    <ul className="list-disc pl-5 text-xs text-[#504766] dark:text-[#B5ABD0] space-y-1">
                      {profileResult.profileChecklist.map((c, idx) => (
                        <li key={idx}>{c}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {activeTool === 'suggestions' && suggestResult && (
                <div className="divide-y divide-[#EFEBF7] dark:divide-[#211938]">
                  {suggestResult.suggestions?.map((s, idx) => (
                    <div key={idx} className="py-4 first:pt-0 last:pb-0 space-y-1">
                      <p className="text-sm font-bold text-[#110D1F] dark:text-[#F4F2FA]">
                        0{idx + 1}. {s.title}
                      </p>
                      <p className="text-xs text-[#6D28D9] dark:text-[#C4B5FD] font-medium">{s.partnerFocus}</p>
                      <p className="text-xs text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{s.concept}</p>
                      <p className="text-xs text-[#6E658A] dark:text-[#988EB8]">Deliverable: {s.deliverableIdea}</p>
                    </div>
                  ))}
                </div>
              )}

              {((activeTool === 'match' && !matchResult) ||
                (activeTool === 'description' && !descResult) ||
                (activeTool === 'brief' && !briefResult) ||
                (activeTool === 'profile' && !profileResult) ||
                (activeTool === 'suggestions' && !suggestResult)) && (
                <div className="py-12 text-center text-sm text-[#786E91] dark:text-[#988EB8]">
                  Configure your parameters on the left and click &ldquo;Generate Recommendations&rdquo; to run CREOVATE Intelligence.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
