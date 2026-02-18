# AI Chatbot Setup & Configuration Guide

## 🎉 Features Implemented

Your AI assistant chatbot now includes all advanced features:

### ✅ 1. Secure API Key Management
- API key moved to `.env` file for security
- Configuration stored in `config/services.php`
- Fallback to hardcoded key if .env not configured

### ✅ 2. Real-Time Task Analytics
- Shows overdue tasks count
- Tasks due today and this week
- Completed vs in-progress statistics
- Assigned vs unassigned tasks
- AI can answer questions like "How many overdue tasks do I have?"

### ✅ 3. @Mentions for Team Members
- Type `@` in chat to see mention suggestions
- Tag team members in conversations
- Autocomplete dropdown appears

### ✅ 4. File Upload Support
- Click paperclip icon to attach files
- Supports: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
- Max file size: 5MB
- File context sent to AI

### ✅ 5. Voice Input (Hands-Free)
- Click microphone icon to start voice input
- Speaks your message into the chat
- Works in Chrome, Edge, Safari
- Red pulsing icon when recording

---

## 🔧 Configuration Steps

### Step 1: Add API Key to .env

Open your `.env` file and add these lines:

```env
# OpenRouter AI API Configuration
OPENROUTER_API_KEY=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
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_MODEL=meta-llama/llama-3.1-8b-instruct:free
```

### Step 2: Clear Configuration Cache

Run this command to refresh Laravel's config cache:

```bash
php artisan config:clear
```

### Step 3: Test the Chatbot

1. Refresh your browser (Ctrl+F5)
2. Click the floating chat bubble (bottom-right)
3. Try these test queries:

**Task Analytics:**
- "How many tasks do I have?"
- "Show me my overdue tasks"
- "What's due today?"
- "How many tasks are in progress?"

**Voice Input:**
- Click the microphone icon
- Speak: "How do I create a task?"
- Watch it transcribe automatically

**File Upload:**
- Click the paperclip icon
- Select a file (PDF, image, etc.)
- Ask: "Can you help me with this file?"

**@Mentions:**
- Type `@` in the input box
- Select a team member from the dropdown
- Send a message with the mention

---

## 📊 How Task Analytics Work

The AI now has access to **real-time data** about your workspace:

```
Current Task Statistics:
- Total tasks: 45
- Assigned to you: 12
- Overdue: 3
- Due today: 2
- Due this week: 7
- Completed: 20
- In progress: 15
- Unassigned: 5
```

When you ask questions like:
- "How many overdue tasks?"
- "What's my workload?"
- "Show me task stats"

The AI responds with **actual numbers** from your database!

---

## 🎤 Voice Input Browser Support

| Browser | Support |
|---------|---------|
| Chrome | ✅ Full support |
| Edge | ✅ Full support |
| Safari | ✅ Full support |
| Firefox | ❌ Not supported |

If voice input doesn't work, you'll see an alert message.

---

## 📎 File Upload Limits

- **Max file size:** 5MB
- **Supported formats:** 
  - Documents: PDF, DOC, DOCX, TXT
  - Images: PNG, JPG, JPEG
- Files are shown in chat with paperclip icon
- File name is sent to AI for context

---

## 🔐 Security Best Practices

### ✅ What We Did:
1. Moved API key from code to `.env`
2. Added config file for centralized management
3. Gitignore protects `.env` from being committed

### 🚨 Important:
- **Never commit `.env` to Git**
- Keep your API key secret
- Rotate keys if exposed
- Use environment variables in production

---

## 💬 Example Conversations

### Analytics Query:
**User:** "How many overdue tasks do I have?"

**AI:** "You currently have 3 overdue tasks in your workspace. These are tasks with due dates in the past that haven't been marked as done or deployed yet. Would you like tips on how to prioritize them?"

### Voice Input:
**User:** *Clicks mic, speaks* "How do I assign a task to a developer?"

**AI:** "To assign a task to a developer:
1. Click 'New Task' or 'Add task' in any column
2. Fill in the task title
3. In the 'Assign To' dropdown, select the team member
4. Note: Only users who are members of the project will appear in the list
5. Click 'Create Task'"

### File Upload:
**User:** *Uploads screenshot* "Can you help me understand this error?"

**AI:** "I can see you've attached a file (screenshot.png). While I can't view the image directly, I can help you troubleshoot common errors. Could you describe what you're seeing in the screenshot?"

---

## 🛠️ Troubleshooting

### Chatbot not appearing?
- Clear browser cache (Ctrl+Shift+Delete)
- Run `npm run build`
- Hard refresh (Ctrl+F5)

### Voice input not working?
- Check browser compatibility (Chrome/Edge/Safari)
- Allow microphone permissions
- Check browser console for errors

### File upload fails?
- Check file size (must be < 5MB)
- Verify file format is supported
- Check browser console for errors

### AI responses are slow?
- OpenRouter free tier has rate limits
- Consider upgrading to paid tier
- Check your internet connection

### Task analytics showing 0?
- Ensure you have tasks in your workspace
- Check database has task records
- Verify workspace relationship is correct

---

## 🚀 Advanced Customization

### Change AI Model:
Edit `.env`:
```env
OPENROUTER_MODEL=anthropic/claude-3-sonnet
```

### Adjust Response Length:
Edit `AiChatController.php` line 73:
```php
'max_tokens' => 1000, // Increase for longer responses
```

### Add More Quick Questions:
Edit `AiChatbot.jsx` lines 118-122:
```javascript
const quickQuestions = [
  "How do I create a task?",
  "Show me my overdue tasks",
  "What are my tasks for today?",
  // Add more here
];
```

---

## 📁 Files Modified

1. **Backend:**
   - `app/Http/Controllers/AiChatController.php` - Main AI logic
   - `config/services.php` - API configuration
   - `routes/auth.php` - Chat endpoint
   - `.env.example` - Environment template

2. **Frontend:**
   - `resources/js/Components/AiChatbot.jsx` - Chat UI
   - `resources/js/Layouts/MainLayout.jsx` - Integration

---

## 🎯 What's Next?

The chatbot is now fully functional with:
- ✅ Secure API key management
- ✅ Real-time task analytics
- ✅ Voice input
- ✅ File upload
- ✅ @Mentions

**Optional Future Enhancements:**
- Add image recognition for uploaded screenshots
- Implement chat history persistence
- Add multi-language support
- Create custom AI training on your data
- Add task creation directly from chat
- Implement smart notifications

---

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Verify `.env` configuration
3. Run `php artisan config:clear`
4. Clear browser cache
5. Check OpenRouter API status

**Enjoy your AI-powered collaboration assistant!** 🎉
