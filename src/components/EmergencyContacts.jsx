import { useState, useEffect } from 'react';
import { Phone, Copy, Check } from 'lucide-react';
import contactsData from '../data/contacts.json';

const EmergencyContacts = () => {
  const [copiedNumber, setCopiedNumber] = useState(null);
  const [language, setLanguage] = useState('en'); // default to English

  // Set language based on browser preference or localStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('preferred_language');
    if (savedLang && ['en', 'si', 'ta'].includes(savedLang)) {
      setLanguage(savedLang);
    } else {
      // Detect browser language
      const browserLang = navigator.language || navigator.languages[0];
      if (browserLang.startsWith('si')) {
        setLanguage('si');
      } else if (browserLang.startsWith('ta')) {
        setLanguage('ta');
      } else {
        setLanguage('en');
      }
    }
  }, []);

  const copyToClipboard = (number) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2000); // Reset after 2 seconds
    });
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number}`;
  };

  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    localStorage.setItem('preferred_language', lang);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 pt-20 overflow-x-hidden">
      <div className="max-w-4xl mx-auto">
        {/* Language Selector */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 mb-8 border border-white/20">
          <div className="flex justify-center gap-2">
            <button
              onClick={() => handleLanguageChange('en')}
              className={`px-4 py-2 rounded-lg transition-colors ${language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
            >
              English
            </button>
            <button
              onClick={() => handleLanguageChange('si')}
              className={`px-4 py-2 rounded-lg transition-colors ${language === 'si'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
            >
              සිංහල
            </button>
            <button
              onClick={() => handleLanguageChange('ta')}
              className={`px-4 py-2 rounded-lg transition-colors ${language === 'ta'
                ? 'bg-blue-600 text-white'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
                }`}
            >
              தமிழ்
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {language === 'si'
                  ? 'හදිසි ඇමතුම් අංක'
                  : language === 'ta'
                    ? 'அவசர எண்கள்'
                    : 'Emergency Contacts'}
              </h1>
              <p className="text-slate-300">
                {language === 'si'
                  ? 'ශ්‍රී ලංකාවේ හදිසි සේවාවන් වෙත ප්‍රවේගී ප්‍රවේශය'
                  : language === 'ta'
                    ? 'இலங்கையில் அவசர சேவைகளுக்கான விரைவான அணுகல்'
                    : 'Quick access to emergency services in Sri Lanka'}
              </p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-full border border-red-500/50">
              <Phone className="w-8 h-8 text-red-400" />
            </div>
          </div>
        </div>

        {/* Contacts by Category */}
        <div className="space-y-6 pb-8">
          {contactsData.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
                {category.category[language] || category.category.en}
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {category.contacts.map((contact, contactIndex) => (
                  <div
                    key={contactIndex}
                    className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">
                          {contact.name[language] || contact.name.en}
                        </h3>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-bold text-primary-400">{contact.number}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 ml-2">
                        <button
                          onClick={() => handleCall(contact.number)}
                          className="bg-green-500/20 hover:bg-green-500/30 p-2 rounded-lg border border-green-500/50 transition-colors"
                          aria-label={
                            language === 'si'
                              ? `${contact.name.si || contact.name.en} අමතන්න`
                              : language === 'ta'
                                ? `${contact.name.ta || contact.name.en} அழைக்க`
                                : `Call ${contact.name.en}`
                          }
                        >
                          <Phone className="w-5 h-5 text-green-400" />
                        </button>

                        <button
                          onClick={() => copyToClipboard(contact.number)}
                          className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded-lg border border-blue-500/50 transition-colors"
                          aria-label={
                            language === 'si'
                              ? `${contact.name.si || contact.name.en} අංකය පිටපත් කරන්න`
                              : language === 'ta'
                                ? `${contact.name.ta || contact.name.en} எண்ணை நகலெடுக்க`
                                : `Copy ${contact.name.en} number`
                          }
                        >
                          {copiedNumber === contact.number ? (
                            <Check className="w-5 h-5 text-blue-400" />
                          ) : (
                            <Copy className="w-5 h-5 text-blue-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-slate-400 text-sm pb-8">
          <p>
            {language === 'si'
              ? 'දුරකථන අයිකනය මත click කර අමතන්න හෝ copy අයිකනය මත click කර අංකය clipboard වෙත copy කරගන්න'
              : language === 'ta'
                ? 'அழைப்பு ஐகானைக் கிளிக் செய்து அழைக்கவும் அல்லது நகலை ஐகானைக் கிளிக் செய்து எண்ணை கிளிப்போர்டுக்கு நகலெடுக்கவும்'
                : 'Tap the phone icon to call or the copy icon to copy the number to clipboard'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContacts;