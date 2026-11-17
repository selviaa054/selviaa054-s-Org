export function AboutStorySection() {
  return (
    <section id="story" className="bg-[#FBF7FA] border-y border-[#F1E4EC]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-5">
            <p className="text-xs font-medium text-[#8B5E78] mb-2">
              Our Craft · Made for Sharing
            </p>
            <h2
              className="font-display text-2xl sm:text-3xl font-semibold text-[#2B1D26] tracking-tight leading-tight"
              style={{ textWrap: 'balance' }}
            >
              Iconic local chiki &amp; study-night drinks in one cute storefront.
            </h2>
          </div>

          <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-6 pt-1">
            <div>
              <p className="font-mono text-sm font-medium text-[#BE3E6E] mb-1.5 tabular-nums">
                01. Crispy Chiki
              </p>
              <p className="text-sm text-[#5E4B56] leading-relaxed">
                Original sealed packs of Taro, Tic Tic, Nabati SiiP, and Garuda O&apos;Corn.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-[#BE3E6E] mb-1.5 tabular-nums">
                02. Savory &amp; Sweet
              </p>
              <p className="text-sm text-[#5E4B56] leading-relaxed">
                From Chitato Lite seaweed and Kusuka cassava chips to Oishi chocolate popcorn.
              </p>
            </div>
            <div>
              <p className="font-mono text-sm font-medium text-[#BE3E6E] mb-1.5 tabular-nums">
                03. Chilled Pairings
              </p>
              <p className="text-sm text-[#5E4B56] leading-relaxed">
                Oatside chocolate, Nutriboost strawberry milk, and ready-to-drink cappuccino.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
