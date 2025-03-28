"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";
import { useNavigation } from "react-day-picker";
import { useRouter } from "next/navigation";
import axios from "axios";
import { backendUrl } from "@/config/config";

// Mock data for previously created IgY patents
const previousPatents = [
  {
    id: 1,
    name: "IgY-based Therapy for H5N1",
    antigen: "Avian Influenza H5N1 Hemagglutinin",
    disease: "Avian Influenza",
  },
  {
    id: 2,
    name: "IgY Antibodies Against Salmonella",
    antigen: "Salmonella Enteritidis Outer Membrane Proteins",
    disease: "Salmonellosis",
  },
  {
    id: 3,
    name: "Egg-derived IgY for Rotavirus",
    antigen: "Rotavirus VP6 Protein",
    disease: "Rotaviral Gastroenteritis",
  },
  {
    id: 4,
    name: "IgY Treatment for Dental Caries",
    antigen: "Streptococcus mutans Surface Antigens",
    disease: "Dental Caries",
  },
  {
    id: 5,
    name: "Anti-Helicobacter pylori IgY",
    antigen: "H. pylori Urease",
    disease: "Peptic Ulcer Disease",
  },
  {
    id: 6,
    name: "IgY for Pseudomonas Infections",
    antigen: "Pseudomonas aeruginosa Flagellin",
    disease: "Pseudomonas Respiratory Infections",
  },
  {
    id: 7,
    name: "Avian IgY Against E. coli",
    antigen: "E. coli O157:H7 Intimin",
    disease: "E. coli Infections",
  },
  {
    id: 8,
    name: "IgY Therapy for Candidiasis",
    antigen: "Candida albicans Cell Wall Mannoproteins",
    disease: "Oral Candidiasis",
  },
  {
    id: 9,
    name: "IgY-based Vaccine for Newcastle Disease",
    antigen: "Newcastle Disease Virus F Protein",
    disease: "Newcastle Disease",
  },
  {
    id: 10,
    name: "IgY Against Clostridium difficile",
    antigen: "C. difficile Toxin A and B",
    disease: "C. difficile Infection",
  },
];

export default function CreatePatent() {
  const router = useRouter();
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
      router.push(`/KnowledgeCreation`);
    }
  };

  const handlePatentClick = (patent: (typeof previousPatents)[0]) => {
    console.log("Selected patent:", patent);
  };

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
            {previousPatents.map((patent) => (
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
