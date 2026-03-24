kindly see the code and then initialize the db :)

## PROJECT: Production Deployment Architecture - Government Token & Appointment Management System
Hosted on Microsoft Azure (Production VM)

---
## 1. Domain & DNS
Domain Provider: name.com (via GitHub Student Developer Pack) -> a free .page domain

DNS Management from Cloudflare
A Record mapping to Azure Public IP in Cloudflare only.

Flow:<br>
User<br>
↓<br>
generatetoken.page<br>
↓<br>
Cloudflare DNS<br>
↓<br>
Azure Public IP<br>
↓<br>
Azure VM<br>
↓<br>
Node.js Server

---

## 2. Cloud Hosting – Microsoft Azure - Azure Virtual Machine

Full control over backend
Premium SSD support

Azure Configuration:

| Component      | Value                 |
| -------------- | --------------------- |
| VM Size        | B2als_v2              |
| Category       | General Purpose       |
| vCPUs          | 2                     |
| RAM            | 4 GiB                 |
| Max Data Disks | 4                     |
| Max IOPS       | 3750                  |
| Local Storage  | N/A                   |
| Disk Type      | Premium SSD Supported |
| Monthly Cost   | ~$17.96               |
| Deployment     | GitHub → Azure        |

---
## 3. Deployment Pipeline

CI/CD flow:

Local Development
      ↓
Push to GitHub Repository
      ↓
GitHub Actions / Manual Pull to VM
      ↓
Build on Production VM
      ↓
Live Production System

- Deployment to Azure VM
- Process manager (PM2 / Node runtime)

---
## 4. Database Layer
Database Used -> SQLite (hosted inside Azure VM)

Record Size Calculation

 ≈ 0.24 KB per record

Real Production Growth

At ~300 tokens per day:

300 × 0.24 KB ≈ 72 KB/daily

≈ 2–3 MB/month

≈ 25–30 MB/year

---
## 5. Storage Architecture

| Storage Type             | Purpose                  |
| ------------------------ | ------------------------ |
| Premium SSD (Azure Disk) | Database persistence     |
| VM File System           | Runtime files            |

VM supports:

4 data disks
3750 max IOPS
Premium SSD tier

---
## 6. Security Architecture

Transport Layer

HTTPS enabled
TLS encryption

Infrastructure Security

Azure Network Security Group
Restricted inbound ports
SSH secured access

---
## 7. Full Tech Stack

Frontend

HTML5
CSS3
Vanilla JavaScript
Chart.js
htmlt2pdf.bundle.min.js
Fetch API

Backend

Node.js
Express.js
REST APIs
SQLite
Transaction handling

Cloud

Azure Virtual Machine (B2als_v2)
GitHub Integration
name.com Domain
HTTPS SSL

---
## 8. Storage & Resource Utilization

| Resource        | Usage                     |
| --------------- | ------------------------- |
| Database Growth | ~25 MB/year               |
| Static Assets   | < 20 MB                   |
| RAM Usage       | ~500–800 MB typical       |
| CPU Load        | Low (300 tokens/day)      |
| Disk Required   | < 1 GB for multiple years |
OUR VM (4GB RAM) is comfortably provisioned.

---
## 9. Scalability Potential

Current Load:

~300 tokens/day
≈ 12–15 tokens/hour

VM Capacity:

2 vCPU + 4GB RAM can handle:

-> 2000+ requests/day without scaling

---
