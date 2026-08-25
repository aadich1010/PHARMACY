import { Tenant, AppUser, Medicine, InventoryBatch, Supplier, Customer, Sale, StockTransfer, PurchaseOrder } from '../types';

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant-1',
    name: 'Apex Care Pharmacy - Downtown Hub',
    branchCode: 'APX-01',
    licenseNumber: 'DRAP-LIC-2024-8891',
    drugAuthorityReg: 'FDA/PK-99120',
    address: 'Suite 104, Central Commercial Plaza, Main Boulevard',
    city: 'Lahore',
    phone: '+92 42 35789012',
    email: 'downtown@apexcarepharma.com',
    currency: 'PKR',
    taxRatePercent: 5.0,
    lowStockDefaultThreshold: 20,
    expiryWarningDays: 90,
    managerName: 'Dr. Adeel Tariq, PharmD',
    createdAt: '2024-01-15',
    isActive: true,
    colorTheme: 'emerald'
  },
  {
    id: 'tenant-2',
    name: 'GreenLife Health Chemists - Northside',
    branchCode: 'GLH-02',
    licenseNumber: 'DRAP-LIC-2024-4412',
    drugAuthorityReg: 'FDA/PK-88319',
    address: 'Plot 45-B, Sector F-7 Markaz',
    city: 'Islamabad',
    phone: '+92 51 2654321',
    email: 'northside@greenlifehealth.com',
    currency: 'PKR',
    taxRatePercent: 5.0,
    lowStockDefaultThreshold: 25,
    expiryWarningDays: 90,
    managerName: 'Dr. Fatima Zahra, RPh',
    createdAt: '2024-03-20',
    isActive: true,
    colorTheme: 'teal'
  },
  {
    id: 'tenant-3',
    name: 'Al-Shifa Wellness Pharmacy - Medical City',
    branchCode: 'ASW-03',
    licenseNumber: 'DRAP-LIC-2024-7721',
    drugAuthorityReg: 'FDA/PK-77401',
    address: 'Hospital Road, Near Civil Complex, Medical District',
    city: 'Rawalpindi',
    phone: '+92 51 5590987',
    email: 'medcity@alshifawellness.com',
    currency: 'PKR',
    taxRatePercent: 5.0,
    lowStockDefaultThreshold: 15,
    expiryWarningDays: 90,
    managerName: 'Dr. Usman Khalid, M.Pharm',
    createdAt: '2024-06-10',
    isActive: true,
    colorTheme: 'blue'
  }
];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-super',
    name: 'Super Admin',
    email: 'Superadmin',
    role: 'super_admin',
    tenantId: null,
    avatar: ''
  },
  {
    id: 'usr-1',
    name: 'Adeel Chaudhary (Network Owner)',
    email: 'adeelchaudhary101@gmail.com',
    role: 'super_admin',
    tenantId: null,
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  {
    id: 'usr-2',
    name: 'Dr. Adeel Tariq, PharmD',
    email: 'a.tariq@apexcarepharma.com',
    role: 'tenant_admin',
    tenantId: 'tenant-1'
  },
  {
    id: 'usr-3',
    name: 'Zubair Ahmed, Pharmacist',
    email: 'z.ahmed@apexcarepharma.com',
    role: 'pharmacist',
    tenantId: 'tenant-1'
  },
  {
    id: 'usr-4',
    name: 'Dr. Fatima Zahra, RPh',
    email: 'f.zahra@greenlifehealth.com',
    role: 'tenant_admin',
    tenantId: 'tenant-2'
  },
  {
    id: 'usr-5',
    name: 'Bilal Khan, Cashier',
    email: 'b.khan@greenlifehealth.com',
    role: 'cashier',
    tenantId: 'tenant-2'
  },
  {
    id: 'usr-6',
    name: 'Dr. Usman Khalid, M.Pharm',
    email: 'u.khalid@alshifawellness.com',
    role: 'tenant_admin',
    tenantId: 'tenant-3'
  }
];

export const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'GlaxoSmithKline (GSK) Distribution',
    contactPerson: 'Khurram Shehzad',
    phone: '+92 42 35912300',
    email: 'orders@gskdistro.com.pk',
    address: 'Industrial Estate, Kot Lakhpat, Lahore',
    taxNumber: 'NTN-382910-1',
    paymentTerms: 'Net 30 Days'
  },
  {
    id: 'sup-2',
    name: 'Pfizer Global Pharmaceuticals',
    contactPerson: 'Saima Bano',
    phone: '+92 21 34509122',
    email: 'supply@pfizer.com.pk',
    address: 'Clifton Pharma Zone, Karachi',
    taxNumber: 'NTN-774819-4',
    paymentTerms: 'Net 15 Days'
  },
  {
    id: 'sup-3',
    name: 'Abbott Laboratories Ltd',
    contactPerson: 'Hamza Farooq',
    phone: '+92 42 37882211',
    email: 'distro@abbottpharma.pk',
    address: 'Gulberg Pharma Tower, Lahore',
    taxNumber: 'NTN-994820-2',
    paymentTerms: 'Net 30 Days'
  },
  {
    id: 'sup-4',
    name: 'Getz Pharma (Pvt) Ltd',
    contactPerson: 'Rashid Minhas',
    phone: '+92 21 38290011',
    email: 'sales@getzpharma.com',
    address: 'Korangi Industrial Area, Karachi',
    taxNumber: 'NTN-112394-8',
    paymentTerms: 'Net 30 Days'
  },
  {
    id: 'sup-5',
    name: 'Novartis Healthcare Wholesale',
    contactPerson: 'Ayesha Siddiqui',
    phone: '+92 51 2284910',
    email: 'care@novartis.com.pk',
    address: 'Blue Area Commercial, Islamabad',
    taxNumber: 'NTN-664910-3',
    paymentTerms: 'Cash on Delivery / Net 7'
  }
];

export const INITIAL_MEDICINES: Medicine[] = [
  {
    id: 'med-1',
    brandName: 'Augmentin 625mg',
    genericName: 'Amoxicillin + Clavulanic Acid',
    sku: 'AUG-625-TAB',
    barcode: '8964000100214',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '500mg/125mg',
    manufacturer: 'GlaxoSmithKline (GSK)',
    description: 'Broad-spectrum antibiotic for bacterial respiratory, urinary, and skin infections.',
    sideEffects: 'Mild nausea, diarrhea, skin rash.',
    contraindications: ['Penicillin allergy', 'Hepatic dysfunction history'],
    defaultStorage: 'Store below 25°C',
    requiresPrescription: true,
    unitPackSize: 14
  },
  {
    id: 'med-2',
    brandName: 'Panadol Extra',
    genericName: 'Paracetamol + Caffeine',
    sku: 'PAN-EXT-500',
    barcode: '8964000100344',
    category: 'Analgesics & Pain',
    dosageForm: 'Tablet',
    strength: '500mg / 65mg',
    manufacturer: 'GlaxoSmithKline (GSK)',
    description: 'Fast acting pain reliever and antipyretic enhanced with caffeine for tension headache & fever.',
    sideEffects: 'Insomnia if taken late evening, mild palpitations.',
    contraindications: ['Severe liver disease', 'Hypersensitivity to paracetamol'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 20
  },
  {
    id: 'med-3',
    brandName: 'Glucophage 500mg',
    genericName: 'Metformin Hydrochloride',
    sku: 'GLU-500-MET',
    barcode: '8964000201192',
    category: 'Diabetes & Endocrine',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Merck Healthcare',
    description: 'First-line anti-hyperglycemic medicine for type 2 diabetes mellitus management.',
    sideEffects: 'Gastrointestinal upset, metallic taste, nausea.',
    contraindications: ['Severe renal failure (eGFR < 30)', 'Metabolic acidosis'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 50
  },
  {
    id: 'med-4',
    brandName: 'Lipitor 20mg',
    genericName: 'Atorvastatin Calcium',
    sku: 'LIP-020-ATO',
    barcode: '8964000300881',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '20mg',
    manufacturer: 'Pfizer',
    description: 'HMG-CoA reductase inhibitor (statin) used to lower LDL cholesterol and triglycerides.',
    sideEffects: 'Myalgia, headache, elevated liver transaminases.',
    contraindications: ['Active liver disease', 'Pregnancy and lactation'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 30
  },
  {
    id: 'med-5',
    brandName: 'Ventolin Evohaler',
    genericName: 'Salbutamol Sulfate',
    sku: 'VEN-100-INH',
    barcode: '8964000100771',
    category: 'Respiratory',
    dosageForm: 'Inhaler',
    strength: '100mcg / actuation (200 doses)',
    manufacturer: 'GlaxoSmithKline (GSK)',
    description: 'Short-acting beta-2 agonist bronchodilator for acute asthma relief and bronchospasm.',
    sideEffects: 'Fine muscle tremor, tachycardia, headache.',
    contraindications: ['Hypersensitivity to salbutamol'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 1
  },
  {
    id: 'med-6',
    brandName: 'Risek 20mg',
    genericName: 'Omeprazole',
    sku: 'RIS-020-OME',
    barcode: '8964000400512',
    category: 'Gastrointestinal',
    dosageForm: 'Capsule',
    strength: '20mg',
    manufacturer: 'Getz Pharma',
    description: 'Proton pump inhibitor (PPI) for GERD, peptic ulcers, and acid reflux management.',
    sideEffects: 'Abdominal pain, constipation, flatulence.',
    contraindications: ['Concomitant use with nelfinavir'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 14
  },
  {
    id: 'med-7',
    brandName: 'Zithrokan 500mg',
    genericName: 'Azithromycin Dihydrate',
    sku: 'ZIT-500-AZI',
    barcode: '8964000500129',
    category: 'Antibiotics',
    dosageForm: 'Tablet',
    strength: '500mg',
    manufacturer: 'Getz Pharma',
    description: 'Macrolide antibiotic for chest infections, sinusitis, throat infections, and skin issues.',
    sideEffects: 'Diarrhea, nausea, abdominal cramps.',
    contraindications: ['History of cholestatic jaundice with macrolides'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 6
  },
  {
    id: 'med-8',
    brandName: 'Brufen DS 400mg',
    genericName: 'Ibuprofen',
    sku: 'BRU-400-IBU',
    barcode: '8964000300445',
    category: 'Analgesics & Pain',
    dosageForm: 'Tablet',
    strength: '400mg',
    manufacturer: 'Abbott Laboratories',
    description: 'Nonsteroidal anti-inflammatory drug (NSAID) for arthritis, joint pain, toothache, and fever.',
    sideEffects: 'Gastric irritation, heartburn, dizziness.',
    contraindications: ['Active peptic ulcer disease', 'Third trimester pregnancy', 'Severe heart failure'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 30
  },
  {
    id: 'med-9',
    brandName: 'Lantus SoloStar Pen',
    genericName: 'Insulin Glargine',
    sku: 'LAN-100-INS',
    barcode: '8964000600998',
    category: 'Diabetes & Endocrine',
    dosageForm: 'Injection',
    strength: '100 units/ml (3ml prefilled pen)',
    manufacturer: 'Sanofi',
    description: 'Long-acting basal analog insulin for 24-hour continuous glycemic control in type 1 and 2 diabetes.',
    sideEffects: 'Hypoglycemia, injection site lipodystrophy.',
    contraindications: ['During episodes of hypoglycemia'],
    defaultStorage: 'Cold Chain (2-8°C)',
    requiresPrescription: true,
    unitPackSize: 5
  },
  {
    id: 'med-10',
    brandName: 'Rigix 10mg',
    genericName: 'Cetirizine Dihydrochloride',
    sku: 'RIG-010-CET',
    barcode: '8964000400780',
    category: 'Respiratory',
    dosageForm: 'Tablet',
    strength: '10mg',
    manufacturer: 'Getz Pharma',
    description: 'Second-generation non-sedating antihistamine for allergic rhinitis, sneezing, and chronic urticaria.',
    sideEffects: 'Mild drowsiness, dry mouth, fatigue.',
    contraindications: ['End-stage renal disease (eGFR < 10)'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 10
  },
  {
    id: 'med-11',
    brandName: 'Norvasc 5mg',
    genericName: 'Amlodipine Besylate',
    sku: 'NOR-005-AML',
    barcode: '8964000300113',
    category: 'Cardiovascular',
    dosageForm: 'Tablet',
    strength: '5mg',
    manufacturer: 'Pfizer',
    description: 'Dihydropyridine calcium channel blocker for hypertension and chronic stable angina.',
    sideEffects: 'Peripheral ankle edema, flushing, dizziness.',
    contraindications: ['Severe hypotension', 'Cardiogenic shock'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 30
  },
  {
    id: 'med-12',
    brandName: 'Cac-1000 Plus',
    genericName: 'Calcium Carbonate + Vitamin C, D3 & B6',
    sku: 'CAC-100-EFF',
    barcode: '8964000100990',
    category: 'Vitamins & Supplements',
    dosageForm: 'Tablet',
    strength: '1000mg Effervescent',
    manufacturer: 'GlaxoSmithKline (GSK)',
    description: 'Effervescent calcium and multivitamin supplement for bone health, pregnancy, and immunity.',
    sideEffects: 'Mild bloating, frequent urination.',
    contraindications: ['Hypercalcemia', 'Severe hypercalciuria'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 20
  },
  {
    id: 'med-13',
    brandName: 'Flagyl 400mg',
    genericName: 'Metronidazole',
    sku: 'FLA-400-MET',
    barcode: '8964000600121',
    category: 'Gastrointestinal',
    dosageForm: 'Tablet',
    strength: '400mg',
    manufacturer: 'Sanofi',
    description: 'Nitroimidazole antiprotozoal and antibiotic for anaerobic and amoebic infections.',
    sideEffects: 'Metallic taste, nausea, dark urine.',
    contraindications: ['Alcohol consumption (Disulfiram-like reaction)', 'First trimester pregnancy'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 20
  },
  {
    id: 'med-14',
    brandName: 'Pedialyte Electrolyte Solution',
    genericName: 'Oral Rehydration Salts Liquid',
    sku: 'PED-500-ORS',
    barcode: '8964000300994',
    category: 'Pediatric',
    dosageForm: 'Syrup',
    strength: '500ml Solution',
    manufacturer: 'Abbott Laboratories',
    description: 'Clinically formulated hydration fluid to prevent dehydration in diarrhea and vomiting in children.',
    sideEffects: 'Rare when used as directed.',
    contraindications: ['Intestinal obstruction', 'Severe kidney failure'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 1
  },
  {
    id: 'med-15',
    brandName: 'Dermovate Cream',
    genericName: 'Clobetasol Propionate',
    sku: 'DER-025-CRM',
    barcode: '8964000100654',
    category: 'Dermatological',
    dosageForm: 'Ointment',
    strength: '0.05% w/w (25g)',
    manufacturer: 'GlaxoSmithKline (GSK)',
    description: 'Super-potent topical corticosteroid for severe eczema, psoriasis, and lichen planus.',
    sideEffects: 'Skin thinning, striae, burning sensation.',
    contraindications: ['Untreated cutaneous infections', 'Rosacea', 'Acne vulgaris'],
    defaultStorage: 'Store below 25°C',
    requiresPrescription: true,
    unitPackSize: 1
  },
  {
    id: 'med-16',
    brandName: 'Accu-Chek Instant Test Strips',
    genericName: 'Blood Glucose Test Strips',
    sku: 'ACC-050-STR',
    barcode: '8964000700181',
    category: 'Medical Devices',
    dosageForm: 'Device',
    strength: '50 Strips Box',
    manufacturer: 'Roche Diagnostics',
    description: 'Accurate and fast blood glucose testing strips for instant diabetic monitoring.',
    sideEffects: 'None',
    contraindications: [],
    defaultStorage: 'Room Temperature',
    requiresPrescription: false,
    unitPackSize: 50
  },
  {
    id: 'med-17',
    brandName: 'Xanax 0.5mg',
    genericName: 'Alprazolam',
    sku: 'XAN-050-ALP',
    barcode: '8964000200331',
    category: 'Psychiatric & Neuro',
    dosageForm: 'Tablet',
    strength: '0.5mg',
    manufacturer: 'Pfizer',
    description: 'Schedule-IV controlled benzodiazepine for acute panic disorders and anxiety management.',
    sideEffects: 'Drowsiness, impaired coordination, memory impairment.',
    contraindications: ['Myasthenia gravis', 'Severe respiratory depression', 'Substance abuse history'],
    defaultStorage: 'Room Temperature',
    requiresPrescription: true,
    unitPackSize: 30
  }
];

export const INITIAL_BATCHES: InventoryBatch[] = [
  // Tenant 1 - Apex Care
  {
    id: 'bat-101',
    tenantId: 'tenant-1',
    medicineId: 'med-1', // Augmentin 625mg
    batchNumber: 'AUG24B-01',
    manufactureDate: '2024-02-10',
    expiryDate: '2027-02-10',
    purchasePrice: 420.00,
    sellingPrice: 510.00,
    mrp: 520.00,
    stockQuantity: 45,
    initialQuantity: 100,
    locationRack: 'A-12',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-102',
    tenantId: 'tenant-1',
    medicineId: 'med-2', // Panadol Extra
    batchNumber: 'PAN24E-91',
    manufactureDate: '2024-01-01',
    expiryDate: '2027-01-01',
    purchasePrice: 75.00,
    sellingPrice: 95.00,
    mrp: 98.00,
    stockQuantity: 120,
    initialQuantity: 200,
    locationRack: 'B-04',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-103',
    tenantId: 'tenant-1',
    medicineId: 'med-3', // Glucophage 500
    batchNumber: 'GLU23X-44',
    manufactureDate: '2023-09-15',
    expiryDate: '2026-10-15', // Expiring in ~2 months!
    purchasePrice: 180.00,
    sellingPrice: 240.00,
    mrp: 250.00,
    stockQuantity: 8, // Low stock!
    initialQuantity: 80,
    locationRack: 'D-02',
    supplierId: 'sup-3'
  },
  {
    id: 'bat-104',
    tenantId: 'tenant-1',
    medicineId: 'med-4', // Lipitor 20mg
    batchNumber: 'LIP24A-12',
    manufactureDate: '2024-04-01',
    expiryDate: '2027-04-01',
    purchasePrice: 650.00,
    sellingPrice: 780.00,
    mrp: 800.00,
    stockQuantity: 28,
    initialQuantity: 50,
    locationRack: 'C-08',
    supplierId: 'sup-2'
  },
  {
    id: 'bat-105',
    tenantId: 'tenant-1',
    medicineId: 'med-5', // Ventolin Inhaler
    batchNumber: 'VEN24K-88',
    manufactureDate: '2024-03-12',
    expiryDate: '2026-11-30', // Expiring soon (<90 days)
    purchasePrice: 280.00,
    sellingPrice: 350.00,
    mrp: 360.00,
    stockQuantity: 14, // Low stock!
    initialQuantity: 60,
    locationRack: 'R-01',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-106',
    tenantId: 'tenant-1',
    medicineId: 'med-6', // Risek 20mg
    batchNumber: 'RIS24C-02',
    manufactureDate: '2024-05-10',
    expiryDate: '2027-05-10',
    purchasePrice: 290.00,
    sellingPrice: 365.00,
    mrp: 375.00,
    stockQuantity: 65,
    initialQuantity: 100,
    locationRack: 'E-03',
    supplierId: 'sup-4'
  },
  {
    id: 'bat-107',
    tenantId: 'tenant-1',
    medicineId: 'med-9', // Lantus Insulin (Cold chain)
    batchNumber: 'LAN24Z-90',
    manufactureDate: '2024-02-20',
    expiryDate: '2026-12-15',
    purchasePrice: 2800.00,
    sellingPrice: 3350.00,
    mrp: 3400.00,
    stockQuantity: 12,
    initialQuantity: 30,
    locationRack: 'FRIDGE-COLD-01',
    supplierId: 'sup-5'
  },
  {
    id: 'bat-108',
    tenantId: 'tenant-1',
    medicineId: 'med-17', // Xanax (Controlled)
    batchNumber: 'XAN24P-77',
    manufactureDate: '2024-01-18',
    expiryDate: '2027-01-18',
    purchasePrice: 420.00,
    sellingPrice: 530.00,
    mrp: 540.00,
    stockQuantity: 19,
    initialQuantity: 40,
    locationRack: 'LOCKER-SAFE-01',
    supplierId: 'sup-2',
    isControlledSubstance: true
  },
  {
    id: 'bat-109',
    tenantId: 'tenant-1',
    medicineId: 'med-12', // Cac 1000 Plus
    batchNumber: 'CAC24M-33',
    manufactureDate: '2024-03-01',
    expiryDate: '2027-03-01',
    purchasePrice: 380.00,
    sellingPrice: 460.00,
    mrp: 475.00,
    stockQuantity: 80,
    initialQuantity: 120,
    locationRack: 'V-05',
    supplierId: 'sup-1'
  },

  // Tenant 2 - GreenLife Northside
  {
    id: 'bat-201',
    tenantId: 'tenant-2',
    medicineId: 'med-1', // Augmentin 625mg
    batchNumber: 'AUG24B-09',
    manufactureDate: '2024-04-12',
    expiryDate: '2027-04-12',
    purchasePrice: 420.00,
    sellingPrice: 510.00,
    mrp: 520.00,
    stockQuantity: 95, // Surplus stock in Northside!
    initialQuantity: 150,
    locationRack: 'A-02',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-202',
    tenantId: 'tenant-2',
    medicineId: 'med-3', // Glucophage 500
    batchNumber: 'GLU24K-11',
    manufactureDate: '2024-03-10',
    expiryDate: '2027-03-10',
    purchasePrice: 180.00,
    sellingPrice: 240.00,
    mrp: 250.00,
    stockQuantity: 110, // Surplus stock in Northside!
    initialQuantity: 150,
    locationRack: 'D-01',
    supplierId: 'sup-3'
  },
  {
    id: 'bat-203',
    tenantId: 'tenant-2',
    medicineId: 'med-7', // Zithrokan 500mg
    batchNumber: 'ZIT24X-23',
    manufactureDate: '2024-02-15',
    expiryDate: '2027-02-15',
    purchasePrice: 390.00,
    sellingPrice: 480.00,
    mrp: 495.00,
    stockQuantity: 42,
    initialQuantity: 80,
    locationRack: 'A-09',
    supplierId: 'sup-4'
  },
  {
    id: 'bat-204',
    tenantId: 'tenant-2',
    medicineId: 'med-8', // Brufen DS
    batchNumber: 'BRU24G-55',
    manufactureDate: '2024-01-20',
    expiryDate: '2027-01-20',
    purchasePrice: 110.00,
    sellingPrice: 145.00,
    mrp: 150.00,
    stockQuantity: 18, // Low stock in Northside
    initialQuantity: 90,
    locationRack: 'B-02',
    supplierId: 'sup-3'
  },
  {
    id: 'bat-205',
    tenantId: 'tenant-2',
    medicineId: 'med-10', // Rigix 10mg
    batchNumber: 'RIG24R-01',
    manufactureDate: '2024-03-15',
    expiryDate: '2027-03-15',
    purchasePrice: 120.00,
    sellingPrice: 160.00,
    mrp: 165.00,
    stockQuantity: 75,
    initialQuantity: 100,
    locationRack: 'R-03',
    supplierId: 'sup-4'
  },
  {
    id: 'bat-206',
    tenantId: 'tenant-2',
    medicineId: 'med-11', // Norvasc 5mg
    batchNumber: 'NOR24L-08',
    manufactureDate: '2024-02-01',
    expiryDate: '2027-02-01',
    purchasePrice: 310.00,
    sellingPrice: 390.00,
    mrp: 400.00,
    stockQuantity: 34,
    initialQuantity: 60,
    locationRack: 'C-01',
    supplierId: 'sup-2'
  },
  {
    id: 'bat-207',
    tenantId: 'tenant-2',
    medicineId: 'med-16', // Accu-Chek
    batchNumber: 'ACC24T-99',
    manufactureDate: '2024-04-05',
    expiryDate: '2026-10-30', // Expiring in ~2 months!
    purchasePrice: 1450.00,
    sellingPrice: 1750.00,
    mrp: 1800.00,
    stockQuantity: 15,
    initialQuantity: 40,
    locationRack: 'DEV-01',
    supplierId: 'sup-5'
  },

  // Tenant 3 - Al-Shifa Medical City
  {
    id: 'bat-301',
    tenantId: 'tenant-3',
    medicineId: 'med-1', // Augmentin 625mg
    batchNumber: 'AUG24B-88',
    manufactureDate: '2024-05-15',
    expiryDate: '2027-05-15',
    purchasePrice: 420.00,
    sellingPrice: 510.00,
    mrp: 520.00,
    stockQuantity: 52,
    initialQuantity: 80,
    locationRack: 'A-10',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-302',
    tenantId: 'tenant-3',
    medicineId: 'med-5', // Ventolin
    batchNumber: 'VEN24M-19',
    manufactureDate: '2024-04-10',
    expiryDate: '2027-04-10',
    purchasePrice: 280.00,
    sellingPrice: 350.00,
    mrp: 360.00,
    stockQuantity: 48,
    initialQuantity: 70,
    locationRack: 'R-02',
    supplierId: 'sup-1'
  },
  {
    id: 'bat-303',
    tenantId: 'tenant-3',
    medicineId: 'med-9', // Lantus Insulin
    batchNumber: 'LAN24Y-31',
    manufactureDate: '2024-03-22',
    expiryDate: '2027-03-22',
    purchasePrice: 2800.00,
    sellingPrice: 3350.00,
    mrp: 3400.00,
    stockQuantity: 24,
    initialQuantity: 50,
    locationRack: 'FRIDGE-01',
    supplierId: 'sup-5'
  },
  {
    id: 'bat-304',
    tenantId: 'tenant-3',
    medicineId: 'med-13', // Flagyl 400
    batchNumber: 'FLA24W-88',
    manufactureDate: '2024-01-10',
    expiryDate: '2027-01-10',
    purchasePrice: 90.00,
    sellingPrice: 120.00,
    mrp: 125.00,
    stockQuantity: 95,
    initialQuantity: 120,
    locationRack: 'G-02',
    supplierId: 'sup-5'
  },
  {
    id: 'bat-305',
    tenantId: 'tenant-3',
    medicineId: 'med-14', // Pedialyte
    batchNumber: 'PED24Q-09',
    manufactureDate: '2024-04-01',
    expiryDate: '2027-04-01',
    purchasePrice: 240.00,
    sellingPrice: 310.00,
    mrp: 320.00,
    stockQuantity: 38,
    initialQuantity: 50,
    locationRack: 'P-01',
    supplierId: 'sup-3'
  },
  {
    id: 'bat-306',
    tenantId: 'tenant-3',
    medicineId: 'med-15', // Dermovate
    batchNumber: 'DER24V-03',
    manufactureDate: '2024-02-14',
    expiryDate: '2027-02-14',
    purchasePrice: 195.00,
    sellingPrice: 255.00,
    mrp: 260.00,
    stockQuantity: 6, // Very Low stock!
    initialQuantity: 40,
    locationRack: 'OIN-04',
    supplierId: 'sup-1'
  }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Muhammad Tariq',
    phone: '+92 300 1234567',
    email: 'm.tariq@gmail.com',
    age: 58,
    gender: 'Male',
    address: 'House 12, St 4, DHA Phase 5',
    chronicConditions: ['Type 2 Diabetes', 'Hypertension'],
    allergies: ['Penicillin', 'Sulfa drugs'],
    insuranceProvider: 'Jubilee Life HealthCare',
    policyNumber: 'JUB-88219-A',
    totalSpent: 38400,
    lastVisitDate: '2026-08-20'
  },
  {
    id: 'cust-2',
    name: 'Amina Bibi',
    phone: '+92 321 9876543',
    email: 'amina.b@yahoo.com',
    age: 42,
    gender: 'Female',
    address: 'Apartment 4B, Silver Heights, F-7',
    chronicConditions: ['Asthma'],
    allergies: ['Aspirin', 'NSAIDs'],
    insuranceProvider: 'EFU General Insurance',
    policyNumber: 'EFU-49102-K',
    totalSpent: 19800,
    lastVisitDate: '2026-08-22'
  },
  {
    id: 'cust-3',
    name: 'Zahid Mahmood',
    phone: '+92 333 4455667',
    email: 'zahid.m@outlook.com',
    age: 65,
    gender: 'Male',
    address: 'Villa 109, Bahria Town, Phase 8',
    chronicConditions: ['Hyperlipidemia', 'Coronary Artery Disease'],
    allergies: [],
    insuranceProvider: 'State Life Gold Plan',
    policyNumber: 'SLIC-99201',
    totalSpent: 52100,
    lastVisitDate: '2026-08-21'
  },
  {
    id: 'cust-4',
    name: 'Sarah Farooq',
    phone: '+92 305 7766554',
    age: 29,
    gender: 'Female',
    chronicConditions: [],
    allergies: [],
    totalSpent: 8500,
    lastVisitDate: '2026-08-23'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'sale-1001',
    tenantId: 'tenant-1',
    invoiceNumber: 'INV-APX-2026-0089',
    date: '2026-08-23T10:15:00Z',
    customerId: 'cust-1',
    customerName: 'Muhammad Tariq',
    customerPhone: '+92 300 1234567',
    doctorName: 'Dr. Shahzad Mir (Consultant Diabetologist)',
    prescriptionNumber: 'RX-9921',
    items: [
      {
        id: 'si-1',
        medicineId: 'med-3',
        medicineName: 'Glucophage 500mg',
        genericName: 'Metformin Hydrochloride',
        batchId: 'bat-103',
        batchNumber: 'GLU23X-44',
        unitPrice: 240.00,
        quantity: 2,
        discountPercent: 5,
        taxAmount: 22.80,
        totalAmount: 478.80,
        dosageInstructions: '1 tablet twice daily with meals'
      },
      {
        id: 'si-2',
        medicineId: 'med-4',
        medicineName: 'Lipitor 20mg',
        genericName: 'Atorvastatin Calcium',
        batchId: 'bat-104',
        batchNumber: 'LIP24A-12',
        unitPrice: 780.00,
        quantity: 1,
        discountPercent: 5,
        taxAmount: 37.05,
        totalAmount: 778.05,
        dosageInstructions: '1 tablet at bedtime'
      }
    ],
    subtotal: 1260.00,
    discountTotal: 63.00,
    taxTotal: 59.85,
    grandTotal: 1256.85,
    paymentMethod: 'Insurance Co-Pay',
    insuranceDetails: {
      provider: 'Jubilee Life HealthCare',
      claimNumber: 'CLM-2026-8819',
      coPayPercent: 20
    },
    cashierId: 'usr-3',
    cashierName: 'Zubair Ahmed, Pharmacist',
    notes: 'Prescription verified. Patient advised on evening dosing.',
    status: 'completed'
  },
  {
    id: 'sale-1002',
    tenantId: 'tenant-1',
    invoiceNumber: 'INV-APX-2026-0090',
    date: '2026-08-23T11:40:00Z',
    customerName: 'Walk-in Customer (Sarah F.)',
    customerPhone: '+92 305 7766554',
    items: [
      {
        id: 'si-3',
        medicineId: 'med-2',
        medicineName: 'Panadol Extra',
        genericName: 'Paracetamol + Caffeine',
        batchId: 'bat-102',
        batchNumber: 'PAN24E-91',
        unitPrice: 95.00,
        quantity: 3,
        discountPercent: 0,
        taxAmount: 14.25,
        totalAmount: 299.25,
        dosageInstructions: '1-2 tablets SOS for headache'
      },
      {
        id: 'si-4',
        medicineId: 'med-12',
        medicineName: 'Cac-1000 Plus',
        genericName: 'Calcium Carbonate + Vitamin C, D3 & B6',
        batchId: 'bat-109',
        batchNumber: 'CAC24M-33',
        unitPrice: 460.00,
        quantity: 1,
        discountPercent: 0,
        taxAmount: 23.00,
        totalAmount: 483.00,
        dosageInstructions: '1 tablet dissolved in water daily'
      }
    ],
    subtotal: 745.00,
    discountTotal: 0.00,
    taxTotal: 37.25,
    grandTotal: 782.25,
    paymentMethod: 'Digital Wallet',
    cashierId: 'usr-2',
    cashierName: 'Dr. Adeel Tariq, PharmD',
    status: 'completed'
  },
  {
    id: 'sale-2001',
    tenantId: 'tenant-2',
    invoiceNumber: 'INV-GLH-2026-0144',
    date: '2026-08-23T09:20:00Z',
    customerId: 'cust-2',
    customerName: 'Amina Bibi',
    customerPhone: '+92 321 9876543',
    doctorName: 'Dr. Najeeb Ullah (Pulmonologist)',
    prescriptionNumber: 'RX-7718',
    items: [
      {
        id: 'si-5',
        medicineId: 'med-1',
        medicineName: 'Augmentin 625mg',
        genericName: 'Amoxicillin + Clavulanic Acid',
        batchId: 'bat-201',
        batchNumber: 'AUG24B-09',
        unitPrice: 510.00,
        quantity: 2,
        discountPercent: 5,
        taxAmount: 48.45,
        totalAmount: 1017.45,
        dosageInstructions: '1 tablet every 12 hours for 7 days'
      },
      {
        id: 'si-6',
        medicineId: 'med-10',
        medicineName: 'Rigix 10mg',
        genericName: 'Cetirizine Dihydrochloride',
        batchId: 'bat-205',
        batchNumber: 'RIG24R-01',
        unitPrice: 160.00,
        quantity: 1,
        discountPercent: 5,
        taxAmount: 7.60,
        totalAmount: 159.60,
        dosageInstructions: '1 tablet once daily at night'
      }
    ],
    subtotal: 1180.00,
    discountTotal: 59.00,
    taxTotal: 56.05,
    grandTotal: 1177.05,
    paymentMethod: 'Card',
    cashierId: 'usr-5',
    cashierName: 'Bilal Khan, Cashier',
    status: 'completed'
  },
  {
    id: 'sale-3001',
    tenantId: 'tenant-3',
    invoiceNumber: 'INV-ASW-2026-0045',
    date: '2026-08-23T14:10:00Z',
    customerName: 'Walk-in Hospital Referral',
    items: [
      {
        id: 'si-7',
        medicineId: 'med-9',
        medicineName: 'Lantus SoloStar Pen',
        genericName: 'Insulin Glargine',
        batchId: 'bat-303',
        batchNumber: 'LAN24Y-31',
        unitPrice: 3350.00,
        quantity: 1,
        discountPercent: 0,
        taxAmount: 167.50,
        totalAmount: 3517.50,
        dosageInstructions: 'Inject 18 units subcutaneously at 10 PM daily'
      },
      {
        id: 'si-8',
        medicineId: 'med-14',
        medicineName: 'Pedialyte Electrolyte Solution',
        genericName: 'Oral Rehydration Salts Liquid',
        batchId: 'bat-305',
        batchNumber: 'PED24Q-09',
        unitPrice: 310.00,
        quantity: 2,
        discountPercent: 0,
        taxAmount: 31.00,
        totalAmount: 651.00,
        dosageInstructions: 'Sip frequently throughout the day'
      }
    ],
    subtotal: 3970.00,
    discountTotal: 0.00,
    taxTotal: 198.50,
    grandTotal: 4168.50,
    paymentMethod: 'Cash',
    cashierId: 'usr-6',
    cashierName: 'Dr. Usman Khalid, M.Pharm',
    notes: 'Cold chain insulated bag provided.',
    status: 'completed'
  }
];

export const INITIAL_TRANSFERS: StockTransfer[] = [
  {
    id: 'tr-101',
    fromTenantId: 'tenant-2',
    fromTenantName: 'GreenLife Health Chemists - Northside',
    toTenantId: 'tenant-1',
    toTenantName: 'Apex Care Pharmacy - Downtown Hub',
    medicineId: 'med-3',
    medicineName: 'Glucophage 500mg (Metformin)',
    genericName: 'Metformin Hydrochloride',
    batchNumber: 'GLU24K-11',
    quantity: 40,
    status: 'pending',
    requestedDate: '2026-08-23T11:00:00Z',
    requestedBy: 'Dr. Adeel Tariq, PharmD',
    notes: 'Urgent stock shortage at Downtown Hub. Northside branch has 110 packs in surplus.'
  },
  {
    id: 'tr-102',
    fromTenantId: 'tenant-1',
    fromTenantName: 'Apex Care Pharmacy - Downtown Hub',
    toTenantId: 'tenant-3',
    toTenantName: 'Al-Shifa Wellness Pharmacy - Medical City',
    medicineId: 'med-12',
    medicineName: 'Cac-1000 Plus',
    genericName: 'Calcium Carbonate + Vitamin C, D3 & B6',
    batchNumber: 'CAC24M-33',
    quantity: 25,
    status: 'completed',
    requestedDate: '2026-08-21T15:30:00Z',
    completedDate: '2026-08-22T09:00:00Z',
    requestedBy: 'Dr. Usman Khalid, M.Pharm',
    notes: 'Dispatched via inter-branch courier. Received and inventoried.'
  }
];

export const INITIAL_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: 'po-101',
    tenantId: 'tenant-1',
    supplierId: 'sup-1',
    supplierName: 'GlaxoSmithKline (GSK) Distribution',
    orderNumber: 'PO-APX-2026-004',
    orderDate: '2026-08-22',
    expectedDate: '2026-08-25',
    status: 'ordered',
    items: [
      {
        medicineId: 'med-5',
        medicineName: 'Ventolin Evohaler',
        genericName: 'Salbutamol Sulfate',
        dosageForm: 'Inhaler',
        strength: '100mcg',
        quantity: 50,
        unitCost: 280.00,
        totalCost: 14000.00
      },
      {
        medicineId: 'med-1',
        medicineName: 'Augmentin 625mg',
        genericName: 'Amoxicillin + Clavulanic Acid',
        dosageForm: 'Tablet',
        strength: '500mg/125mg',
        quantity: 60,
        unitCost: 420.00,
        totalCost: 25200.00
      }
    ],
    totalAmount: 39200.00,
    notes: 'Regular replenishment batch for upcoming seasonal peak.'
  },
  {
    id: 'po-102',
    tenantId: 'tenant-3',
    supplierId: 'sup-1',
    supplierName: 'GlaxoSmithKline (GSK) Distribution',
    orderNumber: 'PO-ASW-2026-012',
    orderDate: '2026-08-23',
    expectedDate: '2026-08-26',
    status: 'draft',
    items: [
      {
        medicineId: 'med-15',
        medicineName: 'Dermovate Cream',
        genericName: 'Clobetasol Propionate',
        dosageForm: 'Ointment',
        strength: '0.05% w/w',
        quantity: 30,
        unitCost: 195.00,
        totalCost: 5850.00
      }
    ],
    totalAmount: 5850.00,
    notes: 'Critically low stock reorder.'
  }
];
