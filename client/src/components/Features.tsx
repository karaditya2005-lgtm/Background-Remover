import { useRef, useState, type SetStateAction } from 'react';
import { featuresData } from '../assets/dummy-data';
import image_w_bg from '../assets/image_w_bg.jpg';
import image_with_bg from '../assets/image_wo_bg.png';
import Title from './Title';
import { motion } from 'framer-motion';

export default function Features() {
    const refs = useRef<(HTMLDivElement | null)[]>([]);

    const[sliderPosition, setSliderPosition]=useState(50)

    const handleSliderChange = (e: { target: { value: SetStateAction<number>; }; }) =>{
        setSliderPosition(e.target.value)
    }
    return (
        <section id="features" className="py-10 2xl:py-32">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Services"
                    heading="Steps to remove background in seconds"
                    description="Remove backgrounds effortlessly with a clean, fast, and fully automated process designed for everyone — no design experience or software needed."
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {featuresData.map((feature, i) => (
                        <motion.div
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            initial={{ y: 100, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            key={i}
                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-300", "hover:border-white/15", "hover:-translate-y-1");
                                }
                            }}
                            className="rounded-2xl p-6 bg-white/3 border border-white/6"
                        >
                            <div className="w-12 h-12 rounded-lg bg-violet-900/20 flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                            <p className="text-gray-300 text-sm leading-relaxed">
                                {feature.desc}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
            <div className="mt-12 sm:m-4 sm:mt-20 relative w-full max-w-3xl overflow-hidden m-auto rounded-3xl">

  {/* Background Image */}
  <img
    src={image_w_bg}
    className="rounded-3xl w-full"
    alt="bg"
    style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
  />

  {/* Foreground Image */}
  <img
    src={image_with_bg}
    className="rounded-3xl absolute top-0 left-0 w-full h-full"
    alt="fg"
    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
  />

  {/* WHITE MOVING LINE */}
  <div
    className="slider-line"
    style={{ left: `${sliderPosition}%` }}
  />

  {/* SLIDER */}
  <input
    type="range"
    min="0"
    max="100"
    value={sliderPosition}
    onChange={handleSliderChange}
    className="slider absolute inset-0 z-20"
  />
</div>

        </section>
    );
};