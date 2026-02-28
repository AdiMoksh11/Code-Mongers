"use client";
import React, { useState } from "react";
import HoverExpand from "./ui/hover-expand";

export const stories = [
  {
    id: 1,
    name: "Dr. Anya Sharma",
    role: "Skill India Program Manager",
    quote:
      "Credexa's alignment with NSQF is revolutionary. It provides a standardized view of skills, making it easier for us to track and promote certified talent across the country.",
    image: "/images/testimonials/testimonial-1.png",
  },
  {
    id: 2,
    name: "Benjamin Carter",
    role: "HR Director, TechCorp",
    quote:
      "The fraud detection engine is a game-changer. We can now trust the credentials on a candidate's resume, which has significantly streamlined our hiring and reduced risk.",
    image: "/images/testimonials/testimonial-2.png",
  },
  {
    id: 3,
    name: "Javier Moreno",
    role: "Lifelong Learner",
    quote:
      "I've accumulated certificates from Coursera, AWS, and my local university. Credexa's 'Skill Passport' brings them all together into one powerful, verifiable portfolio.",
    image: "/images/testimonials/testimonial-3.png",
  },
  {
    id: 4,
    name: "Sofia Chen",
    role: "Career Counselor",
    quote:
      "The AI Career Recommender is an incredible tool. It helps students visualize their career path and understand exactly what micro-credentials they need to achieve their goals.",
    image: "/images/testimonials/testimonial-4.png",
  },
  {
    id: 5,
    name: "Michael Jones",
    role: "CTO, Fintech Startup",
    quote:
      "Finding developers with specific, verifiable skills used to be a challenge. With Credexa, we can search by NSQF level and verified badges, making our talent search incredibly efficient.",
    image: "/images/testimonials/testimonial-5.png",
  },
  {
    id: 6,
    name: "Dr. Liam O'Connell",
    role: "University Registrar",
    quote:
      "The analytics dashboard is invaluable. We can now see real-time trends in which skills students are pursuing, helping us update our curriculum to meet market demands.",
    image: "/images/testimonials/testimonial-6.png",
  },
  {
    id: 7,
    name: "Chloe Lee",
    role: "Recent Graduate",
    quote:
      "My Credexa profile gave me a massive edge in interviews. I could instantly share a trusted, verifiable portfolio of my certifications from diverse sources.",
    image: "/images/testimonials/testimonial-7.png",
  },
  {
    id: 8,
    name: "Arjun Mehta",
    role: "EdTech Platform Founder",
    quote:
      "Integrating our credential issuance with Credexa has provided our learners with a trusted 'Skill Passport' that extends beyond our platform. It's a win-win for everyone.",
    image: "/images/testimonials/testimonial-8.png",
  },
];

export default function SuccessStories() {
  const [hoveredIndex, setHoveredIndex] = useState(0);

  return (
    <section className="relative p-16">
      <div className="container sm:mx-4 md:mx-auto md:px-6 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
          Success Stories
        </h2>
        <p className="text-muted-foreground mb-4">
          Trusted by learners, employers, and institutions, Credexa is the future of verifiable skills and lifelong learning.        
        </p>

        <HoverExpand
          images={stories.map((s) => s.image)}
          maxThumbnails={stories.length}
          thumbnailHeight={220}
          modalImageSize={420}
          onHover={(index) => setHoveredIndex(index)}
        />

        <div className="mt-6 max-w-2xl mx-auto">
          <p className="text-lg text-muted-foreground italic mb-4">
            “{stories[hoveredIndex].quote}”
          </p>
          <h3 className="text-foreground font-semibold">
            {stories[hoveredIndex].name}
          </h3>
          <span className="text-sm text-muted-foreground">
            {stories[hoveredIndex].role}
          </span>
        </div>
      </div>
    </section>
  );
}
