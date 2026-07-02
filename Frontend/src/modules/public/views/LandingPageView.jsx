import { PublicHeader } from '../components/PublicHeader.jsx';
import { PublicFooter } from '../components/PublicFooter.jsx';
import { useLandingData } from '../hooks/use-landing-data.js';
import { LandingHero } from '../components/landing/LandingHero.jsx';
import { LandingStats } from '../components/landing/LandingStats.jsx';
import { LandingForSellers, LandingFlow } from '../components/landing/LandingFlow.jsx';
import { LandingFeaturedAuctions } from '../components/landing/LandingFeaturedAuctions.jsx';
import { LandingCategoryBrowse } from '../components/landing/LandingCategoryBrowse.jsx';
import { LandingTrust } from '../components/landing/LandingTrust.jsx';
import { GetAppSection } from '@enderass/shared/ui';

export function LandingPageView() {
  const {
    stats,
    statsStatus,
    featuredAuctions,
    auctionsStatus,
    heroLot,
    categories,
    contact,
  } = useLandingData();

  return (
    <>
      <PublicHeader />
      <LandingHero heroLot={heroLot} status={auctionsStatus} />
      <LandingStats stats={stats} status={statsStatus} />
      <LandingForSellers />
      <LandingFlow />
      <LandingFeaturedAuctions auctions={featuredAuctions} status={auctionsStatus} />
      <LandingCategoryBrowse categories={categories} status={auctionsStatus} />
      <LandingTrust />
      <GetAppSection />
      <PublicFooter contact={contact} stats={stats} categories={categories} />
    </>
  );
}

export default LandingPageView;
