import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  ChevronUp,
  MapPin,
  Menu,
  X,
  Briefcase,
  Users,
  Layers,
  ShieldCheck,
  Sparkles,
  Check,
} from 'lucide-react';
import type { Campaign, CreatorProfile, UserRecord } from '../types';
import {
  ASSETS,
  LANDING_FAQS,
  LANDING_TESTIMONIALS,
  formatCurrency,
  formatNumberCompact,
} from '../data/demoData';
import { AnimatedCounter, CreovateLogo, SafeImage, StatusText, ThemeToggle } from './UIPrimitives';

interface LandingPageProps {
  dark: boolean;
  onToggleTheme: () => void;
  creators: CreatorProfile[];
  campaigns: Campaign[];
  currentUser: UserRecord | null;
  onOpenAuth: (mode: 'login' | 'register', defaultRole?: 'brand' | 'creator') => void;
  onEnterWorkspace: () => void;
}

export function LandingPage({
  dark,
  onToggleTheme,
  creators,
  campaigns,
  currentUser,
  onOpenAuth,
  onEnterWorkspace,
}: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [previewCreator, setPreviewCreator] = useState<CreatorProfile | null>(null);
  const [previewCampaign, setPreviewCampaign] = useState<Campaign | null>(null);

  const featuredCreators = creators.slice(0, 3);
  const trendingCampaigns = campaigns.filter((c) => c.status !== 'draft').slice(0, 3);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAF9FC] dark:bg-[#0B0814] text-[#110D1F] dark:text-[#F4F2FA] transition-colors">
      {/* Top Bar Contract: 3 clean zones */}
      <header className="sticky top-0 z-40 bg-[#FAF9FC]/88 dark:bg-[#0B0814]/88 backdrop-blur-md border-b border-[#E6E1F2] dark:border-[#211938]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection('home');
            }}
            className="shrink-0"
          >
            <CreovateLogo />
          </a>

          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-[#4E4663] dark:text-[#B5ABD0]">
            {[
              { label: 'Home', id: 'home' },
              { label: 'Discover Creators', id: 'discover-creators' },
              { label: 'Explore Campaigns', id: 'explore-campaigns' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'About', id: 'why-creovate' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="hover:text-[#6D28D9] dark:hover:text-[#C4B5FD] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
            {currentUser ? (
              <button
                type="button"
                onClick={onEnterWorkspace}
                className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Open Workspace
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onOpenAuth('login')}
                  className="hidden sm:inline-flex px-3.5 py-2 text-sm font-semibold text-[#3F3756] dark:text-[#DDD6FE] hover:text-[#6D28D9] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAuth('register', 'brand')}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  Join CREOVATE
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              className="lg:hidden w-10 h-10 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#E6E1F2] dark:border-[#211938] bg-white dark:bg-[#130E24] px-6 py-4 space-y-2">
            {[
              { label: 'Home', id: 'home' },
              { label: 'Discover Creators', id: 'discover-creators' },
              { label: 'Explore Campaigns', id: 'explore-campaigns' },
              { label: 'How It Works', id: 'how-it-works' },
              { label: 'About', id: 'why-creovate' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className="block w-full text-left py-2 text-sm font-medium text-[#3F3756] dark:text-[#DDD6FE]"
              >
                {item.label}
              </button>
            ))}
            {!currentUser && (
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('login');
                }}
                className="block w-full text-left py-2 text-sm font-semibold text-[#6D28D9] dark:text-[#C4B5FD]"
              >
                Log In
              </button>
            )}
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section id="home" className="relative overflow-hidden pt-14 pb-20 lg:pt-20 lg:pb-24">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 right-0 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-[#7C3AED]/15 via-[#3B82F6]/10 to-transparent blur-3xl dark:from-[#7C3AED]/25"
        />
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-sm font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-4">
                Create. Connect. Collaborate.
              </p>
              <h1 className="font-display font-extrabold text-[clamp(2.4rem,4.4vw,3.85rem)] leading-[1.06] tracking-tight text-[#110D1F] dark:text-[#F4F2FA] mb-6">
                Your Next Big Collaboration Starts Here.
              </h1>
              <p className="text-base sm:text-lg text-[#504766] dark:text-[#B5ABD0] leading-relaxed max-w-xl mb-8">
                One platform. Endless creative possibilities. Discover creators, connect with brands, and turn your ideas into impactful collaborations.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 mb-10">
                <button
                  type="button"
                  onClick={() => scrollToSection('discover-creators')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors shadow-sm whitespace-nowrap"
                >
                  <span>Explore Creators</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'creator'))}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-[#D4CBEB] dark:border-[#2E244D] bg-white dark:bg-[#130E24] hover:border-[#6D28D9] dark:hover:border-[#8B5CF6] text-[#110D1F] dark:text-[#F4F2FA] text-sm font-semibold transition-colors whitespace-nowrap"
                >
                  <span>Join as Creator</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#5E5678] dark:text-[#9D93BA]">
                <span>Structured Campaign Briefs</span>
                <span aria-hidden="true">·</span>
                <span>Verified Deliverable Reviews</span>
                <span aria-hidden="true">·</span>
                <span>Direct Brand-Creator Messaging</span>
              </div>
            </motion.div>

            {/* Right Column: Interactive Visual Ecosystem */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="lg:col-span-6 flex flex-col"
            >
              <div className="relative rounded-2xl overflow-hidden border border-[#E6E1F2] dark:border-[#241C3B] bg-[#150D2E] h-full min-h-[380px] flex flex-col justify-between">
                <SafeImage
                  src={ASSETS.heroStudio}
                  alt="CREOVATE brand strategist and creator collaborating in a studio"
                  className="w-full h-full object-cover absolute inset-0"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#100A24]/92 via-[#100A24]/45 to-[#100A24]/20" />

                {/* Top Subtle Connection Flow Strip */}
                <div className="relative z-10 p-5 flex items-center justify-between text-xs text-white/85">
                  <span className="font-semibold tracking-tight">Live Collaboration Flow</span>
                  <span className="font-mono tabular-nums text-[#DDD6FE]">Brief → Match → Deliver</span>
                </div>

                {/* Bottom Connected Cards */}
                <div className="relative z-10 p-5 sm:p-6 mt-auto">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl bg-[#130E24]/85 backdrop-blur-md border border-white/15 p-3.5 text-white"
                    >
                      <p className="text-[11px] text-[#C4B5FD] font-medium mb-1">01. Brand Brief</p>
                      <p className="text-xs font-semibold truncate">Obsidian Elite Launch</p>
                      <p className="text-[11px] text-white/70 font-mono tabular-nums mt-1">$18,500 · 3 deliverables</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl bg-[#130E24]/85 backdrop-blur-md border border-[#8B5CF6]/45 p-3.5 text-white"
                    >
                      <p className="text-[11px] text-[#C4B5FD] font-medium mb-1">02. Matched Creator</p>
                      <p className="text-xs font-semibold truncate">Marcus Vance</p>
                      <p className="text-[11px] text-white/70 font-mono tabular-nums mt-1">685K · 5.8% eng.</p>
                    </motion.div>

                    <motion.div
                      whileHover={{ y: -3 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-xl bg-[#130E24]/85 backdrop-blur-md border border-white/15 p-3.5 text-white"
                    >
                      <p className="text-[11px] text-[#93C5FD] font-medium mb-1">03. Measurable Output</p>
                      <p className="text-xs font-semibold truncate">90s Studio Review</p>
                      <p className="text-[11px] text-emerald-300 font-mono tabular-nums mt-1">Approved · 100%</p>
                    </motion.div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* 7. Platform Statistics Strip (Full-Width Row Below Hero Split) */}
          <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-px rounded-2xl overflow-hidden border border-[#E6E1F2] dark:border-[#241C3B] bg-[#E6E1F2] dark:bg-[#241C3B]">
            {[
              { label: 'Verified Creators', value: 14800, suffix: '+' },
              { label: 'Active Brand Studios', value: 2400, suffix: '+' },
              { label: 'Completed Campaigns', value: 38900, suffix: '+' },
              { label: 'On-Time Deliverable Rate', value: 96, suffix: '%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white dark:bg-[#130E24] px-6 py-6">
                <div className="text-2xl sm:text-3xl font-extrabold text-[#110D1F] dark:text-[#F4F2FA]">
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-xs text-[#5E5678] dark:text-[#A89EC4] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Featured Creators */}
      <section id="discover-creators" className="py-20 border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">Featured Creators</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Vetted creative voices across every major category
              </h2>
            </div>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'brand'))}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline whitespace-nowrap"
            >
              <span>Browse full directory in Brand Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredCreators.map((creator) => (
              <motion.article
                key={creator.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
                className="group rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden flex flex-col"
              >
                <div className="aspect-[4/3] overflow-hidden bg-[#EFEAF9] dark:bg-[#1B1433]">
                  <SafeImage
                    src={creator.photoUrl}
                    alt={creator.fullName}
                    fallbackTitle={creator.fullName}
                    className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-[#645C7E] dark:text-[#A89EC4] mb-1.5">
                    <span>{creator.niche}</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {creator.location}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <h3 className="text-lg font-bold text-[#110D1F] dark:text-[#F4F2FA]">{creator.fullName}</h3>
                    {creator.verified && <BadgeCheck className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />}
                  </div>
                  <p className="text-xs font-mono text-[#6E658A] dark:text-[#988EB8] mb-3">@{creator.username}</p>
                  <p className="text-sm text-[#504766] dark:text-[#B5ABD0] line-clamp-2 mb-5 leading-relaxed">
                    {creator.bio}
                  </p>

                  <div className="mt-auto pt-4 border-t border-[#EFEBF7] dark:border-[#211938] flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4 font-mono tabular-nums">
                      <div>
                        <span className="block font-bold text-[#110D1F] dark:text-[#F4F2FA]">
                          {formatNumberCompact(creator.followersCount)}
                        </span>
                        <span className="text-[11px] font-sans text-[#6E658A] dark:text-[#988EB8]">Followers</span>
                      </div>
                      <div>
                        <span className="block font-bold text-[#110D1F] dark:text-[#F4F2FA]">
                          {creator.engagementRate}%
                        </span>
                        <span className="text-[11px] font-sans text-[#6E658A] dark:text-[#988EB8]">Engagement</span>
                      </div>
                      <div>
                        <span className="block font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                          {formatCurrency(creator.collaborationRate)}
                        </span>
                        <span className="text-[11px] font-sans text-[#6E658A] dark:text-[#988EB8]">Starting rate</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewCreator(creator)}
                      className="text-xs font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline whitespace-nowrap"
                    >
                      View Profile
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 2. Trending Campaigns */}
      <section id="explore-campaigns" className="py-20 bg-white/70 dark:bg-[#100B1E] border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">Trending Campaigns</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Live briefs ready for creator partnerships
              </h2>
            </div>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'creator'))}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#6D28D9] dark:text-[#C4B5FD] hover:underline whitespace-nowrap"
            >
              <span>Apply inside Creator Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trendingCampaigns.map((camp) => (
              <motion.article
                key={camp.id}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.18 }}
                className="rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/10] overflow-hidden bg-[#EFEAF9] dark:bg-[#1B1433]">
                  <SafeImage
                    src={camp.coverImageUrl}
                    alt={camp.title}
                    fallbackTitle={camp.brandName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 text-xs text-[#645C7E] dark:text-[#A89EC4] mb-2">
                    <span className="font-semibold text-[#110D1F] dark:text-[#E9E4F7]">{camp.brandName}</span>
                    <StatusText status={camp.status} />
                  </div>
                  <h3 className="text-lg font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-2">{camp.title}</h3>
                  <p className="text-sm text-[#504766] dark:text-[#B5ABD0] line-clamp-2 mb-4 leading-relaxed">
                    {camp.description}
                  </p>
                  <div className="text-xs text-[#645C7E] dark:text-[#A89EC4] mb-5">
                    <span>{camp.niche}</span>
                    <span className="mx-1.5" aria-hidden="true">·</span>
                    <span>{camp.platforms.join(', ')}</span>
                  </div>
                  <div className="mt-auto pt-4 border-t border-[#EFEBF7] dark:border-[#211938] flex items-center justify-between">
                    <div>
                      <span className="block text-base font-bold font-mono tabular-nums text-[#6D28D9] dark:text-[#C4B5FD]">
                        {formatCurrency(camp.budget)}
                      </span>
                      <span className="text-[11px] text-[#6E658A] dark:text-[#988EB8]">
                        Due {camp.endDate || 'Flexible'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPreviewCampaign(camp)}
                      className="px-3.5 py-2 rounded-xl border border-[#D8CFF0] dark:border-[#2E244D] text-xs font-semibold hover:border-[#6D28D9] dark:hover:border-[#8B5CF6] transition-colors whitespace-nowrap"
                    >
                      Inspect Brief
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How CREOVATE Works */}
      <section id="how-it-works" className="py-20 border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">How CREOVATE Works</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
              From discovery to approved deliverables in one structured pipeline
            </h2>
            <p className="text-sm sm:text-base text-[#504766] dark:text-[#B5ABD0]">
              Replace fragmented email chains, spreadsheets, and missed deadlines with verifiable workflow stages.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                num: '01. Build Your Profile',
                desc: 'Onboard as a Brand Studio or Creator Hub with verified portfolio media, audience metrics, and collaboration rates.',
              },
              {
                num: '02. Match & Shortlist',
                desc: 'Filter creators by niche, engagement, platform, and budget—or use CREOVATE Intelligence to shortlist ideal partners.',
              },
              {
                num: '03. Launch Briefs & Invite',
                desc: 'Publish multi-step campaign briefs, send deduplicated invitations, and align directly in campaign-linked messaging.',
              },
              {
                num: '04. Review & Complete',
                desc: 'Track collaboration progress, review uploaded deliverables with revision notes, and close campaigns cleanly.',
              },
            ].map((step) => (
              <div
                key={step.num}
                className="p-6 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]"
              >
                <h3 className="text-base font-bold text-[#110D1F] dark:text-[#F4F2FA] mb-2.5">{step.num}</h3>
                <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Built for Brands & 5. Made for Creators */}
      <section className="py-20 bg-white/70 dark:bg-[#100B1E] border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="p-8 sm:p-10 rounded-2xl bg-[#150D2E] text-white border border-[#2C1E59] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#C4B5FD] mb-4">
                <Briefcase className="w-4 h-4" />
                <span>Built for Brands — Brand Studio</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Run your creator marketing like an in-house agency
              </h3>
              <p className="text-sm text-[#D5CCE8] leading-relaxed mb-6">
                Discover vetted creators, organize talent into custom contact folders, craft multi-step campaign briefs, and review every asset before launch.
              </p>
              <ul className="space-y-3 text-sm text-[#ECE7F8] mb-8">
                {[
                  'Multi-filter creator search with Grid and List views',
                  'Multi-step Campaign Studio with draft, open, active, and completed tracking',
                  'Deliverable review portal with one-click approval or revision feedback',
                  'CREOVATE Intelligence for smart matching and structured brief copy',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#A78BFA] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'brand'))}
              className="w-fit inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-[#150D2E] hover:bg-[#EFEAF9] text-sm font-bold transition-colors whitespace-nowrap"
            >
              <span>Launch Brand Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="p-8 sm:p-10 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-4">
                <Users className="w-4 h-4" />
                <span>Made for Creators — Creator Hub</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-bold tracking-tight mb-4">
                Your creativity deserves the right opportunities
              </h3>
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed mb-6">
                Present your work in a visual portfolio gallery, connect your social channels, discover paid campaigns, and manage deliverables without inbox chaos.
              </p>
              <ul className="space-y-3 text-sm text-[#3F3756] dark:text-[#D5CCE8] mb-8">
                {[
                  'Masonry Portfolio Studio with real media uploads and video links',
                  'Interactive campaign marketplace with instant applications',
                  'Clear invitation review: inspect budget, deliverables, and accept or decline',
                  'Creator Profile Assistant to sharpen your bio and brand pitch',
                ].map((pt) => (
                  <li key={pt} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0 mt-0.5" />
                    <span>{pt}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'creator'))}
              className="w-fit inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap"
            >
              <span>Enter Creator Hub</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 6. Why CREOVATE? (Asymmetric Editorial Bento) */}
      <section id="why-creovate" className="py-20 border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">Why CREOVATE?</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Purpose-built infrastructure for measurable creative work
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
              <Layers className="w-5 h-5 text-[#6D28D9] dark:text-[#A78BFA] mb-4" />
              <h3 className="text-xl font-bold mb-2">End-to-End Connected State</h3>
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed max-w-2xl">
                When a brand dispatches an invitation, it appears instantaneously in the creator&apos;s request queue. Accepting atomically opens a shared collaboration tracker, links direct messaging, and unlocks deliverable submissions—eliminating duplicate invites and out-of-sync spreadsheets.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
              <Sparkles className="w-5 h-5 text-[#2563EB] dark:text-[#60A5FA] mb-4" />
              <h3 className="text-xl font-bold mb-2">CREOVATE Intelligence</h3>
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">
                Optional Gemini-powered brief writing, creator matching, and bio coaching—always clearly distinguished from verified platform metrics.
              </p>
            </div>
            <div className="p-8 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B]">
              <ShieldCheck className="w-5 h-5 text-[#6D28D9] dark:text-[#A78BFA] mb-4" />
              <h3 className="text-xl font-bold mb-2">Role-Scoped Security & Moderation</h3>
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">
                Every private record, conversation thread, and administrative moderation action is guarded by strict Firestore rules and audit trails.
              </p>
            </div>
            <div className="lg:col-span-2 p-8 rounded-2xl bg-gradient-to-r from-[#EFEAF9] via-[#F4F1FA] to-[#EFF6FF] dark:from-[#1B1333] dark:via-[#17112B] dark:to-[#131C36] border border-[#DDD4F3] dark:border-[#2A2047] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
              <div>
                <h3 className="text-xl font-bold mb-1.5">Ready to orchestrate your next campaign?</h3>
                <p className="text-sm text-[#504766] dark:text-[#B5ABD0]">
                  Create your Brand Studio or Creator Hub account in under two minutes.
                </p>
              </div>
              <button
                type="button"
                onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'brand'))}
                className="px-5 py-3 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0"
              >
                Get Started Free
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Testimonials */}
      <section className="py-20 bg-white/70 dark:bg-[#100B1E] border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-12">
            <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">Testimonials</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Trusted by modern marketing teams and independent creators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {LANDING_TESTIMONIALS.map((item) => (
              <blockquote
                key={item.name}
                className="p-7 rounded-2xl bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-mono font-semibold text-[#6D28D9] dark:text-[#C4B5FD] mb-3">
                    {item.metric}
                  </p>
                  <p className="text-sm text-[#2A233D] dark:text-[#E5DFF5] leading-relaxed mb-6">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>
                <footer className="pt-4 border-t border-[#EFEBF7] dark:border-[#211938]">
                  <p className="text-sm font-bold text-[#110D1F] dark:text-[#F4F2FA]">{item.name}</p>
                  <p className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                    {item.role} · {item.company}
                  </p>
                </footer>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Frequently Asked Questions */}
      <section className="py-20 border-t border-[#E6E1F2] dark:border-[#1E1733]">
        <div className="max-w-3xl mx-auto px-6">
          <div className="mb-10">
            <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-2">Frequently Asked Questions</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Everything you need to know</h2>
          </div>

          <div className="divide-y divide-[#E6E1F2] dark:divide-[#241C3B] border-y border-[#E6E1F2] dark:border-[#241C3B]">
            {LANDING_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q} className="py-5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 text-left"
                  >
                    <span className="text-base font-semibold text-[#110D1F] dark:text-[#F4F2FA]">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA] shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-[#6E658A] shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <p className="mt-3 text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. Quiet Footer */}
      <footer className="py-12 border-t border-[#E6E1F2] dark:border-[#1E1733] bg-white dark:bg-[#0E0A1A]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <CreovateLogo />
            <p className="text-xs text-[#645C7E] dark:text-[#9D93BA] mt-2 max-w-sm">
              Create. Connect. Collaborate. Transforming creator partnerships into structured, measurable outcomes.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#58506E] dark:text-[#A89EC4]">
            <button type="button" onClick={() => scrollToSection('discover-creators')} className="hover:text-[#6D28D9]">
              Discover Creators
            </button>
            <button type="button" onClick={() => scrollToSection('explore-campaigns')} className="hover:text-[#6D28D9]">
              Explore Campaigns
            </button>
            <button type="button" onClick={() => scrollToSection('how-it-works')} className="hover:text-[#6D28D9]">
              How It Works
            </button>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'brand'))}
              className="hover:text-[#6D28D9]"
            >
              Brand Studio
            </button>
            <button
              type="button"
              onClick={() => (currentUser ? onEnterWorkspace() : onOpenAuth('register', 'creator'))}
              className="hover:text-[#6D28D9]"
            >
              Creator Hub
            </button>
          </div>
          <p className="text-xs text-[#786E91] dark:text-[#7E7499]">© {new Date().getFullYear()} CREOVATE</p>
        </div>
      </footer>

      {/* Creator Preview Modal */}
      {previewCreator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/65 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 flex items-start justify-between gap-4 border-b border-[#EFEBF7] dark:border-[#211938]">
              <div className="flex items-center gap-4">
                <SafeImage
                  src={previewCreator.photoUrl}
                  alt={previewCreator.fullName}
                  className="w-14 h-14 rounded-xl object-cover"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-bold">{previewCreator.fullName}</h3>
                    {previewCreator.verified && <BadgeCheck className="w-4 h-4 text-[#6D28D9] dark:text-[#A78BFA]" />}
                  </div>
                  <p className="text-xs font-mono text-[#6E658A] dark:text-[#A89EC4]">
                    @{previewCreator.username} · {previewCreator.niche}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCreator(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{previewCreator.bio}</p>
              <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF9FC] dark:bg-[#1B1433] border border-[#EFEBF7] dark:border-[#241C3B] text-center">
                <div>
                  <span className="block text-base font-bold font-mono tabular-nums">
                    {formatNumberCompact(previewCreator.followersCount)}
                  </span>
                  <span className="text-[11px] text-[#6E658A]">Followers</span>
                </div>
                <div>
                  <span className="block text-base font-bold font-mono tabular-nums">
                    {previewCreator.engagementRate}%
                  </span>
                  <span className="text-[11px] text-[#6E658A]">Engagement</span>
                </div>
                <div>
                  <span className="block text-base font-bold font-mono tabular-nums text-[#6D28D9] dark:text-[#C4B5FD]">
                    {formatCurrency(previewCreator.collaborationRate)}
                  </span>
                  <span className="text-[11px] text-[#6E658A]">Base Rate</span>
                </div>
              </div>
              <div className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                <strong className="text-[#110D1F] dark:text-[#F4F2FA]">Skills: </strong>
                {previewCreator.skills.join(' · ')}
              </div>
              <div className="text-xs text-[#645C7E] dark:text-[#A89EC4]">
                <strong className="text-[#110D1F] dark:text-[#F4F2FA]">Platforms: </strong>
                {previewCreator.platforms.join(' · ')}
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setPreviewCreator(null)}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-sm font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewCreator(null);
                    if (currentUser) onEnterWorkspace();
                    else onOpenAuth('register', 'brand');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold"
                >
                  {currentUser ? 'Open in Workspace' : 'Join as Brand to Invite'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Preview Modal */}
      {previewCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0814]/65 backdrop-blur-sm p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#130E24] border border-[#E6E1F2] dark:border-[#241C3B] rounded-2xl overflow-hidden shadow-2xl">
            <div className="p-6 flex items-start justify-between gap-4 border-b border-[#EFEBF7] dark:border-[#211938]">
              <div>
                <p className="text-xs font-semibold text-[#6D28D9] dark:text-[#A78BFA] mb-1">
                  {previewCampaign.brandName} · {previewCampaign.niche}
                </p>
                <h3 className="text-lg font-bold">{previewCampaign.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCampaign(null)}
                aria-label="Close modal"
                className="p-1.5 rounded-lg hover:bg-[#F4F1FA] dark:hover:bg-[#1B1433]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-[#504766] dark:text-[#B5ABD0] leading-relaxed">{previewCampaign.description}</p>
              <div className="text-xs space-y-1.5">
                <p className="font-semibold text-[#110D1F] dark:text-[#F4F2FA]">Deliverables</p>
                <ul className="list-disc pl-5 text-[#504766] dark:text-[#B5ABD0] space-y-1">
                  {previewCampaign.deliverables.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#EFEBF7] dark:border-[#211938] text-sm">
                <span className="font-mono font-bold text-[#6D28D9] dark:text-[#C4B5FD]">
                  Budget: {formatCurrency(previewCampaign.budget)}
                </span>
                <span className="text-xs text-[#645C7E] dark:text-[#A89EC4]">Deadline: {previewCampaign.endDate}</span>
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPreviewCampaign(null)}
                  className="px-4 py-2 rounded-xl border border-[#E6E1F2] dark:border-[#241C3B] text-sm font-medium"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPreviewCampaign(null);
                    if (currentUser) onEnterWorkspace();
                    else onOpenAuth('register', 'creator');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#6D28D9] hover:bg-[#5B21B6] text-white text-sm font-semibold"
                >
                  {currentUser ? 'Open in Workspace' : 'Join as Creator to Apply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
