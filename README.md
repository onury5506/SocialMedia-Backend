# 🌟 SocialMedia-Backend

A powerful, scalable backend for a multilingual, media-rich social media platform, built with **TypeScript**.

---

## 🙌 Acknowledgments

Special thanks to [gyizem](https://github.com/gyizem) for their invaluable contributions and support in developing this project! 🎉

---

## 🚀 Key Features

- ✅ User authentication & authorization  
- ✅ Create, update, delete posts and comments  
- ✅ Like, unlike, follow, unfollow, block, unblock  
- ✅ Real-time communication and notifications  
- ✅ Secure and efficient API design  
- ✅ Media upload & processing using **Google Cloud Platform (GCP)**  
- ✅ Video transcoding powered by **GCP Transcoder API**  
- ✅ Cloud CDN & Storage integration for performance and reliability  

---

## 🛠️ Tech Stack

- **NestJS**
- **TypeScript**
- **Socket.IO**
- **MongoDB**
- **JWT**
- **Google Cloud Platform (GCP)** services:
  - **Cloud Storage** – for storing media files  
  - **Cloud CDN** – for optimized content delivery  
  - **Cloud Translation API** – for cross-language content accessibility  
  - **Cloud Transcoder API** – for automatic video processing and scaling  

---

## 📦 Installation & Setup

1. **Clone the repository**  
   ```bash
   git clone https://github.com/onury5506/SocialMedia-Backend.git
   ```

2. **Navigate to the project directory**  
   ```bash
   cd SocialMedia-Backend
   ```

3. **Install dependencies**  
   ```bash
   npm install
   # or
   yarn install
   ```

4. **Configure environment variables**  
   Create a `.env` file in the root directory and set the following variables:
   ```env
   DATABASE_URL=your-database-url
   JWT_SECRET=your-jwt-secret
   GCP_STORAGE_BUCKET=your-gcp-storage-bucket
   GCP_CDN_URL=your-gcp-cdn-url
   CLOUD_TRANSLATION_API_KEY=your-cloud-translation-api-key
   GCP_TRANSCODER_API_KEY=your-gcp-transcoder-api-key
   PORT=5000
   ```

5. **Run the server**  
   ```bash
   npm run dev
   # or
   yarn dev
   ```

---

## 📱 Mobile App Integration

This backend is designed to work seamlessly with its companion [SocialMedia-Mobile](https://github.com/onury5506/SocialMedia-Mobile) app. The mobile app is built using **TypeScript** and provides a feature-rich frontend for users to experience the social media platform on their devices.

---
