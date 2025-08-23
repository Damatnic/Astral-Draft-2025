/**
 * Crisis Intervention Widget
 * Provides immediate access to mental health crisis resources and support
 * Follows best practices for crisis intervention UI design
 */

import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon } from '../icons/AlertTriangleIcon';
import { PhoneIcon } from '../icons/PhoneIcon';
import { MessageCircleIcon } from '../icons/MessageCircleIcon';
import { HeartIcon } from '../icons/HeartIcon';
import { GlobeIcon } from '../icons/GlobeIcon';

interface CrisisResource {
  name: string;
  number?: string;
  textNumber?: string;
  website?: string;
  description: string;
  hours: string;
  type: 'phone' | 'text' | 'both' | 'web';
  priority: 'immediate' | 'urgent' | 'support';
}

const crisisResources: CrisisResource[] = [
  {
    name: '988 Suicide & Crisis Lifeline',
    number: '988',
    textNumber: '988',
    website: 'https://988lifeline.org',
    description: 'Free, confidential crisis support 24/7 for anyone in suicidal crisis or emotional distress',
    hours: '24/7',
    type: 'both',
    priority: 'immediate'
  },
  {
    name: 'Crisis Text Line',
    textNumber: '741741',
    website: 'https://www.crisistextline.org',
    description: 'Text HOME to connect with a crisis counselor',
    hours: '24/7',
    type: 'text',
    priority: 'immediate'
  },
  {
    name: 'SAMHSA National Helpline',
    number: '1-800-662-4357',
    website: 'https://www.samhsa.gov/find-help/national-helpline',
    description: 'Treatment referral and information service for mental health and substance use disorders',
    hours: '24/7',
    type: 'phone',
    priority: 'urgent'
  },
  {
    name: 'Veterans Crisis Line',
    number: '1-800-273-8255',
    textNumber: '838255',
    website: 'https://www.veteranscrisisline.net',
    description: 'Support for Veterans and their loved ones',
    hours: '24/7',
    type: 'both',
    priority: 'immediate'
  },
  {
    name: 'LGBTQ National Hotline',
    number: '1-888-843-4564',
    website: 'https://www.lgbthotline.org',
    description: 'Support for LGBTQ individuals',
    hours: '1pm-9pm PST',
    type: 'phone',
    priority: 'support'
  },
  {
    name: 'NAMI HelpLine',
    number: '1-800-950-6264',
    website: 'https://www.nami.org/help',
    description: 'National Alliance on Mental Illness support and resources',
    hours: 'Mon-Fri 10am-10pm ET',
    type: 'phone',
    priority: 'support'
  },
  {
    name: 'International Crisis Lines',
    website: 'https://findahelpline.com',
    description: 'Find crisis support in your country',
    hours: 'Varies by location',
    type: 'web',
    priority: 'support'
  }
];

export const CrisisInterventionWidget: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [lastInteraction, setLastInteraction] = useState<Date | null>(null);

  // Track user interaction for analytics (privacy-focused)
  useEffect(() => {
    if (isExpanded) {
      setLastInteraction(new Date());
      // Log anonymous usage for improvement purposes
      console.log('Crisis resources accessed - anonymous event');
    }
  }, [isExpanded]);

  const handleResourceClick = (resource: CrisisResource, action: 'call' | 'text' | 'web') => {
    setShowConfirmation(true);
    setTimeout(() => setShowConfirmation(false), 3000);

    // Track which type of resource was accessed (no personal data)
    console.log(`Crisis resource accessed: ${action} - ${resource.priority} priority`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return 'bg-red-50 border-red-200';
      case 'urgent':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'immediate':
        return 'bg-red-100 text-red-800';
      case 'urgent':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <>
      {/* Floating Crisis Button - Always Visible */}
      <div className="fixed bottom-20 right-4 z-50">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 group"
          aria-label="Crisis Support Resources"
        >
          <HeartIcon className="w-5 h-5" />
          <span className="hidden group-hover:inline text-sm font-medium pr-1">
            Crisis Support
          </span>
        </button>
      </div>

      {/* Crisis Resources Modal */}
      {isExpanded && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <HeartIcon className="w-8 h-8" />
                  <div>
                    <h2 className="text-2xl font-bold">Crisis Support Resources</h2>
                    <p className="text-purple-100 text-sm mt-1">
                      You're not alone. Help is available 24/7.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Important Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangleIcon className="w-5 h-5 text-red-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    If you're in immediate danger, call 911 or your local emergency services
                  </p>
                </div>
              </div>
            </div>

            {/* Resources List */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                {crisisResources.map((resource, index) => (
                  <div
                    key={index}
                    className={`border rounded-lg p-4 ${getPriorityColor(resource.priority)} transition-all duration-200 hover:shadow-md`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900">
                            {resource.name}
                          </h3>
                          <span className={`text-xs px-2 py-1 rounded-full ${getPriorityBadge(resource.priority)}`}>
                            {resource.priority === 'immediate' ? '24/7 Immediate' : 
                             resource.priority === 'urgent' ? 'Urgent' : 'Support'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {resource.description}
                        </p>
                        <div className="flex flex-wrap gap-3">
                          {resource.number && (
                            <a
                              href={`tel:${resource.number}`}
                              onClick={() => handleResourceClick(resource, 'call')}
                              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                              <PhoneIcon className="w-4 h-4" />
                              Call {resource.number}
                            </a>
                          )}
                          {resource.textNumber && (
                            <a
                              href={`sms:${resource.textNumber}${resource.textNumber === '741741' ? '&body=HOME' : ''}`}
                              onClick={() => handleResourceClick(resource, 'text')}
                              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                            >
                              <MessageCircleIcon className="w-4 h-4" />
                              Text {resource.textNumber}
                            </a>
                          )}
                          {resource.website && (
                            <a
                              href={resource.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => handleResourceClick(resource, 'web')}
                              className="inline-flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                            >
                              <GlobeIcon className="w-4 h-4" />
                              Visit Website
                            </a>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Hours: {resource.hours}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Self-Care Resources */}
              <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">Self-Care Resources</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>• Practice deep breathing exercises</p>
                  <p>• Use grounding techniques (5-4-3-2-1 method)</p>
                  <p>• Reach out to a trusted friend or family member</p>
                  <p>• Consider using mental health apps for daily support</p>
                  <p>• Remember: Seeking help is a sign of strength</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 py-4 border-t">
              <p className="text-xs text-gray-500 text-center">
                All resources are confidential. Your privacy and safety are paramount.
                This app cares about your wellbeing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Toast */}
      {showConfirmation && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in">
          <p className="text-sm font-medium">Resource opened. You're taking a positive step.</p>
        </div>
      )}
    </>
  );
};

// PhoneIcon is imported from ../icons/PhoneIcon

export default CrisisInterventionWidget;