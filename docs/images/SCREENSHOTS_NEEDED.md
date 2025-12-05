# Screenshots Needed for Documentation

This file lists all screenshots that need to be captured from the IyziTrace platform.

## How to Capture Screenshots

1. Run the IyziTrace plugin in Grafana
2. Navigate to each page listed below
3. Take high-quality screenshots (PNG format recommended)
4. Save with the exact filename shown
5. Place in `docs/images/` directory

---

## Overview & Infrastructure (6 screenshots)

### Screenshot-2025-10-17-at-10.58.00.png
**Page**: Overview  
**Feature**: Full-stack Infrastructure Overview  
**What to Show**: Main overview page showing regions, infrastructures, services, and operations in horizontal scroll containers  
**Key Elements**: All layers visible, some data populated

### Screenshot-2025-10-17-at-10.59.18.png
**Page**: Overview  
**Feature**: Infrastructure Layer Map  
**What to Show**: Infrastructure cards with health badges, OS types, CPU/Memory usage  
**Key Elements**: Multiple infrastructure cards with different OS types (Linux, Windows, etc.)

### Screenshot-2025-10-17-at-10.59.34.png
**Page**: Overview  
**Feature**: Focus on Critical Zones  
**What to Show**: One infrastructure selected/highlighted showing its services  
**Key Elements**: Clear selection state, filtered view

### Screenshot-2025-10-17-at-10.59.59.png
**Page**: Overview  
**Feature**: Deep Infrastructure Details  
**What to Show**: Infrastructure expanded in table view showing detailed metrics  
**Key Elements**: Table with CPU, Memory, IP, OS details

### Screenshot-2025-10-17-at-11.00.59.png
**Page**: Overview  
**Feature**: Application Layer Topology  
**What to Show**: Infrastructure with applications sidebar open  
**Key Elements**: Applications list with various runtime types (Node.js, Java, etc.)

### Screenshot-2025-10-17-at-11.01.16.png
**Page**: Overview  
**Feature**: Application Health & Latency  
**What to Show**: Application detail or service card showing health and latency metrics  
**Key Elements**: Status badge, latency numbers, calls/sec

---

## Service Map (3 screenshots)

### Screenshot-2025-10-17-at-11.01.54.png
**Page**: Service Map  
**Feature**: Service Map – End-to-End Calls  
**What to Show**: Complete service dependency graph with nodes and edges  
**Key Elements**: Multiple services connected, arrows showing flow

### Screenshot-2025-10-17-at-11.02.05.png
**Page**: Service Map  
**Feature**: Visual Call Flows  
**What to Show**: Service map with highlighted call path or specific flow  
**Key Elements**: Clear request path visualization, multiple hops

### Screenshot-2025-10-17-at-11.03.40.png
**Page**: Service Map (Infrastructure View)  
**Feature**: Full Service Dependency Graph  
**What to Show**: Infrastructure-specific service map from bottom drawer  
**Key Elements**: Services, edges with metrics, service names visible

---

## Performance Monitoring (6 screenshots)

### Screenshot-2025-10-17-at-11.02.29.png
**Page**: Services  
**Feature**: Service-Level Metrics  
**What to Show**: Service cards grid showing multiple services  
**Key Elements**: Service names, types, health status, avg duration, calls/sec

### Screenshot-2025-10-17-at-11.03.03.png
**Page**: Services  
**Feature**: Operation-Level Insight  
**What to Show**: Operations view showing operations grouped by service  
**Key Elements**: Operation names, methods, latency, call counts

### Screenshot-2025-10-17-at-11.03.11.png
**Page**: Service Detail  
**Feature**: Operation Detail – Update Profile  
**What to Show**: Single operation detail with expanded information  
**Key Elements**: Operation metrics, method, path, latency percentiles

### Screenshot-2025-10-17-at-11.04.24.png
**Page**: Services  
**Feature**: Service Performance Overview  
**What to Show**: Service list or grid with performance metrics  
**Key Elements**: Multiple services, sortable columns, metrics

### Screenshot-2025-10-17-at-11.04.59.png
**Page**: Service Detail  
**Feature**: Service Detail – Call Metrics  
**What to Show**: Individual service page with detailed metrics and charts  
**Key Elements**: Charts showing latency, throughput, error rate over time

### Screenshot-2025-10-17-at-11.05.14.png
**Page**: Service Detail  
**Feature**: Service Detail – Operations Insight  
**What to Show**: Service detail page showing operations table  
**Key Elements**: Operations list with APDEX, latency, calls/sec

---

## Distributed Tracing (3 screenshots)

### Screenshot-2025-10-17-at-11.06.02.png
**Page**: Traces  
**Feature**: Distributed Traces Overview  
**What to Show**: Traces list with multiple trace entries  
**Key Elements**: Trace IDs, services, durations, timestamps, status

### Screenshot-2025-10-17-at-11.06.14.png
**Page**: Traces  
**Feature**: Advanced Time Range Filtering  
**What to Show**: Traces page with time range picker visible/highlighted  
**Key Elements**: Time picker dropdown, quick ranges, custom selection

### Screenshot-2025-10-17-at-11.06.27.png
**Page**: Traces  
**Feature**: Multi-Backend Trace Selection  
**What to Show**: Traces page with datasource selector visible  
**Key Elements**: Datasource dropdown showing multiple Tempo options

---

## Log Management (1 screenshot)

### Screenshot-2025-10-17-at-11.07.14.png
**Page**: Logs  
**Feature**: Centralized Log Explorer  
**What to Show**: Logs page with log stream and filters  
**Key Elements**: Log entries with levels, timestamps, messages, filters panel

---

## Customization (1 screenshot)

### Screenshot-2025-10-17-at-11.08.59.png
**Page**: Views  
**Feature**: Custom Monitoring Dashboards  
**What to Show**: Views page showing saved views list or a custom view  
**Key Elements**: View cards, names, descriptions, page types

---

## Screenshot Checklist

Use this checklist when capturing screenshots:

- [ ] All 20 screenshots captured
- [ ] PNG format, high resolution
- [ ] Actual data visible (not empty states)
- [ ] UI is clean (no console errors visible)
- [ ] Proper filename (exact match required)
- [ ] Placed in `docs/images/` directory
- [ ] Test image links in README.md

---

## Quick Capture Guide

**Recommended Screenshot Settings:**
- **Resolution**: 1920x1080 or higher
- **Format**: PNG
- **Quality**: High (no compression)
- **Browser**: Chrome or Firefox (full page)
- **Dark Mode**: Yes (IyziTrace uses dark theme)

**Capture Process:**

1. Start IyziTrace with demo data running
2. Open each page in order
3. Wait for data to load completely
4. Capture screenshot (Cmd+Shift+4 on macOS)
5. Rename to exact filename
6. Move to `docs/images/` directory

**Testing:**

After adding images, view the documentation:

```bash
# If you have a markdown viewer
open docs/README.md

# Or use online viewer like Typora, VS Code, or GitHub
```

All image links should display correctly.

---

## Alternative: Use Existing Screenshots

If you have existing screenshots from your product page or demo videos:

1. Extract frames from `product.mov` video
2. Use existing marketing screenshots
3. Rename to match required filenames
4. Place in `docs/images/` directory

---

**Status**: ⏳ Pending - Screenshots need to be added

Once screenshots are added, update this file to: ✅ Complete

