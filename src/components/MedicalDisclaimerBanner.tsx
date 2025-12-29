import React from 'react';
import { AlertTriangle } from 'lucide-react';

const MedicalDisclaimerBanner = () => {
    return (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 mb-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-200/90">
                <span className="font-bold block text-amber-100 mb-0.5">Medical Disclaimer</span>
                This AI tool is for informational and educational purposes only. It is not a substitute for professional medical diagnosis, advice, or treatment. Always consult a qualified healthcare provider for any health concerns.
            </div>
        </div>
    );
};

export default MedicalDisclaimerBanner;
