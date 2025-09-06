# 🐋 PlastixThinker - Professional AI Education Platform

A production-ready, AI-powered microplastics education platform that helps users learn about microplastics through intelligent conversations and document analysis.

## ✨ Features

- **🤖 AI-Powered Education**: Chat with PlastixThinker, a friendly AI environmental expert who teaches about microplastics
- **📚 Document Analysis**: Upload and analyze documents (PDF, TXT, CSV) with semantic search
- **🔍 Context-Aware Responses**: AI uses your uploaded documents to provide more accurate answers
- **👤 User Authentication**: Secure user registration, login, and session management
- **📊 Dataset Management**: Organize and manage your uploaded documents
- **🎯 Multiple AI Tones**: Choose between simple, scientific, or teen-friendly explanations
- **🔒 Production Security**: Rate limiting, input sanitization, security headers, and more

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ashishspurugulla/plastixtinker.git
cd plastixtinker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   # Edit .env with your OpenAI API key and other settings
   ```

4. **Start the server**
   ```bash
   npm start
   # Or for development with auto-reload:
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 🏗️ Architecture

### Directory Structure

```
plastixtinker/
├── src/                    # Source code
│   ├── config/            # Configuration files
│   ├── middleware/        # Express middleware
│   ├── routes/            # API route handlers
│   ├── services/          # Business logic services
│   ├── utils/             # Utility functions
│   └── server.js          # Main server file
├── public/                # Static frontend files
├── uploads/               # File upload directory
├── .env                   # Environment variables
├── package.json           # Dependencies and scripts
└── README.md             # This file
```

### Key Components

- **`src/config/config.js`**: Centralized configuration management
- **`src/services/database.js`**: Database operations and connection management
- **`src/services/openai.js`**: OpenAI API integration and AI operations
- **`src/services/fileProcessor.js`**: Document processing and embedding generation
- **`src/middleware/`**: Authentication, security, and error handling middleware
- **`src/routes/`**: Organized API endpoints by functionality

## 🔧 Configuration

### Environment Variables

Create a `.env` file based on `env.example`:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
SESSION_SECRET=your_session_secret_here

# Optional (with defaults)
NODE_ENV=development
PORT=3000
OPENAI_MODEL=gpt-4o
RATE_LIMIT_MAX=100
```

### Security Features

- **Rate Limiting**: Prevents API abuse
- **Input Sanitization**: Protects against XSS and injection attacks
- **Security Headers**: Helmet.js for comprehensive security
- **CORS Protection**: Configurable cross-origin resource sharing
- **Session Security**: Secure session management with SQLite store

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/check-auth` - Check authentication status

### Datasets
- `POST /api/datasets/upload-dataset` - Upload and process dataset
- `GET /api/datasets` - Get user datasets
- `DELETE /api/datasets/remove-dataset/:id` - Remove dataset

### AI Chat
- `POST /api/ai/ask` - Ask AI with optional context
- `POST /api/ai/chat` - Chat with AI
- `GET /api/ai/status` - Check AI service status

### Legacy Support
- `POST /ask` - Legacy ask endpoint (maintained for backward compatibility)

## 🛠️ Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run lint       # Run ESLint
npm run format     # Format code with Prettier
npm run setup      # Install dependencies and setup
```

### Code Quality

- **ESLint**: Code linting and style enforcement
- **Prettier**: Automatic code formatting
- **Modular Structure**: Clean separation of concerns
- **Error Handling**: Comprehensive error handling and logging
- **Async/Await**: Modern JavaScript patterns throughout

## 🔒 Security Considerations

- **Input Validation**: All user inputs are validated and sanitized
- **Rate Limiting**: Prevents brute force and abuse attacks
- **Session Security**: Secure session configuration with proper cookies
- **File Upload Security**: File type and size validation
- **SQL Injection Protection**: Parameterized queries throughout
- **XSS Protection**: Input sanitization and security headers

## 📊 Performance Features

- **Async Operations**: Non-blocking file processing
- **Database Indexing**: Optimized database queries
- **Efficient File Handling**: Streamlined document processing
- **Memory Management**: Proper cleanup of temporary files
- **Connection Pooling**: Optimized database connections

## 🚀 Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `SESSION_SECRET`
3. Configure `ALLOWED_ORIGINS` for CORS
4. Set up proper logging and monitoring
5. Use HTTPS in production

### Recommended Hosting

- **Vercel**: Easy deployment with serverless functions
- **Railway**: Simple containerized deployment
- **Heroku**: Traditional hosting with add-ons
- **DigitalOcean**: VPS with full control

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- OpenAI for providing the AI capabilities
- Express.js community for the excellent framework
- SQLite for lightweight database solution

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/ashishspurugulla/plastixtinker/issues) page
2. Create a new issue with detailed information
3. Include your environment details and error logs

---

**Made with ❤️ for ocean conservation education**
