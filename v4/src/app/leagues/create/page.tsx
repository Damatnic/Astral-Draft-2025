'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { ChevronLeft, ChevronRight, Check, Users, Trophy, Calendar, Settings, DollarSign, Shield, Clock, Zap } from 'lucide-react'
import { createLeagueSchema } from '@/lib/validation/schemas'
import { api } from '@/lib/api'

// Use the schema type from validation
type LeagueFormData = {
  name: string
  description?: string
  maxTeams: number
  isPublic: boolean
  password?: string
  settings: {
    rosterPositions: {
      QB: number
      RB: number
      WR: number
      TE: number
      FLEX: number
      K: number
      DST: number
      BENCH: number
    }
    waiverPeriod: number
    tradeDeadline?: string
    playoffTeams: number
  }
  draftSettings: {
    type: 'SNAKE' | 'LINEAR' | 'AUCTION'
    scheduledAt: string
    rounds: number
    pickTimeLimit: number
    order: 'RANDOMIZED' | 'MANUAL'
    allowTrades: boolean
    autopickEnabled: boolean
  }
  scoringSettings: {
    passing: {
      passingYards: number
      passingTouchdowns: number
      interceptions: number
      passingTwoPointConversions: number
    }
    rushing: {
      rushingYards: number
      rushingTouchdowns: number
      rushingTwoPointConversions: number
    }
    receiving: {
      receivingYards: number
      receivingTouchdowns: number
      receptions: number
      receivingTwoPointConversions: number
    }
  }
}

export default function CreateLeaguePage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)

  const methods = useForm<LeagueFormData>({
    resolver: zodResolver(createLeagueSchema),
    defaultValues: {
      name: '',
      description: '',
      maxTeams: 10,
      isPublic: false,
      password: '',
      settings: {
        rosterPositions: {
          QB: 1,
          RB: 2,
          WR: 2,
          TE: 1,
          FLEX: 1,
          K: 1,
          DST: 1,
          BENCH: 6,
        },
        waiverPeriod: 1,
        tradeDeadline: '',
        playoffTeams: 4,
      },
      draftSettings: {
        type: 'SNAKE',
        scheduledAt: '',
        rounds: 15,
        pickTimeLimit: 120,
        order: 'RANDOMIZED',
        allowTrades: false,
        autopickEnabled: true,
      },
      scoringSettings: {
        passing: {
          passingYards: 0.04,
          passingTouchdowns: 4,
          interceptions: -2,
          passingTwoPointConversions: 2,
        },
        rushing: {
          rushingYards: 0.1,
          rushingTouchdowns: 6,
          rushingTwoPointConversions: 2,
        },
        receiving: {
          receivingYards: 0.1,
          receivingTouchdowns: 6,
          receptions: 0, // Standard scoring, can be changed to 1 for PPR
          receivingTwoPointConversions: 2,
        },
      },
    },
  })

  const { handleSubmit, formState: { errors, isSubmitting }, watch, setValue } = methods

  const totalSteps = 5

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Submit form to create league
      await handleSubmit(onSubmit)()
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const onSubmit = async (data: LeagueFormData) => {
    try {
      // TODO: Replace with actual API call to create league
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        const league = await response.json()
        toast.success('League created successfully!')
        router.push(`/leagues/${league.id}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to create league. Please try again.')
      }
    } catch (err) {
      console.error('League creation error:', err)
      toast.error('An unexpected error occurred. Please try again.')
    }
  }

  const updateField = (field: string, value: any) => {
    setValue(field as any, value)
  }

  const watchedValues = watch()

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Basic Information</h2>
              <p className="text-gray-600">Let&apos;s start with the basics of your league</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Name *
                </label>
                <input
                  type="text"
                  value={watchedValues.name || ''}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter league name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={watchedValues.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Describe your league..."
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateField('isPublic', false)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      !watchedValues.isPublic
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Private</div>
                    <div className="text-xs text-gray-500 mt-1">Invite only</div>
                  </button>
                  <button
                    onClick={() => updateField('isPublic', true)}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      watchedValues.isPublic
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">Public</div>
                    <div className="text-xs text-gray-500 mt-1">Anyone can join</div>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Teams
                </label>
                <select
                  value={watchedValues.maxTeams || 10}
                  onChange={(e) => updateField('maxTeams', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={8}>8 Teams</option>
                  <option value={10}>10 Teams</option>
                  <option value={12}>12 Teams</option>
                  <option value={14}>14 Teams</option>
                  <option value={16}>16 Teams</option>
                </select>
              </div>
            </div>
          </div>
        )
        
      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">League Format</h2>
              <p className="text-gray-600">Choose your scoring and league settings</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  League Format
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['standard', 'ppr', 'half-ppr', 'dynasty'].map((format) => {
                    const isPPR = format === 'ppr';
                    const isHalfPPR = format === 'half-ppr';
                    const currentReceptions = watchedValues.scoringSettings?.receiving?.receptions || 0;
                    const isSelected = (isPPR && currentReceptions === 1) || 
                                     (isHalfPPR && currentReceptions === 0.5) || 
                                     (format === 'standard' && currentReceptions === 0);
                    
                    return (
                      <button
                        key={format}
                        onClick={() => {
                          const receptionValue = isPPR ? 1 : isHalfPPR ? 0.5 : 0;
                          updateField('scoringSettings.receiving.receptions', receptionValue);
                        }}
                        className={`p-3 border-2 rounded-lg transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium capitalize">{format.replace('-', ' ')}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Scoring System
                </label>
                <select
                  value={
                    watchedValues.scoringSettings?.receiving?.receptions === 1 ? 'ppr' :
                    watchedValues.scoringSettings?.receiving?.receptions === 0.5 ? 'half-ppr' :
                    'standard'
                  }
                  onChange={(e) => {
                    const value = e.target.value === 'ppr' ? 1 : e.target.value === 'half-ppr' ? 0.5 : 0;
                    updateField('scoringSettings.receiving.receptions', value);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="standard">Standard Scoring</option>
                  <option value="ppr">PPR (1 point per reception)</option>
                  <option value="half-ppr">Half PPR (0.5 points per reception)</option>
                  <option value="custom">Custom Scoring</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keeper League?
                </label>
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={(e) => {}}
                      className="mr-2"
                      disabled
                    />
                    <span className="text-gray-500">Enable Keepers (Coming Soon)</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Playoff Settings
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Teams in Playoffs</label>
                    <select
                      value={watchedValues.settings?.playoffTeams || 4}
                      onChange={(e) => updateField('settings.playoffTeams', parseInt(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={4}>4 Teams</option>
                      <option value={6}>6 Teams</option>
                      <option value={8}>8 Teams</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Playoff Weeks</label>
                    <select
                      defaultValue="14-16"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="14-16">Weeks 14-16</option>
                      <option value="15-17">Weeks 15-17</option>
                      <option value="14-17">Weeks 14-17</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Draft Settings</h2>
              <p className="text-gray-600">Configure your draft preferences</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draft Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateField('draftSettings.type', 'SNAKE')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      watchedValues.draftSettings?.type === 'SNAKE'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Zap className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <div className="font-medium">Snake Draft</div>
                    <div className="text-xs text-gray-500 mt-1">Traditional format</div>
                  </button>
                  <button
                    onClick={() => updateField('draftSettings.type', 'AUCTION')}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      watchedValues.draftSettings?.type === 'AUCTION'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">Auction Draft</div>
                    <div className="text-xs text-gray-500 mt-1">Salary cap format</div>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draft Date & Time
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="datetime-local"
                    value={watchedValues.draftSettings?.scheduledAt || ''}
                    onChange={(e) => updateField('draftSettings.scheduledAt', e.target.value)}
                    className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Draft Order
                </label>
                <select
                  value={watchedValues.draftSettings?.order || 'RANDOMIZED'}
                  onChange={(e) => updateField('draftSettings.order', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="RANDOMIZED">Randomized 1 hour before draft</option>
                  <option value="MANUAL">Manual selection</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time per Pick
                </label>
                <select
                  value={watchedValues.draftSettings?.pickTimeLimit || 120}
                  onChange={(e) => updateField('draftSettings.pickTimeLimit', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>2 minutes</option>
                  <option value={0}>No time limit</option>
                </select>
              </div>
            </div>
          </div>
        )
        
      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Waivers & Trades</h2>
              <p className="text-gray-600">Set up transaction rules</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waiver Type
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => {}}
                    className={`p-4 border-2 rounded-lg transition-all border-blue-500 bg-blue-50`}
                  >
                    <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <div className="font-medium">FAAB</div>
                    <div className="text-xs text-gray-500 mt-1">Budget-based</div>
                  </button>
                  <button
                    onClick={() => {}}
                    className={`p-4 border-2 rounded-lg transition-all border-gray-200 hover:border-gray-300`}
                  >
                    <Trophy className="w-6 h-6 mx-auto mb-2 text-purple-600" />
                    <div className="font-medium">Priority</div>
                    <div className="text-xs text-gray-500 mt-1">Rolling list</div>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  FAAB Budget
                </label>
                <input
                  type="number"
                  defaultValue={100}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter budget amount"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Waiver Period
                </label>
                <select
                  value={watchedValues.settings?.waiverPeriod || 1}
                  onChange={(e) => updateField('settings.waiverPeriod', parseInt(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>Daily - Midnight PT</option>
                  <option value={2}>Daily - 3am PT</option>
                  <option value={3}>Wednesday only</option>
                  <option value={4}>Tuesday & Friday</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade Deadline
                </label>
                <input
                  type="date"
                  value={watchedValues.settings?.tradeDeadline || ''}
                  onChange={(e) => updateField('settings.tradeDeadline', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trade Review Period
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>1 day</option>
                  <option>2 days</option>
                  <option>League vote (majority)</option>
                  <option>Commissioner approval</option>
                  <option>No review (instant)</option>
                </select>
              </div>
            </div>
          </div>
        )
        
      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Entry & Prizes</h2>
              <p className="text-gray-600">Set up league fees and payouts</p>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Entry Fee
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="number"
                    defaultValue={0}
                    className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* Entry fee and prize distribution can be configured later */}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Collection
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option>Platform handles payments</option>
                  <option>Commissioner collects</option>
                  <option>No fee collection</option>
                </select>
              </div>
            </div>
          </div>
        )
        
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Bar */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Create New League</h1>
            <span className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {['Basic', 'Format', 'Draft', 'Transactions', 'Prizes'].map((label, index) => (
              <span
                key={label}
                className={`text-xs ${
                  index + 1 <= currentStep ? 'text-blue-600 font-medium' : 'text-gray-400'
                }`}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-lg p-6 md:p-8 shadow-lg">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleBack}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            {currentStep === totalSteps ? (
              <>
                Create League
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}