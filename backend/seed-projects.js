import 'dotenv/config';
import mongoose from 'mongoose';
import { hashPassword } from './src/utils/bcrypt.js';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://jishnu:jishnu123@cluster0.mt6agn4.mongodb.net/sprintboard?appName=Cluster0';

const STAGE_ORDER = [
  'REQUIREMENT_SPECIFICATION',
  'BASIC_LAYOUT_PLANNING',
  'TECH_STACK_APPROVAL',
  'DEVELOPMENT',
  'TESTING',
  'DEPLOYMENT',
  'MAINTENANCE',
  'FEATURE_ENHANCEMENTS'
];

const projectsData = [
  // shikhar
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'hire perfect',
    clientName: 'shikhar',
    description: 'Hire Perfect web application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://www.hireperfect.in/',
    vercelBackendLink: 'Render',
    envDriveLink: 'shikhar5775@gmail.com',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'acutus',
    clientName: 'shikhar',
    description: 'Acutus Community web application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://auctus-community.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'Shopsmart',
    clientName: 'shikhar',
    description: 'Shopsmart application. Database: MongoDB.',
    gitLink: 'https://github.com/SoulMassive/shopsmart',
    vercelFrontendLink: 'https://shopsmart-hazel.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: 'SoulMassive (shikhar5775@gmail.com)',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'JJR',
    clientName: 'shikhar',
    description: 'Jayajanardhana application. Catalog is not showing up, it is going blank. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://jayajanardhana-prod.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'Millets PRO',
    clientName: 'shikhar',
    description: 'Millets PRO application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://www.milletpro.in/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'SRR',
    clientName: 'shikhar',
    description: 'SRR Pooja Works application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://srr-pooja-works.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'crezco',
    clientName: 'shikhar',
    description: 'Crezco application. Database: MongoDB.',
    gitLink: 'https://github.com/SoulMassive/crezco',
    vercelFrontendLink: 'https://crezco.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: 'SoulMassive (shikhar5775@gmail.com)',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'atlasia workbook',
    clientName: 'shikhar',
    description: 'Atlasia Workbook application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://atlasia-portal-frontend.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'khatha book(shop ledger)',
    clientName: 'shikhar',
    description: 'Khatha Book (Shop Ledger) application. Done but not deployed. Database: PostgreSQL.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'candidate reuse MS',
    clientName: 'shikhar',
    description: 'Candidate Reuse MS application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://candidate-reuse-ms.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'earnify',
    clientName: 'shikhar',
    description: 'Earnify application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'project management system',
    clientName: 'shikhar',
    description: 'Project Management System. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://earnify-one.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'Your Growth',
    clientName: 'shikhar',
    description: 'Your Growth application.',
    gitLink: '',
    vercelFrontendLink: 'https://best-version-five.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'Linkedin data scraper',
    clientName: 'shikhar',
    description: 'Linkedin Data Scraper. Deployment pending.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'shikhar',
    developerEmail: 'shikhar5775@gmail.com',
    name: 'EtiquetteLMS',
    clientName: 'shikhar',
    description: 'EtiquetteLMS application.',
    gitLink: '',
    vercelFrontendLink: 'https://etiquettes.in/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },

  // jishnu
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'Cresentia',
    clientName: 'jishnu',
    description: 'Cresentia application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'Leave MS',
    clientName: 'jishnu',
    description: 'Leave Management System. Database: MongoDB. Deployed in surya\'s account.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: 'Render (surya\'s account)',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'HRMS',
    clientName: 'jishnu',
    description: 'HRMS application. Database: AWS.',
    gitLink: '',
    vercelFrontendLink: 'https://hrms-frontend-prod-eosin.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'Talenty',
    clientName: 'jishnu',
    description: 'Talenty application. Database: Railway.',
    gitLink: '',
    vercelFrontendLink: 'https://talenty-prod.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'funtern',
    clientName: 'jishnu',
    description: 'Funtern application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://funtern-prod.vercel.app/',
    vercelBackendLink: 'Vercel',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'pooja mockup labeling',
    clientName: 'jishnu',
    description: 'Pooja Mockup Labeling application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'White labelling-CRM',
    clientName: 'jishnu',
    description: 'White labelling CRM application.',
    gitLink: '',
    vercelFrontendLink: 'https://pooja-whitelabelling.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'to-business-CRM',
    clientName: 'jishnu',
    description: 'To-business CRM application.',
    gitLink: '',
    vercelFrontendLink: 'https://tobusinessprod.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'pooja wholesale website-CRM',
    clientName: 'jishnu',
    description: 'Pooja Wholesale Website CRM application.',
    gitLink: '',
    vercelFrontendLink: 'https://poojawholesalecrm.vercel.app/',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jishnu',
    developerEmail: 'jishnunreddy@gmail.com',
    name: 'mlm affilate website',
    clientName: 'jishnu',
    description: 'MLM Affiliate Website.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },

  // jeevan
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'contractual',
    clientName: 'jeevan',
    description: 'Contractual application (done by Surya). Database: railway, render.',
    gitLink: 'https://github.com/reshot2005/Contractual.git',
    vercelFrontendLink: 'https://www.contractual.pro/',
    vercelBackendLink: 'Render',
    envDriveLink: 'surya',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'sprintboard',
    clientName: 'jeevan',
    description: 'Sprint Board application. Database: Render Postgres DB.',
    gitLink: 'https://github.com/Jeevan5118/Sprint_Board.git',
    vercelFrontendLink: 'https://sprintboard-prod-frontend.vercel.app/login',
    vercelBackendLink: 'Render',
    envDriveLink: 'jeevan5118',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'ATS',
    clientName: 'jishnu',
    description: 'ATS application. Database: Neon Postgres DB. File storage: Cloudinary.',
    gitLink: 'https://github.com/ae9-in/ATS-prod',
    vercelFrontendLink: 'https://atsprodfrontend.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'Follow ups management',
    clientName: 'jeevan',
    description: 'Follow ups management CRM.',
    gitLink: 'https://github.com/ae9-in/pooja_whitelabelling',
    vercelFrontendLink: 'https://followupscrm.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'early bird',
    clientName: 'jeevan',
    description: 'Early Bird application. Database: Neon Postgres DB.',
    gitLink: '',
    vercelFrontendLink: 'https://earlybird-prod.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'jeevan',
    developerEmail: 'jeevankonduru2002@gmail.com',
    name: 'swastika tracker',
    clientName: 'jeevan',
    description: 'Swastika Tracker.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },

  // surya kiran
  {
    developerName: 'surya kiran',
    developerEmail: 'reshotofficial01@gmail.com',
    name: 'transcribe',
    clientName: 'surya kiran',
    description: 'Transcribe AI application. Database: Supabase. File storage: Cloudinary.',
    gitLink: 'https://github.com/reshot2005/TrascribeAi.git',
    vercelFrontendLink: '',
    vercelBackendLink: 'Render',
    envDriveLink: 'personal',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'surya kiran',
    developerEmail: 'reshotofficial01@gmail.com',
    name: 'etiquette',
    clientName: 'surya kiran',
    description: 'Etiquette application.',
    gitLink: 'https://github.com/reshot2005/Ettiquete.git',
    vercelFrontendLink: '',
    vercelBackendLink: 'Render',
    envDriveLink: 'personal',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'surya kiran',
    developerEmail: 'reshotofficial01@gmail.com',
    name: 'aarambh',
    clientName: 'surya kiran',
    description: 'Aarambh application. Database: Supabase. File storage: Cloudinary.',
    gitLink: 'https://github.com/reshot2005/Arambh.git',
    vercelFrontendLink: 'https://aarambh-production.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: 'personal',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'surya kiran',
    developerEmail: 'reshotofficial01@gmail.com',
    name: 'CRM',
    clientName: 'surya kiran',
    description: 'CRM application (still working).',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: 'Render',
    envDriveLink: 'personal',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'surya kiran',
    developerEmail: 'reshotofficial01@gmail.com',
    name: 'OCC',
    clientName: 'surya kiran',
    description: 'Off Campus Club application. Database: Railway, Render.',
    gitLink: '',
    vercelFrontendLink: 'https://www.offcampusclub.com/',
    vercelBackendLink: 'Render',
    envDriveLink: 'AE9-IN',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },

  // prakruthi
  {
    developerName: 'prakruthi',
    developerEmail: 'prakruthi@gmail.com',
    name: 'TIC',
    clientName: 'prakruthi',
    description: 'The Interns Collective (TIC) application. Database: MongoDB.',
    gitLink: 'https://github.com/ae9-in/TIC-prod.git',
    vercelFrontendLink: 'https://theinternscollective.com/',
    vercelBackendLink: 'Vercel',
    envDriveLink: 'company account',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'prakruthi',
    developerEmail: 'prakruthi@gmail.com',
    name: 'hiredrive',
    clientName: 'prakruthi',
    description: 'Hiredrive application. Database: MongoDB.',
    gitLink: 'https://github.com/ae9-in/hiredrive-prod.git',
    vercelFrontendLink: 'https://hiredrive.vercel.app/',
    vercelBackendLink: 'Vercel',
    envDriveLink: 'company account',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'prakruthi',
    developerEmail: 'prakruthi@gmail.com',
    name: 'menu website',
    clientName: 'prakruthi',
    description: 'Cheesy Order Menu Website. Database: Supabase (not deployed).',
    gitLink: 'https://github.com/prakruthigowda09-cloud/cheesy-order',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },

  // manya
  {
    developerName: 'manya',
    developerEmail: 'subramanya@gmail.com',
    name: 'prepexplus',
    clientName: 'manya',
    description: 'Prepexplus application. Status: pending/crash. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'manya',
    developerEmail: 'subramanya@gmail.com',
    name: 'atlasia',
    clientName: 'manya',
    description: 'Atlasia application. Database: MongoDB.',
    gitLink: 'https://github.com/ae9-in/atlasia-prod',
    vercelFrontendLink: 'https://www.atlasia.online/',
    vercelBackendLink: 'Vercel',
    envDriveLink: 'subramanya',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'manya',
    developerEmail: 'subramanya@gmail.com',
    name: 'employeeperformance tracker',
    clientName: 'manya',
    description: 'Employee Performance Tracker. Status: pending, not deployed. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'manya',
    developerEmail: 'subramanya@gmail.com',
    name: 'CIS',
    clientName: 'manya',
    description: 'CIS application. Status: pending, not deployed. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'manya',
    developerEmail: 'subramanya@gmail.com',
    name: 'toptimise',
    clientName: 'manya',
    description: 'Toptimise application. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },

  // chaya
  {
    developerName: 'chaya',
    developerEmail: 'chaya@gmail.com',
    name: 'maid booking website',
    clientName: 'chaya',
    description: 'Maid Booking Website. Status: pending, not pushed to GitHub.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'chaya',
    developerEmail: 'chaya@gmail.com',
    name: 'ace it up',
    clientName: 'chaya',
    description: 'Ace It Up application. Database: MongoDB.',
    gitLink: 'https://github.com/ae9-in/ace-it-up-.git',
    vercelFrontendLink: '',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'chaya',
    developerEmail: 'chaya@gmail.com',
    name: 'health and wellness',
    clientName: 'chaya',
    description: 'Health and Wellness application. Database: PostgreSQL.',
    gitLink: 'https://github.com/ae9-in/health-and-wellness-prod.git',
    vercelFrontendLink: 'https://health-and-wellness-prod.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'chaya',
    developerEmail: 'chaya@gmail.com',
    name: 'Reimbursement website',
    clientName: 'chaya',
    description: 'Reimbursement website. Database: MongoDB.',
    gitLink: 'https://github.com/ae9-in/reimbursement-prod',
    vercelFrontendLink: 'https://reimbursement-prod.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'chaya',
    developerEmail: 'chaya@gmail.com',
    name: 'bootcamp online',
    clientName: 'chaya',
    description: 'Bootcamp Online. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://bootcamp-prod.vercel.app/',
    vercelBackendLink: 'Render',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },

  // shilpa
  {
    developerName: 'shilpa',
    developerEmail: 'shilpak2k23@gmail.com',
    name: 'intern OS',
    clientName: 'shilpa',
    description: 'Intern OS. Database: Supabase.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'shilpa',
    developerEmail: 'shilpak2k23@gmail.com',
    name: 'refrendraa',
    clientName: 'shilpa',
    description: 'Refrendraa. Deployed, not pushed to Git. Database: Supabase.',
    gitLink: '',
    vercelFrontendLink: 'https://refrendraa.vercel.app',
    vercelBackendLink: 'Render',
    envDriveLink: 'adice24 (shilpak2k23@gmail.com)',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },
  {
    developerName: 'shilpa',
    developerEmail: 'shilpak2k23@gmail.com',
    name: 'alumnix',
    clientName: 'shilpa',
    description: 'Alumnix. Deployed, not pushed to Git. Database: MongoDB.',
    gitLink: '',
    vercelFrontendLink: 'https://alumnix-ktah.onrender.com',
    vercelBackendLink: 'Render',
    envDriveLink: 'adice24 (shilpak2k23@gmail.com)',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  },

  // fazil
  {
    developerName: 'fazil',
    developerEmail: 'fazil@gmail.com',
    name: 'BDE Tracker App (Android Users)',
    clientName: 'fazil',
    description: 'BDE Tracker App (Android Users). Database: Supabase.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'fazil',
    developerEmail: 'fazil@gmail.com',
    name: 'BDE Tracker Website (iOS Users)',
    clientName: 'fazil',
    description: 'BDE Tracker Website (iOS Users). Database: Supabase.',
    gitLink: 'https://github.com/ae9-in/bdetracker',
    vercelFrontendLink: 'Not deployed (shared as ZIP file)',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'fazil',
    developerEmail: 'fazil@gmail.com',
    name: 'Admin Panel for BDE Tracker Website',
    clientName: 'fazil',
    description: 'Admin Panel for BDE Tracker Website. Database: Supabase.',
    gitLink: 'https://github.com/fieldtrackeradmin/field-tracker-admin05',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'fazil',
    developerEmail: 'fazil@gmail.com',
    name: 'OCC App (Ongoing Work)',
    clientName: 'fazil',
    description: 'OCC App. Ongoing work.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },

  // varshith
  {
    developerName: 'varshith',
    developerEmail: 'saivarshithmaddala@gmail.com',
    name: 'akshara info',
    clientName: 'varshith',
    description: 'Akshara Info.',
    gitLink: '',
    vercelFrontendLink: '',
    vercelBackendLink: '',
    envDriveLink: '',
    walkthroughVideoUrl: '',
    status: 'ACTIVE',
    currentStage: 'DEVELOPMENT'
  },
  {
    developerName: 'varshith',
    developerEmail: 'saivarshithmaddala@gmail.com',
    name: 'invoice generator',
    clientName: 'varshith',
    description: 'Invoice Generator. Database: MongoDB.',
    gitLink: 'https://github.com/saivarshithmaddala-sudo/invoiveg',
    vercelFrontendLink: 'https://invoiveg-ik5n.vercel.app',
    vercelBackendLink: 'Vercel',
    envDriveLink: 'saivarshithmaddala-9169',
    walkthroughVideoUrl: '',
    status: 'COMPLETED',
    currentStage: 'DEPLOYMENT'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✓ Connected to MongoDB');

    const { Organization, User, Project, ProjectStage } = await import('./src/models/index.js');

    // Retrieve all organizations
    const orgs = await Organization.find({});
    if (orgs.length === 0) {
      console.log('❌ No organizations found. Run seed-admin first.');
      process.exit(1);
    }

    console.log(`Found ${orgs.length} organizations to seed projects into.`);

    // Loop through each organization
    for (const org of orgs) {
      console.log(`\n--- Seeding for Organization: ${org.name} (Slug: ${org.slug}) ---`);

      // Ensure at least one admin user exists in this organization
      let adminUser = await User.findOne({ organizationId: org._id, role: 'SUPER_ADMIN' });
      if (!adminUser) {
        adminUser = await User.findOne({ organizationId: org._id });
      }

      // If no admin user is found under this org, let's look for admin@sprintboard.com (which has undefined organizationId)
      // and assign it to this organization!
      if (!adminUser && org.slug === 'sprintboard') {
        const globalAdmin = await User.findOne({ email: 'admin@sprintboard.com' });
        if (globalAdmin) {
          await User.updateOne(
            { _id: globalAdmin._id },
            { $set: { organizationId: org._id, fullName: 'Admin User' } }
          );
          adminUser = await User.findById(globalAdmin._id);
          console.log(`✓ Associated existing global admin@sprintboard.com with ${org.name}`);
        }
      }

      // If still no user, create a default admin
      if (!adminUser) {
        const passwordHash = await hashPassword('admin123');
        adminUser = await User.create({
          organizationId: org._id,
          fullName: 'Organization Admin',
          email: `admin@${org.slug}.com`,
          passwordHash,
          role: 'ADMIN',
          userType: 'PROJECT_COORDINATOR',
          isActive: true,
          inviteAccepted: true,
          createdBy: null
        });
        console.log(`✓ Created default administrator for ${org.name}: admin@${org.slug}.com`);
      }

      console.log(`Using admin/creator user: ${adminUser.fullName} (${adminUser.email})`);

      // Map to cache developer users we find/create in this org
      const developerCache = {};

      for (const projData of projectsData) {
        // Find or create developer user in this organization
        let devUser = developerCache[projData.developerEmail];
        if (!devUser) {
          devUser = await User.findOne({ organizationId: org._id, email: projData.developerEmail.toLowerCase() });
          if (!devUser) {
            const passwordHash = await hashPassword('password123');
            devUser = await User.create({
              organizationId: org._id,
              fullName: projData.developerName,
              email: projData.developerEmail.toLowerCase(),
              passwordHash,
              role: 'USER',
              userType: 'DEVELOPER',
              isActive: true,
              inviteAccepted: true,
              createdBy: adminUser._id
            });
            console.log(`✓ Created developer user: ${projData.developerName} (${projData.developerEmail})`);
          }
          developerCache[projData.developerEmail] = devUser;
        }

        // Check if project already exists by name in this organization
        let project = await Project.findOne({ organizationId: org._id, name: projData.name });

        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 1);
        const deadline = new Date();
        deadline.setMonth(deadline.getMonth() + 1);

        const projectPayload = {
          organizationId: org._id,
          name: projData.name,
          clientName: projData.clientName,
          description: projData.description,
          priority: 'MEDIUM',
          status: projData.status,
          currentStage: projData.currentStage,
          startDate,
          deadline,
          gitLink: projData.gitLink,
          vercelFrontendLink: projData.vercelFrontendLink,
          vercelBackendLink: projData.vercelBackendLink,
          envDriveLink: projData.envDriveLink,
          walkthroughVideoUrl: projData.walkthroughVideoUrl,
          assignedUserIds: [devUser._id],
          createdBy: adminUser._id
        };

        if (project) {
          // Update existing project
          await Project.updateOne({ _id: project._id }, { $set: projectPayload });
          console.log(`✓ Updated project: ${projData.name}`);
        } else {
          // Create new project
          project = await Project.create(projectPayload);
          console.log(`✓ Created project: ${projData.name}`);

          // Create 8 stages for the new project
          const stages = STAGE_ORDER.map((stageType, index) => {
            let status = 'PENDING';
            let completedAt = null;
            let startedAt = null;

            // Determine status based on currentStage
            const currentStageIndex = STAGE_ORDER.indexOf(projData.currentStage);
            if (index < currentStageIndex) {
              status = 'APPROVED';
              completedAt = new Date();
              startedAt = new Date();
            } else if (index === currentStageIndex) {
              status = 'IN_PROGRESS';
              startedAt = new Date();
            }

            return {
              projectId: project._id,
              organizationId: org._id,
              stageType,
              status,
              startedAt,
              completedAt,
              createdBy: adminUser._id
            };
          });

          await ProjectStage.insertMany(stages);
          console.log(`  └─ Created 8 sequential lifecycle stages`);
        }
      }
    }

    console.log('\n✅ Seeding complete! All projects and developers have been successfully registered.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed();
