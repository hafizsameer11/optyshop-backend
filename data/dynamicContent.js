// Fallback in-memory content to keep the API usable before a DB is seeded.
// These structures mirror the dynamic frontend needs outlined in docs/dynamic-systems.md

const caseStudies = [
  {
    id: 1,
    slug: 'virtual-try-on-conversion-lift',
    title: 'Virtual Try-On Conversion Lift',
    heroTitle: 'AR try-ons that convert',
    heroSubtitle: 'How immersive previews reduced returns',
    category: 'Ecommerce',
    person: { name: 'Sara Patel', role: 'VP Digital, VisionHub' },
    image: 'https://cdn.example.com/case-studies/vto-conversion.jpg',
    content:
      'VisionHub partnered with OptyShop to add camera-based try-ons. In 8 weeks they saw +18% add-to-cart and -12% returns.',
    tags: ['ar', 'conversion', 'returns']
  },
  
  {
    id: 2,
    slug: 'ai-product-discovery',
    title: 'AI Product Discovery',
    heroTitle: 'Search and recommendations that feel human',
    heroSubtitle: 'Reducing choice overload with AI assists',
    category: 'Retail',
    person: { name: 'Diego Alvarez', role: 'Head of CX, NorthLens' },
    image: 'https://cdn.example.com/case-studies/ai-discovery.jpg',
    content:
      'NorthLens used OptyShop signals (face shape + color prefs) to tailor assortments. Result: +23% session revenue and happier shoppers.',
    tags: ['ai', 'recommendations', 'search']
  }
];

const blogArticles = [
  {
    id: 1,
    slug: 'future-of-digital-try-on',
    title: 'The future of digital try-on for eyewear',
    category: 'Product',
    date: '2024-09-12',
    snippet: 'What matters in AR eyewear and how to measure it.',
    readTime: 6,
    headerImage: 'https://cdn.example.com/blog/future-of-try-on.jpg',
    keyPoints: [
      'Lighting and occlusion drive user trust',
      'Frame fit hints from prior try-ons lift conversion',
      'Measure funnel: camera open → try-on → add-to-cart'
    ],
    summary:
      'Three principles teams can use to ship a better try-on: realistic rendering, smart defaults, and outcome-driven analytics.',
    content:
      'Great try-on experiences feel invisible. In this post we share the rendering, UX, and analytics patterns we use with OptyShop customers...'
  },
  {
    id: 2,
    slug: 'conversion-metrics-that-matter',
    title: 'Conversion metrics that matter for eyewear',
    category: 'Growth',
    date: '2024-11-03',
    snippet: 'How to tell if your product detail page is pulling its weight.',
    readTime: 5,
    headerImage: 'https://cdn.example.com/blog/conversion-metrics.jpg',
    keyPoints: ['Session-level lift matters more than CTR', 'Track try-on depth', 'Reduce cart friction'],
    summary: 'A concise checklist for eyewear PMs to track the right things.',
    content:
      'Clicks are not enough. Track add-to-cart after virtual try-on, lens package attach rate, and post-purchase returns to see real lift...'
  }
];

const jobs = [
  {
    id: 101,
    slug: 'senior-frontend-engineer',
    title: 'Senior Frontend Engineer',
    department: 'Engineering',
    location: 'Remote / EU timezones',
    description:
      'Build React/Vite experiences for virtual try-on, performance dashboards, and admin tooling.',
    requirements: [
      '5+ years with modern React',
      'TypeScript and testing experience',
      'Interest in WebGL/WebXR or camera integrations is a plus'
    ],
    applyUrl: 'https://jobs.example.com/senior-frontend-engineer',
    isActive: true
  },
  {
    id: 102,
    slug: 'product-manager-digital-commerce',
    title: 'Product Manager, Digital Commerce',
    department: 'Product',
    location: 'Hybrid - NYC',
    description:
      'Own the shopper journey from discovery to checkout, including how AR try-on feeds purchase decisions.',
    requirements: [
      '3+ years in product management for ecommerce or SaaS',
      'Comfort with analytics and instrumentation',
      'Ability to run qualitative discovery with merchants'
    ],
    applyUrl: 'https://jobs.example.com/pm-digital-commerce',
    isActive: true
  }
];

const formConfigs = {
  contact: {
    name: 'contact',
    title: 'Talk with us',
    description: 'Tell us about your team and what you want to improve.',
    ctaText: 'Send message',
    fields: [
      { id: 'email', label: 'Work email', type: 'email', required: true, placeholder: 'you@company.com' },
      { id: 'firstName', label: 'First name', type: 'text', required: true },
      { id: 'lastName', label: 'Last name', type: 'text', required: true },
      { id: 'country', label: 'Country', type: 'text', required: true },
      { id: 'company', label: 'Company', type: 'text', required: true },
      { id: 'message', label: 'How can we help?', type: 'textarea', required: false }
    ]
  },
  demo: {
    name: 'demo',
    title: 'Book a demo',
    description: 'See virtual try-on and dynamic merchandising in action.',
    ctaText: 'Book a demo',
    fields: [
      { id: 'email', label: 'Work email', type: 'email', required: true },
      { id: 'name', label: 'Full name', type: 'text', required: true },
      { id: 'company', label: 'Company', type: 'text', required: true },
      { id: 'teamSize', label: 'Team size', type: 'select', options: ['1-10', '11-50', '51-200', '200+'] },
      {
        id: 'focus',
        label: 'What do you want to explore?',
        type: 'select',
        options: ['Virtual try-on', 'Lens packages', 'Personalization', 'Analytics']
      }
    ]
  },
  pricing: {
    name: 'pricing',
    title: 'Request pricing',
    description: 'Get a quote tailored to your traffic and SKU count.',
    ctaText: 'Request pricing',
    fields: [
      { id: 'email', label: 'Work email', type: 'email', required: true },
      { id: 'company', label: 'Company', type: 'text', required: true },
      { id: 'monthlyTraffic', label: 'Monthly site traffic', type: 'select', options: ['<50k', '50k-250k', '250k-1M', '1M+'] },
      { id: 'skuCount', label: 'Active SKUs', type: 'select', options: ['<200', '200-1k', '1k-5k', '5k+'] },
      { id: 'priority', label: 'Top priority', type: 'select', options: ['Conversion lift', 'Return reduction', 'Launch speed', 'AR quality'] }
    ]
  },
  'job-application': {
    name: 'job-application',
    title: 'Apply for this role',
    description: 'Share your details and a recruiter will reach out.',
    ctaText: 'Submit application',
    fields: [
      { id: 'name', label: 'Full name', type: 'text', required: true },
      { id: 'email', label: 'Email', type: 'email', required: true },
      { id: 'linkedIn', label: 'LinkedIn', type: 'url', required: false },
      { id: 'portfolio', label: 'Portfolio / GitHub', type: 'url', required: false },
      { id: 'coverLetter', label: 'Cover letter', type: 'textarea', required: false }
    ]
  }
};

module.exports = {
  caseStudies,
  blogArticles,
  jobs,
  formConfigs
};


