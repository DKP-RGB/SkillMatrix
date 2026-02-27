# SkillMatrix 🕸️

**SkillMatrix** is a premium, AI-powered adaptive assessment platform designed for high-stakes technical evaluations and personalized skill development. It combines advanced proctoring technology with a sophisticated adaptive engine to deliver a secure, intelligent, and immersive testing experience.

## 🚀 Key Features

### 1. Adaptive Assessment Engine
- **Dynamic Scaling**: Questions adjust in real-time based on user performance (Accuracy, Time Taken, and Historical Data).
- **Multi-Category Support**: Seamlessly switch between **C**, **C++**, **JavaScript**, and **Python**.
- **Assessment Types**: Support for both **MCQ (Single Choice)** and **Code Writing** with real-time output verification.

### 2. AI-Driven Proctoring Suite
- **Real-time Detection**: Integrated camera proctoring using TensorFlow.js (COCO-SSD) to detect mobile phones and multiple people.
- **Integrity Tracking**: Monitors tab switching and focus loss with a "Trust Factor" warning system.
- **Graceful Termination**: Automated disqualification flow if a mobile device is detected for more than 10 seconds, ensuring system integrity.

### 3. Advanced Skill Matrix Analytics
- **Live Radar Chart**: A stable, alphabetically-sorted "Skill Matrix" that visualizes your proficiency across 10+ core computer science topics.
- **Expert Analysis**: AI-generated narrative insights identifying your "Strongest Pillars" and "Primary Growth Opportunities."
- **Activity Log**: Comprehensive history of recent assessments with precision-tracking and status reports.

### 4. Intelligent Reattempts
- **Context Persistence**: The system remembers your last-used language and assessment type for every individual topic.
- **Engine Warm-up**: A premium loading transition replaces legacy countdowns, featuring smooth progress bars and engine synchronization status.

## 🛠️ Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS (Vanilla CSS Architecture).
- **Animations**: Framer Motion (Glassmorphism & Micro-animations).
- **Backend/Database**: Supabase (PostgreSQL, Real-time Channels, Auth).
- **AI/ML**: TensorFlow.js, COCO-SSD (Computer Vision).
- **State Management**: React Context & Custom Hooks.

## 📂 Project Structure

- `/src/pages`: Core application views (Dashboard, Exam, Review, Login).
- `/src/analytics`: Custom hooks for real-time performance aggregation.
- `/src/utils`: Adaptive engine logic, proctoring algorithms, and anti-cheat initialization.
- `/src/components`: Premium UI components (RadarChart, AttemptingLayout, Steppers).
- `/src/data`: Question bank (500+ questions across multiple topics/difficulties).

## 🔧 Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Environment Setup**:
   Create a `.env` file with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_url
   VITE_SUPABASE_ANON_KEY=your_key
   ```
4. **Run Development Server**:
   ```bash
   npm run dev
   ```

## 🏆 Hackathon Ready
SkillMatrix is designed with a "Wow-Factor" first impression, utilizing vibrant gradients, dark-mode aesthetics, and a fluid, responsive layout optimized for full-width analytical displays.
