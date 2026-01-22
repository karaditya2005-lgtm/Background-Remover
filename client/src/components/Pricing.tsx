import { Check, Loader2 } from 'lucide-react';
import { PrimaryButton, GhostButton } from './Buttons';
import Title from './Title';
import { plansData } from '../assets/dummy-data';
import { motion } from 'framer-motion';
import { useRef, useState, useContext } from 'react';
import { useAuth, useUser, useClerk } from '@clerk/clerk-react';
import { AppContext } from '../context/AppContext';
import { toast } from 'react-toastify';

export default function Pricing() {
    const refs = useRef<(HTMLDivElement | null)[]>([]);
    const [loading, setLoading] = useState<string | null>(null);
    
    const { getToken } = useAuth();
    const { isSignedIn, user } = useUser();
    const { openSignIn } = useClerk();
    const appContext = useContext(AppContext);

    if (!appContext) throw new Error("AppContext not found");
    const { loadCreditData, backendUrl } = appContext;

    const loadRazorpayScript = () => {
        return new Promise((resolve) => {
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handlePurchase = async (planId: string) => {
        if (!isSignedIn) {
            toast.error('Please login to purchase credits');
            openSignIn({});
            return;
        }

        try {
            setLoading(planId);

            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error('Failed to load payment gateway');
                setLoading(null);
                return;
            }

            const token = await getToken();
            const url = `${backendUrl.replace(/\/$/, '')}/api/payment/create-order`;

            console.log('Request URL:', url);
            console.log('Plan ID:', planId);

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ packageType: planId })
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Response error:', errorText);
                toast.error(`Server error: ${response.status}`);
                setLoading(null);
                return;
            }

            const data = await response.json();
            console.log('Response data:', data);

            if (!data.success) {
                toast.error(data.message);
                setLoading(null);
                return;
            }

            // Get user's primary email
            const userEmail = user?.primaryEmailAddress?.emailAddress || 
                             user?.emailAddresses?.[0]?.emailAddress || 
                             'user@example.com';

            // Get user's full name
            const userName = user?.fullName || 
                           `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 
                           'User';

            const options = {
                key: data.order.keyId,
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'BG Remover',
                description: `Purchase ${data.package.credits} Credits`,
                order_id: data.order.orderId,
                handler: async function (response: any) {
                    await verifyPayment(response, planId);
                },
                prefill: {
                    name: userName,
                    email: userEmail,
                    contact: user?.primaryPhoneNumber?.phoneNumber || ''
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: function() {
                        setLoading(null);
                    }
                }
            };

            const razorpay = new (window as any).Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Purchase error:', error);
            toast.error('Failed to initiate purchase');
            setLoading(null);
        }
    };

    const verifyPayment = async (response: any, packageType: string) => {
        try {
            const token = await getToken();
            const url = `${backendUrl.replace(/\/$/, '')}/api/payment/verify`;

            const verifyResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                    packageType
                })
            });

            const data = await verifyResponse.json();

            if (data.success) {
                toast.success(data.message);
                await loadCreditData();
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            console.error('Verification error:', error);
            toast.error('Payment verification failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <section id="pricing" className="py-20 bg-white/3 border-t border-white/6">
            <div className="max-w-6xl mx-auto px-4">

                <Title
                    title="Pricing"
                    heading="Simple, transparent pricing"
                    description="Flexible plans designed for creators, students, and businesses to remove image backgrounds effortlessly."
                />

                <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                    {plansData.map((plan, i) => (
                        <motion.div
                            key={i}
                            ref={(el) => {
                                refs.current[i] = el;
                            }}
                            initial={{ y: 150, opacity: 0 }}
                            whileInView={{ y: 0, opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1, delay: 0.1 + i * 0.1 }}
                            onAnimationComplete={() => {
                                const card = refs.current[i];
                                if (card) {
                                    card.classList.add("transition", "duration-500", "hover:scale-102");
                                }
                            }}
                            className={`relative p-6 rounded-xl border backdrop-blur ${plan.popular
                                ? 'border-indigo-500/50 bg-indigo-900/30'
                                : 'border-white/8 bg-indigo-950/30'
                                }`}
                        >
                            {plan.popular && (
                                <p className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-md text-xs">
                                    Most popular
                                </p>
                            )}

                            <div className="mb-6">
                                <p>{plan.name}</p>
                                <div className="flex items-end gap-3">
                                    <span className="text-3xl font-extrabold">{plan.price}</span>
                                    <span className="text-sm text-gray-400">
                                        / {plan.credits}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-300 mt-2">
                                    {plan.desc}
                                </p>
                            </div>

                            <ul className="space-y-3 mb-6">
                                {plan.features.map((feat, i) => (
                                    <li
                                        key={i}
                                        className="flex items-center gap-3 text-sm text-gray-300"
                                    >
                                        <Check className="w-4 h-4 text-indigo-400" />
                                        {feat}
                                    </li>
                                ))}
                            </ul>

                            <div>
                                {plan.popular ? (
                                    <PrimaryButton 
                                        className="w-full"
                                        onClick={() => handlePurchase(plan.id)}
                                        disabled={loading === plan.id}
                                    >
                                        {loading === plan.id ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            'Get started'
                                        )}
                                    </PrimaryButton>
                                ) : (
                                    <GhostButton 
                                        className="w-full justify-center"
                                        onClick={() => handlePurchase(plan.id)}
                                        disabled={loading === plan.id}
                                    >
                                        {loading === plan.id ? (
                                            <span className="flex items-center gap-2">
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </span>
                                        ) : (
                                            'Get started'
                                        )}
                                    </GhostButton>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}