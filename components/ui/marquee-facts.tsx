"use client";

const facts = [
  "Support for Math, Physics, Biology & Chemistry",
  "Grade 100+ exams in minutes",
  "AI-powered accurate grading",
  "Detailed student feedback",
  "Save hours of grading time",
  "Consistent grading criteria",
  "Easy to use interface",
  "Secure and private",
  "Real-time results",
  "Customizable rubrics"
];

export function MarqueeFacts() {
  return (
    <div className="flex flex-col gap-12 py-8">
      {/* First Row - Offset to the right */}
      <div className="relative flex overflow-hidden pl-32">
        <div className="animate-marquee whitespace-nowrap flex gap-8">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <p className="text-xl font-medium text-white tracking-wide font-display whitespace-nowrap">
                {fact}
              </p>
            </div>
          ))}
        </div>
        <div className="absolute top-0 animate-marquee2 whitespace-nowrap flex gap-8">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <p className="text-xl font-medium text-white tracking-wide font-display whitespace-nowrap">
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>
      {/* Second Row - Offset to the left */}
      <div className="relative flex overflow-hidden pr-32">
        <div className="animate-marquee2 whitespace-nowrap flex gap-8">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <p className="text-xl font-medium text-white tracking-wide font-display whitespace-nowrap">
                {fact}
              </p>
            </div>
          ))}
        </div>
        <div className="absolute top-0 animate-marquee whitespace-nowrap flex gap-8">
          {facts.map((fact, index) => (
            <div
              key={index}
              className="inline-flex bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/15 transition-all duration-300"
            >
              <p className="text-xl font-medium text-white tracking-wide font-display whitespace-nowrap">
                {fact}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 