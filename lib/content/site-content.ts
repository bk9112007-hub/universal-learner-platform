import type { DashboardActivity, DashboardCard, NavLink, Program, Testimonial, UserRole } from "@/types/domain";

export const marketingNav: NavLink[] = [
  { href: "/", label: "Home" },
  { href: "/methods", label: "Methods" },
  { href: "/programs", label: "Programs" },
  { href: "/testimonials", label: "Testimonials" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" }
];

export const expertiseCards = [
  {
    title: "1 on 1 personalized learning",
    description: "Tailored instruction designed specifically for each learner's pace, strengths, and growth areas."
  },
  {
    title: "Project-Based Learning",
    description: "Real projects that connect academic mastery to confidence, creativity, and authentic problem solving."
  },
  {
    title: "Game-Based Learning",
    description: "Focused, motivating practice loops that make challenge feel rewarding rather than intimidating."
  },
  {
    title: "Concept Mapping",
    description: "Visual frameworks that deepen understanding, strengthen memory, and build independent thinking."
  }
];

export const tutoringSteps = [
  "Assessment to understand the learner's level, goals, and current momentum.",
  "Personalized planning with a custom roadmap for skills, projects, and support.",
  "Dedicated tutoring sessions that blend direct teaching, coaching, and practice.",
  "Progress tracking with ongoing refinements for confidence, consistency, and results."
];

export const programs: Program[] = [
  {
    title: "Grade Ace Tutoring",
    description: "Targeted support for better grades, stronger routines, and renewed academic confidence.",
    price: "$0.01",
    cta: "Start With a Session",
    href: "https://universalleaner.myshopify.com/products/grade-ace-tutoring"
  },
  {
    title: "The Scholar Program",
    description: "Structured tutoring with deeper skill-building across core subjects and study systems.",
    price: "$89.99",
    cta: "Explore the Program",
    href: "https://universalleaner.myshopify.com/products/the-scholar-program"
  },
  {
    title: "The Universal Learner Program",
    description: "A premium blend of tutoring, project-based learning, and strategic growth support.",
    price: "$99.99",
    cta: "Choose Best Value",
    href: "https://universalleaner.myshopify.com/products/the-universal-learner-program",
    badge: "Best Value"
  }
];

export const testimonials: Testimonial[] = [
  {
    quote: "My grades improved from C's to A's in just one semester.",
    name: "Sarah M.",
    role: "High School Student"
  },
  {
    quote: "I finally feel confident in my abilities. Thank you for believing in me.",
    name: "Emma L.",
    role: "Middle School Student"
  },
  {
    quote: "The structure, accountability, and personal attention made a huge difference for our family.",
    name: "Parent of an 8th Grade Learner",
    role: "Parent"
  }
];

export const subjects = [
  "Mathematics",
  "Logic & Critical Thinking",
  "Sciences",
  "Reading & Writing",
  "Social Studies",
  "Interdisciplinary Projects"
];

export const dashboardCardsByRole: Record<UserRole, DashboardCard[]> = {
  student: [
    { title: "Projects Submitted", value: "12", detail: "2 awaiting review this week" },
    { title: "Average Score", value: "8.7/10", detail: "Up from 7.9 last month" },
    { title: "Assessments Due", value: "4", detail: "1 due in the next 24 hours" }
  ],
  teacher: [
    { title: "Classes Active", value: "5", detail: "42 learners across cohorts" },
    { title: "Pending Reviews", value: "18", detail: "7 projects need grading today" },
    { title: "Feedback Sent", value: "96", detail: "This month across all classes" }
  ],
  parent: [
    { title: "Child Progress", value: "84%", detail: "On track in 5 of 6 goals" },
    { title: "Programs Enrolled", value: "2", detail: "Scholar Program plus tutoring add-on" },
    { title: "Upcoming Sessions", value: "3", detail: "Next consultation is Tuesday" }
  ],
  admin: [
    { title: "Total Users", value: "1,248", detail: "11% growth month over month" },
    { title: "Active Programs", value: "9", detail: "3 featured on the public site" },
    { title: "Revenue Synced", value: "$18.4k", detail: "Shopify purchases reconciled daily" }
  ]
};

export const dashboardActivityByRole: Record<UserRole, DashboardActivity[]> = {
  student: [
    { title: "Water Conservation Design received teacher comments", timestamp: "Today at 9:10 AM" },
    { title: "Science Vocabulary Quiz marked as turned in", timestamp: "Yesterday at 4:20 PM" },
    { title: "Community Garden Map added to portfolio", timestamp: "Apr 18 at 1:45 PM" }
  ],
  teacher: [
    { title: "Maya Johnson submitted Sustainable Garden Prototype", timestamp: "Today at 10:05 AM" },
    { title: "Class 8B rubric results exported", timestamp: "Today at 8:40 AM" },
    { title: "Parent consultation booking confirmed", timestamp: "Apr 18 at 6:15 PM" }
  ],
  parent: [
    { title: "Avery's algebra assessment score improved to 92%", timestamp: "Today at 7:50 AM" },
    { title: "Consultation booking reminder sent", timestamp: "Yesterday at 2:00 PM" },
    { title: "Universal Learner Program purchase synced", timestamp: "Apr 17 at 5:35 PM" }
  ],
  admin: [
    { title: "New teacher account approved", timestamp: "Today at 9:30 AM" },
    { title: "Shopify enrollment webhook processed 6 purchases", timestamp: "Today at 7:15 AM" },
    { title: "Role permissions updated for parent portal", timestamp: "Apr 18 at 3:00 PM" }
  ]
};

export const appRouteByRole: Record<UserRole, string> = {
  student: "/app/student",
  teacher: "/app/teacher",
  parent: "/app/parent",
  admin: "/app/admin"
};
