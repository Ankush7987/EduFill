import React from "react";
import Header from "./home/Header";

const campFacilities = [
  {
    number: "01",
    icon: "🏆",
    title: "Score & Save Challenge",
    description:
      "Students begin with a 15-minute NEET mini mock test and earn rewards based on their performance.",
    points: [
      "100% score: Form-filling service is completely free",
      "90% to 99% score: Flat 50% discount on form-filling charges",
      "Every participant receives one free premium mock test token",
    ],
  },
  {
    number: "02",
    icon: "✅",
    title: "Error-Free Form Filling",
    description:
      "Our trained team helps students complete their application forms with careful review and final verification.",
    points: [
      "Student details such as name, DOB, category and documents are checked carefully",
      "Photos, signatures and files are prepared as per required guidelines",
      "Final submission is done only after student confirmation",
    ],
  },
  {
    number: "03",
    icon: "📸",
    title: "Document & Photo Support Zone",
    description:
      "Students can scan documents, capture photos, resize signatures and prepare PDFs directly at the camp.",
    points: [
      "High-quality document scanning support",
      "Photo and signature formatting as per official requirements",
      "Safe and organized handling of student data",
    ],
  },
  {
    number: "04",
    icon: "⚡",
    title: "Smart Slot Booking",
    description:
      "Students can book their preferred time slot in advance to avoid long queues and unnecessary waiting.",
    points: [
      "Fast-track entry for pre-booked students",
      "Digital token system for walk-in students",
      "Smooth crowd management and faster service",
    ],
  },
  {
    number: "05",
    icon: "💻",
    title: "Live PYQ & Mock Test Arena",
    description:
      "Students can practice mock tests and previous year questions in a real exam-like environment.",
    points: [
      "Computer-based test practice at the camp",
      "Instant score after test submission",
      "Quick analysis of weak topics for better preparation",
    ],
  },
  {
    number: "06",
    icon: "🎓",
    title: "One-to-One College Counselling",
    description:
      "Students and parents receive guidance based on expected score, rank, cut-offs and admission options.",
    points: [
      "College predictor support for better decision-making",
      "Guidance on cut-offs, counselling process and admission steps",
      "Dedicated doubt-clearing support for parents and students",
    ],
  },
  {
    number: "07",
    icon: "🛋️",
    title: "Comfort & Convenience Lounge",
    description:
      "A clean and comfortable waiting area is available for students and parents during the camp process.",
    points: [
      "Seating and drinking water facility",
      "Display screen for exam updates and useful information",
      "Helpful preparation tips and important reminders",
    ],
  },
];

const processSteps = [
  "Book Slot",
  "Camp Check-In",
  "Mini Mock Test",
  "Document Review",
  "Expert Form Filling",
  "Final Verification",
  "Submission & Guidance",
];

const discountRules = [
  {
    score: "100% Score",
    reward: "Free Form Filling",
    note: "Best reward for top performance",
  },
  {
    score: "90% - 99% Score",
    reward: "50% Discount",
    note: "Special benefit for high scorers",
  },
  {
    score: "All Participants",
    reward: "Free Mock Test Token",
    note: "Every student receives a learning benefit",
  },
];

const trustPoints = [
  {
    title: "Guided Process",
    text: "Every step is explained clearly so students and parents know exactly what is happening.",
  },
  {
    title: "Careful Verification",
    text: "Important details are reviewed before final submission to reduce mistakes.",
  },
  {
    title: "Student-Friendly Support",
    text: "Our team helps with forms, documents, mock tests and guidance in one place.",
  },
];

export default function OfflineCamp() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header />

      <section className="relative overflow-hidden bg-[#071b33]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.26),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.14),transparent_38%)]" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
          <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
            <div>
              <div className="inline-flex rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-emerald-200 backdrop-blur">
                Offline Support Camp for NEET Students
              </div>

              <h1 className="mt-6 max-w-3xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Form Filling, Mock Tests & Counselling — all in one place.
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-8 text-slate-200 sm:text-lg">
                EduFill Offline Camp helps students complete application forms, prepare documents,
                attempt mock tests and receive admission guidance through a clear, professional and student-friendly process.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#facilities"
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
                >
                  Explore Facilities
                </a>
                <a
                  href="#process"
                  className="inline-flex items-center justify-center rounded-full border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white transition hover:bg-white/15"
                >
                  View Camp Process
                </a>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white p-5 shadow-2xl lg:p-6">
              <div className="rounded-[1.5rem] bg-slate-50 p-5 ring-1 ring-slate-200">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white p-2 shadow-sm ring-1 ring-slate-200">
                    <img
                      src="/edufill-brand-logo.svg"
                      alt="EduFill Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-600">
                      Why Visit EduFill Camp?
                    </p>
                    <h2 className="mt-1 text-2xl font-black text-slate-950">
                      Complete support for students and parents
                    </h2>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  {trustPoints.map((item) => (
                    <div
                      key={item.title}
                      className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                    >
                      <p className="font-black text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
              Score & Save
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              Earn rewards through a mini mock test
            </h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-600">
            Students can attempt a short challenge at the camp and receive discounts or learning benefits based on participation and score.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {discountRules.map((item) => (
            <div
              key={item.score}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
                {item.score}
              </span>
              <h3 className="mt-4 text-2xl font-black text-slate-950">{item.reward}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{item.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="facilities" className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 lg:pb-16">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
            Camp Facilities
          </p>
          <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            What will students get at the camp?
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Each facility is designed to make the application process easier, safer and more reliable for both students and parents.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {campFacilities.map((item) => (
            <article
              key={item.title}
              className="rounded-[1.6rem] border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#071b33] text-2xl shadow-sm">
                  {item.icon}
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500">
                  {item.number}
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">{item.title}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>

              <ul className="mt-5 space-y-3">
                {item.points.map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6 text-slate-700">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-black text-emerald-700">
                      ✓
                    </span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section id="process" className="bg-white py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-600">
                Simple Workflow
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                How does the camp process work?
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                The complete process is organized step by step to reduce confusion, save time and build confidence before final submission.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {processSteps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#071b33] text-sm font-black text-white">
                    {index + 1}
                  </span>
                  <p className="font-bold text-slate-800">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section id="slot" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="overflow-hidden rounded-[2rem] bg-[#071b33] shadow-xl">
          <div className="grid gap-0 lg:grid-cols-[1fr_0.8fr]">
            <div className="p-7 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
                Slot Booking
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                Avoid long queues. Book your camp slot in advance.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200">
                Pre-booked students receive fast-track entry, while walk-in students are managed through a digital token system.
              </p>
            </div>

            <div className="bg-emerald-500 p-7 text-white sm:p-10">
              <h3 className="text-2xl font-black">Need Assistance?</h3>
              <p className="mt-3 text-sm leading-7 text-emerald-50">
                The EduFill team will be available at the camp for form filling, document preparation, mock test support and counselling guidance.
              </p>
              <button className="mt-6 rounded-full bg-white px-6 py-4 text-sm font-black text-emerald-700 shadow-lg transition hover:bg-emerald-50">
                Contact EduFill Team
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
