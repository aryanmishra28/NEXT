import React, { useEffect, useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Briefcase,
  Calendar,
  MapPin,
  Clock,
  ExternalLink,
  Filter,
} from "lucide-react";

/* =======================
   TYPES
======================= */
type Job = {
  _id: string;
  title: string;
  company: string;
  location: string;
  type: "Internship" | "Full-time" | "Part-time";
  salary?: string;
  skills: string[];
  deadline?: string;
  createdAt: string;
};

/* =======================
   API FUNCTIONS
======================= */
const API_BASE = import.meta.env.VITE_API_BASE;

const fetchJobs = async () => {
  const res = await fetch(`${API_BASE}/api/jobs`);
  return res.json();
};

const applyJob = async (jobId: string) => {
  const res = await fetch(`${API_BASE}/api/applications/apply`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jobId }),
  });
  return res.json();
};

/* =======================
   COMPONENT
======================= */
export function JobsAndUpdates() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* Fetch Jobs */
  useEffect(() => {
    const loadJobs = async () => {
      try {
        const data = await fetchJobs();
        if (data.success) {
          setJobs(data.jobs);
        } else {
          setError("Failed to load jobs");
        }
      } catch {
        setError("Server error");
      } finally {
        setLoading(false);
      }
    };
    loadJobs();
  }, []);

  /* Apply Job */
  const handleApply = async (jobId: string) => {
    try {
      const res = await applyJob(jobId);
      if (res.success) {
        alert("Job applied successfully 🎉");
      } else {
        alert(res.message);
      }
    } catch {
      alert("Failed to apply job");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center space-y-4 mb-12">
          <h1 className="text-4xl font-bold text-gray-900">
            Jobs & Opportunities
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Explore latest jobs and internships tailored for students.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between mb-8">
          <Button variant="outline" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </Button>
          <div className="text-sm text-gray-500">
            {jobs.length} jobs found
          </div>
        </div>

        {/* Loading / Error */}
        {loading && (
          <p className="text-center text-gray-500">Loading jobs...</p>
        )}
        {error && (
          <p className="text-center text-red-500">{error}</p>
        )}

        {!loading && !error && (
          <Tabs defaultValue="jobs" className="space-y-8">
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px] mx-auto">
              <TabsTrigger value="jobs">Jobs</TabsTrigger>
              <TabsTrigger value="internships">Internships</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>

            {/* JOBS */}
            <TabsContent value="jobs" className="space-y-6">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onApply={handleApply}
                />
              ))}
            </TabsContent>

            {/* INTERNSHIPS */}
            <TabsContent value="internships" className="space-y-6">
              {jobs
                .filter((job) => job.type === "Internship")
                .map((job) => (
                  <JobCard
                    key={job._id}
                    job={job}
                    onApply={handleApply}
                  />
                ))}
            </TabsContent>

            {/* ALL */}
            <TabsContent value="all" className="space-y-6">
              {jobs.map((job) => (
                <JobCard
                  key={job._id}
                  job={job}
                  onApply={handleApply}
                />
              ))}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}

/* =======================
   JOB CARD COMPONENT
======================= */
function JobCard({
  job,
  onApply,
}: {
  job: Job;
  onApply: (id: string) => void;
}) {
  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all rounded-2xl">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-xl overflow-hidden">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1669023414180-4dcf35d943e1"
              alt="company logo"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">{job.title}</h3>
                <p className="text-gray-600">{job.company}</p>
              </div>
              <Badge variant="secondary">{job.type}</Badge>
            </div>

            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {job.location}
              </span>
              {job.salary && (
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {job.salary}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(job.createdAt).toLocaleDateString()}
              </span>
              {job.deadline && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {job.deadline}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
              </div>
              <Button
                onClick={() => onApply(job._id)}
                className="bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white"
              >
                Apply Now
                <ExternalLink className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
