import { useState } from 'react';
import { Mail } from 'lucide-react';

const EmailCollectionModal = ({ onSubmit }) => {
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!email || !email.includes('@')) {
            alert('Please enter a valid email address');
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(email);
            setIsSubmitted(true);
            // Auto-close after 1 second
            setTimeout(() => {
                document.querySelector('.email-modal-close-trigger')?.click();
            }, 1000);
        } catch (error) {
            console.error('Error submitting email:', error);
            alert('Failed to save email. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Thank You!</h2>
                    <p className="text-slate-600">
                        Your email has been saved successfully.
                    </p>
                </div>
                {/* Hidden button for auto-close trigger */}
                <button 
                    className="email-modal-close-trigger hidden"
                    onClick={() => document.querySelector('.email-modal-wrapper')?.remove()}
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[3000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 email-modal-wrapper">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Stay Connected</h2>
                    <p className="text-slate-600">
                        Join our community! We'll send you important updates about SafePass.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold py-3 rounded-lg hover:from-primary-700 hover:to-primary-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isSubmitting ? 'Saving...' : 'Continue'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default EmailCollectionModal;