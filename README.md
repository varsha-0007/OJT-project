👻 Time Rift Runner — README (Developer-Focused, Short Version)
-----------------------------------------------------------------------------
🚀 Overview

Time Rift Runner is a fast-paced browser survival game where the player evades ghost clones that replay their past movements. The game features 10 progression-based levels, dynamic UI transitions, dark/light theme switching, ghost-trail mechanics, and persistent high-score storage.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🎮 Features

⚡ Ghost Replay System — clones mimic your previous run path

🔓 Level Progression — unlock levels by beating your best time

🌓 Theme Toggle (Dark / Light mode)

🔊 Sound Toggle with Web Audio API

🧠 LocalStorage for saving best times & unlocked levels

📊 Sidebar High Scores

💠 Smooth Animations & Modern UI (neumorphism, gradients, soft glow)

🎯 Responsive Layout (works on mobile/tablet)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🛠 Tech Stack

HTML5

CSS (gradients, animations, responsive design)

JavaScript (Vanilla)
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

📂 Project Structure
/Time-Rift-Runner
│── index.html
│── style.css
│── script.js
└── assets/
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

▶️ How to Run

Clone the repo:

git clone https://github.com/yourname/time-rift-runner.git


Open index.html in any modern browser.

No build setup required — pure HTML/CSS/JS.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🧩 Gameplay

Move using WASD or Arrow Keys

Survive as long as possible

Ghosts appear based on your past movement

Better time = next level unlock
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

🔧 Developer Notes

Game world updates on a requestAnimationFrame loop

Ghost positions are stored & replayed per frame

Level configs are modular & easy to extend

UI screens switch via class toggles (hidden)

Scores stored in localStorage under:

timeRiftScores

timeRiftLevels
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

📜 License
This project is open-source under the **MIT License**.
------------------------------------------------------------------------------------------------------------------------------------------------------------------------------

Deployed link:
    https://vercel.com/varsha-narvis-projects-bbfce39b/ojt-project
