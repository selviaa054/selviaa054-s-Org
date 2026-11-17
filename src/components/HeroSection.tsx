import { ArrowRight } from 'lucide-react';
import { SnackImage } from './SnackImage.tsx';

interface HeroSectionProps {
  onExploreClick: () => void;
}

const HERO_BANNER_URL = '/assets/aistudio/Gemini_Generated_Image_r39rygr39rygr39r_0c2e648e.jpg';

export function HeroSection({ onExploreClick }: HeroSectionProps) {
  return (
    <section
      id="top"
      className="bg-gradient-to-b from-[#FDF2F7] via-[#FBF7FA] to-[#FFF9FB] border-b border-[#F1E4EC]"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-8 sm:pt-8 sm:pb-12 space-y-6 sm:space-y-8">
        {/* Full-Width Uncropped Pastel Banner */}
        <div className="rounded-2xl overflow-hidden border border-[#EFE1EA] bg-[#FFFDF9] shadow-xs">
          <SnackImage
            src={HERO_BANNER_URL}
            alt="Chiki & Snack Time — Cemilan Hits & Minuman Segar Favorit Kamu di ChikiSel"
            className="w-full h-auto block"
          />
        </div>

        {/* Compact Editorial Copy & CTA Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-1">
          <div className="max-w-2xl">
            <p className="text-xs font-medium text-[#8B5E78] tracking-wide mb-1.5">
              ChikiSel Store · Small-Batch Local Snacks &amp; Chilled Drinks
            </p>
            <h1
              className="font-display font-semibold text-[#2B1D26] tracking-tight leading-[1.15] mb-2"
              style={{
                fontSize: 'clamp(1.65rem, 2.8vw, 2.35rem)',
                textWrap: 'balance',
              }}
            >
              Favorite chiki crunches &amp; chilled drinks, delivered fresh.
            </h1>
            <p className="text-sm sm:text-base text-[#5E4B56] leading-relaxed">
              Stock up on Taro Net BBQ, Chitato Lite, Nabati SiiP, Oishi chocolate popcorn, and
              chilled Oatside or Nescafe drinks for study nights and hangouts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row items-start sm:items-center md:items-end lg:items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onExploreClick}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#BE3E6E] hover:bg-[#A4325D] text-white text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[44px]"
            >
              <span>Browse Snacks</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
            <span className="text-xs text-[#6E5A67] whitespace-nowrap">
              Free shipping over Rp 100.000
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
