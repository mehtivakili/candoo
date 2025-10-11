'use client';

import { useState } from 'react';
import { Brain, Loader2, CheckCircle, AlertCircle, BarChart3, Eye } from 'lucide-react';

interface SurveyResult {
  success: boolean;
  message: string;
  surveyData?: {
    url: string;
    timestamp: string;
    elements: any[];
    pageTitle: string;
    pageDescription: string;
    recommendations: {
      searchInput: any;
      locationInput: any;
      searchButton: any;
      resultCards: any[];
    };
    screenshot: string;
  };
}

export default function DOMSurveyTest() {
  const [url, setUrl] = useState('https://snappfood.ir/');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SurveyResult | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const runSurvey = async () => {
    if (!url.trim()) {
      alert('Please enter a URL');
      return;
    }

    setIsLoading(true);
    setResult(null);
    setShowDetails(false);

    try {
      const response = await fetch('/api/dom-survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🔍 DOM Survey Test Tool
          </h1>
          <p className="text-gray-600 text-lg">
            Test the sophisticated DOM analysis system on any website
          </p>
        </div>

        {/* URL Input */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Survey Configuration
          </h2>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                Website URL to Survey
              </label>
              <input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-lg"
                disabled={isLoading}
              />
            </div>
            <button
              onClick={runSurvey}
              disabled={isLoading || !url.trim()}
              className="px-8 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2 font-semibold text-lg transition-colors"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Surveying...
                </>
              ) : (
                <>
                  <Brain className="w-5 h-5" />
                  Run Survey
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-500" />
                ) : (
                  <AlertCircle className="w-6 h-6 text-red-500" />
                )}
                <h2 className="text-xl font-semibold text-gray-800">
                  {result.success ? 'Survey Completed' : 'Survey Failed'}
                </h2>
              </div>
              <p className="text-gray-600 mb-4">{result.message}</p>
            </div>

            {/* Survey Data */}
            {result.success && result.surveyData && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-blue-600" />
                    Survey Results
                  </h2>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    {showDetails ? 'Hide Details' : 'Show Details'}
                  </button>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <div className="text-3xl font-bold text-purple-600">{result.surveyData.elements?.length || 0}</div>
                    <div className="text-sm text-gray-600">Total Elements</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-3xl font-bold text-blue-600">{result.surveyData.recommendations?.searchInput ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Search Input</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-3xl font-bold text-green-600">{result.surveyData.recommendations?.locationInput ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Location Input</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <div className="text-3xl font-bold text-orange-600">{result.surveyData.recommendations?.searchButton ? '✓' : '✗'}</div>
                    <div className="text-sm text-gray-600">Search Button</div>
                  </div>
                </div>

                {/* Page Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Page Information:</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div><strong>Title:</strong> {result.surveyData.pageTitle}</div>
                    <div><strong>URL:</strong> {result.surveyData.url}</div>
                    <div><strong>Survey Time:</strong> {new Date(result.surveyData.timestamp).toLocaleString()}</div>
                    {result.surveyData.pageDescription && (
                      <div><strong>Description:</strong> {result.surveyData.pageDescription}</div>
                    )}
                  </div>
                </div>

                {/* Detailed Results */}
                {showDetails && (
                  <div className="space-y-4">
                    {/* Recommendations */}
                    {result.surveyData.recommendations && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Recommended Elements:</h3>
                        <div className="space-y-3">
                          {result.surveyData.recommendations.searchInput && (
                            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-blue-800">Search Input</strong>
                                <span className="text-sm text-blue-600 font-medium">
                                  {(result.surveyData.recommendations.searchInput.confidence * 100).toFixed(1)}% confidence
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <div><strong>Selector:</strong> {result.surveyData.recommendations.searchInput.selector}</div>
                                <div><strong>Tag:</strong> {result.surveyData.recommendations.searchInput.tagName}</div>
                                <div><strong>Visible:</strong> {result.surveyData.recommendations.searchInput.isVisible ? 'Yes' : 'No'}</div>
                                {result.surveyData.recommendations.searchInput.textContent && (
                                  <div><strong>Text:</strong> {result.surveyData.recommendations.searchInput.textContent}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {result.surveyData.recommendations.locationInput && (
                            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-green-800">Location Input</strong>
                                <span className="text-sm text-green-600 font-medium">
                                  {(result.surveyData.recommendations.locationInput.confidence * 100).toFixed(1)}% confidence
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <div><strong>Selector:</strong> {result.surveyData.recommendations.locationInput.selector}</div>
                                <div><strong>Tag:</strong> {result.surveyData.recommendations.locationInput.tagName}</div>
                                <div><strong>Visible:</strong> {result.surveyData.recommendations.locationInput.isVisible ? 'Yes' : 'No'}</div>
                                {result.surveyData.recommendations.locationInput.textContent && (
                                  <div><strong>Text:</strong> {result.surveyData.recommendations.locationInput.textContent}</div>
                                )}
                              </div>
                            </div>
                          )}

                          {result.surveyData.recommendations.searchButton && (
                            <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                              <div className="flex items-center justify-between mb-2">
                                <strong className="text-orange-800">Search Button</strong>
                                <span className="text-sm text-orange-600 font-medium">
                                  {(result.surveyData.recommendations.searchButton.confidence * 100).toFixed(1)}% confidence
                                </span>
                              </div>
                              <div className="text-sm text-gray-700">
                                <div><strong>Selector:</strong> {result.surveyData.recommendations.searchButton.selector}</div>
                                <div><strong>Tag:</strong> {result.surveyData.recommendations.searchButton.tagName}</div>
                                <div><strong>Visible:</strong> {result.surveyData.recommendations.searchButton.isVisible ? 'Yes' : 'No'}</div>
                                {result.surveyData.recommendations.searchButton.textContent && (
                                  <div><strong>Text:</strong> {result.surveyData.recommendations.searchButton.textContent}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Screenshot */}
                    {result.surveyData.screenshot && (
                      <div>
                        <h3 className="font-semibold text-gray-700 mb-3">Page Screenshot:</h3>
                        <div className="border rounded-lg overflow-hidden">
                          <img
                            src={`data:image/png;base64,${result.surveyData.screenshot}`}
                            alt="Survey screenshot"
                            className="w-full h-auto"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-3">About DOM Survey:</h3>
          <div className="space-y-3 text-blue-700">
            <p>The DOM Survey system uses multiple analysis strategies to intelligently identify key elements on web pages:</p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Semantic Analysis:</strong> Analyzes element attributes, text content, and semantic meaning</li>
              <li><strong>Attribute Pattern Matching:</strong> Uses common CSS selectors and attribute patterns</li>
              <li><strong>Visual Layout Analysis:</strong> Analyzes element position, size, and visual characteristics</li>
              <li><strong>Behavioral Analysis:</strong> Tests element behavior and interaction patterns</li>
            </ul>
            <p className="text-sm bg-blue-100 p-3 rounded-lg">
              <strong>💡 Tip:</strong> This tool helps you understand how the sophisticated automation identifies elements on websites. 
              Try different URLs to see how the analysis adapts to different page structures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

