import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Mic,
  Key,
  RefreshCw,
  Copy,
  Check,
  ExternalLink,
  Calendar,
  Dumbbell,
  Apple,
  Zap,
  Shield,
  Info,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { loadSiriConfig, generateSiriToken, revokeSiriToken } from '../lib/siriToken';
import type { SiriConfig } from '../lib/siriToken';

const PROJECT_ID = 'the-temple-f195e';
const FUNCTIONS_REGION = 'us-central1';

function getFunctionUrl(name: string): string {
  return `https://${FUNCTIONS_REGION}-${PROJECT_ID}.cloudfunctions.net/${name}`;
}

interface ShortcutInfo {
  name: string;
  command: string;
  description: string;
  icon: React.ElementType;
  functionName: string;
}

const SHORTCUTS: ShortcutInfo[] = [
  {
    name: 'Daily Briefing',
    command: 'Hey Siri, daily briefing',
    description: 'Full summary: schedule, workout, and nutrition',
    icon: Zap,
    functionName: 'siriDailyBriefing',
  },
  {
    name: "Today's Schedule",
    command: "Hey Siri, today's schedule",
    description: "Lists all calendar events for today",
    icon: Calendar,
    functionName: 'siriSchedule',
  },
  {
    name: "Today's Workout",
    command: "Hey Siri, today's workout",
    description: 'Shows your routine and exercises for today',
    icon: Dumbbell,
    functionName: 'siriWorkout',
  },
  {
    name: 'Nutrition Check',
    command: 'Hey Siri, nutrition check',
    description: 'Calories, protein, and macros remaining',
    icon: Apple,
    functionName: 'siriNutrition',
  },
];

export function SiriSetup() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [config, setConfig] = useState<SiriConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedShortcut, setExpandedShortcut] = useState<string | null>(null);

  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  useEffect(() => {
    if (currentUser?.uid) {
      loadSiriConfig(currentUser.uid)
        .then(setConfig)
        .finally(() => setLoading(false));
    }
  }, [currentUser]);

  const handleGenerate = useCallback(async (isRegenerate = false) => {
    if (!currentUser?.uid) return;
    if (isRegenerate) {
      if (!window.confirm('This will invalidate your current token. All existing Siri shortcuts will stop working until you update them with the new token. Continue?')) {
        return;
      }
    }
    setGenerating(true);
    try {
      const newConfig = await generateSiriToken(currentUser.uid, userTimezone);
      setConfig(newConfig);
    } catch (error) {
      console.error('Failed to generate Siri token:', error);
      alert('Failed to generate token. Please try again.');
    } finally {
      setGenerating(false);
    }
  }, [currentUser, userTimezone]);

  const handleRevoke = useCallback(async () => {
    if (!currentUser?.uid) return;
    if (!window.confirm('This will disable all your Siri shortcuts. You can generate a new token anytime.')) {
      return;
    }
    try {
      await revokeSiriToken(currentUser.uid);
      setConfig(null);
    } catch (error) {
      console.error('Failed to revoke token:', error);
      alert('Failed to revoke token. Please try again.');
    }
  }, [currentUser]);

  const copyToClipboard = useCallback(async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  }, []);

  const getFullUrl = useCallback(
    (functionName: string) => {
      if (!config?.token) return '';
      const base = getFunctionUrl(functionName);
      const params = new URLSearchParams({ token: config.token });
      if (userTimezone) params.set('tz', userTimezone);
      return `${base}?${params.toString()}`;
    },
    [config, userTimezone]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 z-10">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Back
          </button>
          <h1 className="ml-4 font-semibold text-gray-900 dark:text-white">Siri Integration</h1>
        </div>
      </header>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Hero */}
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ask Siri About Your Day
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 max-w-sm mx-auto">
            Use Apple Shortcuts to let Siri read your schedule, workout, and nutrition — even from the lock screen.
          </p>
        </div>

        {/* Step 1: Generate Token */}
        <div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
            Step 1 — Generate Your Siri Token
          </h3>
          <div className="card dark:bg-gray-800 dark:border-gray-700 p-4">
            {config?.token ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <Shield className="w-4 h-4" />
                  <span>Token active</span>
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 flex items-center gap-2">
                  <Key className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <code className="flex-1 text-sm text-gray-800 dark:text-gray-200 font-mono break-all select-all">
                    {config.token}
                  </code>
                  <button
                    onClick={() => copyToClipboard(config.token, 'token')}
                    className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                    title="Copy token"
                  >
                    {copied === 'token' ? (
                      <Check className="w-4 h-4 text-green-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleGenerate(true)}
                    disabled={generating}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
                    Regenerate
                  </button>
                  <button
                    onClick={handleRevoke}
                    className="flex-1 py-2 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Generate a secure token that connects Siri to your data. This token is private — only share it with your own Apple Shortcuts.
                </p>
                <button
                  onClick={() => handleGenerate()}
                  disabled={generating}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium rounded-xl hover:from-purple-600 hover:to-blue-600 transition-all shadow-md"
                >
                  {generating ? (
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  ) : (
                    <Key className="w-5 h-5" />
                  )}
                  Generate Siri Token
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Step 2: Set Up Shortcuts */}
        {config?.token && (
          <div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
              Step 2 — Create Apple Shortcuts
            </h3>
            <div className="space-y-3">
              {SHORTCUTS.map((shortcut) => {
                const isExpanded = expandedShortcut === shortcut.functionName;
                const url = getFullUrl(shortcut.functionName);
                const Icon = shortcut.icon;

                return (
                  <div
                    key={shortcut.functionName}
                    className="card dark:bg-gray-800 dark:border-gray-700 p-0 overflow-hidden"
                  >
                    <button
                      onClick={() =>
                        setExpandedShortcut(isExpanded ? null : shortcut.functionName)
                      }
                      className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {shortcut.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {shortcut.description}
                        </p>
                      </div>
                      <ChevronLeft
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? '-rotate-90' : ''
                        }`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="pt-3 space-y-3">
                          {/* URL to copy */}
                          <div>
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-1">
                              API URL
                            </label>
                            <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-2 flex items-start gap-2">
                              <code className="flex-1 text-xs text-gray-700 dark:text-gray-300 font-mono break-all select-all">
                                {url}
                              </code>
                              <button
                                onClick={() =>
                                  copyToClipboard(url, shortcut.functionName)
                                }
                                className="flex-shrink-0 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                              >
                                {copied === shortcut.functionName ? (
                                  <Check className="w-3.5 h-3.5 text-green-500" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Instructions */}
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-700 dark:text-blue-300 mb-2">
                              How to set up in Apple Shortcuts:
                            </p>
                            <ol className="text-xs text-blue-600 dark:text-blue-400 space-y-1.5 list-decimal list-inside">
                              <li>Open the <strong>Shortcuts</strong> app on your iPhone</li>
                              <li>Tap <strong>+</strong> to create a new shortcut</li>
                              <li>Add a <strong>"Get Contents of URL"</strong> action</li>
                              <li>Paste the API URL above</li>
                              <li>Add a <strong>"Get Dictionary Value"</strong> action, key: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">text</code></li>
                              <li>Add a <strong>"Speak Text"</strong> action</li>
                              <li>Name it <strong>"{shortcut.name}"</strong></li>
                            </ol>
                            <p className="text-xs text-blue-500 dark:text-blue-400 mt-2 italic">
                              Then say: "{shortcut.command}"
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4">
          <div className="flex gap-3">
            <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-700 dark:text-amber-300 space-y-2">
              <p className="font-medium">Good to know:</p>
              <ul className="space-y-1 text-xs text-amber-600 dark:text-amber-400">
                <li>• Siri reads your data from the cloud — make sure the app has synced before asking</li>
                <li>• Works even when your phone is locked ("Hey Siri")</li>
                <li>• Your token is private — never share it publicly</li>
                <li>• Regenerate the token anytime if you suspect it's compromised</li>
                <li>• Cloud Functions must be deployed first (see deployment guide)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Deployment Note */}
        {config?.token && (
          <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-4">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              Deployment Command
            </p>
            <div className="bg-white dark:bg-gray-700 rounded-lg p-3 flex items-center gap-2">
              <code className="flex-1 text-xs text-gray-700 dark:text-gray-300 font-mono">
                cd functions && npm run deploy
              </code>
              <button
                onClick={() => copyToClipboard('cd functions && npm run deploy', 'deploy')}
                className="flex-shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded"
              >
                {copied === 'deploy' ? (
                  <Check className="w-3.5 h-3.5 text-green-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* External resources */}
        <div className="text-center pb-8">
          <a
            href="https://support.apple.com/guide/shortcuts/intro-to-shortcuts-apdf22b0444c/ios"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-purple-600 dark:text-purple-400 hover:underline"
          >
            Apple Shortcuts User Guide
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
