# ReplyAI

**ReplyAI** is a web-based application that connects to the **Telegram API** (not the Bot API) and integrates with **OpenAI GPT**. It automates replies in specific Telegram chats when you're offline, with a simple and intuitive web interface built on **Next.js**.

---

## Features
- **Telegram Integration**: Poll messages and send automated replies in selected chats.
- **AI-Powered Replies**: Use OpenAI's GPT models to craft intelligent responses.
- **Web Dashboard**: Control chat settings and monitor activity via a sleek frontend.

---

## Technologies Used
### Backend
- **Node.js** and **TypeScript**
- **Express** for API handling
- **Prisma** for database management
- **GramJS** for Telegram API interactions
- **OpenAI API** for AI-generated responses

### Frontend
- **Next.js** for React-based server-side rendering
- **TypeScript** for strong typing
- **Axios** for API communication

---

## Project Structure

Project Structure
Root Directory
backend/
Contains the backend service code.

src/: Source code directory
services/: Logic for Telegram, OpenAI, and database operations
api/: REST API route handlers
tasks/: Background tasks like polling Telegram
package.json: Backend-specific dependencies
tsconfig.json: TypeScript configuration for the backend
frontend/
Contains the frontend service code.

src/: Source code directory
pages/: Next.js pages
components/: Reusable UI components
package.json: Frontend-specific dependencies
tsconfig.json: TypeScript configuration for the frontend
Additional Files
.gitignore: Files and folders to ignore in Git
README.md: Project documentation

---

## Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **Yarn**
- Telegram API credentials (API ID and API Hash)
- OpenAI API Key

---

### Steps to Set Up

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/your-username/telegpt.git
   cd telegpt
