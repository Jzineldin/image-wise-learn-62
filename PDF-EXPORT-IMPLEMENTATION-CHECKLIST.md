# Printable PDFs - Implementation Checklist

**Goal:** Add PDF export functionality to Tale Forge
**Estimated Time:** 4 hours
**Status:** ✅ COMPLETE - Ready for Testing

---

## ✅ STEP-BY-STEP CHECKLIST

### **Phase 1: Setup (15 minutes)** ✅ COMPLETE

- [x] **Task 1.1:** Install html2pdf.js package
  - Command: `npm install html2pdf.js` ✅
  - Command: `npm install --save-dev @types/html2pdf.js` ✅

- [x] **Task 1.2:** Verify installation
  - Check `package.json` for `html2pdf.js` entry ✅
  - Check `node_modules` folder contains the package ✅

---

### **Phase 2: Create PDF Export Utility (45 minutes)** ✅ COMPLETE

- [x] **Task 2.1:** Create utility file
  - File: `src/lib/pdf-export.ts` ✅
  - Purpose: Contains PDF generation logic ✅

- [x] **Task 2.2:** Write PDF export function
  - Function: `exportStoryToPDF()` ✅
  - Inputs: story title, segments array ✅
  - Output: Downloads PDF file ✅

- [x] **Task 2.3:** Add error handling
  - Try/catch blocks ✅
  - Proper error messages ✅
  - Fallback behavior ✅

---

### **Phase 3: Find StoryViewer Component (15 minutes)** ✅ COMPLETE

- [x] **Task 3.1:** Locate StoryViewer component
  - Search for: `StoryViewer.tsx` or `story-viewer.tsx` ✅
  - Found at: `src/pages/StoryViewer.tsx` ✅

- [x] **Task 3.2:** Understand current structure
  - Find where story data is loaded ✅
  - Find where segments are displayed ✅
  - Identify button placement area ✅

---

### **Phase 4: Add Export Button to UI (1 hour)** ✅ COMPLETE

- [x] **Task 4.1:** Import PDF export utility
  - Add: `import { exportStoryToPDF } from '@/lib/pdf-export';` ✅

- [x] **Task 4.2:** Add loading state
  - Add: `const [isExportingPDF, setIsExportingPDF] = useState(false);` ✅

- [x] **Task 4.3:** Create export handler function
  - Function: `handleExportPDF()` ✅
  - Includes loading state management ✅
  - Includes error handling ✅
  - Shows toast notifications ✅

- [x] **Task 4.4:** Add Export PDF button to UI
  - Place near other action buttons (in StoryControls) ✅
  - Show loading state when exporting ✅
  - Disable when no segments or already exporting ✅

---

### **Phase 5: Testing (1 hour)** ⏳ READY FOR TESTING

- [ ] **Task 5.1:** Test with short story (3-5 segments)
  - Create or find a short story
  - Click "Export PDF" button
  - Verify PDF downloads
  - Open PDF and check content

- [ ] **Task 5.2:** Test with long story (10+ segments)
  - Create or find a long story
  - Click "Export PDF" button
  - Verify PDF downloads
  - Check all segments are included

- [ ] **Task 5.3:** Test error cases
  - Try exporting story with no segments
  - Try exporting while story is generating
  - Verify error messages display correctly

- [ ] **Task 5.4:** Test on different devices
  - Test on desktop browser
  - Test on mobile browser (if possible)
  - Verify PDF opens correctly

**See `PDF-EXPORT-TESTING-GUIDE.md` for detailed testing instructions!**

---

### **Phase 6: Polish & Finalize (30 minutes)**

- [ ] **Task 6.1:** Improve PDF styling
  - Check font sizes
  - Check margins and spacing
  - Ensure readability

- [ ] **Task 6.2:** Add Tale Forge branding
  - Add footer with "Created with Tale Forge"
  - Add tale-forge.app link

- [ ] **Task 6.3:** Test filename generation
  - Verify story title is used in filename
  - Check special characters are handled
  - Ensure no file naming conflicts

- [ ] **Task 6.4:** Final verification
  - Export 3 different stories
  - Verify all work correctly
  - Check for any console errors

---

## 📋 FILES TO CREATE/MODIFY

### **New Files:**
1. `src/lib/pdf-export.ts` - PDF generation utility

### **Modified Files:**
1. `src/pages/StoryViewer.tsx` (or wherever StoryViewer is located)
   - Add import
   - Add state
   - Add handler function
   - Add button

---

## 🔧 COMMANDS TO RUN

```bash
# 1. Install dependencies
npm install html2pdf.js
npm install --save-dev @types/html2pdf.js

# 2. Start dev server (if not already running)
npm run dev

# 3. Test the feature
# (Manual testing in browser)
```

---

## ✅ DEFINITION OF DONE

Feature is complete when:
- ✅ Export button appears on story viewer page
- ✅ Clicking button downloads a PDF file
- ✅ PDF contains story title and all segments
- ✅ PDF is readable and properly formatted
- ✅ Loading state shows during export
- ✅ Error handling works (shows toast on failure)
- ✅ Works on both short and long stories
- ✅ No console errors during export

---

## 🚀 READY TO START!

**Next Steps:**
1. Run the npm install commands
2. Create `src/lib/pdf-export.ts`
3. Find and modify StoryViewer component
4. Test the feature
5. Ship it!

**Estimated completion time:** 4 hours from now

