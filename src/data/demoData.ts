import type { BrandProfile, CreatorProfile, Campaign, PortfolioItem, SocialAccount } from '../types';

export const ASSETS = {
  heroStudio: '/src/assets/images/hero_creative_studio_1795431805078.jpg',
  creatorAria: '/src/assets/images/creator_portrait_aria_1795431800046.jpg',
  creatorMarcus: '/src/assets/images/creator_portrait_marcus_1795431800155.jpg',
  creatorPriya: '/src/assets/images/creator_portrait_priya_1795431799220.jpg',
  campaignTech: '/src/assets/images/campaign_tech_launch_1795431800969.jpg',
  campaignSkincare: '/src/assets/images/campaign_botanical_skincare_1795431816696.jpg',
};

export const NICHES = [
  'Technology & Audio',
  'Beauty & Skincare',
  'Fashion & Editorial',
  'Lifestyle & Travel',
  'Fitness & Wellness',
  'Productivity & SaaS',
  'Food & Culinary',
  'Gaming & Esports',
];

export const PLATFORMS = ['YouTube', 'Instagram', 'TikTok', 'LinkedIn', 'X', 'Podcast'];

export const DEMO_BRANDS: BrandProfile[] = [
  {
    id: 'demo_brand_kora',
    ownerId: 'demo_brand_kora',
    brandName: 'Kora Acoustics',
    description:
      'Industrial audio engineering studio crafting wireless reference headphones and spatial sound gear for creative professionals.',
    industry: 'Consumer Technology',
    website: 'https://kora-acoustics.example.com',
    logoUrl: ASSETS.campaignTech,
    location: 'San Francisco, CA',
    contactName: 'Hannah Brooks',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_brand_valois',
    ownerId: 'demo_brand_valois',
    brandName: 'Valois Botanicals',
    description:
      'Dermatologist-formulated skincare house pairing cold-pressed botanical actives with refillable architectural glass packaging.',
    industry: 'Beauty & Skincare',
    website: 'https://valois-botanicals.example.com',
    logoUrl: ASSETS.campaignSkincare,
    location: 'New York, NY',
    contactName: 'Camille Laurent',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
];

export const DEMO_CREATORS: CreatorProfile[] = [
  {
    id: 'demo_creator_aria',
    ownerId: 'demo_creator_aria',
    fullName: 'Aria Chen',
    username: 'ariachen.studio',
    photoUrl: ASSETS.creatorAria,
    bio: 'Filmmaker and lifestyle storyteller producing cinematic product narratives, studio tours, and honest daily-routine integrations for design-led consumer brands.',
    location: 'Los Angeles, CA',
    niche: 'Lifestyle & Travel',
    skills: ['4K Cinematography', 'Short-Form Reels', 'Color Grading', 'Creative Direction', 'Voiceover'],
    platforms: ['YouTube', 'Instagram', 'TikTok'],
    followersCount: 412000,
    engagementRate: 6.4,
    collaborationRate: 3800,
    preferences: 'Long-term ambassador series, launch storytelling, and product design deep dives.',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_creator_marcus',
    ownerId: 'demo_creator_marcus',
    fullName: 'Marcus Vance',
    username: 'marcusbuilds',
    photoUrl: ASSETS.creatorMarcus,
    bio: 'Industrial designer and consumer tech reviewer dissecting acoustics, desk ergonomics, and creative software workflows with lab-grade benchmarks.',
    location: 'Austin, TX',
    niche: 'Technology & Audio',
    skills: ['Product Breakdown', 'YouTube Long-Form', 'B-Roll Production', 'Audio Testing', 'Newsletter'],
    platforms: ['YouTube', 'X', 'LinkedIn'],
    followersCount: 685000,
    engagementRate: 5.8,
    collaborationRate: 6200,
    preferences: 'Dedicated hardware reviews, integrated mid-roll spotlights, and technical launch livestreams.',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_creator_priya',
    ownerId: 'demo_creator_priya',
    fullName: 'Priya Nair',
    username: 'priya.editorial',
    photoUrl: ASSETS.creatorPriya,
    bio: 'Visual art director and skincare educator translating formulation science into tactile editorial reels and high-converting lookbooks.',
    location: 'London, UK',
    niche: 'Beauty & Skincare',
    skills: ['Editorial Photography', 'Ingredient Breakdowns', 'TikTok Series', 'UGC Production', 'Styling'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    followersCount: 294000,
    engagementRate: 7.9,
    collaborationRate: 2900,
    preferences: 'Routine diaries, clinical skincare launches, and sustainable fashion capsules.',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_creator_devon',
    ownerId: 'demo_creator_devon',
    fullName: 'Devon Sato',
    username: 'devon.frames',
    photoUrl: ASSETS.heroStudio,
    bio: 'SaaS workflow strategist and workspace filmmaker helping creative founders adopt modern tools through transparent case-study videos.',
    location: 'Seattle, WA',
    niche: 'Productivity & SaaS',
    skills: ['Case Studies', 'YouTube Tutorials', 'LinkedIn Carousels', 'Podcast Host'],
    platforms: ['YouTube', 'LinkedIn', 'Podcast'],
    followersCount: 178000,
    engagementRate: 6.1,
    collaborationRate: 2400,
    preferences: 'B2B software walkthroughs, workflow playbooks, and sponsored podcast segments.',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_creator_elena',
    ownerId: 'demo_creator_elena',
    fullName: 'Elena Rostova',
    username: 'elenamoves',
    photoUrl: ASSETS.campaignSkincare,
    bio: 'Strength coach and holistic wellness creator documenting marathon prep, recovery rituals, and clean nutrition for busy professionals.',
    location: 'Toronto, Canada',
    niche: 'Fitness & Wellness',
    skills: ['Training Programs', 'Reels & Shorts', 'Brand Ambassadorship', 'Live Events'],
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    followersCount: 340000,
    engagementRate: 8.2,
    collaborationRate: 3200,
    preferences: 'Wearable tech trials, recovery gear, and 30-day wellness challenges.',
    verified: false,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_creator_lucas',
    ownerId: 'demo_creator_lucas',
    fullName: 'Lucas Meyer',
    username: 'lucastastes',
    photoUrl: ASSETS.campaignTech,
    bio: 'Specialty coffee roaster and culinary cinematographer creating atmospheric recipe films and kitchen hardware spotlights.',
    location: 'Berlin, Germany',
    niche: 'Food & Culinary',
    skills: ['ASMR Food Film', 'Recipe Development', 'Studio Stills', 'Short-Form Video'],
    platforms: ['Instagram', 'YouTube', 'TikTok'],
    followersCount: 225000,
    engagementRate: 7.1,
    collaborationRate: 2700,
    preferences: 'Espresso equipment launches, artisan pantry brands, and hospitality partnerships.',
    verified: true,
    visibility: 'public',
    isDemo: true,
  },
];

export const DEMO_SOCIAL_ACCOUNTS: SocialAccount[] = [
  {
    id: 'demo_soc_1',
    ownerId: 'demo_creator_aria',
    creatorId: 'demo_creator_aria',
    platform: 'YouTube',
    handle: '@ariachenstudio',
    url: 'https://youtube.com',
    followers: 245000,
    engagementRate: 6.8,
    visibility: 'public',
  },
  {
    id: 'demo_soc_2',
    ownerId: 'demo_creator_aria',
    creatorId: 'demo_creator_aria',
    platform: 'Instagram',
    handle: '@ariachen.studio',
    url: 'https://instagram.com',
    followers: 167000,
    engagementRate: 5.9,
    visibility: 'public',
  },
  {
    id: 'demo_soc_3',
    ownerId: 'demo_creator_marcus',
    creatorId: 'demo_creator_marcus',
    platform: 'YouTube',
    handle: '@marcusbuilds',
    url: 'https://youtube.com',
    followers: 520000,
    engagementRate: 6.2,
    visibility: 'public',
  },
  {
    id: 'demo_soc_4',
    ownerId: 'demo_creator_priya',
    creatorId: 'demo_creator_priya',
    platform: 'Instagram',
    handle: '@priya.editorial',
    url: 'https://instagram.com',
    followers: 198000,
    engagementRate: 8.1,
    visibility: 'public',
  },
];

export const DEMO_PORTFOLIOS: PortfolioItem[] = [
  {
    id: 'demo_port_1',
    ownerId: 'demo_creator_aria',
    creatorId: 'demo_creator_aria',
    title: 'Architectural Morning — Studio Film Series',
    description: 'Three-part cinematic YouTube integration highlighting minimalist workspace acoustics and natural daylight framing.',
    mediaType: 'image',
    mediaUrl: ASSETS.heroStudio,
    category: 'Brand Film',
    visibility: 'public',
  },
  {
    id: 'demo_port_2',
    ownerId: 'demo_creator_marcus',
    creatorId: 'demo_creator_marcus',
    title: 'Obsidian Reference Over-Ear Launch Review',
    description: 'In-depth acoustic curve walkthrough and studio mixing session garnering 184K organic views in 10 days.',
    mediaType: 'image',
    mediaUrl: ASSETS.campaignTech,
    category: 'Product Review',
    visibility: 'public',
  },
  {
    id: 'demo_port_3',
    ownerId: 'demo_creator_priya',
    creatorId: 'demo_creator_priya',
    title: 'Valois Elixir — Winter Barrier Ritual',
    description: 'Editorial photo carousel and 45-second tactile serum reel focused on botanical hydration science.',
    mediaType: 'image',
    mediaUrl: ASSETS.campaignSkincare,
    category: 'Editorial Campaign',
    visibility: 'public',
  },
];

export const DEMO_CAMPAIGNS: Campaign[] = [
  {
    id: 'demo_camp_obsidian',
    brandId: 'demo_brand_kora',
    brandName: 'Kora Acoustics',
    brandLogoUrl: ASSETS.campaignTech,
    title: 'Obsidian Elite Studio Headphones Launch',
    description:
      'Partnering with audio-savvy tech reviewers and creative filmmakers to showcase our flagship wireless reference headphones inside real studio workflows.',
    objectives:
      'Drive 500K qualified launch impressions, highlight 48-hour lossless battery performance, and generate trackable pre-order conversions.',
    targetAudience: 'Video editors, music producers, industrial designers, and remote tech leads (ages 24-42).',
    niche: 'Technology & Audio',
    platforms: ['YouTube', 'Instagram', 'X'],
    budget: 18500,
    startDate: '2026-11-25',
    endDate: '2026-12-22',
    deliverables: [
      '1x 90-second dedicated YouTube integration',
      '2x Instagram Reels with studio sound-check clip',
      '1x High-resolution desk setup still frame for paid usage',
    ],
    instructions:
      'Film in your authentic studio lighting. Highlight spatial clarity, matte finish, and seamless multi-device switching. Include custom UTM pre-order link in description.',
    coverImageUrl: ASSETS.campaignTech,
    status: 'open',
    allowApplications: true,
    progress: 35,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_camp_valois',
    brandId: 'demo_brand_valois',
    brandName: 'Valois Botanicals',
    brandLogoUrl: ASSETS.campaignSkincare,
    title: 'Winter Repair & Glow Elixir Collection',
    description:
      'A calm, ingredient-transparent campaign introducing our three-step cold-pressed botanical hydration line for winter barrier recovery.',
    objectives:
      'Educate skincare-first audiences on fermented lavender peptides and drive trial kit redemptions across Instagram and TikTok.',
    targetAudience: 'Ingredient-conscious beauty enthusiasts and modern minimalism lovers (ages 22-38).',
    niche: 'Beauty & Skincare',
    platforms: ['Instagram', 'TikTok', 'YouTube'],
    budget: 12000,
    startDate: '2026-11-28',
    endDate: '2027-01-10',
    deliverables: [
      '2x 45-second TikTok routine videos',
      '1x 5-frame Instagram Editorial Carousel',
      '3x Story frames with direct swipe link',
    ],
    instructions:
      'Capture natural morning window light. Focus on texture, glass dropper ergonomics, and 14-day hydration progress without heavy filters.',
    coverImageUrl: ASSETS.campaignSkincare,
    status: 'active',
    allowApplications: true,
    progress: 62,
    visibility: 'public',
    isDemo: true,
  },
  {
    id: 'demo_camp_workspace',
    brandId: 'demo_brand_kora',
    brandName: 'Kora Acoustics',
    brandLogoUrl: ASSETS.heroStudio,
    title: 'Creative Desk Architecture 2027 Lookbook',
    description:
      'Inviting interior-minded productivity creators and filmmakers to document calm, clutter-free creative workspaces built for deep focus.',
    objectives:
      'Build an aspirational video anthology that inspires studio upgrades and collects 15K email waitlist signups.',
    targetAudience: 'Creative directors, architects, software engineers, and independent creators.',
    niche: 'Lifestyle & Travel',
    platforms: ['YouTube', 'LinkedIn', 'Instagram'],
    budget: 9500,
    startDate: '2026-12-01',
    endDate: '2027-01-18',
    deliverables: [
      '1x Full workspace tour reel or YouTube segment',
      '1x LinkedIn behind-the-scenes breakdown post',
    ],
    instructions:
      'Emphasize tactile materials, cable management, and sound isolation. Share honest productivity rituals that keep projects on schedule.',
    coverImageUrl: ASSETS.heroStudio,
    status: 'open',
    allowApplications: true,
    progress: 20,
    visibility: 'public',
    isDemo: true,
  },
];

export const LANDING_TESTIMONIALS = [
  {
    name: 'Hannah Brooks',
    role: 'VP of Brand Partnerships',
    company: 'Kora Acoustics',
    quote:
      'Moving from scattered spreadsheets to CREOVATE cut our campaign kickoff cycle from three weeks to four days while lifting deliverable on-time rates to 96%.',
    metric: '4x faster brief-to-launch',
  },
  {
    name: 'Aria Chen',
    role: 'Filmmaker & Lifestyle Creator',
    company: '412K Community',
    quote:
      'Every brief, timeline, and deliverable approval lives in one workspace. Brands respect our creative process because expectations are structured from day one.',
    metric: '100% transparent deliverables',
  },
  {
    name: 'Camille Laurent',
    role: 'Head of Growth',
    company: 'Valois Botanicals',
    quote:
      'Creator discovery filters and CREOVATE Intelligence helped us shortlist twelve verified skincare educators whose average engagement topped 7.4%.',
    metric: '7.4% avg campaign engagement',
  },
];

export const LANDING_FAQS = [
  {
    q: 'How does CREOVATE separate Brand and Creator workflows?',
    a: 'Brands operate inside Brand Studio with creator discovery, contact shortlists, multi-step campaign builders, and deliverable approvals. Creators work inside Creator Hub with portfolio galleries, campaign discovery, invitation management, and file submission tools.',
  },
  {
    q: 'Are campaigns, messages, and deliverables saved persistently?',
    a: 'Yes. Every profile update, saved contact, campaign, invitation, active collaboration, deliverable submission, message, and moderation log is stored securely in Cloud Firestore with role-based security rules.',
  },
  {
    q: 'How does CREOVATE Intelligence work?',
    a: 'CREOVATE Intelligence connects securely through our backend to Google Gemini to assist with smart creator matching, campaign copy generation, brief structuring, and creator bio refinement. AI outputs are always clearly labeled separately from verified platform metrics.',
  },
  {
    q: 'Can brands prevent duplicate invitations and track revisions?',
    a: 'Yes. Invitations are deduplicated per campaign and creator, state transitions are strictly enforced so only recipients can accept or decline, and deliverable reviews support both final approvals and structured revision feedback.',
  },
];

export function formatNumberCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 100_000 ? 0 : 1)}K`;
  return String(n);
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(n);
}
