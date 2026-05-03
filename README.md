# ✨ re-marking

Master your habits, one day at a time. **re-marking** is a premium, offline-first task management and habit-tracking application built with modern web technologies. It focuses on privacy, organization, and visual excellence.

![Screenshot Placeholder](https://via.placeholder.com/1200x600?text=Re-marking+Premium+UI)

## 🚀 Key Features

-   **💎 Premium Glassmorphism UI:** A stunning, modern interface with smooth gradients, frosted glass effects, and high-end animations.
-   **📅 Timeline View:** Organize your history and active tasks with a beautiful, scannable timeline.
-   **🔄 Range Mode:** Add tasks across multiple days instantly. Perfect for setting up routines and habit streaks.
-   **🎯 Smart Tracking:** Differentiate between tasks completed early ("Excellent!") or late ("Aim Higher!") with personalized feedback badges.
-   **⏰ Backdating Support:** Forget to mark a task? Easily specify the actual completion date for accurate history.
-   **🔔 Future Task Protection:** Safety prompts prevent you from accidentally closing tasks planned for future dates.
-   **🔒 Privacy First:** 100% offline. All data is stored locally in your browser via IndexedDB. Your data never leaves your device.
-   **🔥 Streak System:** Stay motivated with a built-in day streak counter that tracks your daily activity.

## 📖 How to Use

### Adding Tasks
1. Type your task in the input field.
2. Click the **Date (Optional)** field to pick a date. If you pick a date, a **Time** picker will appear.
3. Click **Add** to save.

### Using Range Mode
1. Click the **Add Range** button next to the input.
2. Select a **Start Date** and an **End Date**.
3. Click **Add** to create the same task for every day in that range.

### Completing Tasks
- Click the **Circle icon** next to a task to mark it as done.
- If it's a **Future Task**, you'll be asked to confirm.
- If it's a **Late Task**, you can choose to mark it as finished "Today" or pick an earlier date from the calendar.

### Managing History
- Click the **View Task History** button at the bottom of the home screen.
- Tasks are grouped by date, showing your completion trends and "Off Schedule" badges.

## 🛠️ Tech Stack

-   **Frontend:** [React](https://reactjs.org/) + [TypeScript](https://www.typescriptlang.org/)
-   **Bundler:** [Vite](https://vitejs.dev/)
-   **Database:** [Dexie.js](https://dexie.org/) (IndexedDB wrapper)
-   **Styling:** Vanilla CSS (Modern Custom Properties)
-   **Icons:** [Lucide React](https://lucide.dev/)
-   **DatePicker:** [React DatePicker](https://reactdatepicker.com/)

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/YOUR_USERNAME/re-marking.git
    cd re-marking
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run locally:**
    ```bash
    npm run dev
    ```

4.  **Build for production:**
    ```bash
    npm run build
    ```

## 🌐 Deployment

This project is configured for easy deployment to **GitHub Pages** via GitHub Actions. Simply push your code to the `main` branch, and the included workflow will handle the rest!

## 🛡️ Privacy & Security

**re-marking** is designed with zero-cost and maximum privacy in mind:
-   No account required.
-   No external servers or cloud databases.
-   No tracking or analytics.
-   Data is stored using [IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API), making it completely offline-capable.

---
Built with ❤️ by SaFz
