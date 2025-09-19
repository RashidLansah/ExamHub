# 🎓 TATU Exams Timetable Checker

A comprehensive exam timetable management system for Tamale Technical University, featuring both student and admin interfaces.

## ✨ Features

### 🎯 **Student View**
- **Beautiful Timetable Interface** - Clean, modern design with gradient backgrounds
- **Advanced Filtering** - Search by course, programme, level, date, time, venue, and days
- **Personal Shortlist** - Save important exams to "My Exams" for quick access
- **Responsive Design** - Works perfectly on all devices
- **Print Support** - Print-friendly timetable layout
- **Real-time Updates** - See changes immediately when admin updates

### 🔧 **Admin Panel**
- **Secure Login** - Protected admin access for exam officers
- **CRUD Operations** - Create, Read, Update, Delete exams
- **Bulk Management** - Manage all exams from one dashboard
- **Data Validation** - Form validation with error handling
- **Statistics Dashboard** - Overview of total exams, days, programmes, and venues
- **Share Functionality** - Easy sharing of timetable URL with students

## 🚀 **Quick Start**

### 1. **Installation**
```bash
npm install
npm run dev
```

### 2. **Access the Application**
- **Student View**: `http://localhost:5173/`
- **Admin Panel**: `http://localhost:5173/admin`

### 3. **Admin Login**
- **Username**: `exam_officer`
- **Password**: `tatu2024`

## 📱 **How to Use**

### **For Students:**
1. **View Timetable** - Browse all exams organized by date
2. **Filter Exams** - Use the search bar and filters to find specific exams
3. **Save Exams** - Click the star icon to save important exams
4. **Access Shortlist** - Click "My Exams" to view saved exams
5. **Print Timetable** - Use the print button for offline access

### **For Exam Officers:**
1. **Login** - Access admin panel with credentials
2. **Add Exams** - Click "Add Exam" to create new exam entries
3. **Edit Exams** - Click "Edit" on any exam to modify details
4. **Delete Exams** - Remove exams with confirmation dialog
5. **Share Timetable** - Copy the public URL to share with students
6. **Monitor Statistics** - View overview of all exam data

## 🏗️ **System Architecture**

```
src/
├── components/
│   ├── ui/                 # Reusable UI components
│   ├── admin/              # Admin-specific components
│   ├── Filters.jsx         # Student filter interface
│   ├── ExamCard.jsx        # Individual exam display
│   ├── DaySection.jsx      # Date-grouped exam sections
│   ├── Header.jsx          # Application header
│   └── EmptyState.jsx      # No results state
├── pages/
│   ├── Home.jsx            # Student timetable view
│   └── Admin.jsx           # Admin management interface
├── lib/
│   ├── utils.js            # Utility functions
│   └── filters.js          # Filtering logic
└── data/
    └── exams.json          # Sample exam data
```

## 🎨 **UI Components**

- **Button** - Multiple variants (default, outline, secondary, etc.)
- **Card** - Flexible card layouts with headers and content
- **Badge** - Status indicators and labels
- **Input** - Form inputs with validation states
- **Select** - Dropdown selectors
- **Dialog** - Modal dialogs for forms
- **Sheet** - Side panel for additional content

## 🔐 **Security Features**

- **Admin Authentication** - Protected admin routes
- **Session Management** - Persistent login state
- **Data Validation** - Form input validation
- **Confirmation Dialogs** - Safe deletion operations

## 📊 **Data Management**

- **Local Storage** - Persistent data storage
- **Real-time Updates** - Immediate UI updates
- **Data Export** - Easy sharing and backup
- **Validation** - Data integrity checks

## 🌐 **Deployment**

### **Production Build**
```bash
npm run build
```

### **Environment Variables**
- No external dependencies required
- All data stored locally
- Easy to deploy to any hosting service

## 🔧 **Customization**

### **Adding New Programmes**
Edit the programmes array in `ExamForm.jsx`:
```javascript
const programmes = [
  "Computer Science",
  "Mathematics",
  // Add new programmes here
]
```

### **Adding New Venues**
Edit the venues array in `ExamForm.jsx`:
```javascript
const venues = [
  "Main Auditorium",
  "Science Block A",
  // Add new venues here
]
```

### **Styling Changes**
- Modify Tailwind CSS classes in components
- Update color schemes in `index.css`
- Customize gradients and shadows

## 📱 **Responsive Design**

- **Mobile First** - Optimized for mobile devices
- **Tablet Support** - Responsive grid layouts
- **Desktop Experience** - Full-featured desktop interface
- **Touch Friendly** - Optimized for touch interactions

## 🚀 **Future Enhancements**

- **Database Integration** - Replace localStorage with real database
- **User Management** - Multiple admin accounts
- **Notification System** - Exam reminders and updates
- **API Integration** - Connect with existing university systems
- **Multi-language Support** - Localization for different regions
- **Advanced Analytics** - Detailed exam statistics and reports

## 🤝 **Contributing**

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 **License**

This project is open source and available under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## 📞 **Support**

For technical support or feature requests, please contact the development team.

---

**Built with ❤️ for Tamale Technical University**
