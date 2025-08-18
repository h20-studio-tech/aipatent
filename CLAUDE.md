# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an AI-powered patent generation application built with Next.js. The application helps users create patent documents by guiding them through a multi-stage process:

1. **Patent Creation**: Users input patent name, antigen, and disease information
2. **Knowledge Creation**: Users gather insights through three tabs (Approach, Technology, Innovation) 
3. **Embodiments**: Users define specific implementations
4. **Patent Generation**: AI generates various patent sections based on collected knowledge

## Development Commands

```bash
# Navigate to client directory first
cd client

# Development server
npm run dev

# Production build
npm run build

# Start production server  
npm start

# Linting
npm run lint
```

## Architecture Overview

### Core Application Structure

- **Frontend**: Next.js 15 with TypeScript, using App Router
- **UI Components**: Radix UI primitives with Tailwind CSS styling
- **State Management**: React state with custom hooks
- **Backend Integration**: Axios for API calls to `https://api.aipatent.click/api`

### Key Components

- `app/page.tsx`: Landing page with patent creation form and previous patents list
- `app/KnowledgeCreation/page.tsx`: Multi-stage knowledge gathering workflow
- `components/knowledge-creation.tsx`: Main knowledge creation interface with tabbed insights
- `components/section-generator.tsx`: Patent section generation and editing interface
- `components/embodiments.tsx`: Embodiment definition interface

### Data Flow

1. **Patent Creation**: Form data sent to `/v1/project/` endpoint, returns `patent_id`
2. **Knowledge Storage**: Insights stored via endpoints like `/v1/knowledge/approach/{patent_id}`
3. **Patent Generation**: Section content generated via `/v1/sections/{section_type}` endpoints
4. **Client State**: Uses window-level storage for knowledge data (`window.addStoredData`)

### API Integration

The application integrates with a backend API at `https://api.aipatent.click/api` for:

- Project management (`/v1/projects/`, `/v1/project/`)
- Knowledge storage (`/v1/knowledge/{type}/{patent_id}`)  
- Patent section generation (`/v1/sections/{section_type}`)

### Component Patterns

- **Resizable Sections**: Custom resizable panel component for patent content editing
- **Multi-stage UI**: Stage-based navigation between patent creation phases
- **Form Handling**: React Hook Form with Zod validation (dependencies suggest this pattern)
- **Toast Notifications**: Sonner for user feedback

### Technology Stack

- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Library**: Radix UI primitives
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Form Validation**: React Hook Form + Zod (inferred from dependencies)

## Development Notes

- The application uses window-level APIs for data storage, which may require careful handling in SSR contexts
- API endpoints are hardcoded in `config/config.js` - consider environment variables for different deployments
- The multi-stage workflow relies on URL parameters for state management between pages
- Patent generation sections are dynamically determined by the `generatePatentContent` action

## File Structure

```
client/
├── app/                      # Next.js App Router pages
│   ├── KnowledgeCreation/   # Multi-stage knowledge gathering
│   ├── actions/             # Server actions for patent generation
│   └── globals.css          # Global styles
├── components/              # Reusable React components
│   ├── ui/                  # Radix UI component wrappers
│   └── *.tsx               # Feature-specific components
├── config/                  # Configuration files
├── lib/                     # Utilities and types
└── types/                   # TypeScript type definitions
```