// src/server/vercel-entry.ts
import "dotenv/config";

// src/server/app.ts
import express from "express";
import { GoogleGenAI } from "@google/genai";

// src/server/store.ts
import { createClient } from "@supabase/supabase-js";

// src/data/initialData.ts
var INITIAL_TENANTS = [
  {
    id: "tenant-1",
    name: "Apex Care Pharmacy - Downtown Hub",
    branchCode: "APX-01",
    licenseNumber: "DRAP-LIC-2024-8891",
    drugAuthorityReg: "FDA/PK-99120",
    address: "Suite 104, Central Commercial Plaza, Main Boulevard",
    city: "Lahore",
    phone: "+92 42 35789012",
    email: "downtown@apexcarepharma.com",
    currency: "PKR",
    taxRatePercent: 5,
    lowStockDefaultThreshold: 20,
    expiryWarningDays: 90,
    managerName: "Dr. Adeel Tariq, PharmD",
    createdAt: "2024-01-15",
    isActive: true,
    colorTheme: "emerald"
  },
  {
    id: "tenant-2",
    name: "GreenLife Health Chemists - Northside",
    branchCode: "GLH-02",
    licenseNumber: "DRAP-LIC-2024-4412",
    drugAuthorityReg: "FDA/PK-88319",
    address: "Plot 45-B, Sector F-7 Markaz",
    city: "Islamabad",
    phone: "+92 51 2654321",
    email: "northside@greenlifehealth.com",
    currency: "PKR",
    taxRatePercent: 5,
    lowStockDefaultThreshold: 25,
    expiryWarningDays: 90,
    managerName: "Dr. Fatima Zahra, RPh",
    createdAt: "2024-03-20",
    isActive: true,
    colorTheme: "teal"
  },
  {
    id: "tenant-3",
    name: "Al-Shifa Wellness Pharmacy - Medical City",
    branchCode: "ASW-03",
    licenseNumber: "DRAP-LIC-2024-7721",
    drugAuthorityReg: "FDA/PK-77401",
    address: "Hospital Road, Near Civil Complex, Medical District",
    city: "Rawalpindi",
    phone: "+92 51 5590987",
    email: "medcity@alshifawellness.com",
    currency: "PKR",
    taxRatePercent: 5,
    lowStockDefaultThreshold: 15,
    expiryWarningDays: 90,
    managerName: "Dr. Usman Khalid, M.Pharm",
    createdAt: "2024-06-10",
    isActive: true,
    colorTheme: "blue"
  }
];
var INITIAL_USERS = [
  {
    id: "usr-super",
    name: "Super Admin",
    email: "Superadmin",
    role: "super_admin",
    tenantId: null,
    avatar: ""
  },
  {
    id: "usr-1",
    name: "Adeel Chaudhary (Network Owner)",
    email: "adeelchaudhary101@gmail.com",
    role: "super_admin",
    tenantId: null,
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"
  },
  {
    id: "usr-2",
    name: "Dr. Adeel Tariq, PharmD",
    email: "a.tariq@apexcarepharma.com",
    role: "tenant_admin",
    tenantId: "tenant-1"
  },
  {
    id: "usr-3",
    name: "Zubair Ahmed, Pharmacist",
    email: "z.ahmed@apexcarepharma.com",
    role: "pharmacist",
    tenantId: "tenant-1"
  },
  {
    id: "usr-4",
    name: "Dr. Fatima Zahra, RPh",
    email: "f.zahra@greenlifehealth.com",
    role: "tenant_admin",
    tenantId: "tenant-2"
  },
  {
    id: "usr-5",
    name: "Bilal Khan, Cashier",
    email: "b.khan@greenlifehealth.com",
    role: "cashier",
    tenantId: "tenant-2"
  },
  {
    id: "usr-6",
    name: "Dr. Usman Khalid, M.Pharm",
    email: "u.khalid@alshifawellness.com",
    role: "tenant_admin",
    tenantId: "tenant-3"
  }
];
var INITIAL_SUPPLIERS = [
  {
    id: "sup-1",
    name: "GlaxoSmithKline (GSK) Distribution",
    contactPerson: "Khurram Shehzad",
    phone: "+92 42 35912300",
    email: "orders@gskdistro.com.pk",
    address: "Industrial Estate, Kot Lakhpat, Lahore",
    taxNumber: "NTN-382910-1",
    paymentTerms: "Net 30 Days"
  },
  {
    id: "sup-2",
    name: "Pfizer Global Pharmaceuticals",
    contactPerson: "Saima Bano",
    phone: "+92 21 34509122",
    email: "supply@pfizer.com.pk",
    address: "Clifton Pharma Zone, Karachi",
    taxNumber: "NTN-774819-4",
    paymentTerms: "Net 15 Days"
  },
  {
    id: "sup-3",
    name: "Abbott Laboratories Ltd",
    contactPerson: "Hamza Farooq",
    phone: "+92 42 37882211",
    email: "distro@abbottpharma.pk",
    address: "Gulberg Pharma Tower, Lahore",
    taxNumber: "NTN-994820-2",
    paymentTerms: "Net 30 Days"
  },
  {
    id: "sup-4",
    name: "Getz Pharma (Pvt) Ltd",
    contactPerson: "Rashid Minhas",
    phone: "+92 21 38290011",
    email: "sales@getzpharma.com",
    address: "Korangi Industrial Area, Karachi",
    taxNumber: "NTN-112394-8",
    paymentTerms: "Net 30 Days"
  },
  {
    id: "sup-5",
    name: "Novartis Healthcare Wholesale",
    contactPerson: "Ayesha Siddiqui",
    phone: "+92 51 2284910",
    email: "care@novartis.com.pk",
    address: "Blue Area Commercial, Islamabad",
    taxNumber: "NTN-664910-3",
    paymentTerms: "Cash on Delivery / Net 7"
  }
];
var INITIAL_MEDICINES = [
  {
    id: "med-1",
    brandName: "Augmentin 625mg",
    genericName: "Amoxicillin + Clavulanic Acid",
    sku: "AUG-625-TAB",
    barcode: "8964000100214",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg/125mg",
    manufacturer: "GlaxoSmithKline (GSK)",
    description: "Broad-spectrum antibiotic for bacterial respiratory, urinary, and skin infections.",
    sideEffects: "Mild nausea, diarrhea, skin rash.",
    contraindications: ["Penicillin allergy", "Hepatic dysfunction history"],
    defaultStorage: "Store below 25\xB0C",
    requiresPrescription: true,
    unitPackSize: 14
  },
  {
    id: "med-2",
    brandName: "Panadol Extra",
    genericName: "Paracetamol + Caffeine",
    sku: "PAN-EXT-500",
    barcode: "8964000100344",
    category: "Analgesics & Pain",
    dosageForm: "Tablet",
    strength: "500mg / 65mg",
    manufacturer: "GlaxoSmithKline (GSK)",
    description: "Fast acting pain reliever and antipyretic enhanced with caffeine for tension headache & fever.",
    sideEffects: "Insomnia if taken late evening, mild palpitations.",
    contraindications: ["Severe liver disease", "Hypersensitivity to paracetamol"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 20
  },
  {
    id: "med-3",
    brandName: "Glucophage 500mg",
    genericName: "Metformin Hydrochloride",
    sku: "GLU-500-MET",
    barcode: "8964000201192",
    category: "Diabetes & Endocrine",
    dosageForm: "Tablet",
    strength: "500mg",
    manufacturer: "Merck Healthcare",
    description: "First-line anti-hyperglycemic medicine for type 2 diabetes mellitus management.",
    sideEffects: "Gastrointestinal upset, metallic taste, nausea.",
    contraindications: ["Severe renal failure (eGFR < 30)", "Metabolic acidosis"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 50
  },
  {
    id: "med-4",
    brandName: "Lipitor 20mg",
    genericName: "Atorvastatin Calcium",
    sku: "LIP-020-ATO",
    barcode: "8964000300881",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "20mg",
    manufacturer: "Pfizer",
    description: "HMG-CoA reductase inhibitor (statin) used to lower LDL cholesterol and triglycerides.",
    sideEffects: "Myalgia, headache, elevated liver transaminases.",
    contraindications: ["Active liver disease", "Pregnancy and lactation"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 30
  },
  {
    id: "med-5",
    brandName: "Ventolin Evohaler",
    genericName: "Salbutamol Sulfate",
    sku: "VEN-100-INH",
    barcode: "8964000100771",
    category: "Respiratory",
    dosageForm: "Inhaler",
    strength: "100mcg / actuation (200 doses)",
    manufacturer: "GlaxoSmithKline (GSK)",
    description: "Short-acting beta-2 agonist bronchodilator for acute asthma relief and bronchospasm.",
    sideEffects: "Fine muscle tremor, tachycardia, headache.",
    contraindications: ["Hypersensitivity to salbutamol"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 1
  },
  {
    id: "med-6",
    brandName: "Risek 20mg",
    genericName: "Omeprazole",
    sku: "RIS-020-OME",
    barcode: "8964000400512",
    category: "Gastrointestinal",
    dosageForm: "Capsule",
    strength: "20mg",
    manufacturer: "Getz Pharma",
    description: "Proton pump inhibitor (PPI) for GERD, peptic ulcers, and acid reflux management.",
    sideEffects: "Abdominal pain, constipation, flatulence.",
    contraindications: ["Concomitant use with nelfinavir"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 14
  },
  {
    id: "med-7",
    brandName: "Zithrokan 500mg",
    genericName: "Azithromycin Dihydrate",
    sku: "ZIT-500-AZI",
    barcode: "8964000500129",
    category: "Antibiotics",
    dosageForm: "Tablet",
    strength: "500mg",
    manufacturer: "Getz Pharma",
    description: "Macrolide antibiotic for chest infections, sinusitis, throat infections, and skin issues.",
    sideEffects: "Diarrhea, nausea, abdominal cramps.",
    contraindications: ["History of cholestatic jaundice with macrolides"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 6
  },
  {
    id: "med-8",
    brandName: "Brufen DS 400mg",
    genericName: "Ibuprofen",
    sku: "BRU-400-IBU",
    barcode: "8964000300445",
    category: "Analgesics & Pain",
    dosageForm: "Tablet",
    strength: "400mg",
    manufacturer: "Abbott Laboratories",
    description: "Nonsteroidal anti-inflammatory drug (NSAID) for arthritis, joint pain, toothache, and fever.",
    sideEffects: "Gastric irritation, heartburn, dizziness.",
    contraindications: ["Active peptic ulcer disease", "Third trimester pregnancy", "Severe heart failure"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 30
  },
  {
    id: "med-9",
    brandName: "Lantus SoloStar Pen",
    genericName: "Insulin Glargine",
    sku: "LAN-100-INS",
    barcode: "8964000600998",
    category: "Diabetes & Endocrine",
    dosageForm: "Injection",
    strength: "100 units/ml (3ml prefilled pen)",
    manufacturer: "Sanofi",
    description: "Long-acting basal analog insulin for 24-hour continuous glycemic control in type 1 and 2 diabetes.",
    sideEffects: "Hypoglycemia, injection site lipodystrophy.",
    contraindications: ["During episodes of hypoglycemia"],
    defaultStorage: "Cold Chain (2-8\xB0C)",
    requiresPrescription: true,
    unitPackSize: 5
  },
  {
    id: "med-10",
    brandName: "Rigix 10mg",
    genericName: "Cetirizine Dihydrochloride",
    sku: "RIG-010-CET",
    barcode: "8964000400780",
    category: "Respiratory",
    dosageForm: "Tablet",
    strength: "10mg",
    manufacturer: "Getz Pharma",
    description: "Second-generation non-sedating antihistamine for allergic rhinitis, sneezing, and chronic urticaria.",
    sideEffects: "Mild drowsiness, dry mouth, fatigue.",
    contraindications: ["End-stage renal disease (eGFR < 10)"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 10
  },
  {
    id: "med-11",
    brandName: "Norvasc 5mg",
    genericName: "Amlodipine Besylate",
    sku: "NOR-005-AML",
    barcode: "8964000300113",
    category: "Cardiovascular",
    dosageForm: "Tablet",
    strength: "5mg",
    manufacturer: "Pfizer",
    description: "Dihydropyridine calcium channel blocker for hypertension and chronic stable angina.",
    sideEffects: "Peripheral ankle edema, flushing, dizziness.",
    contraindications: ["Severe hypotension", "Cardiogenic shock"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 30
  },
  {
    id: "med-12",
    brandName: "Cac-1000 Plus",
    genericName: "Calcium Carbonate + Vitamin C, D3 & B6",
    sku: "CAC-100-EFF",
    barcode: "8964000100990",
    category: "Vitamins & Supplements",
    dosageForm: "Tablet",
    strength: "1000mg Effervescent",
    manufacturer: "GlaxoSmithKline (GSK)",
    description: "Effervescent calcium and multivitamin supplement for bone health, pregnancy, and immunity.",
    sideEffects: "Mild bloating, frequent urination.",
    contraindications: ["Hypercalcemia", "Severe hypercalciuria"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 20
  },
  {
    id: "med-13",
    brandName: "Flagyl 400mg",
    genericName: "Metronidazole",
    sku: "FLA-400-MET",
    barcode: "8964000600121",
    category: "Gastrointestinal",
    dosageForm: "Tablet",
    strength: "400mg",
    manufacturer: "Sanofi",
    description: "Nitroimidazole antiprotozoal and antibiotic for anaerobic and amoebic infections.",
    sideEffects: "Metallic taste, nausea, dark urine.",
    contraindications: ["Alcohol consumption (Disulfiram-like reaction)", "First trimester pregnancy"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 20
  },
  {
    id: "med-14",
    brandName: "Pedialyte Electrolyte Solution",
    genericName: "Oral Rehydration Salts Liquid",
    sku: "PED-500-ORS",
    barcode: "8964000300994",
    category: "Pediatric",
    dosageForm: "Syrup",
    strength: "500ml Solution",
    manufacturer: "Abbott Laboratories",
    description: "Clinically formulated hydration fluid to prevent dehydration in diarrhea and vomiting in children.",
    sideEffects: "Rare when used as directed.",
    contraindications: ["Intestinal obstruction", "Severe kidney failure"],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 1
  },
  {
    id: "med-15",
    brandName: "Dermovate Cream",
    genericName: "Clobetasol Propionate",
    sku: "DER-025-CRM",
    barcode: "8964000100654",
    category: "Dermatological",
    dosageForm: "Ointment",
    strength: "0.05% w/w (25g)",
    manufacturer: "GlaxoSmithKline (GSK)",
    description: "Super-potent topical corticosteroid for severe eczema, psoriasis, and lichen planus.",
    sideEffects: "Skin thinning, striae, burning sensation.",
    contraindications: ["Untreated cutaneous infections", "Rosacea", "Acne vulgaris"],
    defaultStorage: "Store below 25\xB0C",
    requiresPrescription: true,
    unitPackSize: 1
  },
  {
    id: "med-16",
    brandName: "Accu-Chek Instant Test Strips",
    genericName: "Blood Glucose Test Strips",
    sku: "ACC-050-STR",
    barcode: "8964000700181",
    category: "Medical Devices",
    dosageForm: "Device",
    strength: "50 Strips Box",
    manufacturer: "Roche Diagnostics",
    description: "Accurate and fast blood glucose testing strips for instant diabetic monitoring.",
    sideEffects: "None",
    contraindications: [],
    defaultStorage: "Room Temperature",
    requiresPrescription: false,
    unitPackSize: 50
  },
  {
    id: "med-17",
    brandName: "Xanax 0.5mg",
    genericName: "Alprazolam",
    sku: "XAN-050-ALP",
    barcode: "8964000200331",
    category: "Psychiatric & Neuro",
    dosageForm: "Tablet",
    strength: "0.5mg",
    manufacturer: "Pfizer",
    description: "Schedule-IV controlled benzodiazepine for acute panic disorders and anxiety management.",
    sideEffects: "Drowsiness, impaired coordination, memory impairment.",
    contraindications: ["Myasthenia gravis", "Severe respiratory depression", "Substance abuse history"],
    defaultStorage: "Room Temperature",
    requiresPrescription: true,
    unitPackSize: 30
  }
];
var INITIAL_BATCHES = [
  // Tenant 1 - Apex Care
  {
    id: "bat-101",
    tenantId: "tenant-1",
    medicineId: "med-1",
    // Augmentin 625mg
    batchNumber: "AUG24B-01",
    manufactureDate: "2024-02-10",
    expiryDate: "2027-02-10",
    purchasePrice: 420,
    sellingPrice: 510,
    mrp: 520,
    stockQuantity: 45,
    initialQuantity: 100,
    locationRack: "A-12",
    supplierId: "sup-1"
  },
  {
    id: "bat-102",
    tenantId: "tenant-1",
    medicineId: "med-2",
    // Panadol Extra
    batchNumber: "PAN24E-91",
    manufactureDate: "2024-01-01",
    expiryDate: "2027-01-01",
    purchasePrice: 75,
    sellingPrice: 95,
    mrp: 98,
    stockQuantity: 120,
    initialQuantity: 200,
    locationRack: "B-04",
    supplierId: "sup-1"
  },
  {
    id: "bat-103",
    tenantId: "tenant-1",
    medicineId: "med-3",
    // Glucophage 500
    batchNumber: "GLU23X-44",
    manufactureDate: "2023-09-15",
    expiryDate: "2026-10-15",
    // Expiring in ~2 months!
    purchasePrice: 180,
    sellingPrice: 240,
    mrp: 250,
    stockQuantity: 8,
    // Low stock!
    initialQuantity: 80,
    locationRack: "D-02",
    supplierId: "sup-3"
  },
  {
    id: "bat-104",
    tenantId: "tenant-1",
    medicineId: "med-4",
    // Lipitor 20mg
    batchNumber: "LIP24A-12",
    manufactureDate: "2024-04-01",
    expiryDate: "2027-04-01",
    purchasePrice: 650,
    sellingPrice: 780,
    mrp: 800,
    stockQuantity: 28,
    initialQuantity: 50,
    locationRack: "C-08",
    supplierId: "sup-2"
  },
  {
    id: "bat-105",
    tenantId: "tenant-1",
    medicineId: "med-5",
    // Ventolin Inhaler
    batchNumber: "VEN24K-88",
    manufactureDate: "2024-03-12",
    expiryDate: "2026-11-30",
    // Expiring soon (<90 days)
    purchasePrice: 280,
    sellingPrice: 350,
    mrp: 360,
    stockQuantity: 14,
    // Low stock!
    initialQuantity: 60,
    locationRack: "R-01",
    supplierId: "sup-1"
  },
  {
    id: "bat-106",
    tenantId: "tenant-1",
    medicineId: "med-6",
    // Risek 20mg
    batchNumber: "RIS24C-02",
    manufactureDate: "2024-05-10",
    expiryDate: "2027-05-10",
    purchasePrice: 290,
    sellingPrice: 365,
    mrp: 375,
    stockQuantity: 65,
    initialQuantity: 100,
    locationRack: "E-03",
    supplierId: "sup-4"
  },
  {
    id: "bat-107",
    tenantId: "tenant-1",
    medicineId: "med-9",
    // Lantus Insulin (Cold chain)
    batchNumber: "LAN24Z-90",
    manufactureDate: "2024-02-20",
    expiryDate: "2026-12-15",
    purchasePrice: 2800,
    sellingPrice: 3350,
    mrp: 3400,
    stockQuantity: 12,
    initialQuantity: 30,
    locationRack: "FRIDGE-COLD-01",
    supplierId: "sup-5"
  },
  {
    id: "bat-108",
    tenantId: "tenant-1",
    medicineId: "med-17",
    // Xanax (Controlled)
    batchNumber: "XAN24P-77",
    manufactureDate: "2024-01-18",
    expiryDate: "2027-01-18",
    purchasePrice: 420,
    sellingPrice: 530,
    mrp: 540,
    stockQuantity: 19,
    initialQuantity: 40,
    locationRack: "LOCKER-SAFE-01",
    supplierId: "sup-2",
    isControlledSubstance: true
  },
  {
    id: "bat-109",
    tenantId: "tenant-1",
    medicineId: "med-12",
    // Cac 1000 Plus
    batchNumber: "CAC24M-33",
    manufactureDate: "2024-03-01",
    expiryDate: "2027-03-01",
    purchasePrice: 380,
    sellingPrice: 460,
    mrp: 475,
    stockQuantity: 80,
    initialQuantity: 120,
    locationRack: "V-05",
    supplierId: "sup-1"
  },
  // Tenant 2 - GreenLife Northside
  {
    id: "bat-201",
    tenantId: "tenant-2",
    medicineId: "med-1",
    // Augmentin 625mg
    batchNumber: "AUG24B-09",
    manufactureDate: "2024-04-12",
    expiryDate: "2027-04-12",
    purchasePrice: 420,
    sellingPrice: 510,
    mrp: 520,
    stockQuantity: 95,
    // Surplus stock in Northside!
    initialQuantity: 150,
    locationRack: "A-02",
    supplierId: "sup-1"
  },
  {
    id: "bat-202",
    tenantId: "tenant-2",
    medicineId: "med-3",
    // Glucophage 500
    batchNumber: "GLU24K-11",
    manufactureDate: "2024-03-10",
    expiryDate: "2027-03-10",
    purchasePrice: 180,
    sellingPrice: 240,
    mrp: 250,
    stockQuantity: 110,
    // Surplus stock in Northside!
    initialQuantity: 150,
    locationRack: "D-01",
    supplierId: "sup-3"
  },
  {
    id: "bat-203",
    tenantId: "tenant-2",
    medicineId: "med-7",
    // Zithrokan 500mg
    batchNumber: "ZIT24X-23",
    manufactureDate: "2024-02-15",
    expiryDate: "2027-02-15",
    purchasePrice: 390,
    sellingPrice: 480,
    mrp: 495,
    stockQuantity: 42,
    initialQuantity: 80,
    locationRack: "A-09",
    supplierId: "sup-4"
  },
  {
    id: "bat-204",
    tenantId: "tenant-2",
    medicineId: "med-8",
    // Brufen DS
    batchNumber: "BRU24G-55",
    manufactureDate: "2024-01-20",
    expiryDate: "2027-01-20",
    purchasePrice: 110,
    sellingPrice: 145,
    mrp: 150,
    stockQuantity: 18,
    // Low stock in Northside
    initialQuantity: 90,
    locationRack: "B-02",
    supplierId: "sup-3"
  },
  {
    id: "bat-205",
    tenantId: "tenant-2",
    medicineId: "med-10",
    // Rigix 10mg
    batchNumber: "RIG24R-01",
    manufactureDate: "2024-03-15",
    expiryDate: "2027-03-15",
    purchasePrice: 120,
    sellingPrice: 160,
    mrp: 165,
    stockQuantity: 75,
    initialQuantity: 100,
    locationRack: "R-03",
    supplierId: "sup-4"
  },
  {
    id: "bat-206",
    tenantId: "tenant-2",
    medicineId: "med-11",
    // Norvasc 5mg
    batchNumber: "NOR24L-08",
    manufactureDate: "2024-02-01",
    expiryDate: "2027-02-01",
    purchasePrice: 310,
    sellingPrice: 390,
    mrp: 400,
    stockQuantity: 34,
    initialQuantity: 60,
    locationRack: "C-01",
    supplierId: "sup-2"
  },
  {
    id: "bat-207",
    tenantId: "tenant-2",
    medicineId: "med-16",
    // Accu-Chek
    batchNumber: "ACC24T-99",
    manufactureDate: "2024-04-05",
    expiryDate: "2026-10-30",
    // Expiring in ~2 months!
    purchasePrice: 1450,
    sellingPrice: 1750,
    mrp: 1800,
    stockQuantity: 15,
    initialQuantity: 40,
    locationRack: "DEV-01",
    supplierId: "sup-5"
  },
  // Tenant 3 - Al-Shifa Medical City
  {
    id: "bat-301",
    tenantId: "tenant-3",
    medicineId: "med-1",
    // Augmentin 625mg
    batchNumber: "AUG24B-88",
    manufactureDate: "2024-05-15",
    expiryDate: "2027-05-15",
    purchasePrice: 420,
    sellingPrice: 510,
    mrp: 520,
    stockQuantity: 52,
    initialQuantity: 80,
    locationRack: "A-10",
    supplierId: "sup-1"
  },
  {
    id: "bat-302",
    tenantId: "tenant-3",
    medicineId: "med-5",
    // Ventolin
    batchNumber: "VEN24M-19",
    manufactureDate: "2024-04-10",
    expiryDate: "2027-04-10",
    purchasePrice: 280,
    sellingPrice: 350,
    mrp: 360,
    stockQuantity: 48,
    initialQuantity: 70,
    locationRack: "R-02",
    supplierId: "sup-1"
  },
  {
    id: "bat-303",
    tenantId: "tenant-3",
    medicineId: "med-9",
    // Lantus Insulin
    batchNumber: "LAN24Y-31",
    manufactureDate: "2024-03-22",
    expiryDate: "2027-03-22",
    purchasePrice: 2800,
    sellingPrice: 3350,
    mrp: 3400,
    stockQuantity: 24,
    initialQuantity: 50,
    locationRack: "FRIDGE-01",
    supplierId: "sup-5"
  },
  {
    id: "bat-304",
    tenantId: "tenant-3",
    medicineId: "med-13",
    // Flagyl 400
    batchNumber: "FLA24W-88",
    manufactureDate: "2024-01-10",
    expiryDate: "2027-01-10",
    purchasePrice: 90,
    sellingPrice: 120,
    mrp: 125,
    stockQuantity: 95,
    initialQuantity: 120,
    locationRack: "G-02",
    supplierId: "sup-5"
  },
  {
    id: "bat-305",
    tenantId: "tenant-3",
    medicineId: "med-14",
    // Pedialyte
    batchNumber: "PED24Q-09",
    manufactureDate: "2024-04-01",
    expiryDate: "2027-04-01",
    purchasePrice: 240,
    sellingPrice: 310,
    mrp: 320,
    stockQuantity: 38,
    initialQuantity: 50,
    locationRack: "P-01",
    supplierId: "sup-3"
  },
  {
    id: "bat-306",
    tenantId: "tenant-3",
    medicineId: "med-15",
    // Dermovate
    batchNumber: "DER24V-03",
    manufactureDate: "2024-02-14",
    expiryDate: "2027-02-14",
    purchasePrice: 195,
    sellingPrice: 255,
    mrp: 260,
    stockQuantity: 6,
    // Very Low stock!
    initialQuantity: 40,
    locationRack: "OIN-04",
    supplierId: "sup-1"
  }
];
var INITIAL_CUSTOMERS = [
  {
    id: "cust-1",
    name: "Muhammad Tariq",
    phone: "+92 300 1234567",
    email: "m.tariq@gmail.com",
    age: 58,
    gender: "Male",
    address: "House 12, St 4, DHA Phase 5",
    chronicConditions: ["Type 2 Diabetes", "Hypertension"],
    allergies: ["Penicillin", "Sulfa drugs"],
    insuranceProvider: "Jubilee Life HealthCare",
    policyNumber: "JUB-88219-A",
    totalSpent: 38400,
    lastVisitDate: "2026-08-20"
  },
  {
    id: "cust-2",
    name: "Amina Bibi",
    phone: "+92 321 9876543",
    email: "amina.b@yahoo.com",
    age: 42,
    gender: "Female",
    address: "Apartment 4B, Silver Heights, F-7",
    chronicConditions: ["Asthma"],
    allergies: ["Aspirin", "NSAIDs"],
    insuranceProvider: "EFU General Insurance",
    policyNumber: "EFU-49102-K",
    totalSpent: 19800,
    lastVisitDate: "2026-08-22"
  },
  {
    id: "cust-3",
    name: "Zahid Mahmood",
    phone: "+92 333 4455667",
    email: "zahid.m@outlook.com",
    age: 65,
    gender: "Male",
    address: "Villa 109, Bahria Town, Phase 8",
    chronicConditions: ["Hyperlipidemia", "Coronary Artery Disease"],
    allergies: [],
    insuranceProvider: "State Life Gold Plan",
    policyNumber: "SLIC-99201",
    totalSpent: 52100,
    lastVisitDate: "2026-08-21"
  },
  {
    id: "cust-4",
    name: "Sarah Farooq",
    phone: "+92 305 7766554",
    age: 29,
    gender: "Female",
    chronicConditions: [],
    allergies: [],
    totalSpent: 8500,
    lastVisitDate: "2026-08-23"
  }
];
var INITIAL_SALES = [
  {
    id: "sale-1001",
    tenantId: "tenant-1",
    invoiceNumber: "INV-APX-2026-0089",
    date: "2026-08-23T10:15:00Z",
    customerId: "cust-1",
    customerName: "Muhammad Tariq",
    customerPhone: "+92 300 1234567",
    doctorName: "Dr. Shahzad Mir (Consultant Diabetologist)",
    prescriptionNumber: "RX-9921",
    items: [
      {
        id: "si-1",
        medicineId: "med-3",
        medicineName: "Glucophage 500mg",
        genericName: "Metformin Hydrochloride",
        batchId: "bat-103",
        batchNumber: "GLU23X-44",
        unitPrice: 240,
        quantity: 2,
        discountPercent: 5,
        taxAmount: 22.8,
        totalAmount: 478.8,
        dosageInstructions: "1 tablet twice daily with meals"
      },
      {
        id: "si-2",
        medicineId: "med-4",
        medicineName: "Lipitor 20mg",
        genericName: "Atorvastatin Calcium",
        batchId: "bat-104",
        batchNumber: "LIP24A-12",
        unitPrice: 780,
        quantity: 1,
        discountPercent: 5,
        taxAmount: 37.05,
        totalAmount: 778.05,
        dosageInstructions: "1 tablet at bedtime"
      }
    ],
    subtotal: 1260,
    discountTotal: 63,
    taxTotal: 59.85,
    grandTotal: 1256.85,
    paymentMethod: "Insurance Co-Pay",
    insuranceDetails: {
      provider: "Jubilee Life HealthCare",
      claimNumber: "CLM-2026-8819",
      coPayPercent: 20
    },
    cashierId: "usr-3",
    cashierName: "Zubair Ahmed, Pharmacist",
    notes: "Prescription verified. Patient advised on evening dosing.",
    status: "completed"
  },
  {
    id: "sale-1002",
    tenantId: "tenant-1",
    invoiceNumber: "INV-APX-2026-0090",
    date: "2026-08-23T11:40:00Z",
    customerName: "Walk-in Customer (Sarah F.)",
    customerPhone: "+92 305 7766554",
    items: [
      {
        id: "si-3",
        medicineId: "med-2",
        medicineName: "Panadol Extra",
        genericName: "Paracetamol + Caffeine",
        batchId: "bat-102",
        batchNumber: "PAN24E-91",
        unitPrice: 95,
        quantity: 3,
        discountPercent: 0,
        taxAmount: 14.25,
        totalAmount: 299.25,
        dosageInstructions: "1-2 tablets SOS for headache"
      },
      {
        id: "si-4",
        medicineId: "med-12",
        medicineName: "Cac-1000 Plus",
        genericName: "Calcium Carbonate + Vitamin C, D3 & B6",
        batchId: "bat-109",
        batchNumber: "CAC24M-33",
        unitPrice: 460,
        quantity: 1,
        discountPercent: 0,
        taxAmount: 23,
        totalAmount: 483,
        dosageInstructions: "1 tablet dissolved in water daily"
      }
    ],
    subtotal: 745,
    discountTotal: 0,
    taxTotal: 37.25,
    grandTotal: 782.25,
    paymentMethod: "Digital Wallet",
    cashierId: "usr-2",
    cashierName: "Dr. Adeel Tariq, PharmD",
    status: "completed"
  },
  {
    id: "sale-2001",
    tenantId: "tenant-2",
    invoiceNumber: "INV-GLH-2026-0144",
    date: "2026-08-23T09:20:00Z",
    customerId: "cust-2",
    customerName: "Amina Bibi",
    customerPhone: "+92 321 9876543",
    doctorName: "Dr. Najeeb Ullah (Pulmonologist)",
    prescriptionNumber: "RX-7718",
    items: [
      {
        id: "si-5",
        medicineId: "med-1",
        medicineName: "Augmentin 625mg",
        genericName: "Amoxicillin + Clavulanic Acid",
        batchId: "bat-201",
        batchNumber: "AUG24B-09",
        unitPrice: 510,
        quantity: 2,
        discountPercent: 5,
        taxAmount: 48.45,
        totalAmount: 1017.45,
        dosageInstructions: "1 tablet every 12 hours for 7 days"
      },
      {
        id: "si-6",
        medicineId: "med-10",
        medicineName: "Rigix 10mg",
        genericName: "Cetirizine Dihydrochloride",
        batchId: "bat-205",
        batchNumber: "RIG24R-01",
        unitPrice: 160,
        quantity: 1,
        discountPercent: 5,
        taxAmount: 7.6,
        totalAmount: 159.6,
        dosageInstructions: "1 tablet once daily at night"
      }
    ],
    subtotal: 1180,
    discountTotal: 59,
    taxTotal: 56.05,
    grandTotal: 1177.05,
    paymentMethod: "Card",
    cashierId: "usr-5",
    cashierName: "Bilal Khan, Cashier",
    status: "completed"
  },
  {
    id: "sale-3001",
    tenantId: "tenant-3",
    invoiceNumber: "INV-ASW-2026-0045",
    date: "2026-08-23T14:10:00Z",
    customerName: "Walk-in Hospital Referral",
    items: [
      {
        id: "si-7",
        medicineId: "med-9",
        medicineName: "Lantus SoloStar Pen",
        genericName: "Insulin Glargine",
        batchId: "bat-303",
        batchNumber: "LAN24Y-31",
        unitPrice: 3350,
        quantity: 1,
        discountPercent: 0,
        taxAmount: 167.5,
        totalAmount: 3517.5,
        dosageInstructions: "Inject 18 units subcutaneously at 10 PM daily"
      },
      {
        id: "si-8",
        medicineId: "med-14",
        medicineName: "Pedialyte Electrolyte Solution",
        genericName: "Oral Rehydration Salts Liquid",
        batchId: "bat-305",
        batchNumber: "PED24Q-09",
        unitPrice: 310,
        quantity: 2,
        discountPercent: 0,
        taxAmount: 31,
        totalAmount: 651,
        dosageInstructions: "Sip frequently throughout the day"
      }
    ],
    subtotal: 3970,
    discountTotal: 0,
    taxTotal: 198.5,
    grandTotal: 4168.5,
    paymentMethod: "Cash",
    cashierId: "usr-6",
    cashierName: "Dr. Usman Khalid, M.Pharm",
    notes: "Cold chain insulated bag provided.",
    status: "completed"
  }
];
var INITIAL_TRANSFERS = [
  {
    id: "tr-101",
    fromTenantId: "tenant-2",
    fromTenantName: "GreenLife Health Chemists - Northside",
    toTenantId: "tenant-1",
    toTenantName: "Apex Care Pharmacy - Downtown Hub",
    medicineId: "med-3",
    medicineName: "Glucophage 500mg (Metformin)",
    genericName: "Metformin Hydrochloride",
    batchNumber: "GLU24K-11",
    quantity: 40,
    status: "pending",
    requestedDate: "2026-08-23T11:00:00Z",
    requestedBy: "Dr. Adeel Tariq, PharmD",
    notes: "Urgent stock shortage at Downtown Hub. Northside branch has 110 packs in surplus."
  },
  {
    id: "tr-102",
    fromTenantId: "tenant-1",
    fromTenantName: "Apex Care Pharmacy - Downtown Hub",
    toTenantId: "tenant-3",
    toTenantName: "Al-Shifa Wellness Pharmacy - Medical City",
    medicineId: "med-12",
    medicineName: "Cac-1000 Plus",
    genericName: "Calcium Carbonate + Vitamin C, D3 & B6",
    batchNumber: "CAC24M-33",
    quantity: 25,
    status: "completed",
    requestedDate: "2026-08-21T15:30:00Z",
    completedDate: "2026-08-22T09:00:00Z",
    requestedBy: "Dr. Usman Khalid, M.Pharm",
    notes: "Dispatched via inter-branch courier. Received and inventoried."
  }
];
var INITIAL_PURCHASE_ORDERS = [
  {
    id: "po-101",
    tenantId: "tenant-1",
    supplierId: "sup-1",
    supplierName: "GlaxoSmithKline (GSK) Distribution",
    orderNumber: "PO-APX-2026-004",
    orderDate: "2026-08-22",
    expectedDate: "2026-08-25",
    status: "ordered",
    items: [
      {
        medicineId: "med-5",
        medicineName: "Ventolin Evohaler",
        genericName: "Salbutamol Sulfate",
        dosageForm: "Inhaler",
        strength: "100mcg",
        quantity: 50,
        unitCost: 280,
        totalCost: 14e3
      },
      {
        medicineId: "med-1",
        medicineName: "Augmentin 625mg",
        genericName: "Amoxicillin + Clavulanic Acid",
        dosageForm: "Tablet",
        strength: "500mg/125mg",
        quantity: 60,
        unitCost: 420,
        totalCost: 25200
      }
    ],
    totalAmount: 39200,
    notes: "Regular replenishment batch for upcoming seasonal peak."
  },
  {
    id: "po-102",
    tenantId: "tenant-3",
    supplierId: "sup-1",
    supplierName: "GlaxoSmithKline (GSK) Distribution",
    orderNumber: "PO-ASW-2026-012",
    orderDate: "2026-08-23",
    expectedDate: "2026-08-26",
    status: "draft",
    items: [
      {
        medicineId: "med-15",
        medicineName: "Dermovate Cream",
        genericName: "Clobetasol Propionate",
        dosageForm: "Ointment",
        strength: "0.05% w/w",
        quantity: 30,
        unitCost: 195,
        totalCost: 5850
      }
    ],
    totalAmount: 5850,
    notes: "Critically low stock reorder."
  }
];

// src/server/auth.ts
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";
var DEFAULT_BOOTSTRAP_PASSWORD = "PharmaAdmin@123";
var TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
function hashPassword(plain) {
  const salt = randomBytes(16);
  const hash = scryptSync(plain, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}
function verifyPassword(plain, stored) {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 3 || parts[0] !== "scrypt") return false;
  const salt = Buffer.from(parts[1], "hex");
  const expected = Buffer.from(parts[2], "hex");
  let actual;
  try {
    actual = scryptSync(plain, salt, expected.length);
  } catch {
    return false;
  }
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
function getSessionSecret() {
  const s = process.env.SESSION_SECRET;
  if (s && s.trim().length > 0) return s.trim();
  const fallbackKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
  if (fallbackKey && fallbackKey.trim().length > 0) {
    return fallbackKey.trim();
  }
  return "dev-pharmacy-session-secret-default-key-2026";
}
function b64url(input) {
  return Buffer.from(input, "utf8").toString("base64url");
}
function signToken(input) {
  const payload = { ...input, exp: Date.now() + TOKEN_TTL_MS };
  const body = b64url(JSON.stringify(payload));
  const sig = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  return `${body}.${sig}`;
}
function verifyToken(token) {
  const dot = token.indexOf(".");
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = createHmac("sha256", getSessionSecret()).update(body).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
function sanitizeUser(u) {
  const { passwordHash, ...safe } = u;
  return safe;
}

// src/server/store.ts
var MemoryTable = class {
  constructor(seed) {
    this.rows = seed.map((r) => ({ ...r }));
  }
  async all() {
    return this.rows;
  }
  async insert(row) {
    this.rows.push(row);
    return row;
  }
  async insertMany(rows) {
    this.rows.push(...rows);
  }
  async update(id, patch) {
    const i = this.rows.findIndex((r) => r.id === id);
    if (i === -1) return null;
    this.rows[i] = { ...this.rows[i], ...patch };
    return this.rows[i];
  }
};
function cleanSupabaseUrl(raw) {
  if (!raw) return null;
  let trimmed = raw.trim();
  if (!trimmed) return null;
  const dashboardMatch = trimmed.match(/supabase\.com\/dashboard\/project\/([a-z0-9_-]+)/i);
  if (dashboardMatch) {
    return `https://${dashboardMatch[1]}.supabase.co`;
  }
  if (/^[a-z0-9]{15,30}$/i.test(trimmed)) {
    return `https://${trimmed}.supabase.co`;
  }
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    trimmed = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.origin;
    }
  } catch {
    return null;
  }
  return null;
}
var SupabaseTable = class {
  constructor(sb, name, seedRows = []) {
    this.sb = sb;
    this.name = name;
    this.fallbackMemory = /* @__PURE__ */ new Map();
    for (const r of seedRows) {
      this.fallbackMemory.set(r.id, { ...r });
    }
  }
  async all() {
    try {
      const { data, error } = await this.sb.from(this.name).select("data");
      if (error) {
        console.warn(`[${this.name}.all] Supabase read note (${error.message}). Using cache.`);
        return Array.from(this.fallbackMemory.values());
      }
      const items = (data || []).map((r) => r.data);
      for (const item of items) {
        if (item?.id) this.fallbackMemory.set(item.id, item);
      }
      return items;
    } catch (err) {
      console.warn(`[${this.name}.all] Supabase read exception (${err?.message}). Using cache.`);
      return Array.from(this.fallbackMemory.values());
    }
  }
  async insert(row) {
    this.fallbackMemory.set(row.id, { ...row });
    try {
      const { error } = await this.sb.from(this.name).insert({ id: row.id, data: row });
      if (error) console.warn(`[${this.name}.insert] Supabase write note:`, error.message);
    } catch (err) {
      console.warn(`[${this.name}.insert] Supabase write exception:`, err?.message);
    }
    return row;
  }
  async insertMany(rows) {
    if (rows.length === 0) return;
    for (const r of rows) {
      this.fallbackMemory.set(r.id, { ...r });
    }
    try {
      const { error } = await this.sb.from(this.name).insert(rows.map((r) => ({ id: r.id, data: r })));
      if (error) console.warn(`[${this.name}.insertMany] Supabase write note:`, error.message);
    } catch (err) {
      console.warn(`[${this.name}.insertMany] Supabase write exception:`, err?.message);
    }
  }
  async update(id, patch) {
    const memItem = this.fallbackMemory.get(id);
    const base = memItem || {};
    const merged = { ...base, ...patch, id };
    this.fallbackMemory.set(id, merged);
    try {
      const { data: existing, error: e1 } = await this.sb.from(this.name).select("data").eq("id", id).maybeSingle();
      if (!e1 && existing) {
        const fullMerged = { ...existing.data, ...patch };
        await this.sb.from(this.name).update({ data: fullMerged }).eq("id", id);
        this.fallbackMemory.set(id, fullMerged);
        return fullMerged;
      }
    } catch (err) {
      console.warn(`[${this.name}.update] Supabase update note:`, err?.message);
    }
    return merged;
  }
};
var cachedStore = null;
var readyPromise = null;
function buildSupabaseStore(sb) {
  return {
    tenants: new SupabaseTable(sb, "tenants", INITIAL_TENANTS),
    users: new SupabaseTable(sb, "users", INITIAL_USERS),
    medicines: new SupabaseTable(sb, "medicines", INITIAL_MEDICINES),
    batches: new SupabaseTable(sb, "batches", INITIAL_BATCHES),
    suppliers: new SupabaseTable(sb, "suppliers", INITIAL_SUPPLIERS),
    customers: new SupabaseTable(sb, "customers", INITIAL_CUSTOMERS),
    sales: new SupabaseTable(sb, "sales", INITIAL_SALES),
    transfers: new SupabaseTable(sb, "transfers", INITIAL_TRANSFERS),
    purchaseOrders: new SupabaseTable(sb, "purchase_orders", INITIAL_PURCHASE_ORDERS)
  };
}
function buildMemoryStore() {
  return {
    tenants: new MemoryTable(INITIAL_TENANTS),
    users: new MemoryTable(INITIAL_USERS),
    medicines: new MemoryTable(INITIAL_MEDICINES),
    batches: new MemoryTable(INITIAL_BATCHES),
    suppliers: new MemoryTable(INITIAL_SUPPLIERS),
    customers: new MemoryTable(INITIAL_CUSTOMERS),
    sales: new MemoryTable(INITIAL_SALES),
    transfers: new MemoryTable(INITIAL_TRANSFERS),
    purchaseOrders: new MemoryTable(INITIAL_PURCHASE_ORDERS)
  };
}
async function seedSupabase(sb, store2) {
  try {
    const { data, error } = await sb.from("tenants").select("id").limit(1);
    if (error) {
      console.warn(`[seed.check] Supabase tables may not exist yet (${error.message}).`);
      return;
    }
    if (data && data.length > 0) return;
    await store2.tenants.insertMany([...INITIAL_TENANTS]);
    await store2.users.insertMany([...INITIAL_USERS]);
    await store2.medicines.insertMany([...INITIAL_MEDICINES]);
    await store2.batches.insertMany([...INITIAL_BATCHES]);
    await store2.suppliers.insertMany([...INITIAL_SUPPLIERS]);
    await store2.customers.insertMany([...INITIAL_CUSTOMERS]);
    await store2.sales.insertMany([...INITIAL_SALES]);
    await store2.transfers.insertMany([...INITIAL_TRANSFERS]);
    await store2.purchaseOrders.insertMany([...INITIAL_PURCHASE_ORDERS]);
    console.log("[store] Fresh Supabase database initialized with initial pharmacy dataset.");
  } catch (err) {
    console.warn("[seed.check] Supabase seed warning:", err?.message);
  }
}
async function bootstrapAuth(store2) {
  try {
    const users = await store2.users.all();
    for (const u of users) {
      if (!u.passwordHash) {
        await store2.users.update(u.id, { passwordHash: hashPassword(DEFAULT_BOOTSTRAP_PASSWORD) });
      }
    }
  } catch (err) {
    console.warn("[bootstrapAuth] Note:", err?.message);
  }
}
function initStore() {
  if (cachedStore) return cachedStore;
  const rawUrl = process.env.SUPABASE_URL;
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  const url = cleanSupabaseUrl(rawUrl);
  const key = rawKey?.trim();
  if (url && key) {
    try {
      const sb = createClient(url, key, { auth: { persistSession: false } });
      const store3 = buildSupabaseStore(sb);
      readyPromise = seedSupabase(sb, store3).then(() => bootstrapAuth(store3));
      cachedStore = store3;
      console.log(`[store] Connected to Supabase backend: ${url}`);
      return cachedStore;
    } catch (err) {
      console.warn("[store] Failed to initialize Supabase client, falling back to memory:", err?.message);
    }
  }
  const store2 = buildMemoryStore();
  cachedStore = store2;
  readyPromise = bootstrapAuth(store2);
  console.log("[store] Supabase not configured or URL invalid \u2014 using in-memory store");
  return cachedStore;
}
var store = initStore();
async function ensureReady() {
  if (readyPromise) await readyPromise;
}
function isPersistent() {
  const url = cleanSupabaseUrl(process.env.SUPABASE_URL);
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY;
  return Boolean(url && key?.trim());
}

// src/server/app.ts
var aiClient = null;
function getGeminiAI() {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
var ah = (fn) => (req, res) => {
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || "Internal server error" });
    }
  });
};
function getUser(req) {
  return req.user;
}
function isSuper(req) {
  return getUser(req)?.role === "super_admin";
}
function canManageInventory(req) {
  const r = getUser(req)?.role;
  return r === "super_admin" || r === "tenant_admin" || r === "pharmacist";
}
function scopedTenantId(req, requested) {
  const u = getUser(req);
  if (u && u.role !== "super_admin") return u.tenantId || void 0;
  return typeof requested === "string" && requested ? requested : void 0;
}
function ownsTenant(req, tenantId) {
  const u = getUser(req);
  if (!u) return false;
  if (u.role === "super_admin") return true;
  return Boolean(tenantId) && u.tenantId === tenantId;
}
function forbid(res, message = "You do not have permission to perform this action.") {
  res.status(403).json({ error: message });
}
var VALID_ROLES = ["super_admin", "tenant_admin", "pharmacist", "cashier"];
function createApp() {
  const app2 = express();
  app2.use((req, res, next) => {
    if (req.body !== void 0 && req.body !== null) {
      req._body = true;
    }
    next();
  });
  app2.use(express.json({ limit: "15mb" }));
  app2.use("/api", (req, res, next) => {
    ensureReady().then(() => next()).catch((err) => {
      console.error("[store] initialization failed", err);
      res.status(500).json({ error: "Database initialization failed: " + (err?.message || err) });
    });
  });
  app2.post(
    "/api/auth/login",
    ah(async (req, res) => {
      const email = String(req.body?.email || "").trim().toLowerCase();
      const password = String(req.body?.password || "");
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
      }
      const users = await store.users.all();
      const user = users.find((u) => u.email.toLowerCase() === email);
      if (!user || !verifyPassword(password, user.passwordHash)) {
        return res.status(401).json({ error: "Invalid email or password." });
      }
      const token = signToken({ sub: user.id, role: user.role, tenantId: user.tenantId });
      res.json({ token, user: sanitizeUser(user) });
    })
  );
  app2.use("/api", (req, res, next) => {
    const p = req.path;
    if (req.method === "OPTIONS" || p === "/health" || p === "/auth/login") return next();
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
    let payload;
    try {
      payload = token ? verifyToken(token) : null;
    } catch (err) {
      res.status(500).json({ error: err?.message || "Authentication configuration error." });
      return;
    }
    if (!payload) {
      res.status(401).json({ error: "Authentication required. Please sign in." });
      return;
    }
    const userId = payload.sub;
    store.users.all().then((users) => {
      const user = users.find((u) => u.id === userId);
      if (!user) {
        res.status(401).json({ error: "Your session is no longer valid. Please sign in again." });
        return;
      }
      req.user = user;
      next();
    }).catch((err) => res.status(500).json({ error: err?.message || "Auth lookup failed." }));
  });
  app2.get(
    "/api/auth/me",
    ah(async (req, res) => {
      const u = getUser(req);
      if (!u) return res.status(401).json({ error: "Not authenticated" });
      res.json(sanitizeUser(u));
    })
  );
  app2.get(
    "/api/health",
    ah(async (req, res) => {
      const tenants = await store.tenants.all();
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        persistence: isPersistent() ? "supabase" : "in-memory",
        tenantsCount: tenants.length
      });
    })
  );
  app2.get(
    "/api/tenants",
    ah(async (req, res) => {
      const all = await store.tenants.all();
      if (isSuper(req)) return res.json(all);
      const u = getUser(req);
      res.json(all.filter((t) => t.id === u?.tenantId));
    })
  );
  app2.post(
    "/api/tenants",
    ah(async (req, res) => {
      if (!isSuper(req)) return forbid(res);
      const newTenant = {
        ...req.body,
        id: `tenant-${Date.now()}`,
        createdAt: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        isActive: req.body.isActive ?? true,
        taxRatePercent: Number(req.body.taxRatePercent) || 5,
        lowStockDefaultThreshold: Number(req.body.lowStockDefaultThreshold) || 20,
        expiryWarningDays: Number(req.body.expiryWarningDays) || 90
      };
      await store.tenants.insert(newTenant);
      const medicines = await store.medicines.all();
      const suppliers = await store.suppliers.all();
      const initialSeedMedicines = medicines.slice(0, 6);
      const seedBatches = initialSeedMedicines.map((med, idx) => ({
        id: `bat-new-${Date.now()}-${idx}`,
        tenantId: newTenant.id,
        medicineId: med.id,
        batchNumber: `BAT-${newTenant.branchCode}-${idx + 101}`,
        manufactureDate: "2024-03-01",
        expiryDate: "2027-03-01",
        purchasePrice: 150 + idx * 30,
        sellingPrice: 200 + idx * 40,
        mrp: 210 + idx * 40,
        stockQuantity: 30 + idx * 5,
        initialQuantity: 50,
        locationRack: `R-${idx + 1}`,
        supplierId: suppliers[0]?.id || "sup-1"
      }));
      await store.batches.insertMany(seedBatches);
      res.status(201).json(newTenant);
    })
  );
  app2.put(
    "/api/tenants/:id",
    ah(async (req, res) => {
      if (!isSuper(req)) return forbid(res);
      const updated = await store.tenants.update(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Tenant not found" });
      res.json(updated);
    })
  );
  app2.get(
    "/api/users",
    ah(async (req, res) => {
      const actor = getUser(req);
      if (!actor) return res.status(401).json({ error: "Not authenticated" });
      const all = await store.users.all();
      if (actor.role === "super_admin") {
        return res.json(all.map(sanitizeUser));
      }
      if (actor.role === "tenant_admin") {
        return res.json(all.filter((u) => u.tenantId === actor.tenantId).map(sanitizeUser));
      }
      return forbid(res);
    })
  );
  app2.post(
    "/api/users",
    ah(async (req, res) => {
      const actor = getUser(req);
      if (!actor) return res.status(401).json({ error: "Not authenticated" });
      if (actor.role !== "super_admin" && actor.role !== "tenant_admin") return forbid(res);
      const name = String(req.body?.name || "").trim();
      const email = String(req.body?.email || "").trim().toLowerCase();
      const role = String(req.body?.role || "");
      const password = String(req.body?.password || "");
      let tenantId = req.body?.tenantId ?? null;
      if (!name || !email || !password) {
        return res.status(400).json({ error: "Name, email and password are required." });
      }
      if (!VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: "Invalid role." });
      }
      if (actor.role === "tenant_admin") {
        if (role === "super_admin") return forbid(res, "Managers cannot create an owner account.");
        tenantId = actor.tenantId;
      } else {
        tenantId = role === "super_admin" ? null : tenantId;
        if (role !== "super_admin" && !tenantId) {
          return res.status(400).json({ error: "Please select a pharmacy for this user." });
        }
      }
      const users = await store.users.all();
      if (users.some((u) => u.email.toLowerCase() === email)) {
        return res.status(409).json({ error: "A user with this email already exists." });
      }
      const newUser = {
        id: `usr-${Date.now()}`,
        name,
        email,
        role,
        tenantId,
        passwordHash: hashPassword(password)
      };
      await store.users.insert(newUser);
      res.status(201).json(sanitizeUser(newUser));
    })
  );
  app2.put(
    "/api/users/:id",
    ah(async (req, res) => {
      const actor = getUser(req);
      if (!actor) return res.status(401).json({ error: "Not authenticated" });
      if (actor.role !== "super_admin" && actor.role !== "tenant_admin") return forbid(res);
      const users = await store.users.all();
      const target = users.find((u) => u.id === req.params.id);
      if (!target) return res.status(404).json({ error: "User not found" });
      if (actor.role === "tenant_admin") {
        if (target.tenantId !== actor.tenantId || target.role === "super_admin") {
          return forbid(res, "You can only manage staff in your own pharmacy.");
        }
      }
      const patch = {};
      if (typeof req.body?.name === "string" && req.body.name.trim()) patch.name = req.body.name.trim();
      if (typeof req.body?.role === "string") {
        const role = req.body.role;
        if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: "Invalid role." });
        if (actor.role === "tenant_admin" && role === "super_admin") {
          return forbid(res, "Managers cannot assign the owner role.");
        }
        patch.role = role;
      }
      if (typeof req.body?.email === "string" && req.body.email.trim()) {
        const email = req.body.email.trim().toLowerCase();
        if (users.some((u) => u.id !== target.id && u.email.toLowerCase() === email)) {
          return res.status(409).json({ error: "A user with this email already exists." });
        }
        patch.email = email;
      }
      if (typeof req.body?.password === "string" && req.body.password) {
        patch.passwordHash = hashPassword(req.body.password);
      }
      const updated = await store.users.update(target.id, patch);
      if (!updated) return res.status(404).json({ error: "User not found" });
      res.json(sanitizeUser(updated));
    })
  );
  app2.get(
    "/api/medicines",
    ah(async (req, res) => {
      res.json(await store.medicines.all());
    })
  );
  app2.post(
    "/api/medicines",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const newMed = {
        ...req.body,
        id: `med-${Date.now()}`,
        requiresPrescription: req.body.requiresPrescription ?? false,
        unitPackSize: Number(req.body.unitPackSize) || 1
      };
      await store.medicines.insert(newMed);
      res.status(201).json(newMed);
    })
  );
  app2.get(
    "/api/inventory",
    ah(async (req, res) => {
      const { search, category, lowStockOnly, expiringSoonOnly } = req.query;
      const tenantId = scopedTenantId(req, req.query.tenantId);
      const now = /* @__PURE__ */ new Date();
      const ninetyDaysFuture = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1e3);
      const [tenants, medicines, allBatches] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all()
      ]);
      const tenant = tenants.find((t) => t.id === tenantId);
      const lowStockThreshold = tenant?.lowStockDefaultThreshold || 20;
      let items = medicines.map((med) => {
        const batches = allBatches.filter(
          (b) => (!tenantId || b.tenantId === tenantId) && b.medicineId === med.id
        );
        const totalStock = batches.reduce((sum, b) => sum + b.stockQuantity, 0);
        const sortedBatches = [...batches].sort(
          (a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime()
        );
        const nearestExpiry = sortedBatches.length > 0 ? sortedBatches[0].expiryDate : null;
        const prices = batches.map((b) => b.sellingPrice);
        const lowestPrice = prices.length ? Math.min(...prices) : 0;
        const highestPrice = prices.length ? Math.max(...prices) : 0;
        const isExpired = nearestExpiry ? new Date(nearestExpiry) < now : false;
        const isExpiringSoon = nearestExpiry ? new Date(nearestExpiry) <= ninetyDaysFuture && !isExpired : false;
        const isLowStock = totalStock <= lowStockThreshold;
        return {
          ...med,
          batches,
          totalStock,
          nearestExpiry,
          lowestPrice,
          highestPrice,
          isLowStock,
          isExpiringSoon,
          isExpired
        };
      });
      if (search && typeof search === "string") {
        const q = search.toLowerCase();
        items = items.filter(
          (item) => item.brandName.toLowerCase().includes(q) || item.genericName.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q) || item.barcode.includes(q)
        );
      }
      if (category && typeof category === "string" && category !== "All") {
        items = items.filter((item) => item.category === category);
      }
      if (lowStockOnly === "true") {
        items = items.filter((item) => item.isLowStock);
      }
      if (expiringSoonOnly === "true") {
        items = items.filter((item) => item.isExpiringSoon || item.isExpired);
      }
      res.json(items);
    })
  );
  app2.get(
    "/api/inventory/reorder-check",
    ah(async (req, res) => {
      const tenantId = scopedTenantId(req, req.query.tenantId);
      const [tenants, medicines, allBatches, suppliers] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
        store.suppliers.all()
      ]);
      const tenant = tenants.find((t) => t.id === tenantId) || (tenantId ? null : tenants[0]);
      const threshold = tenant?.lowStockDefaultThreshold || 20;
      const currency = tenant?.currency || "PKR";
      const tenantBatches = allBatches.filter((b) => !tenantId || b.tenantId === tenantId);
      const lowStockItems = [];
      let outOfStockCount = 0;
      let criticalStockCount = 0;
      let totalEstimatedCost = 0;
      for (const med of medicines) {
        const batches = tenantBatches.filter((b) => b.medicineId === med.id);
        const currentStock = batches.reduce((sum, b) => sum + b.stockQuantity, 0);
        if (currentStock <= threshold) {
          const isOutOfStock = currentStock === 0;
          const isCritical = currentStock <= Math.max(5, Math.floor(threshold * 0.4));
          if (isOutOfStock) outOfStockCount++;
          if (isCritical && !isOutOfStock) criticalStockCount++;
          const deficit = Math.max(0, threshold - currentStock);
          const suggestedReorderQty = Math.max(deficit, threshold * 2);
          const unitCost = batches[0]?.purchasePrice || 100;
          const lineCost = suggestedReorderQty * unitCost;
          totalEstimatedCost += lineCost;
          const supplierId = batches[0]?.supplierId || suppliers[0]?.id;
          const supplier = suppliers.find((s) => s.id === supplierId) || suppliers[0];
          lowStockItems.push({
            medicineId: med.id,
            brandName: med.brandName,
            genericName: med.genericName,
            category: med.category,
            dosageForm: med.dosageForm,
            strength: med.strength,
            currentStock,
            threshold,
            deficit,
            suggestedReorderQty,
            estimatedUnitCost: unitCost,
            estimatedTotalCost: lineCost,
            supplierId: supplier?.id,
            supplierName: supplier?.name || "Wholesale Distributor",
            urgency: isOutOfStock ? "OUT_OF_STOCK" : isCritical ? "CRITICAL" : "LOW"
          });
        }
      }
      res.json({
        tenantId: tenant?.id || null,
        tenantName: tenant?.name || "All Branches (HQ)",
        thresholdUsed: threshold,
        totalEvaluated: medicines.length,
        lowStockCount: lowStockItems.length,
        criticalStockCount,
        outOfStockCount,
        totalEstimatedCost,
        currency,
        items: lowStockItems
      });
    })
  );
  app2.get(
    "/api/batches",
    ah(async (req, res) => {
      const { medicineId } = req.query;
      const tenantId = scopedTenantId(req, req.query.tenantId);
      let result = await store.batches.all();
      if (tenantId) result = result.filter((b) => b.tenantId === tenantId);
      if (medicineId) result = result.filter((b) => b.medicineId === medicineId);
      res.json(result);
    })
  );
  app2.post(
    "/api/batches",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const actor = getUser(req);
      const tenantId = actor.role === "super_admin" ? req.body.tenantId : actor.tenantId;
      if (!tenantId) return res.status(400).json({ error: "tenantId is required." });
      const newBatch = {
        ...req.body,
        tenantId,
        id: `bat-${Date.now()}`,
        purchasePrice: Number(req.body.purchasePrice) || 0,
        sellingPrice: Number(req.body.sellingPrice) || 0,
        mrp: Number(req.body.mrp) || Number(req.body.sellingPrice) || 0,
        stockQuantity: Number(req.body.stockQuantity) || 0,
        initialQuantity: Number(req.body.stockQuantity) || 0
      };
      await store.batches.insert(newBatch);
      res.status(201).json(newBatch);
    })
  );
  app2.put(
    "/api/batches/:id",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const batches = await store.batches.all();
      const existing = batches.find((b) => b.id === req.params.id);
      if (!existing) return res.status(404).json({ error: "Batch not found" });
      if (!ownsTenant(req, existing.tenantId)) return forbid(res);
      const patch = {
        ...req.body,
        stockQuantity: Number(req.body.stockQuantity ?? existing.stockQuantity),
        sellingPrice: Number(req.body.sellingPrice ?? existing.sellingPrice),
        purchasePrice: Number(req.body.purchasePrice ?? existing.purchasePrice)
      };
      const updated = await store.batches.update(req.params.id, patch);
      res.json(updated);
    })
  );
  app2.get(
    "/api/sales",
    ah(async (req, res) => {
      const tenantId = scopedTenantId(req, req.query.tenantId);
      let list = await store.sales.all();
      if (tenantId) list = list.filter((s) => s.tenantId === tenantId);
      list = [...list].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      res.json(list);
    })
  );
  app2.post(
    "/api/sales",
    ah(async (req, res) => {
      const actor = getUser(req);
      const saleData = req.body;
      const tenantId = actor.role === "super_admin" ? saleData.tenantId : actor.tenantId;
      if (!tenantId || !saleData.items || saleData.items.length === 0) {
        return res.status(400).json({ error: "Invalid sale payload: tenantId and items required" });
      }
      saleData.tenantId = tenantId;
      const allBatches = await store.batches.all();
      const deductions = [];
      for (const item of saleData.items) {
        const batch = allBatches.find((b) => b.id === item.batchId && b.tenantId === tenantId);
        if (batch) {
          if (batch.stockQuantity < item.quantity) {
            return res.status(400).json({
              error: `Insufficient stock for ${item.medicineName} in batch ${batch.batchNumber}. Available: ${batch.stockQuantity}`
            });
          }
          deductions.push({ id: batch.id, newQty: batch.stockQuantity - item.quantity });
        }
      }
      for (const d of deductions) {
        await store.batches.update(d.id, { stockQuantity: d.newQty });
      }
      if (saleData.customerId) {
        const customers = await store.customers.all();
        const customer = customers.find((c) => c.id === saleData.customerId);
        if (customer) {
          await store.customers.update(customer.id, {
            totalSpent: customer.totalSpent + (saleData.grandTotal || 0),
            lastVisitDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
          });
        }
      }
      const tenants = await store.tenants.all();
      const tenant = tenants.find((t) => t.id === saleData.tenantId);
      const sales = await store.sales.all();
      const invoiceCount = sales.filter((s) => s.tenantId === saleData.tenantId).length + 1;
      const invoiceNumber = `INV-${tenant?.branchCode || "PH"}-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(
        invoiceCount
      ).padStart(4, "0")}`;
      const newSale = {
        id: `sale-${Date.now()}`,
        tenantId: saleData.tenantId,
        invoiceNumber,
        date: (/* @__PURE__ */ new Date()).toISOString(),
        customerId: saleData.customerId,
        customerName: saleData.customerName || "Walk-in Customer",
        customerPhone: saleData.customerPhone,
        doctorName: saleData.doctorName,
        prescriptionNumber: saleData.prescriptionNumber,
        items: saleData.items,
        subtotal: Number(saleData.subtotal) || 0,
        discountTotal: Number(saleData.discountTotal) || 0,
        taxTotal: Number(saleData.taxTotal) || 0,
        grandTotal: Number(saleData.grandTotal) || 0,
        paymentMethod: saleData.paymentMethod || "Cash",
        insuranceDetails: saleData.insuranceDetails,
        cashierId: actor.id,
        cashierName: actor.name,
        notes: saleData.notes,
        status: "completed"
      };
      await store.sales.insert(newSale);
      res.status(201).json(newSale);
    })
  );
  app2.post(
    "/api/sales/:id/refund",
    ah(async (req, res) => {
      const sales = await store.sales.all();
      const sale = sales.find((s) => s.id === req.params.id);
      if (!sale) return res.status(404).json({ error: "Sale not found" });
      if (!ownsTenant(req, sale.tenantId)) return forbid(res);
      if (sale.status === "refunded") {
        return res.status(400).json({ error: "Sale is already refunded" });
      }
      const allBatches = await store.batches.all();
      for (const item of sale.items) {
        const batch = allBatches.find((b) => b.id === item.batchId);
        if (batch) {
          await store.batches.update(batch.id, { stockQuantity: batch.stockQuantity + item.quantity });
        }
      }
      const updated = await store.sales.update(sale.id, { status: "refunded" });
      res.json(updated);
    })
  );
  app2.get(
    "/api/transfers",
    ah(async (req, res) => {
      const tenantId = scopedTenantId(req, req.query.tenantId);
      let list = await store.transfers.all();
      if (tenantId) {
        list = list.filter((t) => t.fromTenantId === tenantId || t.toTenantId === tenantId);
      }
      list = [...list].sort(
        (a, b) => new Date(b.requestedDate).getTime() - new Date(a.requestedDate).getTime()
      );
      res.json(list);
    })
  );
  app2.post(
    "/api/transfers",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const actor = getUser(req);
      const { toTenantId, medicineId, quantity, notes } = req.body;
      const fromTenantId = actor.role === "super_admin" ? req.body.fromTenantId : actor.tenantId;
      const [tenants, medicines, allBatches] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all()
      ]);
      const fromTenant = tenants.find((t) => t.id === fromTenantId);
      const toTenant = tenants.find((t) => t.id === toTenantId);
      const medicine = medicines.find((m) => m.id === medicineId);
      if (!fromTenant || !toTenant || !medicine) {
        return res.status(400).json({ error: "Invalid transfer request parameters" });
      }
      const sourceBatch = allBatches.find(
        (b) => b.tenantId === fromTenantId && b.medicineId === medicineId && b.stockQuantity >= quantity
      ) || allBatches.find((b) => b.tenantId === fromTenantId && b.medicineId === medicineId);
      if (!sourceBatch || sourceBatch.stockQuantity < quantity) {
        return res.status(400).json({
          error: `Source branch ${fromTenant.name} has insufficient stock (Available: ${sourceBatch?.stockQuantity || 0})`
        });
      }
      const newTransfer = {
        id: `tr-${Date.now()}`,
        fromTenantId,
        fromTenantName: fromTenant.name,
        toTenantId,
        toTenantName: toTenant.name,
        medicineId,
        medicineName: medicine.brandName,
        genericName: medicine.genericName,
        batchNumber: sourceBatch.batchNumber,
        quantity: Number(quantity),
        status: "pending",
        requestedDate: (/* @__PURE__ */ new Date()).toISOString(),
        requestedBy: actor.name,
        notes
      };
      await store.transfers.insert(newTransfer);
      res.status(201).json(newTransfer);
    })
  );
  app2.put(
    "/api/transfers/:id/status",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const { status } = req.body;
      const transfers = await store.transfers.all();
      const transfer = transfers.find((t) => t.id === req.params.id);
      if (!transfer) return res.status(404).json({ error: "Transfer not found" });
      if (!ownsTenant(req, transfer.fromTenantId) && !ownsTenant(req, transfer.toTenantId)) {
        return forbid(res);
      }
      const patch = { status };
      if (status === "completed" && transfer.status !== "completed") {
        const allBatches = await store.batches.all();
        const sourceBatch = allBatches.find(
          (b) => b.tenantId === transfer.fromTenantId && b.batchNumber === transfer.batchNumber
        );
        if (sourceBatch) {
          await store.batches.update(sourceBatch.id, {
            stockQuantity: Math.max(0, sourceBatch.stockQuantity - transfer.quantity)
          });
        }
        const destBatch = allBatches.find(
          (b) => b.tenantId === transfer.toTenantId && b.batchNumber === transfer.batchNumber
        );
        if (destBatch) {
          await store.batches.update(destBatch.id, {
            stockQuantity: destBatch.stockQuantity + transfer.quantity
          });
        } else if (sourceBatch) {
          await store.batches.insert({
            id: `bat-tr-${Date.now()}`,
            tenantId: transfer.toTenantId,
            medicineId: transfer.medicineId,
            batchNumber: sourceBatch.batchNumber,
            manufactureDate: sourceBatch.manufactureDate,
            expiryDate: sourceBatch.expiryDate,
            purchasePrice: sourceBatch.purchasePrice,
            sellingPrice: sourceBatch.sellingPrice,
            mrp: sourceBatch.mrp,
            stockQuantity: transfer.quantity,
            initialQuantity: transfer.quantity,
            locationRack: "TRANSFERRED-IN",
            supplierId: sourceBatch.supplierId
          });
        }
        patch.completedDate = (/* @__PURE__ */ new Date()).toISOString();
      }
      const updated = await store.transfers.update(req.params.id, patch);
      res.json(updated);
    })
  );
  app2.get(
    "/api/suppliers",
    ah(async (req, res) => {
      res.json(await store.suppliers.all());
    })
  );
  app2.get(
    "/api/orders",
    ah(async (req, res) => {
      const tenantId = scopedTenantId(req, req.query.tenantId);
      let list = await store.purchaseOrders.all();
      if (tenantId) list = list.filter((p) => p.tenantId === tenantId);
      list = [...list].sort(
        (a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime()
      );
      res.json(list);
    })
  );
  app2.post(
    "/api/orders",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const actor = getUser(req);
      const { supplierId, items, notes } = req.body;
      const tenantId = actor.role === "super_admin" ? req.body.tenantId : actor.tenantId;
      if (!tenantId) return res.status(400).json({ error: "tenantId is required." });
      const [suppliers, tenants, orders] = await Promise.all([
        store.suppliers.all(),
        store.tenants.all(),
        store.purchaseOrders.all()
      ]);
      const supplier = suppliers.find((s) => s.id === supplierId);
      const tenant = tenants.find((t) => t.id === tenantId);
      const totalAmount = items.reduce(
        (sum, it) => sum + it.quantity * it.unitCost,
        0
      );
      const orderCount = orders.filter((p) => p.tenantId === tenantId).length + 1;
      const orderNumber = `PO-${tenant?.branchCode || "ORD"}-${(/* @__PURE__ */ new Date()).getFullYear()}-${String(
        orderCount
      ).padStart(3, "0")}`;
      const newOrder = {
        id: `po-${Date.now()}`,
        tenantId,
        supplierId,
        supplierName: supplier?.name || "Wholesale Distributor",
        orderNumber,
        orderDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        expectedDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0],
        status: "ordered",
        items,
        totalAmount,
        notes
      };
      await store.purchaseOrders.insert(newOrder);
      res.status(201).json(newOrder);
    })
  );
  app2.put(
    "/api/orders/:id/receive",
    ah(async (req, res) => {
      if (!canManageInventory(req)) return forbid(res);
      const orders = await store.purchaseOrders.all();
      const order = orders.find((p) => p.id === req.params.id);
      if (!order) return res.status(404).json({ error: "Order not found" });
      if (!ownsTenant(req, order.tenantId)) return forbid(res);
      if (order.status === "received") {
        return res.status(400).json({ error: "Order is already marked as received" });
      }
      for (const it of order.items) {
        const generatedBatchNum = it.batchNumber || `BAT-${Date.now().toString().slice(-4)}`;
        const expiryDate = it.expiryDate || new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1e3).toISOString().split("T")[0];
        await store.batches.insert({
          id: `bat-rcv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId: order.tenantId,
          medicineId: it.medicineId,
          batchNumber: generatedBatchNum,
          manufactureDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          expiryDate,
          purchasePrice: it.unitCost,
          sellingPrice: Math.round(it.unitCost * 1.25),
          mrp: Math.round(it.unitCost * 1.28),
          stockQuantity: it.quantity,
          initialQuantity: it.quantity,
          locationRack: "NEW-STOCK",
          supplierId: order.supplierId
        });
      }
      const updated = await store.purchaseOrders.update(order.id, { status: "received" });
      res.json(updated);
    })
  );
  app2.get(
    "/api/customers",
    ah(async (req, res) => {
      const list = await store.customers.all();
      const sorted = [...list].sort(
        (a, b) => new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime()
      );
      res.json(sorted);
    })
  );
  app2.post(
    "/api/customers",
    ah(async (req, res) => {
      const newCust = {
        ...req.body,
        id: `cust-${Date.now()}`,
        chronicConditions: req.body.chronicConditions || [],
        allergies: req.body.allergies || [],
        totalSpent: 0,
        lastVisitDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
      };
      await store.customers.insert(newCust);
      res.status(201).json(newCust);
    })
  );
  app2.get(
    "/api/analytics/network",
    ah(async (req, res) => {
      if (!isSuper(req)) return forbid(res);
      const [tenants, medicines, allBatches, allSales] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
        store.sales.all()
      ]);
      const totalTenants = tenants.length;
      const completedSales = allSales.filter((s) => s.status === "completed");
      const totalRevenue = completedSales.reduce((sum, s) => sum + s.grandTotal, 0);
      const totalSalesCount = completedSales.length;
      const totalInventoryValuation = allBatches.reduce(
        (sum, b) => sum + b.stockQuantity * b.purchasePrice,
        0
      );
      const now = /* @__PURE__ */ new Date();
      const ninetyDays = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1e3);
      const lowStockItemsCount = medicines.filter((med) => {
        const totalStock = allBatches.filter((b) => b.medicineId === med.id).reduce((sum, b) => sum + b.stockQuantity, 0);
        return totalStock <= 25;
      }).length;
      const expiringItemsCount = allBatches.filter((b) => {
        const exp = new Date(b.expiryDate);
        return exp <= ninetyDays && b.stockQuantity > 0;
      }).length;
      const tenantComparisons = tenants.map((t) => {
        const tSales = completedSales.filter((s) => s.tenantId === t.id);
        const rev = tSales.reduce((sum, s) => sum + s.grandTotal, 0);
        const tBatches = allBatches.filter((b) => b.tenantId === t.id);
        const invVal = tBatches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0);
        const stockItemsCount = tBatches.reduce((sum, b) => sum + b.stockQuantity, 0);
        const lowStockCount = medicines.filter((med) => {
          const s = tBatches.filter((b) => b.medicineId === med.id).reduce((sum, b) => sum + b.stockQuantity, 0);
          return s <= t.lowStockDefaultThreshold;
        }).length;
        return {
          tenantId: t.id,
          tenantName: t.name,
          branchCode: t.branchCode,
          city: t.city,
          revenue: rev,
          salesCount: tSales.length,
          inventoryValue: invVal,
          stockItemsCount,
          lowStockCount,
          currency: t.currency
        };
      });
      const medicineSalesMap = {};
      for (const s of completedSales) {
        for (const it of s.items) {
          if (!medicineSalesMap[it.medicineId]) {
            const med = medicines.find((m) => m.id === it.medicineId);
            if (med) medicineSalesMap[it.medicineId] = { units: 0, revenue: 0, med };
          }
          if (medicineSalesMap[it.medicineId]) {
            medicineSalesMap[it.medicineId].units += it.quantity;
            medicineSalesMap[it.medicineId].revenue += it.totalAmount;
          }
        }
      }
      const topSellingMedicines = Object.values(medicineSalesMap).sort((a, b) => b.units - a.units).slice(0, 6).map((item) => ({
        medicineName: item.med.brandName,
        genericName: item.med.genericName,
        category: item.med.category,
        unitsSold: item.units,
        revenue: item.revenue
      }));
      const responseData = {
        totalTenants,
        totalRevenue,
        totalSalesCount,
        totalInventoryValuation,
        totalMedicinesCount: medicines.length,
        lowStockItemsCount,
        expiringItemsCount,
        tenantComparisons,
        recentSales: completedSales.slice(0, 8),
        topSellingMedicines
      };
      res.json(responseData);
    })
  );
  app2.post(
    "/api/ai/analyze-prescription",
    ah(async (req, res) => {
      const { text, tenantId, patientConditions, patientAllergies } = req.body;
      if (!text) {
        return res.status(400).json({ error: "Prescription text or notes required" });
      }
      const medicines = await store.medicines.all();
      const availableMedicines = medicines.map((m) => ({
        id: m.id,
        brandName: m.brandName,
        genericName: m.genericName,
        strength: m.strength,
        dosageForm: m.dosageForm,
        category: m.category
      }));
      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are an expert Clinical Pharmacist AI Assistant.
Analyze this medical prescription / doctor note text:
"""
${text}
"""
Patient known conditions: ${patientConditions?.join(", ") || "None specified"}
Patient known allergies: ${patientAllergies?.join(", ") || "None specified"}

Our pharmacy inventory contains these medicines:
${JSON.stringify(availableMedicines)}

Provide a JSON object response with:
1. "detectedDoctorName": string or null
2. "detectedPatientName": string or null
3. "diagnosis": string or clinical notes
4. "prescribedItems": array of objects:
   - "medicineName": string
   - "genericName": string
   - "matchedMedicineId": string (or null if not in our inventory)
   - "dosage": string (e.g. "1 tablet BD after meals for 5 days")
   - "quantity": number (suggested dispense units)
   - "safetyNotes": string (any dosage advice or warnings)
5. "clinicalWarnings": array of strings (drug-allergy conflicts, condition contraindications, drug interactions)
6. "summaryAdvice": string (pharmacist counseling notes for the patient)`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }
      const lower = text.toLowerCase();
      const detectedItems = [];
      if (lower.includes("augmentin") || lower.includes("amoxicillin")) {
        detectedItems.push({
          medicineName: "Augmentin 625mg",
          genericName: "Amoxicillin + Clavulanic Acid",
          matchedMedicineId: "med-1",
          dosage: "1 tablet twice daily for 7 days",
          quantity: 2,
          safetyNotes: "Take with food to minimize GI distress."
        });
      }
      if (lower.includes("panadol") || lower.includes("paracetamol")) {
        detectedItems.push({
          medicineName: "Panadol Extra",
          genericName: "Paracetamol + Caffeine",
          matchedMedicineId: "med-2",
          dosage: "1-2 tablets every 6 hours SOS for pain/fever",
          quantity: 1,
          safetyNotes: "Do not exceed 8 tablets in 24 hours."
        });
      }
      if (lower.includes("glucophage") || lower.includes("metformin")) {
        detectedItems.push({
          medicineName: "Glucophage 500mg",
          genericName: "Metformin Hydrochloride",
          matchedMedicineId: "med-3",
          dosage: "1 tablet twice daily after major meals",
          quantity: 2,
          safetyNotes: "Regular blood glucose monitoring advised."
        });
      }
      if (lower.includes("lipitor") || lower.includes("atorvastatin")) {
        detectedItems.push({
          medicineName: "Lipitor 20mg",
          genericName: "Atorvastatin Calcium",
          matchedMedicineId: "med-4",
          dosage: "1 tablet once daily at bedtime",
          quantity: 1,
          safetyNotes: "Avoid consuming large amounts of grapefruit juice."
        });
      }
      if (detectedItems.length === 0) {
        detectedItems.push({
          medicineName: "Augmentin 625mg",
          genericName: "Amoxicillin + Clavulanic Acid",
          matchedMedicineId: "med-1",
          dosage: "1 tablet twice daily after meals for 5 days",
          quantity: 1,
          safetyNotes: "Verify patient allergy before dispensing."
        });
      }
      res.json({
        detectedDoctorName: "Dr. Specialized Physician",
        detectedPatientName: "Prescribed Patient",
        diagnosis: "Upper Respiratory Tract & Symptomatic Relief",
        prescribedItems: detectedItems,
        clinicalWarnings: patientAllergies?.includes("Penicillin") ? ["CRITICAL ALLERGY ALERT: Patient has Penicillin allergy; avoid Amoxicillin/Augmentin!"] : ["Verify exact dosage timing with meals."],
        summaryAdvice: "Ensure patient completes full course of antimicrobial therapy."
      });
    })
  );
  app2.post(
    "/api/ai/drug-interaction-check",
    ah(async (req, res) => {
      const { medicineIds, patientConditions, patientAge, isPregnant } = req.body;
      if (!medicineIds || !Array.isArray(medicineIds) || medicineIds.length === 0) {
        return res.status(400).json({ error: "medicineIds array required" });
      }
      const medicines = await store.medicines.all();
      const selectedMeds = medicines.filter((m) => medicineIds.includes(m.id));
      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are a Clinical Pharmacologist AI.
Analyze the following list of medications intended for a patient:
${JSON.stringify(
          selectedMeds.map((m) => ({
            brand: m.brandName,
            generic: m.genericName,
            strength: m.strength,
            category: m.category
          }))
        )}

Patient Profile:
- Age: ${patientAge || "Adult (35-60)"}
- Pregnant/Lactating: ${isPregnant ? "YES" : "NO"}
- Chronic Conditions: ${patientConditions?.join(", ") || "None"}

Evaluate drug-drug interactions, food/drink interactions, age-specific risks, and contraindications.
Return a JSON object:
1. "overallRiskLevel": "LOW" | "MODERATE" | "HIGH" | "CRITICAL"
2. "interactionCount": number
3. "interactions": array of objects:
   - "drugA": string
   - "drugB": string
   - "severity": "MILD" | "MODERATE" | "SEVERE"
   - "mechanism": string
   - "clinicalRecommendation": string
4. "patientRiskFactors": array of strings (e.g. pregnancy risk, kidney caution)
5. "pharmacistGuidance": string (actionable steps for the dispensing pharmacist)`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }
      const hasStatin = selectedMeds.some((m) => m.genericName.toLowerCase().includes("atorvastatin"));
      const hasMacrolide = selectedMeds.some((m) => m.genericName.toLowerCase().includes("azithromycin"));
      const interactions = [];
      if (hasStatin && hasMacrolide) {
        interactions.push({
          drugA: "Atorvastatin (Lipitor)",
          drugB: "Azithromycin (Zithrokan)",
          severity: "MODERATE",
          mechanism: "CYP3A4 / P-glycoprotein competition may elevate statin plasma levels, increasing myopathy risk.",
          clinicalRecommendation: "Monitor for unexplained muscle pain or weakness."
        });
      }
      res.json({
        overallRiskLevel: interactions.length > 0 ? "MODERATE" : "LOW",
        interactionCount: interactions.length,
        interactions,
        patientRiskFactors: isPregnant ? ["Lipitor & Brufen are contraindicated in pregnancy."] : ["Ensure hydration and spaced dosing."],
        pharmacistGuidance: "Review prescription timings and remind patient on dosage schedule."
      });
    })
  );
  app2.post(
    "/api/ai/smart-reorder-forecast",
    ah(async (req, res) => {
      const actor = getUser(req);
      const [tenants, medicines, allBatches, suppliers] = await Promise.all([
        store.tenants.all(),
        store.medicines.all(),
        store.batches.all(),
        store.suppliers.all()
      ]);
      const scopedId = actor.role === "super_admin" ? req.body?.tenantId : actor.tenantId;
      const tenant = tenants.find((t) => t.id === scopedId) || tenants[0];
      const tenantBatches = allBatches.filter((b) => b.tenantId === tenant.id);
      const inventoryStatus = medicines.map((med) => {
        const b = tenantBatches.filter((batch) => batch.medicineId === med.id);
        const total = b.reduce((s, x) => s + x.stockQuantity, 0);
        return {
          id: med.id,
          name: med.brandName,
          generic: med.genericName,
          category: med.category,
          currentStock: total,
          threshold: tenant.lowStockDefaultThreshold,
          isLow: total <= tenant.lowStockDefaultThreshold
        };
      });
      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are a Pharmaceutical Supply Chain AI Specialist.
Analyze the inventory for pharmacy branch "${tenant.name}" (${tenant.city}):
Inventory Data:
${JSON.stringify(inventoryStatus)}

Suppliers Available:
${JSON.stringify(suppliers.map((s) => ({ id: s.id, name: s.name, paymentTerms: s.paymentTerms })))}

Generate an intelligent automated stock replenishment plan.
Return a JSON object with:
1. "executiveSummary": string (quick overview of inventory health, critical shortages, and reorder urgency)
2. "criticalShortages": array of strings
3. "recommendedPurchaseOrders": array of objects:
   - "supplierId": string
   - "supplierName": string
   - "estimatedTotalCost": number (in ${tenant.currency})
   - "rationale": string
   - "items": array of objects:
     - "medicineId": string
     - "medicineName": string
     - "genericName": string
     - "suggestedQuantity": number
     - "estimatedUnitCost": number
     - "priority": "HIGH" | "MEDIUM" | "NORMAL"
4. "stockOptimizationTips": array of strings (e.g. cross-branch transfers, lead time buffers)`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }
      const lowItems = inventoryStatus.filter((i) => i.isLow);
      res.json({
        executiveSummary: `Analysis for ${tenant.name}: Detected ${lowItems.length} medications below threshold of ${tenant.lowStockDefaultThreshold} units. Urgent replenishment recommended to avoid prescription stockouts.`,
        criticalShortages: lowItems.map((i) => `${i.name} (Current: ${i.currentStock} units)`),
        recommendedPurchaseOrders: [
          {
            supplierId: "sup-1",
            supplierName: "GlaxoSmithKline (GSK) Distribution",
            estimatedTotalCost: 35e3,
            rationale: "Replenish essential antibiotic and respiratory inhalers reaching critical minimums.",
            items: lowItems.slice(0, 3).map((item) => ({
              medicineId: item.id,
              medicineName: item.name,
              genericName: item.generic,
              suggestedQuantity: 50,
              estimatedUnitCost: 350,
              priority: "HIGH"
            }))
          }
        ],
        stockOptimizationTips: [
          "Check GreenLife Northside branch for surplus stock transfers before issuing fresh supplier PO.",
          "Maintain cold-chain buffer for insulin batches."
        ]
      });
    })
  );
  app2.post(
    "/api/ai/executive-summary",
    ah(async (req, res) => {
      if (!isSuper(req)) return forbid(res);
      const [tenants, allBatches, allSales, allTransfers] = await Promise.all([
        store.tenants.all(),
        store.batches.all(),
        store.sales.all(),
        store.transfers.all()
      ]);
      const completedSales = allSales.filter((s) => s.status === "completed");
      const summaryPayload = {
        tenants: tenants.map((t) => ({
          name: t.name,
          city: t.city,
          salesCount: completedSales.filter((s) => s.tenantId === t.id).length,
          revenue: completedSales.filter((s) => s.tenantId === t.id).reduce((sum, s) => sum + s.grandTotal, 0),
          stockUnits: allBatches.filter((b) => b.tenantId === t.id).reduce((s, b) => s + b.stockQuantity, 0)
        })),
        pendingTransfersCount: allTransfers.filter((t) => t.status === "pending").length,
        totalInventoryValuation: allBatches.reduce((sum, b) => sum + b.stockQuantity * b.purchasePrice, 0)
      };
      const ai = getGeminiAI();
      if (ai) {
        const prompt = `You are an Executive Pharmacy Director & COO AI.
Review this multi-tenant pharmacy network performance data:
${JSON.stringify(summaryPayload)}

Generate a high-level executive briefing for the Network Owner.
Return a JSON object:
1. "headline": string
2. "networkHealthScore": number (1 to 100)
3. "topPerformingBranch": string
4. "keyHighlights": array of strings (3 bullet points)
5. "riskAlerts": array of strings (inventory imbalances, pending transfers, expiry risks)
6. "strategicRecommendations": array of strings (actionable business growth & operational moves)`;
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: { responseMimeType: "application/json" }
        });
        const parsed = JSON.parse(response.text || "{}");
        return res.json(parsed);
      }
      res.json({
        headline: "Robust Multi-Branch Performance with High Inventory Turnover",
        networkHealthScore: 88,
        topPerformingBranch: "Al-Shifa Wellness Pharmacy - Medical City",
        keyHighlights: [
          "Healthy cross-tenant sales velocity with highest prescription ticket value at Medical City.",
          "Downtown Hub experiencing peak demand for chronic disease management medications.",
          "Inter-branch transfers actively balancing regional stock discrepancies."
        ],
        riskAlerts: [
          "Glucophage and Ventolin approaching low-stock threshold in Downtown Hub.",
          "1 pending inter-branch transfer awaiting dispatch from Northside branch."
        ],
        strategicRecommendations: [
          "Approve pending stock transfer to prevent stockouts at Downtown branch.",
          "Consolidate bulk purchase orders with GSK & Abbott for volume rebates."
        ]
      });
    })
  );
  return app2;
}

// src/server/vercel-entry.ts
var app = null;
var loadError = null;
try {
  app = createApp();
} catch (e) {
  loadError = e;
}
function handler(req, res) {
  if (loadError) {
    const err = loadError;
    res.status(500).json({
      error: "init_failed",
      message: String(err?.message || err),
      stack: String(err?.stack || "").split("\n").slice(0, 12)
    });
    return;
  }
  return app(req, res);
}
export {
  handler as default
};
