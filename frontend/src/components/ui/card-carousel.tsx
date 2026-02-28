"use client";
import React from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { ChevronLeft, ChevronRight } from 'lucide-react';

import "swiper/css";
import "swiper/css/effect-coverflow";
import "swiper/css/pagination";
import "swiper/css/navigation";
import { Autoplay, EffectCoverflow, Navigation, Pagination } from "swiper/modules";

interface ImageType {
  src: string;
  alt: string;
}

interface CardCarouselProps {
  images: ImageType[];
  autoplayDelay?: number;
  showPagination?: boolean;
  showNavigation?: boolean;
}

export const CardCarousel: React.FC<CardCarouselProps> = ({
  images,
  autoplayDelay = 3000,
  showPagination = true,
  showNavigation = true,
}) => {
  const css = `
    .swiper {
      width: 100%;
      padding-bottom: 40px; /* Space for pagination */
    }
  
    .swiper-slide {
      background-position: center;
      background-size: cover;
      /* Adjust slide width for more rectangular feel, depends on desired aspect */
      width: 400px; /* Increased width */ 
    }
  
    .swiper-slide img {
      display: block;
      width: 100%;
      height: 100%;
      border-radius: 1rem; /* 16px */
      object-fit: cover;
    }
  
    .swiper-3d .swiper-slide-shadow-left,
    .swiper-3d .swiper-slide-shadow-right {
      background: none;
    }

    /* Custom pagination color */
    .swiper-pagination-bullet {
      background-color: #9ca3af; /* gray-400 */
      opacity: 0.8;
    }
    .swiper-pagination-bullet-active {
      background-color: #3b82f6; /* blue-500 */
      opacity: 1;
    }
  `;

  return (
    <section className="relative w-full group">
      <style>{css}</style>
      <div className="w-full max-w-2xl mx-auto">
        <Swiper
          spaceBetween={50}
          autoplay={{
            delay: autoplayDelay,
            disableOnInteraction: false,
          }}
          effect={"coverflow"}
          grabCursor={true}
          centeredSlides={true}
          loop={true}
          slidesPerView={"auto"}
          coverflowEffect={{
            rotate: 0,
            stretch: 0,
            depth: 150,
            modifier: 2.5,
          }}
          pagination={showPagination ? { clickable: true } : false}
          navigation={
            showNavigation
              ? {
                  nextEl: ".swiper-button-next-custom",
                  prevEl: ".swiper-button-prev-custom",
                }
              : false
          }
          modules={[EffectCoverflow, Autoplay, Pagination, Navigation]}
        >
          {images.map((image: ImageType, index: number) => (
            <SwiperSlide key={index}>
              <div className="w-full h-[220px] sm:h-[260px] md:h-[300px] transition-transform duration-300 ease-in-out hover:scale-105">
                <Image
                  src={image.src}
                  width={700}
                  height={400} 
                  className="rounded-xl object-cover shadow-lg"
                  alt={image.alt}
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
      
      {showNavigation && (
        <>
          <div className="swiper-button-prev-custom absolute top-1/2 left-0 z-10 -translate-y-1/2 p-2 bg-white/50 dark:bg-zinc-900/50 rounded-full cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:left-2 hover:bg-white dark:hover:bg-zinc-800">
            <ChevronLeft className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </div>
          <div className="swiper-button-next-custom absolute top-1/2 right-0 z-10 -translate-y-1/2 p-2 bg-white/50 dark:bg-zinc-900/50 rounded-full cursor-pointer transition-all duration-300 opacity-0 group-hover:opacity-100 group-hover:right-2 hover:bg-white dark:hover:bg-zinc-800">
            <ChevronRight className="h-6 w-6 text-gray-800 dark:text-gray-200" />
          </div>
        </>
      )}
    </section>
  );
};
