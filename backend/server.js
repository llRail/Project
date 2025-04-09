const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect("mongodb://localhost:27017/cybersecurityDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// ✅ User Schema
const UserSchema = new mongoose.Schema({
  username: String,
  password: String,
  points: { type: Number, default: 0 },
  quizResults: [
    {
      questionText: String,
      userAnswer: String,
      correctAnswer: String,
      isCorrect: Boolean,
      explanation: String,
    },
  ],
});

const User = mongoose.model("User", UserSchema);

// ✅ Questions Database (Updated with 10 Questions)
const questions = [
  // Easy questions
  {
    question_text: "What does HTTPS stand for?",
    options: [
      "Hyper Text Transfer Protocol",
      "Hyper Text Transfer Protocol Secure",
      "Hyper Terminal Transfer Protocol",
    ],
    correct_answer: "Hyper Text Transfer Protocol Secure",
    difficulty: "Easy",
    type: "Multiple Choice",
  },
  {
    question_text: "A strong password should include letters, numbers, and symbols.",
    options: ["True", "False"],
    correct_answer: "True",
    difficulty: "Easy",
    type: "True/False",
  },

  // Medium questions
  {
    question_text: "Which of the following is a form of phishing?",
    options: [
      "Sending malicious links via email",
      "Brute force attacks",
      "Installing a firewall",
      "Creating a VPN",
    ],
    correct_answer: "Sending malicious links via email",
    difficulty: "Medium",
    type: "Multiple Choice",
  },
  {
    question_text: "Antivirus software is enough to fully protect your system.",
    options: ["True", "False"],
    correct_answer: "False",
    difficulty: "Medium",
    type: "True/False",
  },

  // Hard questions
  {
    question_text: "Which of these encryption methods is considered the most secure?",
    options: ["AES-256", "RSA-512", "MD5", "SHA-1"],
    correct_answer: "AES-256",
    difficulty: "Hard",
    type: "Multiple Choice",
  },
  {
    question_text: "Multi-Factor Authentication (MFA) is a security risk.",
    options: ["True", "False"],
    correct_answer: "False",
    difficulty: "Hard",
    type: "True/False",
  },

  // **Updated Image-Based Question**
  {
    question_text: "Which of the following websites is a phishing site? (Click on the correct link)",
    image_url: "https://example.com/phishing-screenshot.jpg", // URL of the image
    options: [
      "http://example1.com",
      "http://example2.com",
      "http://example3.com",
    ],
    correct_answer: "http://example1.com",
    difficulty: "Medium",
    type: "Image-Based",
  },

  // Drag-and-drop question
  {
    question_text: "Drag the terms to the appropriate category.",
    options: {
      "Phishing": ["Malicious Email", "Suspicious Link"],
      "Security": ["Strong Password", "Two-Factor Authentication"],
    },
    correct_answer: {
      "Phishing": ["Malicious Email", "Suspicious Link"],
      "Security": ["Strong Password", "Two-Factor Authentication"],
    },
    difficulty: "Hard",
    type: "Drag-and-Drop",
  },

  // Scenario-based question
  {
    question_text: "You receive an email asking for your login credentials. What should you do?",
    options: [
      "Click the link and enter your details",
      "Delete the email and report it as phishing",
      "Ignore the email",
    ],
    correct_answer: "Delete the email and report it as phishing",
    difficulty: "Medium",
    type: "Scenario-Based",
  },

  // True/False Question (Already added)
  {
    question_text: "Multi-Factor Authentication (MFA) is a security risk.",
    options: ["True", "False"],
    correct_answer: "False",
    difficulty: "Hard",
    type: "True/False",
  },

  // Additional Question (e.g., Cybersecurity Best Practices)
  {
    question_text: "Which of the following is a best practice for creating strong passwords?",
    options: [
      "Use your name and birthdate",
      "Use at least 12 characters, including letters, numbers, and special characters",
      "Use the same password for all your accounts",
    ],
    correct_answer: "Use at least 12 characters, including letters, numbers, and special characters",
    difficulty: "Medium",
    type: "Multiple Choice",
  },
];

// ✅ Study Materials
const studyMaterials = [
  {
    points_required: 0,
    title: "Introduction to Cybersecurity",
    content: "Learn the basics of cybersecurity, including common threats and best practices.",
    description: "Cybersecurity is the practice of protecting systems, networks, and programs from digital attacks.",
    keyTakeaways: "Understanding malware, phishing, and strong password management.",
  },
  {
    points_required: 10,
    title: "Phishing Attacks and Prevention",
    content: "Learn how phishing works and how to avoid falling victim to scams.",
    description: "Phishing is an attack where cybercriminals impersonate legitimate entities to steal sensitive information.",
    keyTakeaways: "Recognizing phishing emails, using spam filters, and never clicking unknown links.",
  },
  {
    points_required: 20,
    title: "Advanced Encryption Techniques",
    content: "A deep dive into encryption methods like AES-256 and RSA.",
    description: "Encryption is a method used to protect data by converting it into an unreadable format.",
    keyTakeaways: "AES-256 is widely used for its high security, RSA is common for secure communications.",
  },
];

// ✅ API Routes
app.get("/questions", (req, res) => {
  res.json(questions);
});

app.get("/study-materials", (req, res) => {
  const userPoints = parseInt(req.query.points);
  const availableMaterials = studyMaterials.filter((material) => userPoints >= material.points_required);

  if (availableMaterials.length > 0) {
    res.json(availableMaterials);
  } else {
    res.status(404).json({ message: "No materials available for the given points." });
  }
});

// ✅ User Routes
app.get("/get-user", async (req, res) => {
  try {
    const { username } = req.query;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user." });
  }
});

app.post("/update-points", async (req, res) => {
  try {
    const { username, points } = req.body;
    const updatedUser = await User.findOneAndUpdate({ username }, { points }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error updating points." });
  }
});

app.post("/reset-points", async (req, res) => {
  try {
    const { username } = req.body;
    const updatedUser = await User.findOneAndUpdate({ username }, { points: 0 }, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(updatedUser);
  } catch (err) {
    res.status(500).json({ message: "Error resetting points." });
  }
});

// ✅ Start Server
app.listen(5000, () => console.log("✅ Server running on port 5000"));
