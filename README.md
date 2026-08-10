# 🎓 CBTify.ai

### AI-Powered Document-to-CBT Examination Platform

> Transform PDFs, images, scanned notes, and question papers into interactive Computer-Based Tests with AI-powered question generation, automated evaluation, and detailed performance analytics.

---

## 🔗 Live Demo & Project Links

| Resource | Link |
|---|---|
| 🌐 **Live Prototype** https://cbtifyai.vercel.app/
| 🎥 **Demo Video** https://youtu.be/8j4DMaJDMuI 
| 📄 **Sample Test Material** https://drive.google.com/file/d/1n5I2bj__BvIHCsJq8Z2b2gnxqw-mjsmn/view?usp=sharing
| 💻 **GitHub Repository** https://github.com/bhanu-1108/cbtifyai-final

### 🧪 Quick Prototype Test

You can test the complete workflow:

**1.** Download the sample PDF  
**2.** Open the live prototype  
**3.** Upload the PDF/Image  
**4.** Generate the CBT  
**5.** Attempt the examination  
**6.** View the results and analytics  

### 🏫 Institution Demo

For the institution workflow:

**Institution Login → Upload Material → Generate CBT → Create Shareable Link → Student Login → Attempt Test → Institution Analytics**

---

## 🎥 Project Demonstration

Watch the complete 6–8 minute demonstration:

**[▶️ Watch CBTify.ai Full Demo](https://youtu.be/8j4DMaJDMuI )**

The video demonstrates:

- 📄 PDF/Image upload
- 🔍 OCR and document processing
- 🤖 AI question generation
- 📝 CBT generation
- ⏱️ Timed examination
- 📊 Student analytics
- 🏫 Institution workflow
- 🔗 Shareable examination links
- 👨‍🎓 Student attempt
- 📈 Individual and class-level performance analysis

- ## ✨ Key Features

### 🤖 AI-Powered CBT Generation
- Convert PDFs, JPGs, PNGs, scanned notes, and question papers into CBT examinations.
- Automatically generate structured MCQs from uploaded study material.
- Generate 4 options, correct answers, explanations, topics, and difficulty levels.
- Classify questions using Bloom's Taxonomy.

### 📄 Intelligent Document Processing
- Supports both text-based and scanned PDFs.
- Uses PyMuPDF for fast text extraction from digital PDFs.
- Uses PaddleOCR for scanned documents and images.
- Automatically cleans OCR noise, headers, footers, and page numbers.
- Paragraph-aware text chunking for better AI processing.

### 🧠 Smart Question Validation
- Validates AI-generated questions before storing them.
- Ensures exactly four unique options.
- Checks correct-answer validity.
- Removes duplicate questions.
- Ensures required explanations and classifications are present.

### 📝 Interactive CBT Examination
- Real-time countdown timer.
- Question navigation palette.
- Flag questions for later review.
- Automatic submission when time expires.
- Instant automated grading.
- Question-wise answer review with explanations.

### 👨‍🎓 Student Dashboard
- Track total tests taken.
- Monitor average accuracy.
- Track time spent on examinations.
- View improvement rate.
- Access previous attempts.
- Analyze topic-wise and difficulty-wise performance.

### 🏫 Institution Portal
- Upload study material and automatically create examinations.
- Generate shareable examination links.
- Share tests with registered students.
- Manage student rosters.
- Schedule examinations.
- Track individual student performance.
- Analyze overall class performance.

### 📊 Advanced Analytics
- Individual student performance analysis.
- Class-level performance insights.
- Topic-wise performance.
- Easy/Medium/Hard performance breakdown.
- Bloom's Taxonomy skill analysis.
- Question error-rate analysis.
- Student leaderboard and performance comparison.

### 🔐 Examination Integrity
- Secure authentication and role-based access.
- Timed examinations.
- Window-focus monitoring.
- Tab-switch / blur event detection.
- Controlled examination access.

### ⚡ Modular AI Architecture
- React + Vite frontend.
- Node.js + Express backend.
- Python FastAPI OCR microservice.
- PaddleOCR document processing.
- Qwen2.5-7B-Instruct through Hugging Face.
- MongoDB Atlas for persistent data storage.
- Independent AI/OCR services for easier maintenance and scaling.
