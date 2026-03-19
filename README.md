# Real-Time Collaboration Platform
A full-stack real-time collaboration platform where multiple users can work on a shared document simultaneously. Changes made by any user are instantly reflected across all connected users using WebSockets.

---------------------

## Problem Statement
This project is based on Problem Statement A – Real-time Collaboration Platform.
> Develop a platform where multiple users can edit a shared document in real-time, with features like authentication, document creation, editing, and saving. :contentReference[oaicite:0]{index=0}

----------------------

## Features --
User Authentication (Login/Register)  
Create & Edit Documents  
Real-time Collaboration (Socket.io)  
Live Updates Across Multiple Users  
Persistent Storage using MongoDB 

----------------------

## Tech Stack Used - 
Frontend - 
- React (Vite)
- Axios
- Context API (Auth Management)

Backend - 
- Node.js
- Express.js
- Socket.io (WebSockets)

Database - 
- MongoDB

--------------------------

## Setup Instructions

1️⃣ Clone the Repository - 
bash
git clone https://github.com/your-username/collab-platform.git
cd collab-platform

2️⃣ Install Dependencies -
Backend ->   cd backend
            npm install

Frontend ->  cd frontend
            npm install

3️⃣ Environment Setup - 
Create a .env file inside the backend folder:

           MONGO_URI=your_mongodb_connection_string
           JWT_SECRET=your_secret_key

4️⃣ Run the Project
Start Backend ->
          cd backend
          npm start
Start Frontend -> 
          cd frontend
          npm run dev

--------------------------

💡 Future Improvements

 * Version history & revert functionality
 * Rich text editor (like Google Docs)
 * Operational Transform / CRDT for better sync
 * User presence indicators (who is editing)
 * Deployment (Docker + Cloud)

 --------------------------

 👩‍💻 Contributors
    Kshama (https://github.com/Kshama0015)
    Neha Kumari  (https://github.com/NehaKumari897)
    Kanika Ekcoshiya  (https://github.com/Kanikaekcoshiya)
    lavanya   (https://github.com/lavanya074)


Deliverables - https://drive.google.com/file/d/1hsUNdUcaYQl0E8VB1NB6YSev5a9BA7fA/view?usp=sharing

------If you'd like to improve this project, feel free to fork the repository and submit a pull request.-------

