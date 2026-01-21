import { MenuIcon, XIcon } from 'lucide-react';
import { PrimaryButton } from './Buttons';
import { useContext, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useClerk, UserButton, useUser } from '@clerk/clerk-react';
import { AppContext } from '../context/AppContext';
import creditIcon from '../assets/credit_icon.png'

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    const {openSignIn} = useClerk();
    const {isSignedIn} = useUser();
   const appContext = useContext(AppContext);

  if (!appContext) throw new Error("AppContext not found");

  const { credit, loadCreditData } = appContext;

  useEffect(() => {
    if (isSignedIn) {
      loadCreditData();
    }
  }, [isSignedIn, loadCreditData]); // Now safe to include loadCreditData

    // Conditional nav links based on login status
    const navLinks = isSignedIn 
        ? [
            { name: 'Home', href: '/#' },
            { name: 'Features', href: '/#features' },
            { name: 'Pricing', href: '/#pricing' },
            { name: 'Image History', href: '/img-history' },
          ]
        : [
            { name: 'Home', href: '/#' },
            { name: 'Features', href: '/#features' },
            { name: 'Pricing', href: '/#pricing' },
            { name: 'FAQ', href: '/#faq' },
          ];

    return (
        <motion.nav className='fixed top-5 left-0 right-0 z-50 px-4'
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
        >
            <div className='max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/4 rounded-2xl p-3'>
                <a href='/#'>
                    <img src='/logo.svg' alt="logo" className="h-8" />
                </a>

                <div className='hidden md:flex items-center gap-8 text-sm font-medium text-gray-300'>
                    {navLinks.map((link) => (
                        <a href={link.href} key={link.name} className="hover:text-white transition">
                            {link.name}
                        </a>
                    ))}
                </div>

                <div className='hidden md:flex items-center gap-3'>
                    {
                        isSignedIn ?
                        <div className='flex justify-center gap-3'>
                             <span className=" flex justify-center items-center gap-2
                                    px-3 py-1 
                                    mr-2
                                    text-[0.8rem] 
                                    text-white/90 
                                    rounded-full 
                                    backdrop-blur-md 
                                    bg-white/10 
                                    border border-white/20
                                "> <img src={creditIcon} className="w-4 h-4" alt="" />
                                    {credit}
                                </span>
                            <UserButton />
                        </div>
                        :
                    <PrimaryButton onClick={()=>openSignIn({})} className='max-sm:text-xs hidden sm:inline-block'>Get Started</PrimaryButton>
}
                </div>
        <div className='flex gap-4 md:hidden'>
                    <button onClick={() => setIsOpen(!isOpen)} className='md:hidden'>
                        <MenuIcon className='size-6' />
                    </button>
                    {
                        isSignedIn ?
                        <div className='mt-2 md:hidden'>
                            <UserButton />
                        </div>
                        :
                        <div className='hidden'></div>
                    }
                </div>
            </div>
            <div className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}>
                {navLinks.map((link) => (
                    <a key={link.name} href={link.href} onClick={() => setIsOpen(false)}>
                        {link.name}
                    </a>
                ))}

                {
                    isSignedIn ?
                    <div className='flex flex-col gap-6 justify-center items-center'>
                        <span className=" flex justify-center items-center gap-2
                               text-lg font-medium
                            "> 
                                Credits : {credit}
                            </span>
                        <UserButton />
                    </div>
                    :
                    <PrimaryButton onClick={() => openSignIn({})}>Get Started</PrimaryButton>
                }
                <button
                    onClick={() => setIsOpen(false)}
                    className="rounded-md bg-white p-2 text-gray-800 ring-white active:ring-2"
                >
                    <XIcon />
                </button>
            </div>
        </motion.nav>
    );
}