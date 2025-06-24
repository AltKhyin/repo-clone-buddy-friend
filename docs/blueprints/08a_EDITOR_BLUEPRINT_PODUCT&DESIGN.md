# EVIDENS Visual Composition Engine - Definitive Feature Concept

**Version:** 1.0  
**Status:** Feature Definition - Ready for Technical Planning  
**Created:** 2025-01-22  
**Sources Analyzed:** Original conception (editor.txt), Product & Design Blueprint (08a-P), PRD (08a-PRD), Technical Blueprint (08a-T), Compressed Gemini Discussion

---

## Executive Summary

The **Visual Composition Engine** represents a paradigm shift from traditional content editing to **Information Architecture**. It is a Figma-like visual editor that empowers EVIDENS Content Architects to create visually stunning, highly didactic reviews while producing perfectly structured, AI-readable content that renders flawlessly across desktop and mobile viewports.

**Core Innovation:** A freeform canvas interface built on a structured grid system that provides creative freedom while maintaining semantic structure and responsive design integrity.

---

## 1. Feature Philosophy & Vision

### 1.1 The Core Problem
Current content creation in the medical/academic space is constrained by linear, text-first editors that cannot produce the visually rich, didactic layouts required by high-signal practitioners. Traditional editors force authors into single-column, blog-like formats that fail to leverage modern design principles for complex educational content, particularly when presenting research methodologies, study flows, and data analysis.

### 1.2 The Solution Paradigm
**"Structured Visual Composition"** - A system that feels like Figma but thinks like a semantic web document. Authors work with complete creative freedom on an infinite canvas, while the system automatically maintains responsive grid structure and AI-readable output.

### 1.3 Design Tenets
1. **Freedom through Structure:** Visual design freedom backed by semantic structure
2. **Focus on Flow:** Interface disappears, content creation becomes intuitive
3. **Didactic by Design:** Tools specifically designed for educational content creation

---

## 2. User Experience Vision

### 2.1 The Target User: Content Architect
The user is not a casual blogger but a **Praticante de Alto Sinal** (High-Signal Practitioner) who creates authoritative, educational content. They need:
- Professional-grade visual composition tools
- Academic citation and reference management
- Sophisticated layout capabilities for complex information
- Efficient workflows for high-value content creation

### 2.2 The Editing Experience
**"Like editing in Figma"** - The interface provides:
- **Infinite pannable canvas** with clear page boundary indicators
- **Drag-and-drop block placement** with intelligent snapping
- **Visual feedback systems** (smart guides, grid snapping, real-time preview)
- **Context-aware controls** that adapt based on selected content
- **Dual-viewport workflow** for simultaneous desktop/mobile design

---

## 3. Core Functional Concept

### 3.1 The Three-Panel Workspace
**Professional editor layout optimized for efficiency:**

1. **Block Palette (Left):** Drag-only interface with specialized content blocks
2. **Editor Canvas (Center):** Infinite, pannable workspace with grid overlay
3. **Inspector Panel (Right):** Context-aware controls for selected content

### 3.2 Complete Block Library (V1)
**Comprehensive blocks for professional educational content:**

**Text & Structure:**
- Heading Block (H1-H4 with styling controls)
- Text Block (rich text with Tiptap inline editing)
- Quote Block (citations with academic formatting)

**Media & Visual:**
- Image Block (upload with responsive optimization)
- Video Embed Block (YouTube/Vimeo integration)
- Separator Block (visual dividers with style options)

**Data & Analysis:**
- Data Table Block (interactive spreadsheet-style with sortable columns)
- Interactive Poll Block (reader engagement with real-time results)

**EVIDENS Specialized:**
- Key Takeaway Block (highlighted callouts with icons)
- Reference Block (structured academic citations)

**Advanced Diagramming:**
- Diagram Block (comprehensive visual composition tool)
  - **Study Design Templates:** Pre-built diagrams for RCTs, cohort studies, case-control studies
  - **CONSORT Flow Diagrams:** Standardized clinical trial reporting
  - **Sample Selection Flowcharts:** Inclusion/exclusion criteria visualization
  - **Systematic Review PRISMA:** Evidence synthesis workflow diagrams
  - **Custom Flowcharts:** General-purpose diagramming with medical/academic focus
  - **Mind Maps:** Concept visualization and knowledge mapping

### 3.3 Canvas Interaction Model
**Figma-inspired interactions:**
- **Pan:** Spacebar + drag for canvas navigation
- **Zoom:** Ctrl/Cmd + scroll wheel for scale control
- **Select:** Click blocks for multi-handle selection feedback
- **Move:** Drag blocks with opacity feedback and snap guides
- **Resize:** Eight-handle resize system with grid snapping
- **Edit:** Double-click for in-place text editing with bubble menu

---

## 4. Technical Architecture Concept

### 4.1 The Canvas-as-Grid Paradigm
**Revolutionary approach:** The "freeform" canvas is an illusion. Every placement is actually translated to a responsive CSS Grid system:

- **User sees:** Pixel-perfect placement on infinite canvas
- **System stores:** Grid coordinates (grid-column: 3/5, grid-row: 2/4)
- **Output renders:** Perfect responsive layout across devices

### 4.2 Structured Content v2.0 Data Model
**AI-readable output format:**
```json
{
  "version": "2.0.0",
  "nodes": [
    {
      "id": "uuid",
      "type": "textBlock",
      "data": { "htmlContent": "..." }
    }
  ],
  "layouts": {
    "desktop": {
      "gridSettings": { "columns": 12 },
      "items": [
        {
          "nodeId": "uuid",
          "x": 0, "y": 0, "w": 8, "h": 4
        }
      ]
    },
    "mobile": {
      "gridSettings": { "columns": 4 },
      "items": [...]
    }
  }
}
```

### 4.3 Adaptive Design Workflow
**Dual-layout system:**
- Authors design desktop layout first
- Switch to mobile viewport for responsive adjustments
- Same content nodes, different grid arrangements
- Independent layouts stored for each breakpoint

---

## 5. Core User Workflows

### 5.1 Content Creation Flow
1. **Canvas Setup:** Open infinite workspace with page boundaries
2. **Block Placement:** Drag from palette to canvas with snap feedback
3. **Content Entry:** Double-click for inline editing with rich formatting
4. **Layout Composition:** Arrange blocks using visual guides and grid snapping
5. **Responsive Design:** Switch viewport to adjust mobile layout
6. **Save & Publish:** Auto-save with preview functionality

### 5.2 Specialized Content Workflows
**Academic Citations:**
- Drag Reference Block to canvas
- Fill structured form (authors, year, title, source)
- System auto-formats to APA 7 standard

**Key Takeaways:**
- Drag Key Takeaway Block for highlighted content
- Select from predefined theme colors and icons
- System applies consistent visual treatment

**Media Integration:**
- Drag Image Block with built-in upload zone
- Automatic responsive optimization and WebP conversion
- Caption and alt-text accessibility features

**Advanced Diagramming Workflow:**
- Drag Diagram Block to canvas
- Choose from professional medical/academic templates:
  - **Study Design:** Select RCT, cohort, case-control templates
  - **CONSORT Flow:** Pre-structured clinical trial reporting diagram
  - **Sample Selection:** Build inclusion/exclusion criteria flowcharts
  - **PRISMA Flow:** Systematic review evidence synthesis
  - **Custom Diagrams:** Start with blank canvas for specialized needs
- Full sub-app modal editor with:
  - Professional diagramming tools
  - Medical/academic icon libraries
  - Template customization capabilities
  - Export integration back to main canvas

**Interactive Data Presentation:**
- Data Table Block with CSV import/export
- Interactive Poll Block with real-time result visualization
- Sortable, filterable table functionality for research data

---

## 6. Quality & Performance Standards

### 6.1 User Experience Requirements
- **Load Time:** Editor opens in under 2 seconds
- **Responsiveness:** All interactions provide immediate visual feedback
- **Auto-save:** 3-second debounced saving with clear status indicators
- **Error Handling:** Graceful degradation with inline error states
- **Accessibility:** Full keyboard navigation and screen reader support

### 6.2 Content Quality Assurance
- **Grid Validation:** Prevent overlapping blocks with collision detection
- **Content Integrity:** Zod schema validation for all data operations
- **Image Optimization:** Automatic WebP conversion and multiple formats
- **Mobile Optimization:** Responsive layout verification system

---

## 7. Strategic Benefits

### 7.1 Content Creation Efficiency
- **Faster Production:** Specialized blocks reduce repetitive formatting
- **Visual Excellence:** Professional layouts without design expertise
- **Academic Rigor:** Built-in citation and reference management
- **Reusable Patterns:** Common layouts become templates

### 7.2 Technical Advantages
- **AI Integration:** Structured output enables AI content generation
- **Future-Proof:** Versioned schema supports migration and evolution
- **Performance:** Grid-based rendering optimizes load times
- **Maintenance:** Separation of content and presentation simplifies updates

---

## 8. Implementation Roadmap

### 8.1 V1 Scope (Complete Feature Set)
**Goal:** Professional-grade visual composition engine
- Three-panel workspace implementation
- Complete block library including:
  - Core content blocks (text, image, heading, quote, reference)
  - Data presentation blocks (tables, interactive polls)
  - Advanced diagramming with medical/academic templates
  - Key takeaway and specialized EVIDENS blocks
- Dual-viewport responsive design workflow
- Comprehensive diagram editor sub-app with template library
- Auto-save and state management
- Full preview functionality

### 8.2 V1 Success Metrics
- **Efficiency:** 40% reduction in content creation time
- **Adoption:** 90% of new reviews use specialized blocks (diagrams, tables, takeaways)
- **Satisfaction:** 9/10 user satisfaction score from Content Architects
- **Feature Usage:** 80% of reviews utilize advanced diagramming capabilities

### 8.3 Future Enhancement Areas
- Global style management system
- Advanced template and pattern libraries
- Integration with external medical databases
- Enhanced accessibility features
- Performance optimizations for complex documents

---

## 9. Risk Assessment & Mitigation

### 9.1 Technical Risks
**State Management Complexity:**
- *Risk:* Zustand store becomes unwieldy with complex editor state
- *Mitigation:* Reducer pattern with Redux DevTools for debugging

**Performance with Large Documents:**
- *Risk:* 100+ blocks create render performance issues
- *Mitigation:* React.memo optimization and virtual scrolling

**Data Integrity:**
- *Risk:* Browser crashes cause content loss
- *Mitigation:* localStorage backup and conflict resolution

### 9.2 User Experience Risks
**Learning Curve:**
- *Risk:* Complex interface overwhelms users
- *Mitigation:* Progressive disclosure and contextual help

**Mobile Editing Complexity:**
- *Risk:* Responsive design workflow confuses users
- *Mitigation:* Clear viewport indicators and preview modes

---

## 10. Competitive Analysis & Differentiation

### 10.1 Market Position
**Unlike existing editors:**
- **Notion/Obsidian:** More visual freedom, less text-centric
- **Figma/Canva:** Maintains semantic structure for web rendering
- **WordPress/Ghost:** Professional visual composition capabilities
- **Academic tools:** Built-in citation and reference management

### 10.2 Unique Value Proposition
The only editor that combines:
- Figma-level visual design freedom
- Academic-grade content structure
- Perfect responsive output
- AI-readable structured content

---

## Conclusion

The Visual Composition Engine represents a fundamental evolution in medical and academic content creation technology. By bridging the gap between visual design tools and structured content management, it empowers EVIDENS Content Architects to create exceptional educational content with sophisticated diagramming, data presentation, and interactive capabilities while maintaining the technical rigor required for modern web applications and AI integration.

This comprehensive V1 feature set - including advanced diagramming with medical templates, interactive data tables, and specialized academic blocks - positions EVIDENS as the premier platform for high-quality medical and scientific content creation. The focus on professional-grade tools for evidence synthesis, study methodology visualization, and interactive reader engagement creates a unique value proposition in the academic content space.

This feature concept provides the foundation for technical architecture decisions and implementation planning, ensuring the final product delivers exceptional user experience and establishes EVIDENS as the definitive platform for medical content creation.
