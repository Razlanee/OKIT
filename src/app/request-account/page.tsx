"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function RequestAccountPage() {
  const [formData, setFormData] = useState({
    institutionName: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/institutions/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) {
      setSubmitted(true);
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Request Submitted!
          </h1>
          <p className="text-gray-400 mb-6">
            Our team will review your application and send a payment link to
            activate your institutional account.
          </p>
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 font-medium"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">
            Request an Institutional Account
          </h1>
          <p className="text-gray-400 mt-1">
            Fill out the form below and our team will get in touch.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xl p-8 space-y-5"
        >
          <Input
            id="institutionName"
            label="Institution Name"
            placeholder="e.g., Metro Manila Technical Institute"
            value={formData.institutionName}
            onChange={(e) =>
              setFormData({ ...formData, institutionName: e.target.value })
            }
            required
          />
          <Input
            id="contactPerson"
            label="Contact Person"
            placeholder="Full name"
            value={formData.contactPerson}
            onChange={(e) =>
              setFormData({ ...formData, contactPerson: e.target.value })
            }
            required
          />
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="admin@institution.edu"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            required
          />
          <Input
            id="phone"
            label="Phone Number"
            placeholder="+63 9XX XXX XXXX"
            value={formData.phone}
            onChange={(e) =>
              setFormData({ ...formData, phone: e.target.value })
            }
          />
          <Input
            id="address"
            label="Address"
            placeholder="Full institution address"
            value={formData.address}
            onChange={(e) =>
              setFormData({ ...formData, address: e.target.value })
            }
          />

          <Button type="submit" loading={loading} className="w-full" size="lg">
            Submit Request
          </Button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-blue-600 hover:underline font-medium"
            >
              Sign In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
