"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useNavigation } from "react-day-picker";
import { useRouter } from "next/navigation";
import axios from "axios";
import { backendUrl } from "@/config/config";

type Patent = {
  name: string;
  antigen: string;
  disease: string;
  updated_at: string;
  [key: string]: any;
};

export default function CreatePatent() {
  const router = useRouter();
  const [patents, setPatents] = useState<Patent[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    antigen: "",
    disease: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);

    const response = await axios.post(`${backendUrl}/v1/project/`, formData);

    if (response.data.patent_id) {
      router.push(
        `/KnowledgeCreation?patentId=${response.data.patent_id}&patentName=${formData.name}&antigen=${formData.antigen}&disease=${formData.disease}`
      );
    }
  };

  const getPatents = async () => {
    try {
      const response = await axios.get(`${backendUrl}/v1/projects/`);
      const projects = response.data.projects;

      // Sort by updated_at (descending)
      const sortedProjects = projects.sort(
        (a: any, b: any) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setPatents(sortedProjects);
    } catch (err) {
      console.log(err);
    }
  };
  const handlePatentClick = async (patent: (typeof patents)[0]) => {
    console.log("Selected patent:", patent);

    // const approachResponse = await axios.get(
    //   `${backendUrl}/v1/knowledge/approach/${patent.patent_id}`
    // );
    // const innovationResponse = await axios.get(
    //   `${backendUrl}/v1/knowledge/innovation/${patent.patent_id}`
    // );
    // const technologyResponse = await axios.get(
    //   `${backendUrl}/v1/knowledge/technology/${patent.patent_id}`
    // );
    // const notesResponse = await axios.get(
    //   `${backendUrl}/v1/knowledge/research-note/${patent.patent_id}`
    // );

    // console.log("Approach Response", approachResponse);
    // console.log("Innovation Response", innovationResponse);
    // console.log("Technology Response", technologyResponse);
    // console.log("Notes Response", notesResponse);

    router.push(
      `/KnowledgeCreation?patentId=${patent.patent_id}&patentName=${patent.name}&antigen=${patent.antigen}&disease=${patent.disease}`
    );
  };

  useEffect(() => {
    getPatents();
  }, []);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Create New Patent</h1>
        <p className="text-gray-600 mt-2">
          Enter the details below to begin creating your new patent
        </p>
      </div>

      <div className="border rounded-lg p-6 bg-white mb-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patentName" className="text-sm font-medium">
              Patent Name
            </Label>
            <Input
              id="patentName"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              placeholder="Enter patent name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="antigen" className="text-sm font-medium">
              Antigen
            </Label>
            <Textarea
              id="antigen"
              name="antigen"
              value={formData.antigen}
              onChange={handleChange}
              className="w-full min-h-[100px] resize-y"
              placeholder="Enter antigen details"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="disease" className="text-sm font-medium">
              Disease
            </Label>
            <Textarea
              id="disease"
              name="disease"
              value={formData.disease}
              onChange={handleChange}
              className="w-full min-h-[100px] resize-y"
              placeholder="Enter disease details"
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-2"
          >
            Next
          </Button>
        </form>
      </div>

      {/* Previous Patents Section */}
      <div className="border rounded-lg p-6 bg-white">
        <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
          <FileText size={20} />
          Previous Patents
        </h2>

        <div className="max-h-[300px] overflow-y-auto pr-2">
          <div className="grid gap-3">
            {patents?.map((patent: any) => (
              <div
                key={patent.id}
                className="p-4 border rounded-md cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handlePatentClick(patent)}
              >
                <h3 className="font-medium">{patent.name}</h3>
                <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-700">Antigen:</span>{" "}
                    {patent.antigen}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Disease:</span>{" "}
                    {patent.disease}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
