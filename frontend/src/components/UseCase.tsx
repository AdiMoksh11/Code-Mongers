"use client";

import React from "react";
import MinimalCard, {
  MinimalCardDescription,
  MinimalCardImage,
  MinimalCardTitle,
} from "../components/ui/minimal-card";
import BadgeButton from "../components/ui/badge-button";

const UseCase = () => {
  const cards = [
    {
      title: "For Learners",
      description:
        "Credexa unified all my certificates into one secure profile, making it easy to showcase my verified skills to employers.",
      src: "/images/giphy/giphy-1.gif",
      alt: "A learner showcasing their skill passport",
    },
    {
      title: "For Educators",
      description:
        "With Credexa, issuing tamper-proof credentials is seamless, ensuring students carry lifelong, verifiable achievements.",
      src: "/images/giphy/giphy-2.gif",
      alt: "An educator issuing verified digital credentials",
    },
    {
      title: "For Employers & Regulators",
      description:
        "Instant verification of candidates’ credentials through Credexa has simplified hiring and eliminated doubts about authenticity.",
      src:"/images/giphy/giphy-3.gif",
      alt: "An employer verifying a candidate's digital credential",
    },
  ];

  return (
    <div className="py-10">
      <div className="sm:w-[90%] md:w-[100%] lg:w-[75%] rounded-3xl shadow mx-auto">
        <div className="p-6 shadow rounded-3xl mx-auto">
          <BadgeButton>Use Cases</BadgeButton>

          <div className="flex flex-col md:flex-row justify-center items-start gap-6 mt-6">
            {cards.map((card, key) => (
              <MinimalCard
                key={key}
                className="w-full md:w-1/3 bg-[#F0F0F0] dark:bg-[#2a2a2a] text-white rounded-2xl shadow-md"
              >
                <MinimalCardImage
                  className="h-[180px] w-full object-cover rounded-t-2xl"
                  src={card.src}
                  alt={card.alt}
                />
                <MinimalCardTitle>{card.title}</MinimalCardTitle>
                <MinimalCardDescription>
                  {card.description}
                </MinimalCardDescription>
              </MinimalCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UseCase;
