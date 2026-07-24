import "dotenv/config";
import mongoose from "mongoose";
import { Category } from "./src/models/category.model.js";
import { WebStory } from "./src/models/webstory.model.js";

const MONGODB_URI = process.env.MONGODB_URI;

const webStoriesData = [
  {
    title: "IPL 2026: टॉप 5 युवा खिलाड़ी जो इस सीजन मचाएंगे धमाल",
    categoryName: "क्रिकेट",
    image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80",
        title: "IPL 2026 की शुरुआत!",
        description: "22 मार्च से शुरू हो रहे क्रिकेट के सबसे बड़े महाकुंभ IPL 2026 पर पूरी दुनिया की नजरें हैं।",
        articleUrl: "https://publicasia.in/ipl-2026-schedule"
      },
      {
        image: "https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800&q=80",
        title: "1. यशस्वी जायसवाल",
        description: "राजस्थान रॉयल्स के इस विस्फोटक ओपनर से इस बार भी आतिशी पारियों की उम्मीद है।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1624526267942-ab0ff8a3e972?w=800&q=80",
        title: "2. शुभमन गिल",
        description: "गुजरात टाइटन्स के कप्तान गिल अपनी निरंतरता से ऑरेंज कैप के मजबूत दावेदार हैं।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80",
        title: "3. रिंकू सिंह",
        description: "कोलकाता नाइट राइडर्स के मैच फिनिशर रिंकू सिंह डेथ ओवरों के सबसे खतरनाक बल्लेबाज हैं।",
        articleUrl: "https://publicasia.in"
      }
    ]
  },
  {
    title: "iPhone 18 Pro: 5 सबसे बड़े AI फीचर्स जो देंगे नया अनुभव",
    categoryName: "टेक्नोलॉजी",
    image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&q=80",
        title: "Apple का नया फ्लैगशिप फोन!",
        description: "Apple ने अपना अब तक का सबसे एडवांस और पावरफुल iPhone 18 Pro पेश किया है।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80",
        title: "A20 Bionic AI चिप",
        description: "2-नैनोमीटर तकनीक पर आधारित चिपसेट, जो पलक झपकते ही ऑन-डिवाइस AI काम निपटाता है।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80",
        title: "108MP 3D फोटोग्राफी",
        description: "सिनेमैटिक 8K वीडियो रिकॉर्डिंग और ऑटो-फोकस ट्रैकिंग के साथ प्रोफेशनल कैमरा अनुभव।",
        articleUrl: "https://publicasia.in"
      }
    ]
  },
  {
    title: "गर्मियों में तरोताजा रहने के लिए 4 देसी हेल्थ ड्रिंक्स",
    categoryName: "लाइफस्टाइल",
    image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?w=800&q=80",
        title: "गर्मी से बचाव के ड्रिंक्स",
        description: "भीषण गर्मी में डिहाइड्रेशन से बचने के लिए ये देसी शरबत बहुत फायदेमंद हैं।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&q=80",
        title: "1. सत्तू का शरबत",
        description: "प्रोटीन से भरपूर सत्तू पेट को तुरंत ठंडा रखता है और ऊर्जा से भर देता है।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
        title: "2. आम पन्ना",
        description: "कच्चे आम का पन्ना लू से बचाता है और पाचन तंत्र को दुरुस्त रखता है।",
        articleUrl: "https://publicasia.in"
      }
    ]
  },
  {
    title: "सेंसेक्स 90,000 पार: जानिए शेयर बाजार में रिकॉर्ड तेजी के 3 बड़े कारण",
    categoryName: "बिजनेस",
    image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    slides: [
      {
        image: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
        title: "ऐतिहासिक ऊंचाई पर बाजार",
        description: "भारतीय शेयर बाजार का प्रमुख सूचकांक सेंसेक्स रिकॉर्ड 90,000 के पार पहुंच गया।",
        articleUrl: "https://publicasia.in"
      },
      {
        image: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&q=80",
        title: "मजबूत GDP ग्रोथ",
        description: "भारत की जीडीपी ग्रोथ दर 7.8% रही, जिससे विदेशी निवेशकों का भरोसा बढ़ा।",
        articleUrl: "https://publicasia.in"
      }
    ]
  }
];

async function seedWebStories() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Clear old webstories
    await WebStory.deleteMany({});
    console.log("🗑️  Cleared old web stories");

    // Fetch categories map
    const categories = await Category.find({});
    const catMap = {};
    categories.forEach(c => { catMap[c.name] = c._id; });

    let defaultCatId = categories[0]?._id;

    for (const story of webStoriesData) {
      const catId = catMap[story.categoryName] || defaultCatId;

      await WebStory.create({
        title: story.title,
        category: catId,
        image: story.image,
        status: "PUBLISHED",
        views: Math.floor(Math.random() * 2000) + 300,
        articleUrl: story.slides[0]?.articleUrl || "",
        slides: story.slides
      });
      console.log(`📸 Created WebStory: ${story.title}`);
    }

    console.log("\n🎉 WebStories Seeding Completed Successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err);
    process.exit(1);
  }
}

seedWebStories();
