import React, { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { postJob } from "../utils/api";

export function PostJob() {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    type: "Internship",
    salary: "",
    skills: "",
    deadline: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()),
      };

      const res = await postJob(payload);

      if (res.success) {
        alert("Job posted successfully 🎉");
        setForm({
          title: "",
          company: "",
          location: "",
          type: "Internship",
          salary: "",
          skills: "",
          deadline: "",
        });
      } else {
        alert(res.message);
      }
    } catch {
      alert("Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <Card className="rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Post a New Job
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          <Input
            placeholder="Job Title"
            name="title"
            value={form.title}
            onChange={handleChange}
          />

          <Input
            placeholder="Company Name"
            name="company"
            value={form.company}
            onChange={handleChange}
          />

          <Input
            placeholder="Location (Remote / City)"
            name="location"
            value={form.location}
            onChange={handleChange}
          />

          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option>Internship</option>
            <option>Full-time</option>
            <option>Part-time</option>
          </select>

          <Input
            placeholder="Salary (optional)"
            name="salary"
            value={form.salary}
            onChange={handleChange}
          />

          <Input
            placeholder="Skills (comma separated)"
            name="skills"
            value={form.skills}
            onChange={handleChange}
          />

          <Input
            type="date"
            name="deadline"
            value={form.deadline}
            onChange={handleChange}
          />

          <div className="flex flex-wrap gap-2">
            {form.skills
              .split(",")
              .filter(Boolean)
              .map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill.trim()}
                </Badge>
              ))}
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#6A0DAD] to-[#9B4DFF] text-white"
          >
            {loading ? "Posting..." : "Post Job"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
