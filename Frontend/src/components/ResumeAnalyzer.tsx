import React from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { useAuth } from "./AuthContext";
import { Upload, FileText, CheckCircle, AlertCircle } from "lucide-react";
import { analyzeResume as analyzeResumeApi } from "../utils/api"; // adjust path if necessary

export function ResumeAnalyzer() {
  const { user } = useAuth();
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [analysisData, setAnalysisData] = React.useState<any | null>(null);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setAnalysisData(null);
    const file = e.target.files?.[0] ?? null;
    if (file && !file.name.toLowerCase().endsWith('.pdf') && !file.type.includes('pdf')) {
      setError('Please upload a PDF file (.pdf)');
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please choose a PDF resume first.');
      return;
    }
    if (!user) {
      setError('Please sign in to analyze your resume.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysisData(null);

    try {
      // analyzeResumeApi should accept a File and POST it as FormData to /api/resume/analyze
      const result = await analyzeResumeApi(selectedFile);
      // expected backend shape: { success: true, source: 'ai'|'sample', data: {...} }
      if (!result || !result.success) {
        throw new Error(result?.message || 'Resume analysis failed');
      }

      // result.data is the parsed resume JSON from backend
      setAnalysisData(result.data ?? null);
    } catch (err: any) {
      console.error('Resume analysis error:', err);
      setError(err?.message || 'Failed to analyze resume. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Resume Analyzer</h1>
          <p className="text-xl text-gray-600">Get AI-powered insights to improve your resume</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <Card className="shadow-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-purple-600" />
                  <span>Upload Resume</span>
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-purple-300 rounded-xl p-8 text-center">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="resume-upload"
                  />
                  <label htmlFor="resume-upload" className="cursor-pointer">
                    <FileText className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-700">
                      {selectedFile ? selectedFile.name : 'Click to select your resume'}
                    </p>
                    <p className="text-sm text-gray-500">PDF files supported</p>
                  </label>
                </div>

                <Button
                  onClick={handleAnalyze}
                  disabled={!selectedFile || !user || isAnalyzing}
                  className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white py-3 rounded-xl disabled:opacity-50"
                >
                  {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
                </Button>

                {!user && <p className="text-sm text-center text-gray-500">Sign in to analyze your resume</p>}
                {error && <p className="text-sm text-center text-red-600 mt-2">{error}</p>}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            {!analysisData && user && !isAnalyzing && (
              <Card className="shadow-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">Upload Your Resume</h3>
                  <p className="text-gray-600">Get AI-powered insights and recommendations</p>
                  <p className="text-sm text-gray-500 mt-2">Supported format: PDF (.pdf)</p>
                </CardContent>
              </Card>
            )}

            {isAnalyzing && (
              <Card className="shadow-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <div className="w-16 h-16 border-4 border-[#6A0DAD] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">Analyzing Resume...</h3>
                  <p className="text-gray-600">Our AI is reviewing your resume. This may take a moment.</p>
                </CardContent>
              </Card>
            )}

            {!user && (
              <Card className="shadow-lg rounded-2xl">
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900">Sign In to Get Started</h3>
                  <p className="text-gray-600">Create an account to analyze your resume</p>
                </CardContent>
              </Card>
            )}

            {analysisData && (
              <>
                <Card className="shadow-lg rounded-2xl">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>Overall Score</span>
                      <div className="text-3xl font-bold text-purple-600">
                        {typeof analysisData.ats_score_estimate === 'number'
                          ? `${analysisData.ats_score_estimate}/100`
                          : (analysisData.score ? `${analysisData.score}/100` : '—')}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      value={
                        typeof analysisData.ats_score_estimate === 'number'
                          ? analysisData.ats_score_estimate
                          : analysisData.score ?? 0
                      }
                      className="h-3 mb-4"
                    />
                    <p className="text-gray-600">
                      {((analysisData.ats_score_estimate ?? analysisData.score) >= 80) && (
                        <>Your resume is <span className="font-semibold text-green-600">excellent</span>. Keep it up!</>
                      )}
                      {((analysisData.ats_score_estimate ?? analysisData.score) >= 60) &&
                        ((analysisData.ats_score_estimate ?? analysisData.score) < 80) && (
                          <>Your resume is <span className="font-semibold text-purple-600">good</span>. Use suggestions to improve.</>
                        )}
                      {((analysisData.ats_score_estimate ?? analysisData.score) < 60) && (
                        <>Your resume needs <span className="font-semibold text-orange-600">improvement</span>. Review suggestions below.</>
                      )}
                    </p>
                  </CardContent>
                </Card>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-green-700 flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5" />
                        <span>Strengths</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisData.top_skills && analysisData.top_skills.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {analysisData.top_skills.map((skill: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-500 text-sm">No skills detected yet.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle className="text-orange-700 flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5" />
                        <span>Areas to Improve</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisData.improvement_suggestions && analysisData.improvement_suggestions.length > 0 ? (
                        <ul className="list-disc pl-5 space-y-2 text-gray-700">
                          {analysisData.improvement_suggestions.map((s: string, i: number) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">No major areas found.</p>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {analysisData.summary && (
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle>Professional Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 whitespace-pre-line">{analysisData.summary}</p>
                    </CardContent>
                  </Card>
                )}

                {analysisData.experience && analysisData.experience.length > 0 && (
                  <Card className="shadow-lg rounded-2xl">
                    <CardHeader>
                      <CardTitle>Experience</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {analysisData.experience.map((exp: any, idx: number) => (
                          <div key={idx}>
                            <div className="flex items-baseline justify-between">
                              <h4 className="font-semibold">{exp.title} @ {exp.company}</h4>
                              <span className="text-sm text-gray-500">{exp.start ?? ''} - {exp.end ?? 'Present'}</span>
                            </div>
                            {exp.bullets && exp.bullets.length > 0 && (
                              <ul className="list-disc pl-5 text-gray-700 mt-2">
                                {exp.bullets.map((b: string, bi: number) => <li key={bi}>{b}</li>)}
                              </ul>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
