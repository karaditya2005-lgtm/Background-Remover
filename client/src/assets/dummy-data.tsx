import { DownloadIcon,  UploadIcon, Wand2 } from 'lucide-react';

export const featuresData = [
    {
        icon: <UploadIcon className="w-6 h-6" />,
        title: 'Upload Image',
        desc: 'Upload any JPG or PNG image from your device.'
    },
    {
        icon: <Wand2 className="w-6 h-6" />,
        title: 'Remove Background',
        desc: 'Our AI automatically removes the background in seconds.'
    },
    {
        icon: <DownloadIcon className="w-6 h-6" />,
        title: 'Download Image',
        desc: 'Download your image with a clean transparent background.'
    }
];

export const plansData = [
  {
    id: 'free',
    name: 'Free',
    price: '₹0',
    desc: 'Try background removal with basic features.',
    credits: 'Limited',
    features: [
      'Basic background removal',
      'Low-resolution download',
      'PNG transparent background',
      'Standard processing speed',
      'Community support'
    ]
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '₹299',
    desc: 'Perfect for creators and freelancers.',
    credits: 'Monthly',
    features: [
      'Everything in Free',
      'High-resolution downloads',
      'No watermark',
      'Faster processing',
      'Priority support'
    ],
    popular: true
  },
  {
    id: 'business',
    name: 'Business',
    price: '₹999',
    desc: 'Best for teams and commercial usage.',
    credits: 'Monthly',
    features: [
      'Everything in Pro',
      'Unlimited background removals',
      'Bulk image upload',
      'API access (coming soon)',
      'Dedicated support'
    ]
  }
];


export const faqData = [
  {
    question: 'What does this background remover do?',
    answer:
      'Our tool automatically removes the background from images using AI, giving you a clean and transparent result in just a few seconds.'
  },
  {
    question: 'Do I need to create an account to use it?',
    answer:
      'No signup or login is required. You can upload your image, remove the background, and download it instantly.'
  },
  {
    question: 'What image formats are supported?',
    answer:
      'We support common image formats like JPG, JPEG, and PNG. The final image is downloaded as a transparent PNG.'
  },
  {
    question: 'Is this background remover free to use?',
    answer:
      'Yes, the tool is free to use for basic background removal. Additional features may be added in the future.'
  },
  {
    question: 'Can I use the images for commercial purposes?',
    answer:
      'Yes, you can use the processed images for personal and commercial projects without any restrictions.'
  }
];


export const footerLinks = [
    {
        title: "Company",
        links: [
            { name: "Home", url: "#" },
            { name: "Services", url: "#" },
            { name: "Work", url: "#" },
            { name: "Contact", url: "#" }
        ]
    },
    {
        title: "Legal",
        links: [
            { name: "Privacy Policy", url: "#" },
            { name: "Terms of Service", url: "#" }
        ]
    },
    {
        title: "Connect",
        links: [
            { name: "Twitter", url: "#" },
            { name: "LinkedIn", url: "#" },
            { name: "GitHub", url: "#" }
        ]
    }
];