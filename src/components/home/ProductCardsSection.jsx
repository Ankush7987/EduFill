import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { productCards, toneMap } from '../../data/homeData';

export default function ProductCardsSection({ onGoToProduct }) {
  const navigate = useNavigate();

  const isBookSlotCard = (card) => {
    const title = String(card?.title || '').toLowerCase();
    const route = String(card?.route || '').toLowerCase();

    return (
      title.includes('book') && title.includes('slot')
    ) || route.includes('book-slot') || route.includes('slot-booking');
  };

  const handleCardOpen = (card) => {
    if (isBookSlotCard(card)) {
      navigate('/book-slot');
      return;
    }

    if (typeof onGoToProduct === 'function') {
      onGoToProduct(card.route);
      return;
    }

    if (card?.route) {
      navigate(card.route);
    }
  };

  return (
    <section
      id="slot-booking"
      className="max-w-[1400px] mx-auto px-4 md:px-8 py-10 sm:py-12 md:py-16"
    >
      <div className="flex items-center justify-center gap-4 mb-7 sm:mb-10">
        <div className="hidden sm:block h-px bg-gradient-to-r from-transparent to-emerald-300 w-32" />
        <h2 className="text-2xl md:text-3xl font-black text-gray-950 text-center leading-tight">
          Everything You Need, All in One Place
        </h2>
        <div className="hidden sm:block h-px bg-gradient-to-r from-emerald-300 to-transparent w-32" />
      </div>

      {/* Mobile: horizontal swipe cards. Desktop: grid. */}
      <div className="-mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-3 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 xl:grid-cols-5 sm:overflow-visible sm:pb-0">
        {productCards.map((card) => {
          const tone = toneMap[card.tone];
          const opensBookSlot = isBookSlotCard(card);

          return (
            <article
              key={card.title}
              className={`relative snap-start shrink-0 w-[78vw] min-[420px]:w-[68vw] sm:w-auto rounded-[1.55rem] sm:rounded-[1.7rem] p-5 sm:p-6 border shadow-sm hover:shadow-xl transition-all duration-300 min-h-[245px] sm:min-h-[285px] flex flex-col items-center text-center ${tone.card}`}
            >
              {card.tag && (
                <span className={`absolute top-4 right-4 text-[8px] sm:text-[9px] font-black uppercase px-2.5 py-1 rounded-full ${tone.badge}`}>
                  {card.tag}
                </span>
              )}

              <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full ${tone.icon} flex items-center justify-center mb-4 sm:mb-5 shadow-sm`}>
                {card.icon}
              </div>

              <h3 className={`text-base sm:text-lg font-black mb-2 sm:mb-3 ${tone.title}`}>
                {card.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-600 font-medium leading-relaxed mb-5 sm:mb-6 flex-1">
                {card.desc}
              </p>

              <button
                type="button"
                onClick={() => handleCardOpen(card)}
                className={`w-10 h-10 sm:w-11 sm:h-11 rounded-full text-white flex items-center justify-center shadow-md transition-transform active:scale-95 hover:scale-105 ${tone.button}`}
                aria-label={opensBookSlot ? 'Open Book Your Slot page' : `Open ${card.title}`}
                title={opensBookSlot ? 'Book Your Slot' : card.title}
              >
                <ArrowRight size={17} />
              </button>
            </article>
          );
        })}
      </div>

      <p className="sm:hidden text-center text-[11px] font-bold text-gray-400 mt-2">
        Swipe to see all EduFill features →
      </p>
    </section>
  );
}
