export interface DefaultMetaTagItem {
  route: string;
  pageTitle: string;
  focusKeyword: string;
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
}

export const DEFAULT_META_TAGS: DefaultMetaTagItem[] = [
  {
    route: "/",
    pageTitle: "Home Page",
    focusKeyword: "Ai powered Mobile app development agency in delaware",
    title: "AI-Powered Mobile App Development Agency in Delaware",
    description:
      "Looking for an AI-powered mobile app development agency in Delaware? Nexus App Developers builds innovative mobile apps tailored to your business needs.",
    keywords:
      "Ai powered Mobile app development agency in delaware, mobile app development company, software development Delaware, AI app developers",
    canonical: "https://www.nexusappdevelopers.com/",
    ogTitle: "AI-Powered Mobile App Development Agency in Delaware",
    ogDescription:
      "Looking for an AI-powered mobile app development agency in Delaware? Nexus App Developers builds innovative mobile apps tailored to your business needs.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/about-us",
    pageTitle: "About Us",
    focusKeyword: "android app development company in delaware",
    title: "Android App Development Company in Delaware | Nexus App Developers",
    description:
      "Learn how Nexus App Developers delivers innovative Android app development solutions for businesses in Delaware, turning ideas into reliable mobile applications.",
    keywords:
      "android app development company in delaware, Android app developers, mobile app agency Delaware",
    canonical: "https://www.nexusappdevelopers.com/about-us",
    ogTitle: "Android App Development Company in Delaware | Nexus App Developers",
    ogDescription:
      "Learn how Nexus App Developers delivers innovative Android app development solutions for businesses in Delaware, turning ideas into reliable mobile applications.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/portfolio",
    pageTitle: "Portfolio",
    focusKeyword: "Ai powered Mobile app development agency in delaware",
    title: "Android App Development Company in Delaware | Nexus App Developers",
    description:
      "Nexus App Developers is an Android app development company serving Delaware businesses with innovative mobile app solutions tailored to their goals.",
    keywords:
      "Ai powered Mobile app development agency in delaware, Android app development company in Delaware, mobile app portfolio",
    canonical: "https://www.nexusappdevelopers.com/portfolio",
    ogTitle: "Android App Development Company in Delaware | Nexus App Developers",
    ogDescription:
      "Nexus App Developers is an Android app development company serving Delaware businesses with innovative mobile app solutions tailored to their goals.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/mobile-apps-designed",
    pageTitle: "Services - Mobile Apps Designed",
    focusKeyword: "mobile app development agency in delaware",
    title: "Mobile App Development Agency in Delaware | Nexus App Developers",
    description:
      "Looking for a mobile app development agency in Delaware? Nexus App Developers creates innovative, user-friendly mobile apps tailored to your business goals.",
    keywords:
      "mobile app development agency in delaware, custom mobile app development, iOS and Android apps Delaware",
    canonical: "https://www.nexusappdevelopers.com/services/mobile-apps-designed",
    ogTitle: "Mobile App Development Agency in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for a mobile app development agency in Delaware? Nexus App Developers creates innovative, user-friendly mobile apps tailored to your business goals.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services",
    pageTitle: "Services",
    focusKeyword: "Best ai powered digital marketing agency in delaware",
    title: "Best AI-Powered Digital Marketing Agency in Delaware | Nexus App Developers",
    description:
      "Looking for the best AI-powered digital marketing agency in Delaware? Nexus App Developers offers innovative digital marketing solutions to grow your online presence.",
    keywords:
      "Best ai powered digital marketing agency in delaware, digital marketing services Delaware, AI marketing agency",
    canonical: "https://www.nexusappdevelopers.com/services",
    ogTitle: "Best AI-Powered Digital Marketing Agency in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for the best AI-powered digital marketing agency in Delaware? Nexus App Developers offers innovative digital marketing solutions to grow your online presence.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/cloud-infrastructure-built",
    pageTitle: "Services - Cloud Infrastructure Built",
    focusKeyword: "cloud infrastructure services in Delaware",
    title: "Cloud Infrastructure Services in Delaware | Nexus App Developers",
    description:
      "Looking for cloud infrastructure services in Delaware? Nexus App Developers delivers scalable cloud solutions to support your business performance and growth.",
    keywords:
      "cloud infrastructure services in Delaware, cloud DevOps Delaware, scalable cloud architecture",
    canonical: "https://www.nexusappdevelopers.com/services/cloud-infrastructure-built",
    ogTitle: "Cloud Infrastructure Services in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for cloud infrastructure services in Delaware? Nexus App Developers delivers scalable cloud solutions to support your business performance and growth.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/modern-website-development-that",
    pageTitle: "Services - Modern Website Development That",
    focusKeyword: "website development company in Delaware",
    title: "Website Development Company in Delaware | Nexus App Developers",
    description:
      "Looking for a website development company in Delaware? Nexus App Developers builds modern, responsive, and user-friendly websites tailored to your business goals.",
    keywords:
      "website development company in Delaware, web development Delaware, responsive websites",
    canonical: "https://www.nexusappdevelopers.com/services/modern-website-development-that",
    ogTitle: "Website Development Company in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for a website development company in Delaware? Nexus App Developers builds modern, responsive, and user-friendly websites tailored to your business goals.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/powerful-backend-systems-that-scale-seamlessly",
    pageTitle: "Services - Powerful Backend Systems That Scale Seamlessly",
    focusKeyword: "backend development services Delaware",
    title: "Backend Development Services in Delaware | Nexus App Developers",
    description:
      "Need backend development services in Delaware? Nexus App Developers builds secure, scalable backend systems, custom APIs, and reliable server-side solutions.",
    keywords:
      "backend development services Delaware, API development, scalable server architecture",
    canonical: "https://www.nexusappdevelopers.com/services/powerful-backend-systems-that-scale-seamlessly",
    ogTitle: "Backend Development Services in Delaware | Nexus App Developers",
    ogDescription:
      "Need backend development services in Delaware? Nexus App Developers builds secure, scalable backend systems, custom APIs, and reliable server-side solutions.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/modern-frontend-experiences-that-users-love",
    pageTitle: "Services - Modern Frontend Experiences That Users Love",
    focusKeyword: "frontend development company in Delaware",
    title: "Frontend Development Company in Delaware | Nexus App Developers",
    description:
      "Looking for a frontend development company in Delaware? Nexus App Developers creates responsive, user-friendly interfaces for modern websites and web applications.",
    keywords:
      "frontend development company in Delaware, UI web development, React frontend Delaware",
    canonical: "https://www.nexusappdevelopers.com/services/modern-frontend-experiences-that-users-love",
    ogTitle: "Frontend Development Company in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for a frontend development company in Delaware? Nexus App Developers creates responsive, user-friendly interfaces for modern websites and web applications.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/services/ai-driven-uxui-design",
    pageTitle: "Services - AI-Driven UX/UI Design",
    focusKeyword: "UI design company in Delaware",
    title: "UI Design Company in Delaware | Nexus App Developers",
    description:
      "Looking for a UI design company in Delaware? Nexus App Developers creates intuitive, modern, and user-friendly interfaces for websites and mobile applications.",
    keywords:
      "UI design company in Delaware, UX UI design Delaware, user interface design agency",
    canonical: "https://www.nexusappdevelopers.com/services/ai-driven-uxui-design",
    ogTitle: "UI Design Company in Delaware | Nexus App Developers",
    ogDescription:
      "Looking for a UI design company in Delaware? Nexus App Developers creates intuitive, modern, and user-friendly interfaces for websites and mobile applications.",
    ogImage: "/static/img/logo.png",
  },
  {
    route: "/contact-us",
    pageTitle: "Contact Us",
    focusKeyword: "contact Nexus App Developers",
    title: "Contact Nexus App Developers | Start Your Project",
    description:
      "Have a project idea or need a technology partner? Contact Nexus App Developers for mobile app development, web development, UI/UX design, backend, and cloud solutions.",
    keywords:
      "contact Nexus App Developers, app development consultation, web development inquiry",
    canonical: "https://www.nexusappdevelopers.com/contact-us",
  },
  {
    route: "/blogs",
    pageTitle: "Blogs",
    focusKeyword: "Nexus App Developers blog",
    title: "Nexus App Developers Blog | Technology, Apps & Digital Insights",
    description:
      "Explore technology insights, mobile app development trends, web development tips, UI/UX strategies, AI, cloud technology, and digital product insights from Nexus App Developers.",
    keywords:
      "Nexus App Developers blog, app development blog, tech blog Delaware",
    canonical: "https://www.nexusappdevelopers.com/blogs",
  },
  {
    route: "/faq",
    pageTitle: "FAQ",
    focusKeyword: "Nexus App Developers FAQ",
    title: "Frequently Asked Questions | Nexus App Developers",
    description:
      "Find answers to frequently asked questions about mobile app development, web development, timelines, pricing, and services at Nexus App Developers.",
    keywords:
      "Nexus App Developers FAQ, mobile app questions, software development FAQs",
    canonical: "https://www.nexusappdevelopers.com/faq",
  },
  {
    route: "/testimonials",
    pageTitle: "Testimonials",
    focusKeyword: "Nexus App Developers reviews",
    title: "Client Testimonials & Reviews | Nexus App Developers",
    description:
      "Read what clients say about working with Nexus App Developers on mobile apps, web applications, and custom digital transformation solutions.",
    keywords:
      "Nexus App Developers reviews, client testimonials, software company reviews",
    canonical: "https://www.nexusappdevelopers.com/testimonials",
  },
  {
    route: "/terms",
    pageTitle: "Terms of Service",
    focusKeyword: "Nexus App Developers terms",
    title: "Terms of Service | Nexus App Developers",
    description:
      "Review the Terms of Service for Nexus App Developers to understand the terms, conditions, rights, and responsibilities associated with using our website and services.",
    keywords: "Nexus App Developers terms, terms of service",
    canonical: "https://www.nexusappdevelopers.com/terms",
  },
  {
    route: "/privacy-policy",
    pageTitle: "Privacy Policy",
    focusKeyword: "Nexus App Developers privacy policy",
    title: "Privacy Policy | Nexus App Developers",
    description:
      "Read the Nexus App Developers Privacy Policy to learn how we collect, use, protect, and manage information when you use our website and services.",
    keywords: "Nexus App Developers privacy policy, data protection",
    canonical: "https://www.nexusappdevelopers.com/privacy-policy",
  },
  {
    route: "/thank-you",
    pageTitle: "Thank You",
    focusKeyword: "thank you Nexus App Developers",
    title: "Thank You | Nexus App Developers",
    description:
      "Thank you for contacting Nexus App Developers. Our team has received your message and will get back to you as soon as possible.",
    keywords: "thank you Nexus App Developers, contact confirmation",
    canonical: "https://www.nexusappdevelopers.com/thank-you",
  },
];
