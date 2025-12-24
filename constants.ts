
import { Square, SquareType } from './types';

// Helper to create properties
const createProperty = (
  id: number,
  name: string,
  price: number,
  rent: number[], // [base, 1h, 2h, 3h, 4h, hotel]
  houseCost: number,
  colorGroup: string
): Square => ({
  id,
  name,
  type: SquareType.PROPERTY,
  price,
  rent,
  houseCost,
  colorGroup,
  ownerId: null,
  houses: 0,
  isMortgaged: false,
});

const createSpecial = (
  id: number,
  name: string,
  type: SquareType,
  price = 0
): Square => ({
  id,
  name,
  type,
  price,
  rent: [],
  houseCost: 0,
  colorGroup: 'transparent',
  ownerId: null,
  houses: 0,
  isMortgaged: false,
});

// Bengali Board Data
export const INITIAL_SQUARES: Square[] = [
  // BOTTOM ROW (Right to Left): 0 -> 10
  createSpecial(0, 'শুরু', SquareType.START),
  createProperty(1, 'পুরান ঢাকা', 60, [2, 10, 30, 90, 160, 250], 50, '#8B4513'), // Brown
  createSpecial(2, 'ভাগ্য পরীক্ষা', SquareType.COMMUNITY),
  createProperty(3, 'যাত্রাবাড়ী', 60, [4, 20, 60, 180, 320, 450], 50, '#8B4513'), // Brown
  createSpecial(4, 'আয়কর', SquareType.TAX, 200),
  createSpecial(5, 'কমলাপুর', SquareType.UTILITY, 200),
  createProperty(6, 'নিউ মার্কেট', 100, [6, 30, 90, 270, 400, 550], 50, '#87CEEB'), // Light Blue
  createSpecial(7, 'সুযোগ গ্রহণ', SquareType.CHANCE),
  createProperty(8, 'শাহবাগ', 100, [6, 30, 90, 270, 400, 550], 50, '#87CEEB'), // Light Blue
  createProperty(9, 'ফার্মগেট', 120, [8, 40, 100, 300, 450, 600], 50, '#87CEEB'), // Light Blue
  createSpecial(10, 'জেলখানা', SquareType.JAIL),

  // LEFT COLUMN (Bottom to Top): 11 -> 19
  createProperty(11, 'মিরপুর', 140, [10, 50, 150, 450, 625, 750], 100, '#DA70D6'), // Pink
  createSpecial(12, 'বিদ্যুৎ', SquareType.UTILITY, 150),
  createProperty(13, 'মোহাম্মদপুর', 140, [10, 50, 150, 450, 625, 750], 100, '#DA70D6'), // Pink
  createProperty(14, 'উত্তরা', 160, [12, 60, 180, 500, 700, 900], 100, '#DA70D6'), // Pink
  createSpecial(15, 'ময়মনসিংহ', SquareType.UTILITY, 200), // Renamed from Bimanbandar
  createProperty(16, 'গাজীপুর', 180, [14, 70, 200, 550, 750, 950], 100, '#FFA500'), // Orange
  createSpecial(17, 'ভাগ্য পরীক্ষা', SquareType.COMMUNITY),
  createProperty(18, 'সাভার', 180, [14, 70, 200, 550, 750, 950], 100, '#FFA500'), // Orange
  createProperty(19, 'বড় বাজার', 200, [16, 80, 220, 600, 800, 1000], 100, '#FFA500'), // Orange

  // TOP ROW (Left to Right): 20 -> 30
  createSpecial(20, 'বিশ্রাম', SquareType.CLUB),
  createProperty(21, 'বাটালী হিল', 220, [18, 90, 250, 700, 875, 1050], 150, '#FF0000'), // Red
  createSpecial(22, 'সুযোগ গ্রহণ', SquareType.CHANCE),
  createProperty(23, 'পাথর ঘাটা', 220, [18, 90, 250, 700, 875, 1050], 150, '#FF0000'), // Red
  createProperty(24, 'মেহেদি বাগ', 240, [20, 100, 300, 750, 925, 1100], 150, '#FF0000'), // Red
  createSpecial(25, 'সিলেট', SquareType.UTILITY, 200),
  createProperty(26, 'লালদিঘীর ময়দান', 260, [22, 110, 330, 800, 975, 1150], 150, '#FFFF00'), // Yellow
  createProperty(27, 'আগ্রাবাদ', 260, [22, 110, 330, 800, 975, 1150], 150, '#FFFF00'), // Yellow
  createSpecial(28, 'ওয়াসা', SquareType.UTILITY, 150),
  createProperty(29, 'কুশলী', 280, [24, 120, 360, 850, 1025, 1200], 150, '#FFFF00'), // Yellow
  createSpecial(30, 'জেলে যান', SquareType.GO_TO_JAIL),

  // RIGHT COLUMN (Top to Bottom): 31 -> 39
  createProperty(31, 'ওয়ারী', 300, [26, 130, 390, 900, 1100, 1275], 200, '#008000'), // Green
  createProperty(32, 'মতিঝিল', 300, [26, 130, 390, 900, 1100, 1275], 200, '#008000'), // Green
  createSpecial(33, 'ভাগ্য পরীক্ষা', SquareType.COMMUNITY),
  createProperty(34, 'ধানমন্ডি', 320, [28, 150, 450, 1000, 1200, 1400], 200, '#008000'), // Green
  createSpecial(35, 'চট্টগ্রাম', SquareType.UTILITY, 200),
  createSpecial(36, 'সুযোগ গ্রহণ', SquareType.CHANCE),
  createProperty(37, 'বনানী', 350, [35, 175, 500, 1100, 1300, 1500], 200, '#0000FF'), // Dark Blue
  createSpecial(38, ' কর পরিশোধ ', SquareType.TAX, 100), // Pay 100
  createProperty(39, 'গুলশান', 400, [50, 200, 600, 1400, 1700, 2000], 200, '#0000FF'), // Dark Blue
];

// 16 Cards for Chance (সুযোগ গ্রহণ)
export const CHANCE_CARDS = [
  { id: 1, text: "ব্যাংক থেকে লভ্যাংশ পেয়েছেন ৫০ টাকা।", amount: 50 },
  { id: 2, text: "দ্রুত গতির জন্য জরিমানা ১৫ টাকা।", amount: -15 },
  { id: 3, text: "শব্দজট প্রতিযোগিতায় জিতেছেন ১০০ টাকা।", amount: 100 },
  { id: 4, text: "ডাক্তারের ফি বাবদ ৫০ টাকা দিন।", amount: -50 },
  { id: 5, text: "আপনার জন্মদিন। উপহার ২০ টাকা।", amount: 20 },
  { id: 6, text: "৩ ঘর পিছিয়ে যান।", move: -3 },
  { id: 7, text: "মেরামত বাবদ ৪০ টাকা খরচ।", amount: -40 },
  { id: 8, text: "লটারি জিতেছেন! ২০০ টাকা সংগ্রহ করুন।", amount: 200 },
  { id: 9, text: "স্কুল ফি প্রদান করুন ১৫০ টাকা।", amount: -150 },
  { id: 10, text: "মদ্যপানের জন্য জরিমানা ২০ টাকা।", amount: -20 },
  { id: 11, text: "পুরান ঢাকা ভ্রমণে যান (যদি পাস করেন ২০০ পাবেন)।", move: 1 }, // Moves to ID 1 logic handled in app
  { id: 12, text: "সরাসরি জেলে যান।", action: "GOTOJAIL" },
  { id: 13, text: "জেল থেকে মুক্তির কার্ড।", action: "GETOUTOFJAIL" },
  { id: 14, text: "সব প্লেয়ারকে ১০ টাকা করে দিন।", action: "PAYALL10" },
  { id: 15, text: "শেয়ার বাজারে লাভ ১৫০ টাকা।", amount: 150 },
  { id: 16, text: "শুরু তে যান (২০০ টাকা সংগ্রহ করুন)।", move: 40 }, // Logic to wrap around handled in app
];

// 16 Cards for Community Chest (ভাগ্য পরীক্ষা)
export const COMMUNITY_CARDS = [
  { id: 1, text: "ডাক্তারের কাছে ভিজিট। ৫০ টাকা দিন।", amount: -50 },
  { id: 2, text: "ব্যাংক ভুল করে আপনাকে ২০০ টাকা দিয়েছে।", amount: 200 },
  { id: 3, text: "ইনকাম ট্যাক্স ফেরত পেয়েছেন ২০ টাকা।", amount: 20 },
  { id: 4, text: "জীবন বীমার মেয়াদ শেষ। ১০০ টাকা পাবেন।", amount: 100 },
  { id: 5, text: "হাসপাতালের বিল ১০০ টাকা দিন।", amount: -100 },
  { id: 6, text: "স্কলারশিপ পেয়েছেন ১০০ টাকা।", amount: 100 },
  { id: 7, text: "কনসালটেন্সি ফি ২৫ টাকা পেয়েছেন।", amount: 25 },
  { id: 8, text: "রাস্তা মেরামতের জন্য ৪০ টাকা দিন।", amount: -40 },
  { id: 9, text: "বিউটি পার্লারে খরচ ১০ টাকা।", amount: -10 },
  { id: 10, text: "পুরানো ঋণ আদায় ৫০ টাকা।", amount: 50 },
  { id: 11, text: "সরাসরি জেলে যান।", action: "GOTOJAIL" },
  { id: 12, text: "জেল থেকে মুক্তির কার্ড।", action: "GETOUTOFJAIL" },
  { id: 13, text: "জন্মদিনে সবার থেকে ১০ টাকা নিন।", action: "COLLECTALL10" },
  { id: 14, text: "সম্পত্তি বিক্রয় বাবদ ১০০ টাকা লাভ।", amount: 100 },
  { id: 15, text: "ছুটিতে যাওয়ার খরচ ১০০ টাকা।", amount: -100 },
  { id: 16, text: "শুরু তে ফিরে যান।", move: 40 },
];

export const PLAYER_COLORS = [
  { name: 'লাল', hex: '#ef4444', tailwind: 'bg-red-500' },
  { name: 'সবুজ', hex: '#22c55e', tailwind: 'bg-green-500' },
  { name: 'নীল', hex: '#3b82f6', tailwind: 'bg-blue-500' },
  { name: 'হলুদ', hex: '#eab308', tailwind: 'bg-yellow-500' },
];
