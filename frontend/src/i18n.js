import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: {
        translation: {
          welcome: "Welcome",
          appointments: "Appointments",
          records: "Health Locker",
          vitals: "Health Tracker",
          ehr: "Master Health Summary",
          prescriptions: "Prescriptions",
          family: "Family Members",
          notifications: "Notifications",
          symptoms: "AI Symptom Finder",
          book_new: "Book New Appointment",
          cancel: "Cancel",
          reschedule: "Reschedule",
          opd_slip: "OPD Slip",
          rate: "Rate Doctor",
          callback: "Callback",
          rebook: "Rebook"
        }
      },
      hi: {
        translation: {
          welcome: "स्वागत है",
          appointments: "निर्धारित भेंट",
          records: "स्वास्थ्य लॉकर",
          vitals: "स्वास्थ्य ट्रैकर",
          ehr: "मास्टर स्वास्थ्य सारांश",
          prescriptions: "दवा की पर्ची",
          family: "परिवार के सदस्य",
          notifications: "सूचनाएं",
          symptoms: "एआई लक्षण खोजक",
          book_new: "नया अपॉइंटमेंट बुक करें",
          cancel: "रद्द करें",
          reschedule: "पुनर्निर्धारित करें",
          opd_slip: "ओपीडी पर्ची",
          rate: "डॉक्टर को रेट करें",
          callback: "कॉल बैक करें",
          rebook: "फिर से बुक करें"
        }
      }
    }
  });

export default i18n;
