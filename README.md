# AI-Native Workflow Designer (Frontend)

**"Executable Business Process Design via Natural Language"**

> 🔗 **Paired Backend Repository:** [ai-workflow-designer-be](https://github.com/donnieyu/aicopilot_BE)  
> (This frontend requires the backend server to be running locally on port 8080)

AI-Native Workflow Designer is an AI-powered workflow modeler that helps users complete **Executable Process Definitions** through natural language and intuitive interactions without complex setups.

## 🚀 Project Overview

This project is a **Design Time** tool for defining and designing business processes, not a runtime where business logic is executed.

### Core Philosophy: "Seamless Co-Architect"

We define AI not merely as a generative tool but as a **'Co-Architect'** that designs systems together with the user.
When a user sets up the structure, the AI understands the context of the data, identifies logical gaps, offers suggestions, and simultaneously designs the data, UI, and logic.

## ✨ Key Features

* **⚡ Natural Language-Based Process Drafting (AI Drafting)**
    * Analyzes user requirements to automatically generate a structured step list.

* **🔄 Automatic Process Map Transformation (Auto-Transformation)**
    * Automatically converts list-based definitions into visual BPMN-based process maps.

* **🧠 Real-Time AI Suggestions (Smart Suggestion)**
    * Analyzes the context of the node currently being designed to recommend the next action and automatically suggest necessary data bindings.

* **🛡️ Real-Time Structure Analysis & Nudges (Real-time Audit)**
    * Detects logical errors (isolated nodes, missing required data, etc.) in the background and sends correction suggestions (Nudges) to the user.

* **🎨 AI-Based Form/Data Auto-Generation**
    * AI automatically designs the data models (Entities) and input forms (UI) required for the process.

* **🖼️ Image-Based Process Generation (Vision-Driven Generation)**
    * Upload a BPMN image or whiteboard photo, and AI analyzes it to convert it into a digital process.

## 🛠️ Tech Stack

### Core
* **Framework:** [React 18+](https://react.dev/)
* **Language:** [TypeScript](https://www.typescriptlang.org/)
* **Build Tool:** [Vite](https://vitejs.dev/)

### State Management & Data Fetching
* **Client State:** [Zustand](https://github.com/pmndrs/zustand) (Concise and powerful global state management)
* **Server State:** [TanStack Query (React Query)](https://tanstack.com/query/latest) (Server data synchronization and caching)

### UI & Visualization
* **Diagram:** [React Flow](https://reactflow.dev/) (Node-based workflow visualization)
* **Layout Engine:** [Dagre](https://github.com/dagrejs/dagre) (Automatic layout calculation)
* **Styling:** [Tailwind CSS](https://tailwindcss.com/) (Utility-first CSS framework)
* **Icons:** [Lucide React](https://lucide.dev/)

### HTTP Client
* **Axios:** API communication

## 📦 Installation & Execution (Getting Started)

### Prerequisites
* Node.js (v18 or higher recommended)
* npm or yarn

### 1. Clone Repository
```bash
git clone [https://github.com/your-username/ai-workflow-designer-fe.git](https://github.com/your-username/ai-workflow-designer-fe.git)
cd ai-workflow-designer-fe
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Run Development Server
```bash
npm run dev
# or
yarn dev
```
Open your browser and navigate to http://localhost:5173 to check.

### 4. Build (Production)
```bash
npm run build
```

## 📂 Project Structure
```
src/
├── api/                # API communication logic (client, endpoints)
├── assets/             # Static assets (images, icons, etc.)
├── components/         # Common UI components (Button, Modal, etc.)
├── features/
│   └── workflow/       # Workflow core features
│       ├── components/ # Workflow-specific components (Panel, Node, etc.)
│       └── nodes/      # React Flow custom node definitions
├── hooks/              # Custom Hooks (Business logic separation)
├── store/              # Zustand Store (Global state management)
│   └── slices/         # State logic separation (Slice Pattern applied)
├── types/              # TypeScript type definitions
└── utils/              # Utility functions (Graph, Layout, etc.)

```

## 📝 License

This project is licensed under the MIT License.
