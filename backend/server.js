const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();


app.use(cors());
app.use(express.json());  // Enables parsing of JSON requests

// Connects to MongoDB database
mongoose
  .connect("mongodb://localhost:27017/cybersecurityDB")
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Connection Error:", err));

// User Schema
const UserSchema = new mongoose.Schema({
  username: String,  
  password: String, 
  points: { type: Number, default: 0 },  // User points the default number is 0
  quizResults: [   // Array to store quiz results for user
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

// all questions
const quizQuestions = [
  
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

// Study Materials content accessible with certain user points
const educationalMaterials = [
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

// this is the API Route for Fetching thr Questions
app.get("/questions", (req, res) => {
  res.json(quizQuestions); // Returns questions as JSON
});

// this is the API Route for Fetching Study Materials Based on User Points
app.get("/study-materials", (req, res) => {
  const userPoints = parseInt(req.query.points);  
  const availableMaterials = educationalMaterials.filter((material) => userPoints >= material.points_required);

  if (availableMaterials.length > 0) {
    res.json(availableMaterials);  
  } else {
    res.status(404).json({ message: "No materials available for the given points." });  // Return error to user if no materials available
  }
});

// this is the API Route for Fetching the User Data
app.get("/get-user", async (req, res) => {
  try {
    const { username } = req.query;  
    const user = await User.findOne({ username });  

    if (!user) {
      return res.status(404).json({ message: "User not found." });  // Return error if user is not found
    }

    res.json(user);  
  } catch (err) {
    res.status(500).json({ message: "Error fetching user." });  // this will Handle all database errors
  }
});

// this is the API Route for Updating the User Points
app.post("/update-points", async (req, res) => {
  try {
    const { username, points } = req.body;  
    const updatedUser = await User.findOneAndUpdate({ username }, { points }, { new: true });  

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });  // Returns error if user is not found
    }

    res.json(updatedUser);  
  } catch (err) {
    res.status(500).json({ message: "Error updating points." });  // this will Handle all database errors
  }
});

// this is the API Route for Resetting User Points
app.post("/reset-points", async (req, res) => {
  try {
    const { username } = req.body;  
    const updatedUser = await User.findOneAndUpdate({ username }, { points: 0 }, { new: true });  // Resets the user points to 0

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });  // Returns error if user is not found
    }

    res.json(updatedUser);  
  } catch (err) {
    res.status(500).json({ message: "Error resetting points." });  // this will Handle all database errors
  }
});

// this will Start the Server and Listen on Port 5000
app.listen(5000, () => console.log("✅ Server running on port 5000"));
